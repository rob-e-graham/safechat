/**
 * Safechat
 * Crisis safety for AI apps. Detects distress, finds local help. Zero location permissions.
 *
 * Usage:
 *   const safechat = require('safechat');
 *
 *   // Check a message
 *   const result = safechat.check("I can't go on anymore");
 *   // → { level: "low", matched: "can't go on", country: "AU", resources: [...], action: "soft_warning" }
 *
 *   // Get prompt override for your AI
 *   const override = safechat.promptOverride("high", "AU");
 *   // → system prompt text telling the AI to stop and show crisis resources
 *
 * @license MIT
 */

const { detect, detectSubtle, isHighCrisis, isAnyCrisis, ConversationTracker } = require("./detect");
const { locate, locateSync, fromRequest, fromLocale, fromTimezone } = require("./locate");
const { getResources, listCountries, getEmergencyNumber, search, formatForChat, formatForHTML, loadData } = require("./resources");

/**
 * One-call safety check: detect crisis level + get localized resources.
 *
 * @param {string} text - The user's message
 * @param {object} options
 * @param {string} [options.country] - Override country code (skips geo-detection)
 * @param {object} [options.req] - Express/Node request object (for server-side detection)
 * @returns {{ level: string, matched: string|null, country: string|null, resources: object, action: string }}
 */
function check(text, options = {}) {
  const { level, matched } = detect(text);

  let country = null;
  if (options.country) {
    country = options.country.toUpperCase();
  } else if (options.req) {
    country = fromRequest(options.req).country;
  } else {
    country = locateSync().country;
  }

  const resources = level !== "none" ? getResources(country) : { resources: [], fallback: false, globalResources: [] };

  const action =
    level === "high" ? "crisis_intervention" :
    level === "low" ? "soft_warning" :
    "none";

  return { level, matched, country, resources, action };
}

/**
 * Generate a system prompt override for AI crisis handling.
 *
 * Inject this at the TOP of your system prompt when crisis is detected.
 * The AI will stop its normal behavior and respond with crisis resources.
 *
 * @param {string} level - "high" or "low"
 * @param {string} countryCode - ISO country code
 * @returns {string} - System prompt text to prepend
 */
function promptOverride(level, countryCode) {
  if (level === "high") {
    const result = getResources(countryCode);
    const resourceText = formatForChat(result);

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
 * Express/Connect middleware — attaches safechat to req.
 *
 * Usage:
 *   app.use(safechat.middleware());
 *
 *   app.post('/api/chat', (req, res) => {
 *     const safety = req.safechat.check(req.body.message);
 *     if (safety.level === 'high') { ... }
 *   });
 */
function middleware(options = {}) {
  return function safechatMiddleware(req, _res, next) {
    const location = fromRequest(req);

    req.safechat = {
      check(text) {
        return check(text, { country: location.country, ...options });
      },
      country: location.country,
      method: location.method,
      getResources(countryOverride) {
        return getResources(countryOverride || location.country);
      },
      promptOverride(level, countryOverride) {
        return promptOverride(level, countryOverride || location.country);
      },
    };

    next();
  };
}

module.exports = {
  // One-call API
  check,
  promptOverride,
  middleware,

  // Detection
  detect,
  detectSubtle,
  isHighCrisis,
  isAnyCrisis,

  // Session tracking
  ConversationTracker,

  // Geo-detection
  locate,
  locateSync,
  fromRequest,
  fromLocale,
  fromTimezone,

  // Resources
  getResources,
  listCountries,
  getEmergencyNumber,
  search,
  formatForChat,
  formatForHTML,
  loadData,
};
