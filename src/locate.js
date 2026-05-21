/**
 * Safechat — Geo-detection cascade
 *
 * Finds the user's country WITHOUT location permissions.
 * Cascade: locale → timezone → IP fallback → manual override → global fallback
 *
 * Zero permissions. Zero tracking. Just finds help nearby.
 */

// Timezone → country code mapping (covers all countries in the crisis database)
const TZ_MAP = {
  "Australia":            "AU",
  "Europe/Vienna":        "AT",
  "Europe/Brussels":      "BE",
  "America/Sao_Paulo":    "BR",
  "America/Fortaleza":    "BR",
  "America/Recife":       "BR",
  "America/Toronto":      "CA",
  "America/Vancouver":    "CA",
  "America/Edmonton":     "CA",
  "America/Winnipeg":     "CA",
  "America/Halifax":      "CA",
  "America/St_Johns":     "CA",
  "Asia/Shanghai":        "CN",
  "Asia/Chongqing":       "CN",
  "Europe/Copenhagen":    "DK",
  "Europe/Helsinki":      "FI",
  "Europe/Paris":         "FR",
  "Europe/Berlin":        "DE",
  "Europe/Munich":        "DE",
  "Africa/Accra":         "GH",
  "Asia/Hong_Kong":       "HK",
  "Asia/Kolkata":         "IN",
  "Asia/Calcutta":        "IN",
  "Europe/Dublin":        "IE",
  "Asia/Jerusalem":       "IL",
  "Asia/Tel_Aviv":        "IL",
  "Europe/Rome":          "IT",
  "Asia/Tokyo":           "JP",
  "Africa/Nairobi":       "KE",
  "America/Mexico_City":  "MX",
  "America/Cancun":       "MX",
  "Europe/Amsterdam":     "NL",
  "Pacific/Auckland":     "NZ",
  "Africa/Lagos":         "NG",
  "Europe/Oslo":          "NO",
  "Asia/Karachi":         "PK",
  "Asia/Manila":          "PH",
  "Europe/Lisbon":        "PT",
  "Europe/Moscow":        "RU",
  "Africa/Johannesburg":  "ZA",
  "Asia/Seoul":           "KR",
  "Europe/Madrid":        "ES",
  "Europe/Stockholm":     "SE",
  "Europe/Zurich":        "CH",
  "Europe/London":        "GB",
  "America/New_York":     "US",
  "America/Chicago":      "US",
  "America/Denver":       "US",
  "America/Los_Angeles":  "US",
  "America/Phoenix":      "US",
  "America/Anchorage":    "US",
  "Pacific/Honolulu":     "US",
};

/**
 * Step 1: Extract country from browser locale string
 * "en-AU" → "AU", "fr-CA" → "CA", "de" → null
 */
function fromLocale(locale) {
  if (!locale || typeof locale !== "string") return null;
  const parts = locale.split("-");
  if (parts.length >= 2) {
    const code = parts[parts.length - 1].toUpperCase();
    if (code.length === 2) return code;
  }
  return null;
}

/**
 * Step 2: Extract country from IANA timezone
 * "Australia/Sydney" → "AU", "Europe/London" → "GB"
 */
function fromTimezone(tz) {
  if (!tz || typeof tz !== "string") return null;

  // Direct match first
  if (TZ_MAP[tz]) return TZ_MAP[tz];

  // Partial match (e.g. "Australia/Sydney" matches "Australia")
  for (const [prefix, code] of Object.entries(TZ_MAP)) {
    if (tz.startsWith(prefix) || tz.includes(prefix)) return code;
  }

  return null;
}

/**
 * Step 3: IP-based geolocation (optional, requires fetch)
 * Uses free ip-api.com — no API key needed, 45 req/min limit
 * Returns country code or null
 */
async function fromIP({ timeout = 3000 } = {}) {
  try {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), timeout);
    const res = await fetch("http://ip-api.com/json/?fields=countryCode", {
      signal: controller.signal,
    });
    clearTimeout(timer);
    if (!res.ok) return null;
    const data = await res.json();
    return data?.countryCode || null;
  } catch (_) {
    return null;
  }
}

/**
 * Full detection cascade — tries each method in order, returns first hit
 *
 * Options:
 *   manual:    "AU"         — skip detection, use this code
 *   useIP:     true/false   — whether to try IP geolocation (default: false)
 *   timeout:   3000         — IP lookup timeout in ms
 *
 * Returns: { country: "AU"|null, method: "locale"|"timezone"|"ip"|"manual"|"fallback" }
 */
async function locate(options = {}) {
  // Manual override — highest priority
  if (options.manual) {
    return { country: options.manual.toUpperCase(), method: "manual" };
  }

  // Step 1: Browser locale
  if (typeof navigator !== "undefined") {
    const fromLoc = fromLocale(navigator.language);
    if (fromLoc) return { country: fromLoc, method: "locale" };
  }

  // Step 2: Timezone
  try {
    const tz = Intl.DateTimeFormat().resolvedOptions().timeZone;
    const fromTz = fromTimezone(tz);
    if (fromTz) return { country: fromTz, method: "timezone" };
  } catch (_) {}

  // Step 3: IP geolocation (opt-in)
  if (options.useIP !== false) {
    const fromIp = await fromIP({ timeout: options.timeout || 3000 });
    if (fromIp) return { country: fromIp, method: "ip" };
  }

  // Step 4: Global fallback
  return { country: null, method: "fallback" };
}

/**
 * Synchronous version — skips IP lookup, returns immediately
 */
function locateSync(options = {}) {
  if (options.manual) {
    return { country: options.manual.toUpperCase(), method: "manual" };
  }

  if (typeof navigator !== "undefined") {
    const fromLoc = fromLocale(navigator.language);
    if (fromLoc) return { country: fromLoc, method: "locale" };
  }

  try {
    const tz = Intl.DateTimeFormat().resolvedOptions().timeZone;
    const fromTz = fromTimezone(tz);
    if (fromTz) return { country: fromTz, method: "timezone" };
  } catch (_) {}

  return { country: null, method: "fallback" };
}

/**
 * Node.js server-side: detect from request headers
 * Checks Accept-Language header and CF-IPCountry / X-Vercel-IP-Country
 */
function fromRequest(req) {
  if (!req) return { country: null, method: "fallback" };

  // CDN headers (Cloudflare, Vercel, AWS CloudFront)
  const cfCountry = req.headers?.["cf-ipcountry"];
  if (cfCountry && cfCountry !== "XX") return { country: cfCountry.toUpperCase(), method: "cdn_header" };

  const vercelCountry = req.headers?.["x-vercel-ip-country"];
  if (vercelCountry) return { country: vercelCountry.toUpperCase(), method: "cdn_header" };

  const awsCountry = req.headers?.["cloudfront-viewer-country"];
  if (awsCountry) return { country: awsCountry.toUpperCase(), method: "cdn_header" };

  // Accept-Language header
  const acceptLang = req.headers?.["accept-language"];
  if (acceptLang) {
    const match = acceptLang.match(/[a-z]{2}-([A-Z]{2})/);
    if (match) return { country: match[1], method: "accept_language" };
  }

  return { country: null, method: "fallback" };
}

module.exports = {
  locate,
  locateSync,
  fromLocale,
  fromTimezone,
  fromIP,
  fromRequest,
  TZ_MAP,
};
