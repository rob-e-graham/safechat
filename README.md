# safechat

**Open-source crisis safety infrastructure for AI apps. Detects distress, finds local help. Zero location permissions.**

Created by Rob Graham / FAMTEC.

Safechat is a community-focused crisis safety toolkit that adds mental health crisis detection and localized helpline routing to AI chatbots, apps, websites, and digital experiences.

**34 countries. 100+ verified helplines. 205 tests. No GPS. No tracking. No API keys.**

![How Safechat Works](docs/images/how-it-works.svg)

---

## Licensing

SafeChat uses a Business Source License (BSL 1.1).

Free for:
- personal use
- educational use
- research use
- nonprofit/community use
- commercial entities generating under $100,000 USD annually from products or services substantially incorporating SafeChat

Commercial entities generating more than $100,000 USD annually from products or services substantially incorporating SafeChat must obtain a commercial license.

Commercial licensing:
rob@fineartmedia.tech

---

## Why this exists

AI apps with personal conversations will inevitably encounter users in crisis. Safechat exists to make ethical safety infrastructure accessible, lightweight, private, and easy to integrate.

The project is focused on:
- privacy-first safety systems
- local-first detection
- ethical AI integration
- open community infrastructure
- accessible crisis resources
- sovereign and transparent tooling

---

## What Safechat does

1. Detects crisis signals in user messages locally
2. Finds the user's country without GPS tracking
3. Returns verified local helplines and support resources
4. Generates AI prompt overrides for safer responses
5. Provides ready-made UI components
6. Works offline with layered fallbacks

---

## Quick start

```bash
npm install safechat
```

```javascript
const safechat = require('safechat');

const safety = safechat.check(userMessage);

if (safety.level === 'high') {
  systemPrompt = safechat.promptOverride('high', safety.country)
                 + '\n\n' + systemPrompt;
}

if (safety.level === 'low') {
  systemPrompt = safechat.promptOverride('low', safety.country)
                 + '\n\n' + systemPrompt;
}
```

### Browser (no build step)

```html
<script src="https://cdn.jsdelivr.net/gh/rob-e-graham/safechat@main/src/browser.js"></script>
<script>
  Safechat.protect(); // auto-monitor all text inputs
</script>
```

### One-line embed (auto-monitors everything)

```html
<script src="https://cdn.jsdelivr.net/gh/rob-e-graham/safechat@main/src/embed.js"
        data-safechat-monitor="true"></script>
```

### Express middleware

```javascript
const safechat = require('safechat');
app.use(safechat.middleware());

app.post('/api/chat', (req, res) => {
  const safety = req.safechat.check(req.body.message);
  if (safety.action === 'crisis_intervention') {
    systemPrompt = req.safechat.promptOverride(safety.level) + '\n\n' + systemPrompt;
  }
});
```

### Hosted popup

The crisis help popup is hosted and works offline after first visit:

```
https://rob-e-graham.github.io/safechat/app/popup.html
```

Embed it anywhere:

```html
<iframe src="https://cdn.jsdelivr.net/gh/rob-e-graham/safechat@main/app/popup.html"
        style="width:100%;max-width:480px;height:700px;border:none;border-radius:16px;">
</iframe>
```

---

## How geo-detection works

![Geo-Detection Cascade](docs/images/geo-cascade.svg)

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

---

## Auto-updating crisis data

![Fallback Chain](docs/images/fallback-chain.svg)

Crisis helpline numbers change. Safechat handles this at multiple layers:

### CDN delivery (automatic)

The browser bundle and popup load crisis data from jsDelivr CDN, which mirrors the GitHub repo. When the JSON is updated on GitHub, the CDN updates automatically.

### Automated verification (GitHub Actions)

A GitHub Actions workflow runs twice monthly:

1. Validates all phone number formats
2. Checks chat/website URLs are reachable
3. Flags missing required fields (name, type, hours)
4. Opens a GitHub Issue for any failures
5. Updates the `last_verified` timestamp

### Offline fallback chain

```
1. jsDelivr CDN (latest data) ← primary
2. GitHub raw (same data, different CDN) ← if jsDelivr is down
3. localStorage cache (last successful load) ← if offline
4. Inline emergency numbers (built into the JS) ← if never loaded
```

The user always gets something, even on first visit with no internet.

---

## API

### `safechat.check(text, options?)`

One-call safety check — detects crisis level and returns localized resources.

```javascript
const result = safechat.check("I can't go on anymore", { country: "AU" });
// { level: "low", matched: "can't go on", country: "AU", action: "soft_warning", resources: {...} }
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

### `safechat.getResources(countryCode, options?)`

Get crisis resources for a country. Options: `{ specialties, types, limit }`.

### `safechat.middleware()`

Express/Connect middleware that auto-detects country from request headers.

---

## Crisis levels

| Level | Triggers | Recommended action |
|-------|----------|--------------------|
| **high** | Suicidal ideation, self-harm, explicit intent | Stop AI response. Show crisis resources immediately. |
| **low** | Hopelessness, worthlessness, feeling trapped | AI responds warmly. Append safety footer with helpline link. |
| **none** | No crisis signals | Normal operation. |

---

## Countries covered

Australia, Austria, Belgium, Brazil, Canada, China, Denmark, Finland, France, Germany, Ghana, Hong Kong, India, Ireland, Israel, Italy, Japan, Kenya, Mexico, Netherlands, New Zealand, Nigeria, Norway, Pakistan, Philippines, Portugal, Russia, South Africa, South Korea, Spain, Sweden, Switzerland, United Kingdom, United States.

**Plus global fallback** via [findahelpline.com](https://findahelpline.com) (175+ countries) and [Befrienders Worldwide](https://www.befrienders.org).

---

## Contributing

We need help keeping crisis resources accurate and expanding to more countries. See [CONTRIBUTING.md](CONTRIBUTING.md) for the verification checklist and entry format.

---

## Safe messaging guidelines

This project follows [Samaritans media guidelines](https://www.samaritans.org/about-samaritans/media-guidelines/):

- Never describe methods of self-harm
- Use "died by suicide" not "committed suicide"
- Always pair mention of struggle with a resource
- Don't sensationalize or dramatize

---

## Community Support

If SafeChat helps your community or organisation, consider supporting development.

Created by Rob Graham / FAMTEC
https://fineartmedia.tech

---

## Crisis Support

If you or someone you know is in crisis: **[findahelpline.com](https://findahelpline.com)**
