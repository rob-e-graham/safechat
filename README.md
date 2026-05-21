# safechat

**Crisis safety for AI apps. Detects distress, finds local help. Zero location permissions.**

Safechat is an open-source toolkit that adds mental health crisis detection and localized helpline routing to any AI chatbot, app, or website. It works as an npm package, Express middleware, or a single `<script>` tag.

**34 countries. 100+ verified helplines. No GPS. No tracking. No API keys.**

---

## The problem

AI apps that have personal conversations with users — journaling, coaching, tarot, therapy-adjacent, wellness — will inevitably encounter users in crisis. Most apps have no safety net. The legal and ethical risks are real (see: Character.AI lawsuits, FTC actions against BetterHelp).

## What Safechat does

1. **Detects crisis signals** in user messages using fast regex matching (runs locally, nothing leaves the device)
2. **Finds the user's country** without GPS — using browser locale, timezone, CDN headers, or IP fallback
3. **Returns verified local helplines** — phone, text, chat, with hours and specialties
4. **Generates AI prompt overrides** that tell your LLM to stop its normal behavior and respond with crisis resources
5. **Provides ready-made UI** — modal, banner, and full-page popup components
6. **Works offline** — Service Worker caches resources, falls back to last-known location

---

## Integration options

| Method | Best for | Setup |
|--------|----------|-------|
| **npm package** | Node.js / full-stack apps | `npm install safechat` |
| **Browser script** | Any website, no build step | Single `<script>` tag |
| **Embed script** | Drop-in auto-monitoring | Single `<script>` tag |
| **Express middleware** | Server-side API protection | One-line middleware |
| **Popup embed** | Standalone crisis help page | `<iframe>` or link |
| **Hosted popup** | Link from any app | Direct URL |

---

## Quick start

### 1. npm (Node.js)

```bash
npm install safechat
```

```javascript
const safechat = require('safechat');

// Check any user message before your AI responds
const safety = safechat.check(userMessage);

if (safety.level === 'high') {
  // Override your AI's system prompt with crisis response
  systemPrompt = safechat.promptOverride('high', safety.country)
                 + '\n\n' + systemPrompt;
}

if (safety.level === 'low') {
  // AI responds normally but ends with a safety footer
  systemPrompt = safechat.promptOverride('low', safety.country)
                 + '\n\n' + systemPrompt;
}
```

### 2. Browser (no build step)

```html
<script src="https://cdn.jsdelivr.net/gh/rob-e-graham/safechat@main/src/browser.js"></script>
<script>
  // Auto-monitor all text inputs for crisis signals
  Safechat.protect();

  // Or check manually
  const result = Safechat.check("I feel hopeless");
  if (result.level !== 'none') {
    Safechat.showModal(result.resources);
  }
</script>
```

### 3. Embed script (one line, auto-monitors everything)

```html
<script src="https://cdn.jsdelivr.net/gh/rob-e-graham/safechat@main/src/embed.js"
        data-safechat-monitor="true"></script>
```

This loads Safechat and automatically monitors all text inputs on the page. When a user types a crisis signal and presses Enter, the crisis modal appears with local helplines.

Options:
- `data-safechat-monitor="true"` — auto-monitor all text inputs
- `data-safechat-popup="true"` — prefetch the offline popup for instant access

### 4. Express middleware

```javascript
const safechat = require('safechat');

app.use(safechat.middleware());

app.post('/api/chat', (req, res) => {
  const safety = req.safechat.check(req.body.message);

  if (safety.action === 'crisis_intervention') {
    systemPrompt = req.safechat.promptOverride(safety.level) + '\n\n' + systemPrompt;
  }

  // Country auto-detected from request headers (Cloudflare, Vercel, Accept-Language)
  console.log(req.safechat.country); // "AU"
});
```

### 5. Popup embed (iframe)

Embed the crisis help popup directly in your app:

```html
<iframe src="https://cdn.jsdelivr.net/gh/rob-e-graham/safechat@main/app/popup.html"
        style="width:100%;max-width:480px;height:700px;border:none;border-radius:16px;">
</iframe>
```

Or link to the hosted version:

```html
<a href="https://rob-e-graham.github.io/safechat/app/popup.html"
   target="_blank">Find crisis help near you</a>
```

### 6. Hosted popup (GitHub Pages)

The popup is hosted at:

```
https://rob-e-graham.github.io/safechat/app/popup.html
```

Works offline after first visit. Installable as a PWA. No server required.

---

## How geo-detection works

Safechat finds the user's country **without location permissions** using a cascade:

| Priority | Method | How it works | Permissions |
|----------|--------|-------------|-------------|
| 1 | **Browser locale** | `navigator.language` → `en-AU` → `AU` | None |
| 2 | **Timezone** | `Intl.DateTimeFormat` → `Australia/Sydney` → `AU` | None |
| 3 | **CDN headers** | `CF-IPCountry`, `X-Vercel-IP-Country` (server-side) | None |
| 4 | **Accept-Language** | Request header → `en-GB,en;q=0.9` → `GB` | None |
| 5 | **IP geolocation** | Optional API call to ip-api.com | None (opt-in) |
| 6 | **Manual override** | `safechat.check(msg, { country: 'AU' })` | None |
| 7 | **Global fallback** | findahelpline.com (175+ countries) | None |

If none of the above produce a country, the user still gets connected to global crisis directories.

---

## Auto-updating crisis data

Crisis helpline numbers change. Safechat handles this at multiple layers:

### CDN delivery (automatic)

The browser bundle and popup load crisis data from jsDelivr CDN, which mirrors the GitHub repo. When the JSON is updated on GitHub, the CDN updates automatically (typically within 24 hours, or instantly with versioned URLs).

### Automated verification (GitHub Actions)

A [GitHub Actions workflow](.github/workflows/verify-resources.yml) runs twice monthly:

1. Validates all phone number formats
2. Checks chat/website URLs are reachable
3. Flags missing required fields (name, type, hours)
4. Opens a GitHub Issue for any failures, tagged `verification` + `help wanted`
5. Updates the `last_verified` timestamp in the data file

### Offline fallback chain

The popup and browser bundle use a 4-layer fallback:

```
1. jsDelivr CDN (latest data) ← primary
2. GitHub raw (same data, different CDN) ← if jsDelivr is down
3. localStorage cache (last successful load) ← if offline
4. Inline emergency numbers (built into the JS) ← if never loaded
```

The user always gets *something*, even on first visit with no internet.

### Community updates

Anyone can submit a PR to update `data/crisis-resources.json`. See [CONTRIBUTING.md](CONTRIBUTING.md) for the verification checklist and entry format.

---

## API

### `safechat.check(text, options?)`

One-call safety check — detects crisis level and returns localized resources.

```javascript
const result = safechat.check("I can't go on anymore", { country: "AU" });

// result:
// {
//   level: "low",                    // "high" | "low" | "none"
//   matched: "can't go on",          // the phrase that triggered
//   country: "AU",                   // detected or provided
//   action: "soft_warning",          // "crisis_intervention" | "soft_warning" | "none"
//   resources: {
//     country: "Australia",
//     emergency: "000",
//     resources: [ ... ],            // verified helplines
//     fallback: false
//   }
// }
```

### `safechat.detect(text)`

Just the crisis detector, no geo-lookup.

```javascript
safechat.detect("I want to kill myself")  // { level: "high", matched: "kill myself" }
safechat.detect("I feel worthless")       // { level: "low", matched: "worthless" }
safechat.detect("great day today")        // { level: "none", matched: null }
```

### `safechat.promptOverride(level, countryCode)`

Generates a system prompt override for your AI.

- **high**: tells the AI to stop everything and show crisis resources
- **low**: tells the AI to respond warmly and end with a safety footer
- **none**: returns empty string (no override needed)

### `safechat.getResources(countryCode, options?)`

Get crisis resources for a country. Options: `{ specialties, types, limit }`.

```javascript
safechat.getResources("US", { specialties: ["youth", "lgbtq"] })
safechat.getResources("GB", { types: ["text"] })
```

### `safechat.middleware()`

Express/Connect middleware that auto-detects country from request headers.

### `Safechat.protect()` (browser)

Auto-monitors all text inputs for crisis signals. Shows modal on high, banner on low.

### `Safechat.showModal(countryOrResources)` (browser)

Shows the crisis resources modal.

### `Safechat.showBanner(options?)` (browser)

Shows a non-blocking banner with a link to crisis resources.

---

## Crisis levels

| Level | Triggers | Recommended action |
|-------|----------|--------------------|
| **high** | Suicidal ideation, self-harm, explicit intent | Stop AI response. Show crisis resources immediately. |
| **low** | Hopelessness, worthlessness, feeling trapped, "no point" | AI responds warmly. Append safety footer with helpline link. |
| **none** | No crisis signals | Normal operation. |

---

## Countries covered

Australia, Austria, Belgium, Brazil, Canada, China, Denmark, Finland, France, Germany, Ghana, Hong Kong, India, Ireland, Israel, Italy, Japan, Kenya, Mexico, Netherlands, New Zealand, Nigeria, Norway, Pakistan, Philippines, Portugal, Russia, South Africa, South Korea, Spain, Sweden, Switzerland, United Kingdom, United States.

**Plus global fallback** via [findahelpline.com](https://findahelpline.com) (175+ countries) and [Befrienders Worldwide](https://www.befrienders.org).

---

## Contributing

We need help keeping crisis resources accurate and expanding to more countries.

### Adding a country

1. Find verified crisis helplines (check official government or WHO sources)
2. Add an entry to `data/crisis-resources.json`
3. Include: name, phone, type (phone/text/chat/email), hours, languages, specialties
4. Mark `verified: true` only if you confirmed the number is active
5. Submit a PR

### Verification checklist

- [ ] Called or checked the helpline is active
- [ ] Hours are accurate
- [ ] Phone number is correct and callable
- [ ] Organization name is current
- [ ] Source URL provided in PR description

---

## Safe messaging guidelines

This project follows [Samaritans media guidelines](https://www.samaritans.org/about-samaritans/media-guidelines/):

- Never describe methods of self-harm
- Use "died by suicide" not "committed suicide"
- Always pair mention of struggle with a resource
- Don't sensationalize or dramatize

---

## License

MIT — use it in anything. Commercial, personal, open-source. No restrictions.

The crisis resource data (`data/crisis-resources.json`) is CC0 (public domain).

---

## Why this exists

AI apps with personal conversations will encounter users in crisis. This is not optional — it is inevitable. Safechat exists so that adding safety takes 3 lines of code instead of 3 months of research.

If you or someone you know is in crisis: **[findahelpline.com](https://findahelpline.com)**
