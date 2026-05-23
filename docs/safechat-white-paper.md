# SafeChat: An Open-Source Crisis Safety Protocol for AI Chat Systems

**Rob Graham**
FAMTEC (Fine Art Media Technology)
PhD Candidate, School of Design, RMIT University
Supervisor: Chris Barker

May 2026

---

## Abstract

As AI chatbots become primary channels for intimate human conversation, the absence of crisis-response infrastructure represents a critical safety gap. SafeChat is an open-source international chat safety protocol that detects crisis signals in user input, determines the user's geographic location without device permissions, and delivers verified helpline resources across 34 countries. The system runs entirely on-device with zero data collection, addressing both the regulatory demands of emerging AI safety legislation and the ethical obligations of developers building emotionally responsive AI. This paper presents SafeChat's architecture, detection methodology, and its relationship to the broader challenge of building sovereign, privacy-respecting AI infrastructure for communities.

---

## 1. Introduction

AI companion applications now facilitate some of the most emotionally vulnerable conversations people have with any system, human or machine. Products including Character.AI, Replika, and general-purpose assistants like ChatGPT routinely encounter users expressing suicidal ideation, self-harm, and acute psychological distress. The consequences of failing to respond appropriately are not theoretical: documented cases have linked AI companion interactions to self-harm and suicide attempts, prompting regulatory action across multiple jurisdictions.

In 2026, the regulatory landscape shifted decisively. New York enacted the first US law mandating crisis-response protocols for AI companions. The US Federal Trade Commission opened formal investigations into chatbot safety practices at Alphabet, Meta, OpenAI, Snap, xAI, and Character Technologies. The VERA-MH framework, the first open-source evaluation for AI mental health safety, demonstrated that major AI systems exhibit significant gaps in detecting and responding to suicidal ideation.

SafeChat responds to this landscape by providing free, open-source crisis safety infrastructure that any developer can integrate into any AI chat application. Its design principles emerge from the same research programme as ARCHAI, a sovereign AI toolkit for cultural heritage: the conviction that critical infrastructure should be locally deployable, privacy-respecting, and independent of commercial cloud services.

---

## 2. Design Principles

SafeChat's architecture reflects five core principles drawn from the author's broader research into sovereign AI systems:

**2.1 Local-first processing.** All crisis detection runs on the user's device using regex pattern matching. No API calls are made. No user data leaves the device. This eliminates the privacy, latency, and availability risks inherent in cloud-based content moderation, and ensures the system functions offline.

**2.2 Zero-permission operation.** Geographic location is determined through a cascade of browser-native signals (locale, timezone, cached data) rather than GPS or IP geolocation. No device permissions are requested. This removes the consent friction that could delay help-seeking behaviour.

**2.3 False-negative minimisation.** The detection engine is calibrated to prioritise sensitivity over specificity. A false positive (showing crisis resources to someone not in crisis) produces minimal harm: the user sees a help modal and dismisses it. A false negative (missing a genuine crisis signal) could cost a life. The system includes explicit false-positive guards to reduce alarm fatigue without compromising recall.

**2.4 Verified, auto-updating data.** The helpline database covers 100+ verified resources across 34 countries, with phone, text, chat, email, and WhatsApp contact methods. Data is served from CDN with fallback to GitHub raw, localStorage cache, and inline emergency numbers. A verification workflow checks all resources twice monthly.

**2.5 Drop-in integration.** SafeChat can be added to any web application with a single script tag. No build step, no API key, no account creation. The system provides modal, banner, and full-page popup interfaces, an Express middleware for server-side integration, and AI prompt overrides that inject crisis-response instructions into any LLM system prompt.

---

## 3. Detection Architecture

### 3.1 Input Normalisation

User input undergoes preprocessing before pattern matching:

- Unicode normalisation (smart quotes to ASCII)
- Whitespace collapse
- Common misspelling correction (e.g., "suicde", "suiside", "overdoze")
- Text-speak expansion (e.g., "kms" to "kill myself", "wanna" to "want to", "2 die" to "to die")

This layer ensures that crisis signals are not missed due to spelling errors, text-speak conventions, or unicode variation, which are common in the informal register typical of chat interactions.

### 3.2 Signal Classification

Normalised input is matched against two tiers of regex patterns:

**HIGH signals** indicate explicit suicidal language, self-harm, or crisis-level distress. These include direct statements of intent ("kill myself", "end my life"), method references ("overdose", "jumping off"), finality language ("the end for me", "this will all be over soon"), and behavioural indicators ("writing goodbye letters", "gave away everything"). HIGH signals trigger immediate crisis intervention with full helpline resources.

**LOW signals** indicate hopelessness, worthlessness, or passive distress without explicit intent. These include expressions of hopelessness ("can't go on", "no point"), worthlessness ("I'm a burden", "nobody cares"), and passive ideation ("done with life", "no hope left"). LOW signals trigger a softer safety response with helpline links embedded in the AI's normal response.

The current engine includes 45 HIGH patterns, 22 LOW patterns, and 218 automated tests covering true positives, true negatives, false-positive guards, misspellings, text-speak, adversarial inputs, and security edge cases.

### 3.3 False-Positive Guards

Context-aware guards prevent triggering on figurative or idiomatic language:

- "cut my hair" / "hurt my ankle" (body-part context)
- "suicide squeeze" / "suicide prevention class" (non-crisis usage)
- "overdosed on coffee" (non-drug context)
- "the game is over for me" (entertainment context)
- "the economy is bleeding" (financial metaphor)

Guards are checked before crisis classification. If a matched pattern falls within a known false-positive context, that match is skipped and detection continues.

---

## 4. Geo-Detection Cascade

SafeChat determines the user's country without location permissions through a priority cascade:

| Priority | Method | Source |
|----------|--------|--------|
| 1 | Browser locale | `navigator.languages` |
| 2 | Timezone mapping | `Intl.DateTimeFormat` |
| 3 | CDN headers | `CF-IPCountry`, `X-Vercel-IP-Country` |
| 4 | Accept-Language header | Server-side |
| 5 | Cached country | `localStorage` |
| 6 | Global fallback | findahelpline.com |

The timezone mapping covers 50+ timezone-to-country entries including regional variants (e.g., six US timezones, six Canadian timezones, all Australian state zones). This approach sacrifices precision in edge cases (e.g., a user in a timezone shared by multiple countries) for the significant gain of requiring zero permissions and functioning offline.

---

## 5. Relationship to ARCHAI and Sovereign AI Research

SafeChat emerged from the same research programme as ARCHAI, a sovereign AI toolkit for cultural heritage institutions. Both projects share a foundational position: that critical AI infrastructure should be locally deployable, privacy-respecting, and independent of commercial cloud dependencies.

ARCHAI addresses the problem of making museum collections accessible through locally-hosted language models and vector search, ensuring that cultural heritage data remains under institutional control. SafeChat addresses the parallel problem of ensuring that AI chat systems have a duty-of-care layer that does not depend on external services, does not collect user data, and continues to function when network connectivity is unavailable.

The shared architectural pattern is what the author terms "sovereign AI infrastructure": systems that provide full functionality from local resources while optionally enhancing from network sources when available. In ARCHAI, this manifests as a layered architecture separating permanent heritage assets from regenerable AI processing. In SafeChat, it manifests as a four-tier resource fallback (CDN, GitHub raw, localStorage cache, inline emergency numbers) that degrades gracefully from rich helpline data to basic emergency numbers without ever failing to provide some form of help.

Both projects also share a commitment to reducing barriers to adoption. ARCHAI targets a deployment cost of $3,500-5,000 USD in one-time hardware investment. SafeChat targets zero cost, zero permissions, and a single line of code to integrate.

This work contributes to the author's PhD research question: "How can sovereign AI infrastructure create more accessible, interpretive, and ethically grounded systems of cultural memory that enhance rather than replace curatorial expertise?" SafeChat extends the ethical dimension of this question from cultural heritage to human safety, arguing that the same principles of sovereignty, privacy, and local-first operation that protect cultural data also protect vulnerable users.

---

## 6. Regulatory Alignment

SafeChat's design anticipates and addresses requirements from multiple regulatory frameworks:

**New York AI Companion Law (2026):** Mandates detection of suicidal ideation, referral to crisis services, and disclosure of AI's non-human nature. SafeChat provides the detection and referral components as drop-in infrastructure.

**FTC Chatbot Safety Inquiry (2026):** Investigating duty-of-care standards for emotionally responsive AI across major platforms. SafeChat demonstrates that meaningful crisis detection is achievable without surveillance infrastructure or cloud dependencies.

**VERA-MH Framework (Spring Health, 2026):** The first open-source evaluation for AI mental health safety, documenting significant gaps in how major AI chatbots respond to suicidal ideation. SafeChat's 218-test suite addresses the categories of failure identified by VERA-MH.

**Samaritans Safe Messaging Guidelines:** SafeChat follows established safe messaging principles in its resource presentation, avoiding sensationalisation, providing actionable contact information, and using warm, non-clinical language.

---

## 7. Limitations

SafeChat's regex-based approach has inherent limitations:

- **Language coverage.** Detection patterns currently target English-language input only. Multilingual expansion is planned but non-trivial due to the cultural and linguistic variation in crisis expression.
- **Indirect signals.** Highly indirect or metaphorical expressions of distress may not trigger detection. The system is calibrated for explicit and semi-explicit signals rather than subtle contextual cues.
- **Not a clinical tool.** SafeChat is a routing layer, not a diagnostic tool. It identifies signals and connects users to professional resources. It does not assess clinical risk, provide therapeutic intervention, or replace professional mental health services.
- **Helpline data currency.** Despite twice-monthly verification, helpline numbers, URLs, and operating hours can change between verification cycles.

---

## 8. Availability

SafeChat is released under the Business Source License 1.1, free for personal, educational, research, nonprofit, community, and small commercial use. The helpline database is released under CC0 public domain dedication. The change license (MPL 2.0) takes effect on 2029-01-01.

- **Live site:** https://rob-e-graham.github.io/safechat
- **Source code:** https://github.com/rob-e-graham/safechat
- **Contact:** rob@fineartmedia.tech

---

## References

1. New York State Legislature. (2026). AI Companion Safety Act.
2. Federal Trade Commission. (2026). Orders to AI Companies Regarding Chatbot Safety Practices.
3. Spring Health. (2026). VERA-MH: Validated Evaluation for Responsible AI in Mental Health.
4. Samaritans. (2020). Media Guidelines for Reporting Suicide.
5. Graham, R. (2026). Cultivating a Living Archive: Sovereign AI for Cultural Heritage. ISEA2026 Dubai.
6. International Association for Suicide Prevention. (2023). IASP Guidelines for Crisis Centre and Helpline Operations.
