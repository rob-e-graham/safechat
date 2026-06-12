/**
 * SafeChat SemanticLayer — Optional embedding-similarity layer (Tier 1).
 *
 * Sits between the regex engine (Tier 0) and the LLM cross-classifier
 * (Tier 3) in SafeChat's progressive enhancement architecture. Catches
 * metaphorical and indirect expressions of distress that keyword patterns
 * can't express ("I just want the noise to stop") using a small sentence
 * embedding model (~25 MB) instead of a multi-billion-parameter LLM.
 *
 * DESIGN PRINCIPLES (same contract as crosscheck.js):
 *   1. The regex layer is ALWAYS the first pass. The semantic layer is a
 *      second opinion, not a replacement.
 *   2. Never downgrade a regex detection. False negatives cost lives.
 *   3. The semantic layer CAN escalate. If regex says NONE but the message
 *      sits close to a crisis exemplar in embedding space, escalate to LOW.
 *   4. Everything runs locally. The exemplar set ships as plain text in this
 *      file; embeddings are computed on-device and cached in memory.
 *   5. Fully optional. Zero new dependencies unless the developer opts in.
 *
 * HOW IT WORKS:
 *   A curated set of exemplar phrases — indirect, metaphorical expressions
 *   of crisis drawn from clinical warning-sign literature — is embedded once
 *   (lazily, on first use). Each incoming message is embedded and compared
 *   to every exemplar by cosine similarity. If the best match crosses the
 *   configured threshold, the layer reports risk at that exemplar's level.
 *
 *   Exemplars are plain, auditable text. Communities can replace them with
 *   their own culturally specific sets (see options.exemplars) — the
 *   governance model follows the CARE Principles: the people closest to a
 *   language own the definition of distress in that language.
 *
 * SUPPORTED BACKENDS:
 *   'custom'     — Developer-provided async embed function (recommended;
 *                  works with Transformers.js in the browser, including PWAs)
 *   'ollama'     — Local Ollama instance (/api/embeddings)
 *   'local_api'  — Any OpenAI-compatible /v1/embeddings endpoint
 *                  (LM Studio, llama.cpp server, vLLM)
 *
 * USAGE:
 *
 *   // Browser / PWA with Transformers.js (all-MiniLM-L6-v2, ~25 MB, offline after first load)
 *   import { pipeline } from '@huggingface/transformers';
 *   const extractor = await pipeline('feature-extraction', 'Xenova/all-MiniLM-L6-v2');
 *   const sem = safechat.createSemanticLayer({
 *     backend: 'custom',
 *     embed: async (texts) => {
 *       const out = await extractor(texts, { pooling: 'mean', normalize: true });
 *       return out.tolist();
 *     },
 *   });
 *
 *   // Server with Ollama
 *   const sem = safechat.createSemanticLayer({
 *     backend: 'ollama',
 *     model: 'nomic-embed-text',
 *     endpoint: 'http://localhost:11434',
 *   });
 *
 *   // Use with Shield
 *   const shield = safechat.createShield({ crisis: true, semanticLayer: sem });
 *   const result = await shield.processAsync(userMessage);
 *
 * CALIBRATION: Similarity thresholds are model-dependent. The defaults are
 * calibrated for normalised all-MiniLM-L6-v2 embeddings. If you use a
 * different model, measure on a validation set before deploying.
 *
 * PRIVACY: No message content is stored or transmitted externally.
 * All inference runs on the local device or a developer-controlled endpoint.
 *
 * @license BSL-1.1 — see LICENSE file
 */

// ── Default exemplar set ────────────────────────────────────────────────────
// Indirect and metaphorical expressions of distress, organised by level.
// Drawn from clinical warning-sign literature (escape/burden/exhaustion
// framings). Plain text by design: auditable, replaceable, community-ownable.

const DEFAULT_EXEMPLARS = {
  high: [
    "I just want the noise in my head to stop forever",
    "I want to go to sleep and never wake up",
    "everyone would be better off without me here",
    "I'm going to make the pain stop tonight",
    "I have figured out a way to end all of this",
    "this is the last time I'll talk to anyone",
    "I won't be a problem for anyone much longer",
    "I'm ready to disappear for good",
    "there's only one way left to escape this",
    "I keep thinking about how to finally be done with everything",
    "I wrote letters so people understand after I'm gone",
    "soon none of this will hurt anymore",
    "I want out of this life",
    "I can't keep myself safe tonight",
    "I have the pills in front of me right now",
  ],
  low: [
    "I feel like a ghost in my own life",
    "I'm so tired of existing",
    "nothing I do matters to anyone",
    "I feel completely empty inside all the time",
    "I'm drowning and nobody notices",
    "every day is just grey and pointless",
    "I can't remember the last time I felt anything",
    "I'm exhausted in a way that sleep doesn't fix",
    "it feels like I'm screaming underwater",
    "I've stopped making plans for anything",
    "the walls are closing in on me",
    "I'm just going through the motions until it's over",
    "nobody would notice if I stopped showing up",
    "I feel trapped with no way out of my situation",
  ],
};

// ── Vector math ─────────────────────────────────────────────────────────────

/**
 * Cosine similarity between two vectors.
 * Returns 0 for invalid input rather than throwing — a malformed embedding
 * must never crash the safety pipeline.
 */
function cosineSimilarity(a, b) {
  if (!Array.isArray(a) || !Array.isArray(b) || a.length === 0 || a.length !== b.length) {
    return 0;
  }
  let dot = 0;
  let normA = 0;
  let normB = 0;
  for (let i = 0; i < a.length; i++) {
    dot += a[i] * b[i];
    normA += a[i] * a[i];
    normB += b[i] * b[i];
  }
  if (normA === 0 || normB === 0) return 0;
  return dot / (Math.sqrt(normA) * Math.sqrt(normB));
}

// ── SemanticLayer ───────────────────────────────────────────────────────────

class SemanticLayer {
  /**
   * @param {object} options
   * @param {string} options.backend — 'custom' | 'ollama' | 'local_api'
   * @param {Function} [options.embed] — async (texts: string[]) => number[][] (for 'custom' backend)
   * @param {string} [options.model] — embedding model name for server backends
   * @param {string} [options.endpoint] — API endpoint for server backends
   * @param {object} [options.exemplars] — { high: string[], low: string[] } replaces the default set
   * @param {number} [options.highThreshold] — cosine similarity to flag high-tier match (default 0.75)
   * @param {number} [options.lowThreshold] — cosine similarity to flag low-tier match (default 0.62)
   * @param {number} [options.timeout] — request timeout in ms (default 5000)
   * @param {Function} [options.onError] — error callback (default: silent fallback to regex result)
   * @param {Function} [options.onMatch] — called after every verification with full result
   */
  constructor(options = {}) {
    this.backend = options.backend || "custom";
    this.embedFn = options.embed || null;
    this.model = options.model || null;
    this.endpoint = options.endpoint || "http://localhost:11434";
    this.highThreshold = typeof options.highThreshold === "number" ? options.highThreshold : 0.75;
    this.lowThreshold = typeof options.lowThreshold === "number" ? options.lowThreshold : 0.62;
    this.timeout = options.timeout || 5000;
    this.onError = options.onError || null;
    this.onMatch = options.onMatch || null;

    const validBackends = ["custom", "ollama", "local_api"];
    if (!validBackends.includes(this.backend)) {
      throw new Error(
        `SafeChat SemanticLayer: invalid backend "${this.backend}". ` +
        `Valid backends: ${validBackends.join(", ")}`
      );
    }

    if (this.backend === "custom" && typeof this.embedFn !== "function") {
      throw new Error(
        "SafeChat SemanticLayer: 'custom' backend requires an embed function. " +
        "Provide options.embed = async (texts) => number[][]."
      );
    }

    if (this.lowThreshold > this.highThreshold) {
      throw new Error(
        "SafeChat SemanticLayer: lowThreshold must not exceed highThreshold."
      );
    }

    // Exemplar set — validated, defaults replaceable for community/language packs
    const exemplars = options.exemplars || DEFAULT_EXEMPLARS;
    if (!exemplars || !Array.isArray(exemplars.high) || !Array.isArray(exemplars.low) ||
        exemplars.high.length === 0 || exemplars.low.length === 0) {
      throw new Error(
        "SafeChat SemanticLayer: exemplars must be { high: string[], low: string[] } with at least one entry each."
      );
    }
    this.exemplars = exemplars;

    // Lazily computed exemplar embeddings: [{ level, text, vector }]
    this._exemplarIndex = null;
    this._indexPromise = null;

    this._stats = {
      total: 0,
      confirmed: 0,
      escalated: 0,
      overridden: 0,
      errors: 0,
      avgLatencyMs: 0,
    };
  }

  // ── Embedding backends ────────────────────────────────────────────────────

  /**
   * Embed an array of texts via the configured backend.
   * @param {string[]} texts
   * @returns {Promise<number[][]>}
   */
  async embed(texts) {
    switch (this.backend) {
      case "custom":
        return await this.embedFn(texts);
      case "ollama":
        return await this._embedOllama(texts);
      case "local_api":
        return await this._embedLocalApi(texts);
      default:
        throw new Error(`Unknown backend: ${this.backend}`);
    }
  }

  async _embedOllama(texts) {
    const model = this.model || "nomic-embed-text";
    const vectors = [];
    // Ollama's /api/embeddings takes one prompt at a time
    for (const text of texts) {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), this.timeout);
      try {
        const response = await fetch(`${this.endpoint}/api/embeddings`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ model, prompt: text }),
          signal: controller.signal,
        });
        if (!response.ok) {
          throw new Error(`Ollama embeddings returned ${response.status}`);
        }
        const data = await response.json();
        vectors.push(data.embedding || []);
      } finally {
        clearTimeout(timeoutId);
      }
    }
    return vectors;
  }

  async _embedLocalApi(texts) {
    const model = this.model || "default";
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), this.timeout);
    try {
      const response = await fetch(`${this.endpoint}/v1/embeddings`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ model, input: texts }),
        signal: controller.signal,
      });
      if (!response.ok) {
        throw new Error(`Embeddings API returned ${response.status}`);
      }
      const data = await response.json();
      return (data.data || []).map((d) => d.embedding || []);
    } finally {
      clearTimeout(timeoutId);
    }
  }

  // ── Exemplar index ────────────────────────────────────────────────────────

  /**
   * Build (or return the cached) exemplar embedding index.
   * Computed once per instance; concurrent callers share one promise.
   */
  async _getIndex() {
    if (this._exemplarIndex) return this._exemplarIndex;
    if (this._indexPromise) return this._indexPromise;

    this._indexPromise = (async () => {
      const entries = [
        ...this.exemplars.high.map((text) => ({ level: "high", text })),
        ...this.exemplars.low.map((text) => ({ level: "low", text })),
      ];
      const vectors = await this.embed(entries.map((e) => e.text));
      if (!Array.isArray(vectors) || vectors.length !== entries.length) {
        throw new Error(
          `SemanticLayer: embed() returned ${Array.isArray(vectors) ? vectors.length : typeof vectors} ` +
          `vectors for ${entries.length} exemplars`
        );
      }
      this._exemplarIndex = entries.map((e, i) => ({ ...e, vector: vectors[i] }));
      this._indexPromise = null;
      return this._exemplarIndex;
    })();

    try {
      return await this._indexPromise;
    } catch (err) {
      // Allow retry on next call rather than caching the failure
      this._indexPromise = null;
      throw err;
    }
  }

  // ── Classification ────────────────────────────────────────────────────────

  /**
   * Classify a message by embedding similarity to the exemplar set.
   *
   * Returns a normalised result:
   *   { risk: 'high'|'low'|'none', confidence: 0-1, match: string|null, similarity: number }
   *
   * confidence is the best cosine similarity (clamped to 0-1), so the merge
   * semantics line up with CrossClassifier results.
   *
   * @param {string} text — the user's message
   * @returns {Promise<object>}
   */
  async classify(text) {
    if (!text || typeof text !== "string") {
      return { risk: "none", confidence: 0, match: null, similarity: 0 };
    }

    try {
      const index = await this._getIndex();
      const [vector] = await this.embed([text]);

      let best = { level: "none", text: null, similarity: 0 };
      for (const exemplar of index) {
        const sim = cosineSimilarity(vector, exemplar.vector);
        if (sim > best.similarity) {
          best = { level: exemplar.level, text: exemplar.text, similarity: sim };
        }
      }

      let risk = "none";
      if (best.level === "high" && best.similarity >= this.highThreshold) {
        risk = "high";
      } else if (best.similarity >= this.lowThreshold) {
        // A strong match against either tier signals at least low-level distress
        risk = "low";
      }

      return {
        risk,
        confidence: Math.max(0, Math.min(1, best.similarity)),
        match: risk === "none" ? null : best.text,
        similarity: best.similarity,
      };
    } catch (err) {
      this._stats.errors++;
      if (this.onError) {
        try { this.onError(err, text); } catch (_) {}
      }
      // On error, return a neutral result — regex handles it
      return { risk: "none", confidence: 0, match: null, similarity: 0, error: err.message };
    }
  }

  /**
   * Verify a regex detection result using embedding similarity.
   *
   * MERGE RULES (identical contract to CrossClassifier.verify):
   *   1. Regex HIGH → always HIGH (semantic layer can confirm but never downgrade)
   *   2. Regex LOW + semantic HIGH match → escalate to HIGH
   *   3. Regex NONE + semantic match → escalate to LOW
   *   4. No match above threshold → regex result passes through untouched
   *
   * @param {object} regexResult — result from detect() or shield.process()
   * @param {string} text — the original message
   * @returns {Promise<object>} — enhanced result with semantic field
   */
  async verify(regexResult, text) {
    const start = Date.now();
    const classification = await this.classify(text);
    const latencyMs = Date.now() - start;

    this._stats.total++;
    this._stats.avgLatencyMs =
      this._stats.avgLatencyMs + (latencyMs - this._stats.avgLatencyMs) / this._stats.total;

    const regexLevel = regexResult.level || "none";
    const semanticLevel = classification.risk || "none";

    let mergedLevel = regexLevel;
    let mergeAction = "passthrough";

    if (semanticLevel !== "none") {
      if (regexLevel === "high") {
        mergedLevel = "high";
        mergeAction = "confirmed";
        this._stats.confirmed++;
      } else if (regexLevel === "low") {
        if (semanticLevel === "high") {
          mergedLevel = "high";
          mergeAction = "escalated";
          this._stats.escalated++;
        } else {
          mergedLevel = "low";
          mergeAction = "confirmed";
          this._stats.confirmed++;
        }
      } else {
        // regex NONE — semantic match escalates conservatively to LOW
        mergedLevel = "low";
        mergeAction = "escalated";
        this._stats.escalated++;
      }
    } else if (regexLevel !== "none") {
      // Semantic layer saw nothing, regex did — regex wins, never downgrade
      mergeAction = "regex_override";
      this._stats.overridden++;
    }

    const enhanced = {
      ...regexResult,
      level: mergedLevel,
      semantic: {
        backend: this.backend,
        model: this.model,
        risk: semanticLevel,
        similarity: classification.similarity,
        match: classification.match,
        mergeAction,
        latencyMs,
        regexLevel,
        error: classification.error || null,
      },
    };

    if (this.onMatch) {
      try { this.onMatch(enhanced); } catch (_) {}
    }

    return enhanced;
  }

  // ── Stats & diagnostics ───────────────────────────────────────────────────

  /**
   * Get verification statistics.
   * @returns {object}
   */
  stats() {
    return { ...this._stats };
  }

  /**
   * Reset statistics.
   */
  resetStats() {
    this._stats = {
      total: 0,
      confirmed: 0,
      escalated: 0,
      overridden: 0,
      errors: 0,
      avgLatencyMs: 0,
    };
  }

  /**
   * Number of exemplars in the active set.
   * @returns {{ high: number, low: number }}
   */
  exemplarCounts() {
    return { high: this.exemplars.high.length, low: this.exemplars.low.length };
  }

  /**
   * Test the embedding backend and warm the exemplar index.
   * @returns {Promise<{ ok: boolean, latencyMs: number, dimensions: number|null, error: string|null }>}
   */
  async ping() {
    const start = Date.now();
    try {
      const index = await this._getIndex();
      const dimensions = index[0] && Array.isArray(index[0].vector) ? index[0].vector.length : null;
      return { ok: true, latencyMs: Date.now() - start, dimensions, error: null };
    } catch (err) {
      return { ok: false, latencyMs: Date.now() - start, dimensions: null, error: err.message };
    }
  }
}

// ── Factory ────────────────────────────────────────────────────────────────

/**
 * Create a configured SemanticLayer instance.
 *
 * @param {object} options — see SemanticLayer constructor
 * @returns {SemanticLayer}
 */
function createSemanticLayer(options = {}) {
  return new SemanticLayer(options);
}

module.exports = {
  SemanticLayer,
  createSemanticLayer,
  cosineSimilarity,
  DEFAULT_EXEMPLARS,
};
