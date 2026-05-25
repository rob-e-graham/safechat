# AI Chatbots Have a Safety Problem. Here's the Open-Source Fix.

*Why I built SafeChat, and why every AI developer should care.*

---

People tell AI things they don't tell anyone else.

That's not a marketing claim. It's what the data shows. AI companion apps -- Character.AI, Replika, ChatGPT -- now host some of the most emotionally vulnerable conversations happening anywhere. Users disclose suicidal ideation, self-harm, and acute distress to systems that were never designed to handle it.

The consequences have been real. Documented cases have linked AI companion interactions to self-harm and suicide attempts. In 2026, regulators finally moved: New York passed the first US law mandating crisis-response protocols for AI companions. The FTC opened investigations into chatbot safety at Alphabet, Meta, OpenAI, Snap, xAI, and Character Technologies.

But here's the gap: there was no open-source infrastructure for developers to actually implement these protections. Until now.

## What SafeChat Does

SafeChat is a free, open-source crisis safety protocol for AI chat systems. Drop a single script tag into any web app and it:

- **Detects crisis signals** in user input using pattern matching -- not AI, not cloud APIs, just fast local regex with 218 automated tests
- **Finds the user's country** without asking for location permissions (using browser locale, timezone, and CDN headers)
- **Shows verified helpline resources** across 34 countries -- phone, text, chat, email, WhatsApp

Everything runs on-device. Zero data collection. Works offline.

## Why Local-First Matters

The obvious approach to crisis detection is to send user messages to a cloud API for analysis. That approach has three problems:

**Privacy.** You're sending someone's most vulnerable moment to a third-party server. That data gets logged, stored, potentially breached.

**Latency.** A network round-trip when someone is in crisis is a network round-trip too many.

**Availability.** Cloud services go down. When someone needs help at 3am and your API provider is having an outage, what then?

SafeChat runs entirely in the browser. The detection engine is regex-based -- deliberately simple, deliberately fast, deliberately local. No API keys. No accounts. No data leaving the device.

## The Detection Problem

Crisis detection sounds straightforward until you actually build it. The challenge isn't catching "I want to kill myself" -- any keyword filter manages that. The challenge is:

- Catching **misspellings**: "suicde", "suiside", "overdoze"
- Catching **text-speak**: "kms", "wanna die", "2 die"
- Catching **indirect signals**: "this will all be over soon", "writing goodbye letters"
- **Not** catching false positives: "cut my hair", "suicide squeeze in baseball", "overdosed on coffee"

SafeChat handles this with an input normalisation layer (fixing misspellings, expanding text-speak) before running against two tiers of patterns -- HIGH signals for explicit crisis language, LOW signals for hopelessness and passive distress. False-positive guards check context before triggering.

Is it perfect? No. A regex engine will miss highly indirect or metaphorical distress. But the calibration philosophy is simple: a false positive shows someone a help modal they dismiss. A false negative could cost a life.

## Where This Comes From

SafeChat emerged from my PhD research at RMIT University, where I'm building ARCHAI -- a sovereign AI toolkit for cultural heritage institutions. Both projects share the same conviction: critical infrastructure should run locally, respect privacy, and work without commercial cloud dependencies.

In ARCHAI, that means museums can run AI-powered collection search on their own hardware, keeping cultural heritage data under institutional control. In SafeChat, it means crisis detection that functions even when the internet doesn't.

I call this pattern "sovereign AI infrastructure" -- systems that provide full functionality from local resources while optionally enhancing from the network when available. SafeChat degrades gracefully through four tiers: CDN data, GitHub raw fallback, localStorage cache, and hardcoded emergency numbers. It never fails to provide *something*.

## Why This Isn't Just a Technical Preference

There's a deeper argument here, and it comes from the CARE Principles for Indigenous Data Governance.

CARE (Collective Benefit, Authority to Control, Responsibility, Ethics) was developed by the Global Indigenous Data Alliance to ensure that data ecosystems respect indigenous peoples' rights over their own cultural knowledge. When a museum sends collection data about indigenous objects to a cloud API for processing, the community loses authority over how that knowledge is handled. The data gets logged on someone else's servers, potentially used for model training, with no community oversight.

ARCHAI's local-first architecture isn't just technically cleaner -- it's what CARE requires. The data stays on institutional hardware. The community retains governance. And SafeChat follows the same principle: your most vulnerable moment stays on your device, not on someone's cloud.

Sovereign infrastructure isn't a preference. When you're handling sensitive data -- whether it's cultural heritage or a cry for help -- it's an obligation.

## For Developers

If you're building anything with a chat interface -- AI or otherwise -- you can add SafeChat in under a minute:

```html
<script src="https://cdn.jsdelivr.net/gh/rob-e-graham/safechat@main/dist/safechat.min.js"></script>
```

That's it. No build step, no API key, no account. It provides modal, banner, and popup interfaces, Express middleware for server-side use, and prompt overrides that inject crisis-response instructions into any LLM system prompt.

The helpline database is released under CC0 public domain dedication -- use it however you want.

## What's Next

The FTC is asking AI companies to demonstrate duty-of-care. New York is mandating crisis protocols. The VERA-MH framework has documented how badly current systems handle suicidal ideation.

SafeChat is one answer. Not the only answer -- but a working, tested, open-source answer that any developer can use today.

If you're building AI chat tools, you should be thinking about this. And now there's no reason not to act on it.

---

**SafeChat is free and open source.**
- Live demo: [rob-e-graham.github.io/safechat](https://rob-e-graham.github.io/safechat)
- Source: [github.com/rob-e-graham/safechat](https://github.com/rob-e-graham/safechat)
- Support the project: [buymeacoffee.com/famtec](https://buymeacoffee.com/famtec)

*Rob Graham is a PhD candidate at RMIT University researching sovereign AI infrastructure, and founder of FAMTEC (Fine Art Media Technology).*
