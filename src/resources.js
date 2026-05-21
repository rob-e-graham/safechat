/**
 * Safechat — Crisis resource lookup
 *
 * Finds verified crisis helplines by country, with filtering by
 * specialty (youth, LGBTQ+, veterans, indigenous) and contact type (phone, text, chat).
 *
 * Always returns something — if the country isn't in the database,
 * returns global fallback resources (findahelpline.com, Befrienders Worldwide).
 */

const path = require("path");
const fs = require("fs");

let _data = null;

function loadData(customPath) {
  if (_data && !customPath) return _data;

  const dataPath = customPath || path.join(__dirname, "..", "data", "crisis-resources.json");

  try {
    if (typeof fs.readFileSync === "function") {
      const raw = fs.readFileSync(dataPath, "utf8");
      _data = JSON.parse(raw);
      return _data;
    }
  } catch (_) {}

  // Fallback: try require (works in bundlers)
  try {
    _data = require("../data/crisis-resources.json");
    return _data;
  } catch (_) {}

  // Absolute minimum fallback
  _data = {
    countries: {},
    fallback: {
      resources: [
        { name: "Find A Helpline", type: ["web"], url: "https://findahelpline.com", coverage: "175+ countries", verified: true },
        { name: "Befrienders Worldwide", type: ["web"], url: "https://www.befrienders.org", coverage: "50+ countries", verified: true },
      ],
    },
  };
  return _data;
}

/**
 * Get crisis resources for a country code.
 *
 * @param {string} countryCode - ISO 3166-1 alpha-2 (e.g. "AU", "US", "GB")
 * @param {object} options
 * @param {string[]} [options.specialties] - Filter: ["youth", "lgbtq", "veterans", "indigenous"]
 * @param {string[]} [options.types] - Filter: ["phone", "text", "chat", "email"]
 * @param {number}   [options.limit] - Max resources to return (default: all)
 * @returns {{ country: string|null, emergency: string|null, resources: object[], fallback: boolean, globalResources: object[] }}
 */
function getResources(countryCode, options = {}) {
  const data = loadData(options._dataPath);
  const code = (countryCode || "").toUpperCase();
  const country = data.countries[code] || null;

  let resources = country ? [...country.resources] : [];

  if (options.specialties?.length) {
    resources = resources.filter((r) =>
      r.specialties?.some((s) => options.specialties.includes(s))
    );
  }

  if (options.types?.length) {
    resources = resources.filter((r) =>
      r.type?.some((t) => options.types.includes(t))
    );
  }

  if (options.limit && options.limit > 0) {
    resources = resources.slice(0, options.limit);
  }

  const isFallback = !country || resources.length === 0;

  return {
    country: country?.name || null,
    emergency: country?.emergency || null,
    resources,
    fallback: isFallback,
    globalResources: isFallback ? data.fallback.resources : [],
  };
}

/**
 * List all countries in the database.
 * @returns {{ code: string, name: string, emergency: string, resourceCount: number }[]}
 */
function listCountries() {
  const data = loadData();
  return Object.entries(data.countries).map(([code, c]) => ({
    code,
    name: c.name,
    emergency: c.emergency,
    resourceCount: c.resources.length,
  }));
}

/**
 * Get emergency number for a country.
 * @param {string} countryCode
 * @returns {string|null}
 */
function getEmergencyNumber(countryCode) {
  const data = loadData();
  return data.countries[(countryCode || "").toUpperCase()]?.emergency || null;
}

/**
 * Search all resources by keyword (name, specialty, language).
 * @param {string} query
 * @returns {Array}
 */
function search(query) {
  const data = loadData();
  const q = (query || "").toLowerCase();
  const results = [];

  for (const [code, country] of Object.entries(data.countries)) {
    for (const resource of country.resources) {
      if (
        resource.name.toLowerCase().includes(q) ||
        resource.specialties?.some((s) => s.includes(q)) ||
        resource.languages?.some((l) => l.includes(q))
      ) {
        results.push({ countryCode: code, countryName: country.name, ...resource });
      }
    }
  }

  return results;
}

/**
 * Format resources for display in a chat message or terminal.
 * @param {{ resources: object[], emergency: string|null, globalResources: object[] }} result
 * @returns {string}
 */
function formatForChat(result) {
  const lines = [];

  const allResources = result.resources.length > 0 ? result.resources : result.globalResources || [];

  for (const r of allResources) {
    lines.push(`${r.name}`);
    const phones = Array.isArray(r.phone) ? r.phone : r.phone ? [r.phone] : [];
    if (phones.length) lines.push(`  Phone: ${phones.join(" / ")}`);
    if (r.sms) lines.push(`  Text: ${r.sms}`);
    if (r.email) lines.push(`  Email: ${r.email}`);
    if (r.chat_url || r.url) lines.push(`  Web: ${r.chat_url || r.url}`);
    if (r.hours) lines.push(`  Hours: ${r.hours}`);
    lines.push("");
  }

  if (result.emergency) {
    lines.push(`Emergency services: ${result.emergency}`);
  }

  return lines.join("\n").trim();
}

/**
 * Format resources as HTML for embedding in a web UI.
 * @param {{ resources: object[], emergency: string|null, globalResources: object[] }} result
 * @returns {string}
 */
function formatForHTML(result) {
  const allResources = result.resources.length > 0 ? result.resources : result.globalResources || [];
  const items = allResources.map((r) => {
    const phones = Array.isArray(r.phone) ? r.phone : r.phone ? [r.phone] : [];
    const details = [];
    if (phones.length) details.push(`<a href="tel:${phones[0].replace(/\s/g, "")}">${phones[0]}</a>`);
    if (r.sms) details.push(`<span>${r.sms}</span>`);
    if (r.chat_url || r.url) details.push(`<a href="${r.chat_url || r.url}" target="_blank" rel="noopener">Online chat</a>`);
    if (r.hours) details.push(`<span>${r.hours}</span>`);

    return `<div class="safechat-resource"><strong>${r.name}</strong><div>${details.join(" &middot; ")}</div></div>`;
  });

  let html = items.join("\n");
  if (result.emergency) {
    html += `\n<div class="safechat-emergency">Emergency: <a href="tel:${result.emergency}">${result.emergency}</a></div>`;
  }
  return html;
}

module.exports = {
  getResources,
  listCountries,
  getEmergencyNumber,
  search,
  formatForChat,
  formatForHTML,
  loadData,
};
