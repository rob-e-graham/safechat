# LinkedIn Post -- SafeChat v1.1 Launch

---

People tell AI chatbots things they don't tell anyone else. And right now, most of those systems have no idea what to do when someone says they want to end their life.

I built SafeChat to fix that.

SafeChat is a free, open-source crisis safety protocol for AI chat systems. It's a routing layer -- it detects distress signals and connects users to verified professional crisis resources. It does not diagnose, treat, or replace professional services.

One script tag adds crisis detection and verified helpline resources across 34 countries to any web app.

How it works:
- Detects distress signals locally on-device (no cloud, no data collection, no permissions)
- Catches misspellings, text-speak, negation variants, indirect warning signs, and passive suicidality
- Tracks subtle signal accumulation across conversations (42 patterns, 8 clinical categories)
- Finds the user's country without location permissions
- Shows verified helplines -- phone, text, chat, email, WhatsApp
- Configurable Shield class with 6 presets for different deployment contexts
- 424 automated tests including adversarial inputs and false-positive guards
- Works offline as an installable PWA

Why now? New York passed the first US law mandating crisis protocols for AI companions. The FTC is investigating chatbot safety at OpenAI, Meta, Alphabet, Snap, xAI, and Character.AI. The VERA-MH framework (2026) found significant gaps in how major AI systems respond to suicidal ideation. The infrastructure to comply didn't exist as open source. Now it does.

SafeChat emerged from my PhD research at RMIT University, where I'm building sovereign AI systems -- tools that run locally, respect privacy, and don't depend on commercial cloud services.

A false positive shows someone a help modal they dismiss. A false negative could cost a life. That's the calibration philosophy.

False negatives are treated as critical defects. Crisis resource data is verified twice monthly. Detection patterns are reviewed against published clinical literature. Every change is tested, timestamped, and publicly documented.

Live site: https://rob-e-graham.github.io/safechat
Get help now (PWA): https://rob-e-graham.github.io/safechat/app/popup.html
Source: https://github.com/rob-e-graham/safechat

SafeChat is a routing layer, not a diagnostic tool. It does not assess clinical risk or replace professional mental health services, emergency services, or local crisis procedures.

If you or someone you know is in crisis: findahelpline.com

#AIEthics #OpenSource #MentalHealth #AISafety #CrisisIntervention #SafeChat #SuicidePrevention #WebDev #AI #DigitalHealth

---

## Shorter Version

People tell AI chatbots things they don't tell anyone else. Most of those systems have no plan for when someone says they want to end their life.

I built SafeChat -- a free, open-source crisis safety protocol. It detects distress signals locally (zero data collection), finds the user's country without GPS, and shows verified helplines across 34 countries. 424 automated tests. Works offline. One script tag to integrate.

The FTC is investigating AI chatbot safety. New York is mandating crisis protocols. The open-source infrastructure to comply now exists.

SafeChat is a routing layer, not a diagnostic tool. It does not replace professional services.

https://github.com/rob-e-graham/safechat

#AIEthics #OpenSource #AISafety #MentalHealth #SuicidePrevention
