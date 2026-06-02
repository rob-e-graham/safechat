# I Built a Crisis Safety Layer for AI Chatbots. Here's Why.

---

People tell AI things they won't tell anyone else.

Not in a cute way. In a "I want to end my life" way. In a 3am, alone, talking to a chatbot because there's nobody else way. And right now, most of those systems have absolutely no idea what to do with that.

I know this because I built the thing that's supposed to catch it.

## The Problem Nobody Wants to Own

Character.AI, Replika, ChatGPT -- these apps are hosting some of the most vulnerable conversations happening anywhere right now. Kids, lonely people, people in genuine crisis, pouring their hearts out to machines that were never designed for it. And the machines just... keep chatting. Or worse, they play along.

There have been real consequences. Documented cases linking AI companion chats to self-harm and suicide attempts. It took that for regulators to move. New York passed the first US law mandating crisis protocols for AI companions. The FTC opened investigations into OpenAI, Meta, Alphabet, Snap, xAI, and Character.AI. The VERA-MH research team showed that major AI chatbots are genuinely bad at handling suicidal ideation.

But here's what got me: everybody was talking about the problem. Nobody had built the infrastructure to fix it. Not as open source, anyway. Not as something any developer could just drop in.

So I built it.

## What SafeChat Actually Is

SafeChat is a routing layer. Not a therapist. Not a diagnosis engine. Not a replacement for real help. It's a layer that sits in any chat interface, watches for distress signals, figures out what country you're in, and shows you real, verified helplines -- phone numbers you can call, text lines, chat services, WhatsApp links. Actual humans who are trained for this.

Everything runs on your device. Nothing gets sent anywhere. No data collection. No tracking. No permissions. Works offline.

That last bit matters more than people think. When someone needs help at 3am and the API is down or the wifi is out, "sorry, server error" isn't good enough. SafeChat falls back through four layers -- CDN, GitHub, local cache, hardcoded emergency numbers. It always gives you something.

## The Bit That's Actually Hard

Catching "I want to kill myself" is easy. Any keyword filter does that. The hard part is everything else:

People can't spell when they're distressed. "Suicde." "Overdoze." "Selfharm." The text gets mangled. So you build a normalisation layer that fixes that before matching.

People use text-speak. "kms." "wanna die." "2 die." You expand those too.

People write formally when they're careful and scared. "I do not want to live anymore." Your patterns only catch "don't" -- you miss the person who wrote "do not." So you build negation normalisation. Fourteen rules that contract expanded negations before matching.

People don't always say it directly. They talk about giving things away, writing goodbye letters, not being here tomorrow. So you build subtle signal tracking -- 42 patterns across 8 categories that accumulate over a conversation. Sleep disruption plus withdrawal plus hopelessness plus farewell behaviour. Each one alone is nothing. Together it's a pattern.

And then there's the other side: you have to NOT trigger on "cut my hair" or "suicide squeeze in baseball" or "overdosed on coffee" or "magic trick disappear." Because if you cry wolf too often, people turn it off. And then it catches nothing.

I've got 420 automated tests covering all of this. True positives, true negatives, false-positive guards, misspellings, text-speak, negation variants, adversarial inputs, security edge cases. Every release has to pass all of them.

The calibration philosophy is simple: a false positive shows someone a help modal they close. A false negative could cost a life. I know which side I'd rather err on.

## Why I Didn't Use AI For the AI Safety Layer

Yeah, I know. Everyone's first question. "Why regex? Why not just use a language model?"

Three reasons.

**Privacy.** If someone types "I want to die" into a chatbot, the absolute last thing you should do is send that to another cloud API. That's their most vulnerable moment. It doesn't need to be logged on someone else's server, potentially used for training data, sitting in a breach waiting to happen.

**Speed.** Regex is instant. No round-trip. No latency. When someone is in crisis you don't want to be waiting on a 200ms API call.

**It just works.** No API keys. No accounts. No billing. No "oops, we changed the model and now it doesn't detect suicidal ideation anymore." It's regex. It's deterministic. It does the same thing every time.

Is it as nuanced as a language model? No. It'll miss deeply metaphorical distress. That's a known limitation. But it catches a lot, it catches it instantly, it does it privately, and it never goes down.

## For the Devs

Two lines:

```html
<script src="https://cdn.jsdelivr.net/gh/rob-e-graham/safechat@main/src/browser.js"></script>
<script>Safechat.protect();</script>
```

That's it. No build step. No API key. Works in any web app.

If you need more control, there's a Shield class with presets -- companion apps, chatbots, moderation pipelines, research, whatever your context is. Six response modes: interrupt, inject, flag, log, callback, or just leave it alone. Express middleware if you're server-side. Prompt overrides if you want your LLM to know about crisis context.

The helpline database is CC0 public domain. 100+ helplines across 34 countries. Use it however you want.

## Where This Comes From

I'm a PhD candidate at RMIT University in Melbourne. My research is about sovereign AI -- systems that run locally, respect privacy, and don't depend on commercial cloud services to function. I build tools for cultural heritage institutions that need AI but can't send their collection data to OpenAI's servers. Same principles apply here: your most vulnerable moment should stay on your device.

SafeChat is the crisis safety piece. It's live. It works. It's open source. And honestly, even just sharing the PWA -- the installable app that shows helplines for your country -- could help somebody right now.

That's the whole point.

## What Happens Next

The regulatory pressure is only going one direction. The FTC wants duty-of-care. New York is mandating crisis protocols. The EU AI Act is creating compliance requirements. Everyone building AI chat tools is going to need something like this.

I'd rather it was open source and free than locked behind some enterprise SaaS paywall. Safety infrastructure shouldn't have a price tag for the people who need it most.

If you're building AI tools with a chat interface, have a look. If you work in mental health or crisis services, I'd genuinely welcome your feedback on the detection patterns. If you just want to share the PWA with someone who might need it, that link works right now on any phone.

False negatives are treated as critical defects. If you find one, tell me. Lives depend on accuracy.

---

**SafeChat is free and open source.**
- Live site: [rob-e-graham.github.io/safechat](https://rob-e-graham.github.io/safechat)
- Get help now (PWA): [rob-e-graham.github.io/safechat/app/popup.html](https://rob-e-graham.github.io/safechat/app/popup.html)
- Source: [github.com/rob-e-graham/safechat](https://github.com/rob-e-graham/safechat)
- Support: [buymeacoffee.com/famtec](https://buymeacoffee.com/famtec)

**Disclaimer:** SafeChat is a routing layer, not a diagnostic tool. It identifies textual signals that may indicate distress and connects users to verified professional crisis resources. It does not assess clinical risk, provide therapeutic intervention, or replace professional mental health services, emergency services, or local crisis procedures. SafeChat is provided as is, without warranty of any kind. See [full legal disclaimer](https://github.com/rob-e-graham/safechat/blob/main/docs/legal-disclaimer.md) for details.

If you or someone you know is in crisis: [findahelpline.com](https://findahelpline.com)

*Rob Graham is a PhD candidate at RMIT University researching sovereign AI infrastructure, and founder of FAMTEC (Fine Art Media Technology).*
