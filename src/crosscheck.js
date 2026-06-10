/**
 * SafeChat CrossClassifier — Optional second-opinion layer using local ML models.
 *
 * Runs alongside the deterministic regex engine (detect.js) to catch signals
 * that keyword matching can miss — metaphorical distress, nuanced context,
 * therapeutic disclosure vs. genuine crisis.
 *
 * DESIGN PRINCIPLES:
 *   1. The regex layer is ALWAYS the first pass. It's instant, deterministic,
 *      and never goes down. The cross-classifier is a second opinion, not a
 *      replacement.
 *   2. Never downgrade a regex detection. If regex says HIGH and the classifier
 *      says safe, the result stays HIGH. False negatives cost lives.
 *   3. The classifier CAN escalate. If regex says NONE but the classifier
 *      detects risk, it escalates to LOW (model-detected distress).
 *   4. Everything runs locally. No data leaves the device.
 *   5. Fully optional. SafeChat works without this module. Zero new dependencies
 *      unless the developer opts in.
 *
 * SUPPORTED BACKENDS:
 *   'mindguard'     — Sword Health's MindGuard 4B/8B crisis classifier
 *                     (self-harm, harm-to-others, safe)
 *   'mentalllama'   — MentalLLaMA 7B/13B mental health analysis
 *                     (depression, stress, suicide cause, etc.)
 *   'transformers'  — Any Hugging Face model via Transformers.js or local API
 *   'ollama'        — Local Ollama instance (localhost:11434)
 *   'custom'        — Developer-provided classification function
 *
 * USAGE:
 *
 *   // With MindGuard via Ollama
 *   const cc = safechat.createCrossClassifier({
 *     backend: 'ollama',
 *     model: 'mindguard-8b',
 *     endpoint: 'http://localhost:11434',
 *   });
 *
 *   // With custom classifier function
 *   const cc = safechat.createCrossClassifier({
 *     backend: 'custom',
 *     classify: async (text, context) => {
 *       const result = await myLocalModel.predict(text);
 *       return { risk: result.label, confidence: result.score };
 *     },
 *   });
 *
 *   // Use with Shield
 *   const shield = safechat.createShield({
 *     crisis: true,
 *     crossClassifier: cc,
 *   });
 *
 *   // Or standalone
 *   const enhanced = await cc.verify(regexResult, text);
 *
 * PRIVACY: No message content is stored or transmitted externally.
 * All inference runs on the local device or a developer-controlled endpoint.
 *
 * REFERENCES (suggested by Professor Stevie Chancellor, University of Minnesota):
 *   - MindGuard: https://huggingface.co/swordhealth/MindGuard-testset
 *     Paper: https://arxiv.org/abs/2602.00950
 *   - MentalLLaMA: https://github.com/SteveKGYang/MentalLLaMA
 *   - MentalChat16K: https://dl.acm.org/doi/10.1145/3711896.3737393
 *
 * @license BSL-1.1 — see LICENSE file
 */

// ── Risk mapping ────────────────────────────────────────────────────────────
// Maps model-specific labels to SafeChat's tier system.

const MINDGUARD_MAP = {
  "safe": "none",
  "self-harm": "high",
  "self_harm": "high",
  "selfharm": "high",
  "harm_to_others": "high",
  "harm-to-others": "high",
  "harm to others": "high",
  "risk": "low",
  "distress": "low",
  "crisis": "high",
};

const MENTALLLAMA_MAP = {
  "depression": "low",
  "stress": "low",
  "anxiety": "low",
  "loneliness": "low",
  "grief": "low",
  "suicidal_ideation": "high",
  "suicide_risk": "high",
  "self_harm": "high",
  "crisis": "high",
  "safe": "none",
  "none": "none",
  "normal": "none",
  "no_risk": "none",
};

// ── CrossClassifier ────────────────────────────────────────────────────────

class CrossClassifier {
  /**
   * @param {object} options
   * @param {string} options.backend — 'mindguard' | 'mentalllama' | 'ollama' | 'transformers' | 'custom'
   * @param {string} [options.model] — model name for inference backends
   * @param {string} [options.endpoint] — API endpoint for ollama/transformers backends
   * @param {Function} [options.classify] — custom classification function (for 'custom' backend)
   * @param {number} [options.timeout] — request timeout in ms (default 5000)
   * @param {number} [options.confidenceThreshold] — minimum confidence to act on (0-1, default 0.6)
   * @param {boolean} [options.allowDowngrade] — if true, classifier can downgrade regex results (default false)
   * @param {object} [options.labelMap] — custom label-to-level mapping
   * @param {Function} [options.onError] — error callback (default: silent fallback to regex result)
   * @param {Function} [options.onClassify] — called after every classification with full result
   */
  constructor(options = {}) {
    this.backend = options.backend || "custom";
    this.model = options.model || null;
    this.endpoint = options.endpoint || "http://localhost:11434";
    this.classifyFn = options.classify || null;
    this.timeout = options.timeout || 5000;
    this.confidenceThreshold = options.confidenceThreshold || 0.6;
    this.allowDowngrade = options.allowDowngrade || false;
    this.onError = options.onError || null;
    this.onClassify = options.onClassify || null;

    // Label mapping: merge defaults with custom
    this.labelMap = {
      ...MINDGUARD_MAP,
      ...MENTALLLAMA_MAP,
      ...(options.labelMap || {}),
    };

    // Validate backend
    const validBackends = ["mindguard", "mentalllama", "ollama", "transformers", "custom"];
    if (!validBackends.includes(this.backend)) {
      throw new Error(
        `SafeChat CrossClassifier: invalid backend "${this.backend}". ` +
        `Valid backends: ${validBackends.join(", ")}`
      );
    }

    // Custom backend requires a classify function
    if (this.backend === "custom" && typeof this.classifyFn !== "function") {
      throw new Error(
        "SafeChat CrossClassifier: 'custom' backend requires a classify function. " +
        "Provide options.classify = async (text, context) => ({ risk, confidence })."
      );
    }

    // Stats for monitoring
    this._stats = {
      total: 0,
      confirmed: 0,
      escalated: 0,
      overridden: 0,   // classifier disagreed but regex kept (never downgrade)
      errors: 0,
      avgLatencyMs: 0,
    };
  }

  /**
   * Classify a message using the configured backend.
   *
   * Returns a normalised result:
   *   { risk: 'high'|'low'|'none', confidence: 0-1, raw: <backend-specific>, model: string }
   *
   * @param {string} text — the user's message
   * @param {object} [context] — optional context (conversation history, etc.)
   * @returns {Promise<object>}
   */
  async classify(text, context = {}) {
    if (!text || typeof text !== "string") {
      return { risk: "none", confidence: 0, raw: null, model: this.model };
    }

    try {
      switch (this.backend) {
        case "mindguard":
        case "mentalllama":
        case "ollama":
          return await this._classifyOllama(text, context);
        case "transformers":
          return await this._classifyTransformers(text, context);
        case "custom":
          return await this._classifyCustom(text, context);
        default:
          return { risk: "none", confidence: 0, raw: null, model: this.model };
      }
    } catch (err) {
      this._stats.errors++;
      if (this.onError) {
        try { this.onError(err, text); } catch (_) {}
      }
      // On error, return a neutral result — regex handles it
      return { risk: "none", confidence: 0, raw: null, model: this.model, error: err.message };
    }
  }

  /**
   * Verify a regex detection result using the cross-classifier.
   *
   * This is the main integration point. Takes a regex result from detect()
   * and enhances it with the classifier's assessment.
   *
   * MERGE RULES:
   *   1. Regex HIGH → always HIGH (classifier can confirm but never downgrade)
   *   2. Regex LOW + classifier confirms → LOW confirmed
   *   3. Regex NONE + classifier sees risk → escalate to LOW
   *   4. Regex NONE + classifier agrees → NONE confirmed
   *
   * @param {object} regexResult — result from detect() or shield.process()
   * @param {string} text — the original message
   * @param {object} [context] — optional conversation context
   * @returns {Promise<object>} — enhanced result with crossClassifier field
   */
  async verify(regexResult, text, context = {}) {
    const start = Date.now();
    const classification = await this.classify(text, context);
    const latencyMs = Date.now() - start;

    // Update running average latency
    this._stats.total++;
    this._stats.avgLatencyMs =
      this._stats.avgLatencyMs + (latencyMs - this._stats.avgLatencyMs) / this._stats.total;

    const regexLevel = regexResult.level || "none";
    const classifierLevel = classification.risk || "none";
    const confidence = classification.confidence || 0;

    // Determine the merged level
    let mergedLevel = regexLevel;
    let mergeAction = "passthrough"; // no classifier opinion above threshold

    if (confidence >= this.confidenceThreshold) {
      if (regexLevel === "high") {
        // Never downgrade HIGH
        mergedLevel = "high";
        mergeAction = classifierLevel === "high" ? "confirmed" : "regex_override";
        if (classifierLevel === "high") this._stats.confirmed++;
        else this._stats.overridden++;
      } else if (regexLevel === "low") {
        if (classifierLevel === "high") {
          // Classifier sees more urgency — escalate
          mergedLevel = "high";
          mergeAction = "escalated";
          this._stats.escalated++;
        } else if (classifierLevel === "low" || classifierLevel === "none") {
          mergedLevel = regexLevel;
          mergeAction = classifierLevel === "low" ? "confirmed" : "regex_override";
          if (classifierLevel === "low") this._stats.confirmed++;
          else this._stats.overridden++;
        }
      } else if (regexLevel === "none") {
        if (classifierLevel === "high" || classifierLevel === "low") {
          // Classifier caught something regex missed
          mergedLevel = this.allowDowngrade ? classifierLevel : "low";
          mergeAction = "escalated";
          this._stats.escalated++;
        } else {
          mergedLevel = "none";
          mergeAction = "confirmed";
          this._stats.confirmed++;
        }
      }
    }

    const enhanced = {
      ...regexResult,
      level: mergedLevel,
      crossClassifier: {
        backend: this.backend,
        model: classification.model || this.model,
        risk: classifierLevel,
        confidence,
        mergeAction,
        latencyMs,
        regexLevel,
        error: classification.error || null,
      },
    };

    // Fire onClassify callback
    if (this.onClassify) {
      try { this.onClassify(enhanced); } catch (_) {}
    }

    return enhanced;
  }

  // ── Backend implementations ──────────────────────────────────────────────

  /**
   * Classify via Ollama (also used for MindGuard/MentalLLaMA served through Ollama).
   */
  async _classifyOllama(text, context) {
    const model = this.model || this._defaultModelForBackend();
    const conversationHistory = context.history || [];

    // Build the prompt based on the backend type
    const prompt = this._buildPrompt(text, conversationHistory);

    const body = JSON.stringify({
      model,
      prompt,
      stream: false,
      options: {
        temperature: 0,       // deterministic
        num_predict: 50,      // short response
      },
    });

    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), this.timeout);

    try {
      const response = await fetch(`${this.endpoint}/api/generate`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body,
        signal: controller.signal,
      });

      clearTimeout(timeoutId);

      if (!response.ok) {
        throw new Error(`Ollama returned ${response.status}: ${response.statusText}`);
      }

      const data = await response.json();
      return this._parseResponse(data.response || "", model);
    } finally {
      clearTimeout(timeoutId);
    }
  }

  /**
   * Classify via Transformers.js or any OpenAI-compatible local endpoint.
   */
  async _classifyTransformers(text, context) {
    const model = this.model || "mental-health-classifier";
    const conversationHistory = context.history || [];

    const prompt = this._buildPrompt(text, conversationHistory);

    const body = JSON.stringify({
      model,
      messages: [
        { role: "system", content: this._systemPrompt() },
        { role: "user", content: prompt },
      ],
      temperature: 0,
      max_tokens: 50,
    });

    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), this.timeout);

    try {
      const response = await fetch(`${this.endpoint}/v1/chat/completions`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body,
        signal: controller.signal,
      });

      clearTimeout(timeoutId);

      if (!response.ok) {
        throw new Error(`Transformers API returned ${response.status}`);
      }

      const data = await response.json();
      const content = data.choices?.[0]?.message?.content || "";
      return this._parseResponse(content, model);
    } finally {
      clearTimeout(timeoutId);
    }
  }

  /**
   * Classify via developer-provided function.
   */
  async _classifyCustom(text, context) {
    const result = await this.classifyFn(text, context);

    // Normalise the result
    const risk = this._mapLabel(result.risk || result.label || result.category || "none");
    const confidence = typeof result.confidence === "number" ? result.confidence :
                       typeof result.score === "number" ? result.score : 0.5;

    return {
      risk,
      confidence: Math.max(0, Math.min(1, confidence)),
      raw: result,
      model: result.model || "custom",
    };
  }

  // ── Prompt construction ──────────────────────────────────────────────────

  _systemPrompt() {
    if (this.backend === "mindguard") {
      return [
        "You are a mental health safety classifier. Classify the user's message into one of three categories:",
        "- SAFE: No imminent risk. May include therapeutic discussion, emotional expression, or symptom description.",
        "- SELF-HARM: Current or imminent risk of self-directed harm. Includes suicidal ideation, self-injury intent, or overdose plans.",
        "- HARM-TO-OTHERS: Risk of violence or harm directed at identifiable others.",
        "",
        "Respond with ONLY a JSON object: {\"label\": \"safe|self-harm|harm-to-others\", \"confidence\": 0.0-1.0}",
        "Do not explain. Do not add text outside the JSON.",
      ].join("\n");
    }

    if (this.backend === "mentalllama") {
      return [
        "You are a mental health analysis system. Assess the user's message for signs of mental health distress.",
        "Categories: depression, anxiety, stress, loneliness, grief, suicidal_ideation, self_harm, crisis, safe.",
        "",
        "Respond with ONLY a JSON object: {\"label\": \"<category>\", \"confidence\": 0.0-1.0}",
        "Do not explain. Do not add text outside the JSON.",
      ].join("\n");
    }

    // Generic classifier prompt
    return [
      "You are a crisis safety classifier. Assess whether the user's message indicates mental health crisis or distress.",
      "Labels: crisis (immediate danger), distress (emotional pain, hopelessness), safe (no risk detected).",
      "",
      "Respond with ONLY a JSON object: {\"label\": \"crisis|distress|safe\", \"confidence\": 0.0-1.0}",
      "Do not explain. Do not add text outside the JSON.",
    ].join("\n");
  }

  _buildPrompt(text, history) {
    const parts = [];

    // Include system prompt for Ollama (which doesn't have a system role in /api/generate)
    if (this.backend === "ollama" || this.backend === "mindguard" || this.backend === "mentalllama") {
      parts.push(this._systemPrompt());
      parts.push("");
    }

    // Include recent conversation history for context (if available)
    if (history.length > 0) {
      parts.push("Recent conversation context:");
      const recent = history.slice(-5); // last 5 messages for context
      for (const msg of recent) {
        parts.push(`${msg.role}: ${msg.content}`);
      }
      parts.push("");
    }

    parts.push(`User message to classify: "${text}"`);
    return parts.join("\n");
  }

  // ── Response parsing ─────────────────────────────────────────────────────

  _parseResponse(responseText, model) {
    const text = responseText.trim();

    // Try JSON parsing first
    try {
      // Extract JSON from response (may have surrounding text)
      const jsonMatch = text.match(/\{[^}]+\}/);
      if (jsonMatch) {
        const parsed = JSON.parse(jsonMatch[0]);
        const label = parsed.label || parsed.category || parsed.risk || "none";
        const confidence = typeof parsed.confidence === "number" ? parsed.confidence :
                          typeof parsed.score === "number" ? parsed.score : 0.7;
        return {
          risk: this._mapLabel(label),
          confidence: Math.max(0, Math.min(1, confidence)),
          raw: parsed,
          model,
        };
      }
    } catch (_) {
      // JSON parsing failed, try keyword extraction
    }

    // Keyword fallback — look for known labels in the response text
    const lower = text.toLowerCase();
    if (/\bself[- ]?harm\b|\bsuicid|\bcrisis\b|\bharm to others\b/.test(lower)) {
      return { risk: "high", confidence: 0.5, raw: text, model };
    }
    if (/\bdepression\b|\bdistress\b|\banxiety\b|\bhopeless\b|\bloneli/.test(lower)) {
      return { risk: "low", confidence: 0.5, raw: text, model };
    }
    if (/\bsafe\b|\bno risk\b|\bnormal\b|\bnone\b/.test(lower)) {
      return { risk: "none", confidence: 0.5, raw: text, model };
    }

    // Couldn't parse — return neutral
    return { risk: "none", confidence: 0, raw: text, model };
  }

  _mapLabel(label) {
    if (!label) return "none";
    const normalised = label.toLowerCase().trim();
    // If it's already a SafeChat level, return as-is
    if (normalised === "high" || normalised === "low" || normalised === "none") {
      return normalised;
    }
    return this.labelMap[normalised] || "none";
  }

  _defaultModelForBackend() {
    switch (this.backend) {
      case "mindguard": return "mindguard-8b";
      case "mentalllama": return "mentalllama-chat-7b";
      default: return "default";
    }
  }

  // ── Stats & diagnostics ──────────────────────────────────────────────────

  /**
   * Get classification statistics.
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
   * Test connectivity to the backend.
   * @returns {Promise<{ ok: boolean, latencyMs: number, error: string|null }>}
   */
  async ping() {
    const start = Date.now();
    try {
      if (this.backend === "custom") {
        // Test the custom function with a neutral message
        await this.classify("hello", {});
        return { ok: true, latencyMs: Date.now() - start, error: null };
      }

      if (this.backend === "ollama" || this.backend === "mindguard" || this.backend === "mentalllama") {
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), this.timeout);
        try {
          const response = await fetch(`${this.endpoint}/api/tags`, {
            signal: controller.signal,
          });
          clearTimeout(timeoutId);
          return {
            ok: response.ok,
            latencyMs: Date.now() - start,
            error: response.ok ? null : `Status ${response.status}`,
          };
        } finally {
          clearTimeout(timeoutId);
        }
      }

      if (this.backend === "transformers") {
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), this.timeout);
        try {
          const response = await fetch(`${this.endpoint}/v1/models`, {
            signal: controller.signal,
          });
          clearTimeout(timeoutId);
          return {
            ok: response.ok,
            latencyMs: Date.now() - start,
            error: response.ok ? null : `Status ${response.status}`,
          };
        } finally {
          clearTimeout(timeoutId);
        }
      }

      return { ok: false, latencyMs: Date.now() - start, error: "Unknown backend" };
    } catch (err) {
      return { ok: false, latencyMs: Date.now() - start, error: err.message };
    }
  }
}

// ── Factory ────────────────────────────────────────────────────────────────

/**
 * Create a configured CrossClassifier instance.
 *
 * @param {object} options — see CrossClassifier constructor
 * @returns {CrossClassifier}
 */
function createCrossClassifier(options = {}) {
  return new CrossClassifier(options);
}

// ── Pre-configured setups ──────────────────────────────────────────────────

const CC_PRESETS = {
  /** MindGuard via Ollama — 3-category crisis classification */
  mindguard: {
    backend: "mindguard",
    model: "mindguard-8b",
    endpoint: "http://localhost:11434",
    confidenceThreshold: 0.6,
  },

  /** MindGuard lightweight — 4B model for faster inference */
  mindguard_fast: {
    backend: "mindguard",
    model: "mindguard-4b",
    endpoint: "http://localhost:11434",
    confidenceThreshold: 0.6,
  },

  /** MentalLLaMA via Ollama — multi-task mental health analysis */
  mentalllama: {
    backend: "mentalllama",
    model: "mentalllama-chat-7b",
    endpoint: "http://localhost:11434",
    confidenceThreshold: 0.6,
  },

  /** Any local model via OpenAI-compatible API (LM Studio, vLLM, etc.) */
  local_api: {
    backend: "transformers",
    model: "default",
    endpoint: "http://localhost:1234",
    confidenceThreshold: 0.5,
  },
};

module.exports = {
  CrossClassifier,
  createCrossClassifier,
  CC_PRESETS,
  MINDGUARD_MAP,
  MENTALLLAMA_MAP,
};
