/**
 * SafeChat Shield — Configurable safety layer for AI chat applications.
 *
 * Lets developers toggle which safety modules are active and decide how each
 * detection level impacts their chat. One app might hard-interrupt on HIGH,
 * another might silently flag for moderator review.
 *
 * RESPONSE MODES:
 *   'interrupt'  — Stop the conversation. Show crisis resources immediately.
 *                  Use: crisis hotlines, vulnerable-user apps.
 *
 *   'inject'     — Add safety content to the AI's system prompt but let it
 *                  continue responding. The AI leads with warmth, ends with
 *                  helpline links.
 *                  Use: companion AI, therapy-adjacent apps.
 *
 *   'flag'       — Silent flag for moderator/curator review. The user is not
 *                  interrupted. A callback fires with signal data.
 *                  Use: museum comment systems, forums, community platforms.
 *
 *   'log'        — Record the signal but take no visible action. For analytics
 *                  and monitoring without user-facing changes.
 *                  Use: research, baseline measurement, shadow-mode testing.
 *
 *   'callback'   — Call a developer-provided function and let them decide.
 *                  Full control, no default behaviour.
 *                  Use: custom workflows, multi-stage pipelines.
 *
 *   'none'       — Module is active for detection but takes no action.
 *                  Useful when you only want detection data in the return value.
 *
 * USAGE:
 *
 *   // Companion AI — interrupt on HIGH, inject on LOW, track subtle signals
 *   const shield = safechat.createShield({
 *     crisis: true,
 *     subtle: true,
 *     responses: { high: 'interrupt', low: 'inject', subtle: 'inject' },
 *   });
 *
 *   // Museum comment moderation — flag everything for curator review
 *   const shield = safechat.createShield({
 *     crisis: true,
 *     subtle: false,
 *     responses: { high: 'flag', low: 'flag' },
 *     onFlag: (result) => addToReviewQueue(result),
 *   });
 *
 *   // Research / shadow mode — detect but don't act
 *   const shield = safechat.createShield({
 *     crisis: true,
 *     subtle: true,
 *     responses: { high: 'log', low: 'log', subtle: 'log' },
 *     onLog: (result) => analytics.track('safety_signal', result),
 *   });
 *
 *   // Process a message:
 *   const result = shield.process("user message", { country: "AU" });
 *   // → { level, action, response, resources, ... }
 *
 * PRIVACY: No message content is stored by Shield or ConversationTracker.
 * Only signal categories and weights are held in session memory.
 */

const { detect, detectSubtle, ConversationTracker } = require("./detect");
const { locateSync, fromRequest } = require("./locate");
const { getResources, formatForChat } = require("./resources");

const VALID_MODES = ["interrupt", "inject", "flag", "log", "callback", "none"];

const DEFAULTS = {
  // Modules
  crisis: true,           // HIGH/LOW crisis detection
  subtle: false,          // session-level subtle signal accumulation

  // Response mode per level
  responses: {
    high: "interrupt",    // explicit crisis → stop and show resources
    low: "inject",        // distress → add safety to AI response
    subtle: "flag",       // accumulated subtle → flag for review
  },

  // Subtle signal thresholds
  subtleThresholdLow: 4,
  subtleThresholdHigh: 8,

  // Session window for subtle accumulation (ms)
  subtleWindowMs: 30 * 60 * 1000,  // 30 minutes

  // Callbacks (all optional)
  onCrisis: null,   // (result) => {} — fires on HIGH or LOW
  onFlag: null,     // (result) => {} — fires when mode is 'flag'
  onLog: null,      // (result) => {} — fires when mode is 'log'
  onCallback: null, // (result) => {} — fires when mode is 'callback'
};

class Shield {
  /**
   * @param {object} options — see DEFAULTS above
   */
  constructor(options = {}) {
    this.config = { ...DEFAULTS, ...options };
    this.config.responses = { ...DEFAULTS.responses, ...(options.responses || {}) };

    // Validate response modes
    for (const [level, mode] of Object.entries(this.config.responses)) {
      if (!VALID_MODES.includes(mode)) {
        throw new Error(
          `SafeChat Shield: invalid response mode "${mode}" for level "${level}". ` +
          `Valid modes: ${VALID_MODES.join(", ")}`
        );
      }
    }

    // Create session tracker if subtle detection is enabled
    this.tracker = this.config.subtle
      ? new ConversationTracker({
          thresholdLow: this.config.subtleThresholdLow,
          thresholdHigh: this.config.subtleThresholdHigh,
          windowMs: this.config.subtleWindowMs,
        })
      : null;
  }

  /**
   * Process a user message through the safety shield.
   *
   * @param {string} text — the user's message
   * @param {object} options
   * @param {string} [options.country] — ISO country code override
   * @param {object} [options.req] — Express request object (for geo-detection)
   * @returns {object} result
   */
  process(text, options = {}) {
    // --- 1. Detect ---
    const detection = detect(text);
    let level = detection.level;
    let matched = detection.matched;
    let accumulated = false;
    let subtleSignals = [];
    let sessionData = null;

    // --- 2. Session accumulation (if enabled) ---
    if (this.tracker) {
      const tracked = this.tracker.process(text);
      subtleSignals = tracked.subtleSignals || [];
      sessionData = {
        weight: tracked.sessionWeight,
        categories: tracked.sessionCategories,
        signalCount: tracked.sessionSignalCount,
      };

      // If single-message detection found nothing but accumulation escalated
      if (level === "none" && tracked.accumulated) {
        level = tracked.level;
        accumulated = true;
      }
    }

    // --- 3. Determine response mode ---
    let responseMode = "none";
    if (level === "high") {
      responseMode = this.config.responses.high || "interrupt";
    } else if (level === "low" && !accumulated) {
      responseMode = this.config.responses.low || "inject";
    } else if (level !== "none" && accumulated) {
      responseMode = this.config.responses.subtle || "flag";
    }

    // --- 4. Resolve country ---
    let country = null;
    if (options.country) {
      country = options.country.toUpperCase();
    } else if (options.req) {
      country = fromRequest(options.req).country;
    } else {
      try { country = locateSync().country; } catch (_) {}
    }

    // --- 5. Build resources (only if needed) ---
    let resources = null;
    let promptOverride = "";
    if (level !== "none" && (responseMode === "interrupt" || responseMode === "inject")) {
      resources = getResources(country);
      promptOverride = this._buildPromptOverride(level, responseMode, resources);
    }

    // --- 6. Build result ---
    const result = {
      // Detection
      level,
      matched,
      accumulated,

      // Response
      action: responseMode,
      promptOverride,

      // Location & resources
      country,
      resources,

      // Session (if subtle tracking enabled)
      session: sessionData,
      subtleSignals,

      // Metadata
      timestamp: Date.now(),
      shieldVersion: "1.1",
    };

    // --- 7. Fire callbacks ---
    if (level !== "none") {
      this._fireCallbacks(result);
    }

    return result;
  }

  /**
   * Build system prompt override based on response mode.
   */
  _buildPromptOverride(level, mode, resources) {
    if (mode === "flag" || mode === "log" || mode === "none") return "";

    const resourceText = resources ? formatForChat(resources) : "findahelpline.com";

    if (level === "high" && mode === "interrupt") {
      return [
        "[SAFETY_OVERRIDE — CRISIS DETECTED]",
        "The user's message contains signals of serious distress, self-harm, or suicidal ideation.",
        "DO NOT continue your normal response.",
        "DO NOT interpret, analyze, or reflect on the content.",
        "Respond ONLY with:",
        "1. A brief, warm, human acknowledgment (1-2 sentences). No clinical language.",
        "2. A clear statement that you cannot help with this the way a real person can.",
        "3. The crisis resources listed below — present them clearly.",
        "",
        "CRISIS RESOURCES:",
        resourceText,
        "",
        "End with an invitation to reach out to one of these services now.",
      ].join("\n");
    }

    if (level === "high" && mode === "inject") {
      return [
        "[SAFETY_PRIORITY — SERIOUS DISTRESS DETECTED]",
        "The user's message contains signals of serious distress.",
        "You may respond to their message, but you MUST:",
        "1. Lead with genuine warmth and acknowledgment of what they're going through.",
        "2. Keep your response grounded. No deflection, no minimising.",
        "3. Include the crisis resources below naturally in your response.",
        "4. End with a clear invitation to reach out to professional support.",
        "",
        "CRISIS RESOURCES:",
        resourceText,
      ].join("\n");
    }

    if (level === "low") {
      return [
        "[SAFETY_NOTE — DISTRESS SIGNALS DETECTED]",
        "The user's message contains indicators of emotional distress.",
        "You may respond to their message, but you MUST:",
        "1. Lead with warmth and validation — name what they seem to be carrying.",
        "2. Keep your response grounded and steady. No symbolism, no wit, no challenges.",
        "3. End your response with this line:",
        '"If things feel heavier than you can carry right now, support is available — visit findahelpline.com to find a crisis line near you."',
      ].join("\n");
    }

    return "";
  }

  /**
   * Fire appropriate callbacks based on response mode.
   */
  _fireCallbacks(result) {
    try {
      // Always fire onCrisis for HIGH/LOW
      if (this.config.onCrisis && (result.level === "high" || result.level === "low")) {
        this.config.onCrisis(result);
      }

      // Mode-specific callbacks
      if (result.action === "flag" && this.config.onFlag) {
        this.config.onFlag(result);
      }
      if (result.action === "log" && this.config.onLog) {
        this.config.onLog(result);
      }
      if (result.action === "callback" && this.config.onCallback) {
        this.config.onCallback(result);
      }
    } catch (_) {
      // Never let a callback error break the safety pipeline
    }
  }

  /**
   * Reset the session tracker (e.g., new conversation).
   */
  resetSession() {
    if (this.tracker) this.tracker.reset();
  }

  /**
   * Get session summary (if subtle tracking enabled).
   */
  sessionSummary() {
    if (!this.tracker) return null;
    return this.tracker.summary();
  }

  /**
   * Update configuration at runtime.
   * Useful for letting users adjust safety levels in settings.
   */
  configure(updates) {
    if (updates.responses) {
      for (const [level, mode] of Object.entries(updates.responses)) {
        if (!VALID_MODES.includes(mode)) {
          throw new Error(`SafeChat Shield: invalid response mode "${mode}"`);
        }
      }
      this.config.responses = { ...this.config.responses, ...updates.responses };
    }

    // Update callbacks
    if (updates.onCrisis !== undefined) this.config.onCrisis = updates.onCrisis;
    if (updates.onFlag !== undefined) this.config.onFlag = updates.onFlag;
    if (updates.onLog !== undefined) this.config.onLog = updates.onLog;
    if (updates.onCallback !== undefined) this.config.onCallback = updates.onCallback;

    // Toggle subtle detection
    if (updates.subtle !== undefined && updates.subtle !== this.config.subtle) {
      this.config.subtle = updates.subtle;
      if (updates.subtle) {
        this.tracker = new ConversationTracker({
          thresholdLow: updates.subtleThresholdLow || this.config.subtleThresholdLow,
          thresholdHigh: updates.subtleThresholdHigh || this.config.subtleThresholdHigh,
          windowMs: updates.subtleWindowMs || this.config.subtleWindowMs,
        });
      } else {
        this.tracker = null;
      }
    }
  }

  /**
   * Express/Connect middleware using this Shield's configuration.
   */
  middleware() {
    const shield = this;
    return function shieldMiddleware(req, _res, next) {
      const location = fromRequest(req);
      req.safechat = {
        process(text) {
          return shield.process(text, { country: location.country });
        },
        country: location.country,
        resetSession() { shield.resetSession(); },
        sessionSummary() { return shield.sessionSummary(); },
        configure(updates) { shield.configure(updates); },
      };
      next();
    };
  }
}

/**
 * Factory function — creates a configured Shield instance.
 *
 * @param {object} options
 * @returns {Shield}
 */
function createShield(options = {}) {
  return new Shield(options);
}

// ── Preset configurations ─────────────────────────────────────────────────────
// Common setups for different use cases.

const PRESETS = {
  /** Companion AI — interrupt on HIGH, inject on LOW, track subtle signals */
  companion: {
    crisis: true,
    subtle: true,
    responses: { high: "interrupt", low: "inject", subtle: "inject" },
  },

  /** Chatbot — inject safety into prompts, don't hard-interrupt */
  chatbot: {
    crisis: true,
    subtle: true,
    responses: { high: "inject", low: "inject", subtle: "inject" },
  },

  /** Moderation — flag everything for human review */
  moderation: {
    crisis: true,
    subtle: true,
    responses: { high: "flag", low: "flag", subtle: "flag" },
  },

  /** Kids / vulnerable users — interrupt on everything */
  strict: {
    crisis: true,
    subtle: true,
    subtleThresholdLow: 3,
    subtleThresholdHigh: 6,
    responses: { high: "interrupt", low: "interrupt", subtle: "interrupt" },
  },

  /** Research / shadow mode — detect and log, don't act */
  shadow: {
    crisis: true,
    subtle: true,
    responses: { high: "log", low: "log", subtle: "log" },
  },

  /** Museum / GLAM — flag for curator review (CARE-aligned) */
  museum: {
    crisis: true,
    subtle: false,
    responses: { high: "flag", low: "flag" },
  },
};

module.exports = { Shield, createShield, PRESETS };
