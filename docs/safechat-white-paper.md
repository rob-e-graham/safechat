# SafeChat: A Source-Available Crisis Safety Protocol for AI Chat Systems

**Rob Graham**
FAMTEC (Fine Art Media Technology)
PhD Researcher, School of Design, RMIT University

June 2026 (v1.3.0)

---

## Abstract

As AI chatbots become primary channels for intimate human conversation, the absence of crisis-response infrastructure represents a critical safety gap. SafeChat is a source-available international chat safety protocol -- a routing layer that detects crisis signals in user input, determines the user's geographic location without device permissions, and delivers verified helpline resources across 34 countries. SafeChat does not assess clinical risk, provide therapeutic intervention, or replace professional mental health services. The system runs entirely on-device with zero data collection, addressing both the regulatory demands of emerging AI safety legislation and the ethical obligations of developers building emotionally responsive AI. This paper presents SafeChat's architecture, detection methodology, configurable deployment modes, and its relationship to the broader challenge of building sovereign, privacy-respecting AI infrastructure for communities.

---

## 1. Introduction

AI companion applications now facilitate some of the most emotionally vulnerable conversations people have with any system, human or machine. Products including Character.AI, Replika, and general-purpose assistants like ChatGPT routinely encounter users expressing suicidal ideation, self-harm, and acute psychological distress. The consequences of failing to respond appropriately are not theoretical: documented cases have linked AI companion interactions to self-harm and suicide attempts, prompting regulatory action across multiple jurisdictions.

In 2026, the regulatory landscape shifted decisively. New York enacted the first US law mandating crisis-response protocols for AI companions. The US Federal Trade Commission opened formal investigations into chatbot safety practices at Alphabet, Meta, OpenAI, Snap, xAI, and Character Technologies. The VERA-MH framework, the first open-source evaluation for AI mental health safety, demonstrated that major AI systems exhibit significant gaps in detecting and responding to suicidal ideation.

SafeChat responds to this landscape by providing free, source-available crisis safety infrastructure that any developer can integrate into any AI chat application. Its design principles emerge from the same research programme as ARCHAI, a sovereign AI toolkit for cultural heritage: the conviction that critical infrastructure should be locally deployable, privacy-respecting, and independent of commercial cloud services.

---

## 2. Design Principles

SafeChat's architecture reflects five core principles drawn from the author's broader research into sovereign AI systems:

**2.1 Local-first processing.** All crisis detection runs on the user's device using regex pattern matching. No API calls are made. No user data leaves the device. This eliminates the privacy, latency, and availability risks inherent in cloud-based content moderation, and ensures the system functions offline.

**2.2 Zero-permission operation.** Geographic location is determined through a cascade of browser-native signals (locale, timezone, cached data) rather than GPS or IP geolocation. No device permissions are requested. This removes the consent friction that could delay help-seeking behaviour.

**2.3 False-negative minimisation.** The detection engine is calibrated to prioritise sensitivity over specificity. A false positive (showing crisis resources to someone not in crisis) produces minimal harm: the user sees a help modal and dismisses it. A false negative (missing a genuine crisis signal) could cost a life. The system includes explicit false-positive guards to reduce alarm fatigue without compromising recall.

**2.4 Maintained resource data.** The helpline database currently covers 67 resource records across 34 countries, providing 94 phone, text, chat, email, WhatsApp, and web contact methods. Data is served from CDN with fallback to GitHub raw, localStorage cache, and inline emergency numbers. A twice-monthly workflow checks structure, phone formatting, and reachable chat URLs; service details and operating information still require human verification.

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

The current engine (v1.3.0) includes 53 HIGH patterns, 43 LOW patterns, 45 SUBTLE patterns across 17 categories (see Section 3.4), 32 reviewed source-linked signals, and 647 automated tests covering true positives, true negatives, false-positive guards, VERA-MH public risk-presentation families, misspellings, slang, protected-class slur moderation, text-speak, negation variants, contraction consistency, adversarial inputs, session accumulation, ReDoS protection, type coercion, HTML injection, and security edge cases.

The reviewed signal pack is deliberately compressed. It distils signal families from public or peer-reviewed crisis-language resources such as C-SSRS, Reddit C-SSRS, CLPsych, eRisk, MindGuard, MentalLLaMA, and MentalChat16K without embedding raw restricted posts, transcripts, or donated private text. This is the basis for a living signal database: updateable normalisation rules, phrase templates, slang/code-word lexicons, false-positive guards, reviewed exemplars, compact embeddings, and optional distilled local classifiers.

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

Many people in crisis do not use explicit language. Instead, a conversation may contain clusters of individually ambiguous signals: social withdrawal, sleep disruption, loss of interest, farewell-like language, self-worth erosion, method-information queries, escalating thoughts, minimisation, barriers to help, acute timeframe, and persistent expressions of pain.

SafeChat addresses this through a `ConversationTracker` that monitors signals across a conversation session. Forty-five SUBTLE patterns are organised into 17 categories. Each match contributes a configured routing weight of 1-3. A method-information query, for example, contributes 3 but does not trigger alone; an additional overwhelm signal contributes 1 and crosses the LOW threshold of 4. Broader combinations reaching 8 trigger HIGH routing.

Critically, these numbers are deterministic routing controls, not probabilities, diagnoses, or a clinically validated suicide-risk score. The tracker stores no message content. Only signal categories, weights, and timestamps are retained in memory, pruned after 30 minutes, and garbage-collected with the session.

| Category | Example Signals | Weight |
|----------|----------------|--------|
| Withdrawal | "pushing everyone away", "haven't left my room in days" | 1-2 |
| Sleep | "can't sleep again", "awake all night" | 1 |
| Anhedonia | "nothing is fun anymore", "stopped caring" | 1-2 |
| Farewell | "giving away my things", "writing letters to everyone" | 2-3 |
| Self-worth | "I'm just a waste", "hate who I've become" | 1-2 |
| Future loss | "can't imagine a future", "none of this will matter" | 1-2 |
| Substance | "drinking every night", "using every day" | 1 |
| Reckless | "don't care about my safety", "driving drunk" | 2 |
| Pain | "the pain never stops", "every day gets worse" | 1-2 |
| Contextual method research | method or lethality information queries | 3 |
| Escalating thoughts | thoughts "getting louder" or not stopping | 2 |
| Minimisation / help barriers | "not a crisis", unable or unwilling to seek help | 1 |
| Isolation / acute timeframe | nobody to talk to, help getting through tonight | 2 |

This accumulation model is informed by sequential-evidence research and VERA-MH's multi-turn risk presentations. It is designed to decide when SafeChat should offer support, not to predict an outcome or assign a clinical risk level to a person.

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

**VERA-MH Framework (Spring Health, 2026):** A clinically grounded, open-source evaluation for AI mental health safety that documents variation in how major AI chatbots respond to suicidal ideation. SafeChat's local detector and human-care routing are relevant to parts of the VERA-MH rubric, but SafeChat has not yet been run through or scored by VERA-MH. VERA-MH evaluates multi-turn chatbot responses at the API level, while SafeChat is a routing component whose user interface and external escalation workflow sit partly outside that evaluation boundary.

**EU AI Act (2024-2026):** Establishes risk-based requirements for AI systems, with high-risk systems requiring safety measures and human oversight. SafeChat provides vendor-independent, source-available safety infrastructure that supports compliance without creating cloud dependencies.

**Samaritans Safe Messaging Guidelines:** SafeChat follows established safe messaging principles in its resource presentation, avoiding sensationalisation, providing actionable contact information, and using warm, non-clinical language.

---

## 8. Limitations

SafeChat's regex-based approach has inherent limitations:

- **Language coverage.** Detection patterns currently target English-language input only. Multilingual expansion is planned but non-trivial due to the cultural and linguistic variation in crisis expression.
- **Indirect signals.** While the subtle signal accumulation system (Section 3.4) addresses multi-message distress patterns, highly metaphorical or culturally specific expressions of distress may still evade detection. The cross-classifier module (Section 9) addresses this by running local ML models alongside the regex engine.
- **Not a clinical tool.** SafeChat is a routing layer, not a diagnostic tool. It identifies signals and connects users to professional resources. It does not assess clinical risk, provide therapeutic intervention, or replace professional mental health services.
- **Helpline data currency.** Automated checks do not confirm every service detail; numbers, URLs, and operating hours can change between human verification cycles.

---

## 9. Cross-Classifier Module

SafeChat v1.2 introduces an optional cross-classifier layer that runs local machine learning models alongside the deterministic regex engine. This approach was suggested by Professor Stevie Chancellor (University of Minnesota), building on published work in mental health NLP.

**Architecture.** The regex layer remains the fast, deterministic, always-on first pass. The cross-classifier provides a second opinion using clinically trained models:

- **MindGuard** (Sword Health): Lightweight safety classifiers (4B/8B parameters) trained on clinically annotated conversations. Three categories: safe, self-harm risk, harm-to-others risk. AUROC up to 0.982. [9]
- **MentalLLaMA**: Open-source instruction-following LLMs (7B/13B parameters) for interpretable mental health analysis across eight tasks including depression, stress, and suicidal ideation detection. [10]
- **MentalChat16K**: Benchmark dataset combining synthetic counseling conversations and real-world clinical transcripts for model evaluation. [11]

**Merge rules.** The cross-classifier never downgrades a regex detection. If the regex engine flags HIGH and the classifier says safe, the result stays HIGH. This preserves the false-negative-first calibration philosophy. The classifier can escalate: if regex detects nothing but the model identifies risk, the result escalates to LOW.

**Privacy.** All inference runs locally on the user's device or a developer-controlled endpoint. No message content is transmitted to external services. The module supports Ollama, Transformers.js, LM Studio, or custom classification functions.

**Optional.** The cross-classifier adds zero dependencies to the core library. SafeChat works identically without it. Developers opt in by configuring a backend and passing it to Shield.

### 9.1 Semantic Layer and Tiered Architecture (v1.3)

SafeChat v1.3 adds a semantic layer: an embedding-similarity tier that sits between the regex engine and the LLM cross-classifier. A curated set of exemplar phrases -- indirect, metaphorical expressions of distress drawn from clinical warning-sign literature -- is embedded once on-device. Each incoming message is embedded and compared to the exemplar set by cosine similarity; a strong match escalates the result under the same merge contract as the cross-classifier (confirm or escalate, never downgrade).

The semantic layer requires only a small sentence-embedding model (approximately 25 MB, e.g. all-MiniLM-L6-v2 via Transformers.js), making it the first ML tier in SafeChat that runs in any modern browser, including installed progressive web apps on phones, fully offline after first load. Exemplar sets are plain, auditable text and can be replaced wholesale, enabling community-authored, culturally specific pattern sets governed under the CARE Principles (Section 6.1).

This completes a progressive enhancement architecture for safety:

| Tier | Layer | Footprint | Runs on |
|------|-------|-----------|---------|
| 0 | Regex engine + ConversationTracker | KBs | Everything, always, offline |
| 1 | Semantic layer (embedding similarity) | ~25 MB | Any modern browser, PWA |
| 2 | Distilled crisis classifier (planned) | ~50 MB | Browser/phone, offline |
| 3 | LLM cross-classifier | GBs | Server/desktop, opt-in |

Every tier is sovereign, every tier above 0 is optional, and the merge rules guarantee that adding a tier can only reduce false negatives, never introduce them: the failure mode of any ML tier is "no worse than the tier below."

---

## 10. Ongoing Development

SafeChat is under continuous, active development. The project maintains:

- A public CHANGELOG documenting all detection improvements, new patterns, and accuracy gains.
- A test suite (currently 647 automated tests) that must pass before any release.
- Twice-monthly automated checks for resource structure, phone formatting, and chat-link reachability, with human verification still required for service details.
- A false-negative-first triage policy: reports of missed crisis signals are treated as critical defects.
- A public git history providing a complete, timestamped record of every change to detection patterns, false-positive guards, and safety infrastructure.
- Expert guidance and literature review are being incorporated for cross-classifier approaches and evaluation design, including feedback from Professor Stevie Chancellor and public work such as VERA-MH, MindGuard, MentalLLaMA, and MentalChat16K.

This ongoing process reflects the project's commitment to continuous safety improvement. It does not constitute a warranty, guarantee of fitness, or assumption of liability.

---

## 11. Availability

SafeChat is released under the Business Source License 1.1, free for personal, educational, research, nonprofit, community, and small commercial use. The helpline database is released under CC0 public domain dedication. The change license (MPL 2.0) takes effect on 2029-01-01.

- **Live site:** https://rob-e-graham.github.io/safechat
- **Get help now (PWA):** https://rob-e-graham.github.io/safechat/app/popup.html
- **Source code:** https://github.com/rob-e-graham/safechat
- **Contact:** rob@fineartmedia.tech

---

## 12. Disclaimer

SafeChat is a routing layer, not a diagnostic tool. It identifies textual signals that may indicate distress and connects users to verified professional crisis resources. It does not assess clinical risk, provide therapeutic intervention, make diagnoses, or replace professional mental health services, emergency services, qualified clinicians, safeguarding teams, or local crisis response procedures.

SafeChat is provided as is, without warranty of any kind, express or implied. To the maximum extent permitted by law, Rob Graham, FAMTEC, contributors, maintainers, copyright holders, and licensors are not liable for any damages, losses, or harm arising from the use or inability to use SafeChat. See the full legal disclaimer at https://github.com/rob-e-graham/safechat/blob/main/docs/legal-disclaimer.md for details.

If you or someone you know is in crisis, contact your local emergency services or visit https://findahelpline.com.

---

## References

1. New York State Legislature. (2026). AI Companion Safety Act.
2. Federal Trade Commission. (2026). Orders to AI Companies Regarding Chatbot Safety Practices.
3. Belli, L., Bentley, K. H. et al. (2026). VERA-MH: Validation of Ethical and Responsible AI in Mental Health.
4. Samaritans. (2020). Media Guidelines for Reporting Suicide.
5. Graham, R. (2026). Cultivating a Living Archive: Sovereign AI for Cultural Heritage. ISEA2026 Dubai.
6. International Association for Suicide Prevention. (2023). IASP Guidelines for Crisis Centre and Helpline Operations.
7. Carroll, S.R., Garba, I., Figueroa-Rodriguez, O.L., Holbrook, J., Lovett, R., Materechera, S., Parsons, M., Raseroka, K., Rodriguez-Lonebear, D., Rowe, R., Sara, R., Walker, J.D., Anderson, J. & Hudson, M. (2020). The CARE Principles for Indigenous Data Governance. *Data Science Journal*, 19(1), 43.
8. Wilkinson, M.D. et al. (2016). The FAIR Guiding Principles for scientific data management and stewardship. *Scientific Data*, 3, 160018.
9. Sword Health. (2026). MindGuard: Guardrail Classifiers for Multi-Turn Mental Health Support. *arXiv:2602.00950*.
10. Yang, K., Ji, S., Zhang, T., Xie, Q., Kuang, Z., & Ananiadou, S. (2024). MentalLLaMA: Interpretable Mental Health Analysis on Social Media with Large Language Models. *arXiv:2309.13567*.
11. Xu, J., Wei, T., Hou, B., et al. (2025). MentalChat16K: A Benchmark Dataset for Conversational Mental Health Assistance. *Proceedings of the 31st ACM SIGKDD Conference on Knowledge Discovery and Data Mining*. DOI: 10.1145/3711896.3737393.
