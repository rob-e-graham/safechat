# SafeChat: An Open-Source Crisis Safety Protocol for AI Chat Systems

**Rob Graham**
FAMTEC (Fine Art Media Technology)
PhD Candidate, School of Design, RMIT University

June 2026 (v1.1.0)

---

## Abstract

As AI chatbots become primary channels for intimate human conversation, the absence of crisis-response infrastructure represents a critical safety gap. SafeChat is an open-source international chat safety protocol -- a routing layer that detects crisis signals in user input, determines the user's geographic location without device permissions, and delivers verified helpline resources across 34 countries. SafeChat does not assess clinical risk, provide therapeutic intervention, or replace professional mental health services. The system runs entirely on-device with zero data collection, addressing both the regulatory demands of emerging AI safety legislation and the ethical obligations of developers building emotionally responsive AI. This paper presents SafeChat's architecture, detection methodology, configurable deployment modes, and its relationship to the broader challenge of building sovereign, privacy-respecting AI infrastructure for communities.

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
- Common misspelling correction (e.g., "suicde", "suiside", "overdoze", "selfharm", "haning")
- Text-speak expansion (e.g., "kms" to "kill myself", "wanna" to "want to", "2 die" to "to die", "idk", "tbh", "ngl", "cba")
- Negation normalisation: expanded negations are contracted before pattern matching (e.g., "do not" to "don't", "cannot" to "can't", "will not" to "won't", "should not" to "shouldn't"). This ensures that formal or expanded phrasing -- common in careful, distressed writing -- is detected by the same patterns that catch contracted forms. Fourteen negation rules are applied.
- Contraction consistency: patterns accept both contracted and expanded forms (e.g., "there's no coming back" and "there is no coming back" both match; "I'm tired of living" and "I am tired of living" both match).

This layer ensures that crisis signals are not missed due to spelling errors, text-speak conventions, formal phrasing, or unicode variation, which are common in the varied registers of chat interactions.

### 3.2 Signal Classification

Normalised input is matched against two tiers of regex patterns:

**HIGH signals** indicate explicit suicidal language, self-harm, or crisis-level distress. These include direct statements of intent ("kill myself", "end my life"), method references ("overdose", "jumping off"), finality language ("the end for me", "this will all be over soon"), and behavioural indicators ("writing goodbye letters", "gave away everything"). HIGH signals trigger immediate crisis intervention with full helpline resources.

**LOW signals** indicate hopelessness, worthlessness, or passive distress without explicit intent. These include expressions of hopelessness ("can't go on", "no point"), worthlessness ("I'm a burden", "nobody cares"), and passive ideation ("done with life", "no hope left"). LOW signals trigger a softer safety response with helpline links embedded in the AI's normal response.

The current engine (v1.1.0) includes 57 HIGH patterns, 40 LOW patterns, 42 SUBTLE patterns (see Section 3.4), and 420 automated tests covering true positives, true negatives, false-positive guards, misspellings, text-speak, negation variants, contraction consistency, adversarial inputs, session accumulation, ReDoS protection, type coercion, HTML injection, and security edge cases.

### 3.3 False-Positive Guards

Context-aware guards prevent triggering on figurative or idiomatic language:

- "cut my hair" / "hurt my ankle" (body-part context)
- "suicide squeeze" / "suicide prevention class" (non-crisis usage)
- "overdosed on coffee" (non-drug context)
- "the game is over for me" (entertainment context)
- "the economy is bleeding" (financial metaphor)
- "magic trick disappear" / "numb fingers" / "tired of cooking" (non-crisis context)
- "giving away promotions" / "deleting old files" (non-farewell context)

Guards are checked before crisis classification. If a matched pattern falls within a known false-positive context, that match is skipped and detection continues.

### 3.4 Subtle Signal Accumulation

Many people in crisis do not use explicit language. Instead, they exhibit clusters of individually unremarkable behaviours that together indicate accumulating distress: social withdrawal, sleep disruption, loss of interest, farewell-like language, self-worth erosion, loss of future orientation, reckless behaviour, and persistent expressions of pain.

SafeChat addresses this through a `ConversationTracker` that monitors signals across a conversation session. Forty-two SUBTLE patterns are organised into eight categories, each weighted by clinical significance (1-3 points). When accumulated weight crosses a threshold (4 points for LOW escalation, 8 points for HIGH), the system escalates its response as if an explicit signal had been detected.

Critically, the tracker stores no message content. Only signal categories and numerical weights are retained in memory, and all data is garbage-collected when the session ends. This preserves the zero-data-collection principle while enabling multi-message risk assessment.

| Category | Example Signals | Weight |
|----------|----------------|--------|
| Withdrawal | "pushing everyone away", "haven't left my room in days" | 1-2 |
| Sleep | "can't sleep again", "awake all night" | 1 |
| Anhedonia | "nothing is fun anymore", "stopped caring" | 1-2 |
| Farewell | "giving away my things", "writing letters to everyone" | 2-3 |
| Self-worth | "I'm just a waste", "hate who I've become" | 1-2 |
| Future loss | "can't imagine a future", "none of this will matter" | 1-2 |
| Reckless | "don't care about my safety", "driving drunk" | 2 |
| Pain | "the pain never stops", "every day gets worse" | 1-2 |

This approach reflects clinical literature on suicide risk assessment, where the accumulation of warning signs across multiple domains is a stronger predictor than any single statement.

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

## 5. Configurable Shield Class

Different AI deployment contexts require different safety responses. A companion chatbot should interrupt conversation and show crisis resources immediately. A research platform might flag and log signals for later review. A museum exhibit might use a softer approach. SafeChat addresses this through the Shield class, a configurable safety layer that wraps the detection engine.

### 5.1 Response Modes

The Shield supports six response modes, configurable independently for HIGH and LOW signal levels:

| Mode | Behaviour |
|------|-----------|
| **interrupt** | Stop normal flow, return crisis resources immediately |
| **inject** | Prepend crisis context to the AI system prompt |
| **flag** | Mark the message with signal metadata for downstream handling |
| **log** | Record the detection event without altering the response |
| **callback** | Execute a developer-defined function (e.g., alert a human moderator) |
| **none** | No action for this signal level |

### 5.2 Deployment Presets

Six presets provide sensible defaults for common deployment contexts:

| Preset | HIGH Mode | LOW Mode | Use Case |
|--------|-----------|----------|----------|
| **companion** | interrupt | inject | AI companion apps (Character.AI, Replika-style) |
| **chatbot** | inject | flag | General chatbots (customer service, assistants) |
| **moderation** | flag | log | Content moderation pipelines |
| **strict** | interrupt | interrupt | High-risk contexts (youth, clinical adjacency) |
| **shadow** | log | log | Research and monitoring |
| **museum** | inject | none | Cultural heritage exhibits (ARCHAI integration) |

The Shield also provides `resetSession()` for clearing accumulated subtle signals, `sessionSummary()` for reviewing session-level risk data, `configure()` for runtime updates, and Express middleware for server-side integration.

Callbacks support error resilience: if a callback throws, the Shield continues processing rather than failing silently or crashing the host application.

---

## 6. Relationship to ARCHAI, Sovereign AI, and the CARE Principles

SafeChat emerged from the same research programme as ARCHAI, a sovereign AI toolkit for cultural heritage institutions. Both projects share a foundational position: that critical AI infrastructure should be locally deployable, privacy-respecting, and independent of commercial cloud dependencies.

ARCHAI addresses the problem of making museum collections accessible through locally-hosted language models and vector search, ensuring that cultural heritage data remains under institutional control. SafeChat addresses the parallel problem of ensuring that AI chat systems have a duty-of-care layer that does not depend on external services, does not collect user data, and continues to function when network connectivity is unavailable.

The shared architectural pattern is what the author terms "sovereign AI infrastructure": systems that provide full functionality from local resources while optionally enhancing from network sources when available. In ARCHAI, this manifests as a layered architecture separating permanent heritage assets from regenerable AI processing. In SafeChat, it manifests as a four-tier resource fallback (CDN, GitHub raw, localStorage cache, inline emergency numbers) that degrades gracefully from rich helpline data to basic emergency numbers without ever failing to provide some form of help.

### 6.1 The CARE Principles and Indigenous Data Sovereignty

The sovereign architecture shared by ARCHAI and SafeChat is not merely a technical preference but an ethical obligation, particularly when collections hold indigenous cultural material. The CARE Principles for Indigenous Data Governance (Carroll et al., 2020), developed by the Global Indigenous Data Alliance, establish that data ecosystems involving indigenous peoples must uphold four commitments:

- **Collective Benefit.** Data ecosystems should enable indigenous peoples to derive benefit and facilitate indigenous-led development and self-determination.
- **Authority to Control.** Indigenous peoples have rights to govern data about them, their territories, cultures, and resources, including control over collection, access, and use.
- **Responsibility.** Those working with indigenous data must nurture respectful relationships and share how data is used, supporting indigenous self-determination and governance.
- **Ethics.** Indigenous peoples' rights and wellbeing should be the primary concern at all stages of the data lifecycle, minimising harm and maximising benefit as defined by the communities themselves.

Cloud-based AI services violate CARE by design. Sending indigenous collection data to commercial APIs means communities lose authority over how their cultural knowledge is processed, stored, and potentially used for model training. ARCHAI's on-premises architecture directly addresses this: cultural data never leaves the institution, the community retains authority, and processing remains under institutional and community governance.

CARE also informs ARCHAI's approach to content moderation. When visitors comment on objects with indigenous cultural significance, moderation decisions should reflect community-defined boundaries. ARCHAI's constraint system supports culturally sensitive restrictions, and its comment moderation pipeline can route flagged content to community-designated reviewers rather than relying on external moderation APIs whose cultural competency cannot be verified.

CARE complements the FAIR principles (Findable, Accessible, Interoperable, Reusable) that dominate technical data governance. Together, CARE + FAIR represents current best practice in the GLAM (Galleries, Libraries, Archives, Museums) and digital humanities sector. SafeChat's architecture contributes to this synthesis by demonstrating that safety-critical systems can be both technically open (FAIR) and ethically sovereign (CARE).

### 6.2 Shared Commitments

Both projects share a commitment to reducing barriers to adoption. ARCHAI targets a deployment cost of $3,500-5,000 USD in one-time hardware investment. SafeChat targets zero cost, zero permissions, and a single line of code to integrate.

This work contributes to the author's PhD research question: "How can sovereign AI infrastructure create more accessible, interpretive, and ethically grounded systems of cultural memory that enhance rather than replace curatorial expertise?" SafeChat extends the ethical dimension of this question from cultural heritage to human safety, arguing that the same principles of sovereignty, privacy, and local-first operation that protect cultural data also protect vulnerable users. The CARE Principles provide the ethical framework that unifies both projects: sovereign infrastructure is not just better engineering, it is a precondition for respectful engagement with communities and their data.

---

## 7. Regulatory Alignment

SafeChat's design anticipates and addresses requirements from multiple regulatory frameworks:

**New York AI Companion Law (2026):** Mandates detection of suicidal ideation, referral to crisis services, and disclosure of AI's non-human nature. SafeChat provides the detection and referral components as drop-in infrastructure.

**FTC Chatbot Safety Inquiry (2026):** Investigating duty-of-care standards for emotionally responsive AI across major platforms. SafeChat demonstrates that meaningful crisis detection is achievable without surveillance infrastructure or cloud dependencies.

**VERA-MH Framework (Spring Health, 2026):** The first open-source evaluation for AI mental health safety, documenting significant gaps in how major AI chatbots respond to suicidal ideation. SafeChat's 420-test suite addresses the categories of failure identified by VERA-MH.

**EU AI Act (2024-2026):** Establishes risk-based requirements for AI systems, with high-risk systems requiring safety measures and human oversight. SafeChat provides vendor-independent, open-source safety infrastructure that supports compliance without creating cloud dependencies.

**Samaritans Safe Messaging Guidelines:** SafeChat follows established safe messaging principles in its resource presentation, avoiding sensationalisation, providing actionable contact information, and using warm, non-clinical language.

---

## 8. Limitations

SafeChat's regex-based approach has inherent limitations:

- **Language coverage.** Detection patterns currently target English-language input only. Multilingual expansion is planned but non-trivial due to the cultural and linguistic variation in crisis expression.
- **Indirect signals.** While the subtle signal accumulation system (Section 3.4) addresses multi-message distress patterns, highly metaphorical or culturally specific expressions of distress may still evade detection. Future work includes optional integration with small language models for nuanced contextual analysis.
- **Not a clinical tool.** SafeChat is a routing layer, not a diagnostic tool. It identifies signals and connects users to professional resources. It does not assess clinical risk, provide therapeutic intervention, or replace professional mental health services.
- **Helpline data currency.** Despite twice-monthly verification, helpline numbers, URLs, and operating hours can change between verification cycles.

---

## 9. Ongoing Development

SafeChat is under continuous, active development. The project maintains:

- A public CHANGELOG documenting all detection improvements, new patterns, and accuracy gains.
- A test suite (currently 420 automated tests) that must pass before any release.
- A twice-monthly verification process for crisis resource data (phone numbers, URLs, operating hours).
- A false-negative-first triage policy: reports of missed crisis signals are treated as critical defects.
- A public git history providing a complete, timestamped record of every change to detection patterns, false-positive guards, and safety infrastructure.

This ongoing process reflects the project's commitment to continuous safety improvement. It does not constitute a warranty, guarantee of fitness, or assumption of liability.

---

## 10. Availability

SafeChat is released under the Business Source License 1.1, free for personal, educational, research, nonprofit, community, and small commercial use. The helpline database is released under CC0 public domain dedication. The change license (MPL 2.0) takes effect on 2029-01-01.

- **Live site:** https://rob-e-graham.github.io/safechat
- **Get help now (PWA):** https://rob-e-graham.github.io/safechat/app/popup.html
- **Source code:** https://github.com/rob-e-graham/safechat
- **Contact:** rob@fineartmedia.tech

---

## 11. Disclaimer

SafeChat is a routing layer, not a diagnostic tool. It identifies textual signals that may indicate distress and connects users to verified professional crisis resources. It does not assess clinical risk, provide therapeutic intervention, make diagnoses, or replace professional mental health services, emergency services, qualified clinicians, safeguarding teams, or local crisis response procedures.

SafeChat is provided as is, without warranty of any kind, express or implied. To the maximum extent permitted by law, Rob Graham, FAMTEC, contributors, maintainers, copyright holders, and licensors are not liable for any damages, losses, or harm arising from the use or inability to use SafeChat. See the full legal disclaimer at https://github.com/rob-e-graham/safechat/blob/main/docs/legal-disclaimer.md for details.

If you or someone you know is in crisis, contact your local emergency services or visit https://findahelpline.com.

---

## References

1. New York State Legislature. (2026). AI Companion Safety Act.
2. Federal Trade Commission. (2026). Orders to AI Companies Regarding Chatbot Safety Practices.
3. Spring Health. (2026). VERA-MH: Validated Evaluation for Responsible AI in Mental Health.
4. Samaritans. (2020). Media Guidelines for Reporting Suicide.
5. Graham, R. (2026). Cultivating a Living Archive: Sovereign AI for Cultural Heritage. ISEA2026 Dubai.
6. International Association for Suicide Prevention. (2023). IASP Guidelines for Crisis Centre and Helpline Operations.
7. Carroll, S.R., Garba, I., Figueroa-Rodriguez, O.L., Holbrook, J., Lovett, R., Materechera, S., Parsons, M., Raseroka, K., Rodriguez-Lonebear, D., Rowe, R., Sara, R., Walker, J.D., Anderson, J. & Hudson, M. (2020). The CARE Principles for Indigenous Data Governance. *Data Science Journal*, 19(1), 43.
8. Wilkinson, M.D. et al. (2016). The FAIR Guiding Principles for scientific data management and stewardship. *Scientific Data*, 3, 160018.
