# safechat

**Open-source crisis safety infrastructure for AI apps. Detects distress, finds local help. Zero location permissions.**

Created by Rob Graham / FAMTEC.

Safechat is a community-focused crisis safety toolkit that adds mental health crisis detection and localized helpline routing to AI chatbots, apps, websites, and digital experiences.

**34 countries. 100+ verified helplines. No GPS. No tracking. No API keys.**

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
```

---

## Community Support

If SafeChat helps your community or organisation, consider supporting development.

Created by Rob Graham / FAMTEC
https://fineartmedia.tech

---

## Crisis Support

If you or someone you know is in crisis:
https://findahelpline.com
