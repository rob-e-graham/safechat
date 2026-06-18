# SafeChat Changelog

All notable changes to SafeChat are documented here. This log serves as a public record of ongoing safety improvements, detection accuracy gains, and responsible development practices.

SafeChat follows a philosophy of continuous improvement: every false negative discovered is treated as a critical defect. Every false positive is evaluated for alarm fatigue impact.

---

## [Unreleased]

### Added
- Browser bundle now exposes `detectSubtle()` and `ConversationTracker`, so standalone website integrations can detect subtle distress signals and session-level accumulation.
- Website detection demo now shows subtle-signal observations, lets users add separate messages to a demo session, and demonstrates accumulation toward LOW escalation without sending any text off-device.
- `detectReviewed()` adds an evidence-linked reviewed signal pack with C-SSRS, Reddit C-SSRS, CLPsych, eRisk, MindGuard, MentalLLaMA, and MentalChat16K source metadata.
- VERA-MH v1.1 is now an explicit reviewed source. Public synthetic risk presentations inform new active-ideation, passive-absence, recent-attempt, preparation, self-safety, and contextual accumulation families without presenting VERA-MH as a trigger dictionary or validation of SafeChat.
- Conversation tracking now covers 45 contextual patterns across 17 categories. Transparent routing weights combine at 4 for LOW and 8 for HIGH; they are not probabilities or clinical risk scores, and message content is not retained.
- Crisis detection now catches additional slang, obfuscation, and bad-spelling cases such as self-delete language, spaced abbreviations, leetspeak, and suicide euphemisms.
- `detectModeration()` now includes protected-class slur detection with false-positive guards, kept separate from crisis-resource routing.
- New living signal database and reviewed-source docs describe how SafeChat can grow via compressed rules, templates, lexicons, embeddings, and optional local classifiers rather than raw phrase dumps.
- 34 new tests covering reviewed source-linked signals, browser/ESM exports, slang, obfuscation, slur moderation, and false-positive guards (639 total).
- 8 additional regression tests cover VERA-MH public presentation families, false-positive boundaries, browser parity, and contextual accumulation (647 total).

---

## [1.3.0] - 2026-06-12

### Added
- **Semantic layer (Tier 1)** — optional embedding-similarity verification light enough for any modern browser, including installed PWAs on phones, fully offline after first load (~25 MB models such as all-MiniLM-L6-v2). Catches metaphorical distress that keyword patterns can't express by comparing messages against curated crisis exemplar phrases in embedding space.
- **Curated exemplar set** — 29 indirect/metaphorical distress exemplars across HIGH and LOW tiers, drawn from clinical warning-sign literature. Plain, auditable text — replaceable wholesale for community-authored, culturally specific language packs (CARE-aligned governance).
- **Three embedding backends** — `custom` (any embed function, e.g. Transformers.js in-browser), `ollama` (/api/embeddings), `local_api` (OpenAI-compatible /v1/embeddings: LM Studio, llama.cpp, vLLM).
- **Shield integration** — `semanticLayer` config option; `processAsync()` now chains Tier 1 (semantic) then Tier 3 (cross-classifier), each under the same confirm-or-escalate merge contract.
- **Tier architecture documentation** — new diagrams (tier-architecture.svg, dual-path-merge.svg) and progressive-enhancement framing in README and white paper.
- **79 new tests** (596 total) — construction validation, cosine similarity edge cases, threshold behaviour, all merge rules, error fallback and recovery, callbacks, ping/warm-up, Shield integration, both-tiers chaining, ESM exports.

### Changed
- White paper updated to v1.3.0 with Section 9.1 (Semantic Layer and Tiered Architecture); .docx rebuilt with previously missing sections (negation normalisation, subtle signal accumulation, Shield class, CARE Principles, EU AI Act, Ongoing Development, Disclaimer).

### Security
- Same privacy contract as all tiers: no message content stored or transmitted; embeddings computed on-device or on a developer-controlled endpoint; exemplar index held in memory only.
- Merge rules guarantee the semantic layer can only confirm or escalate — a failing or malicious embedder degrades to regex-only behaviour, never below it.

---

## [1.2.0] - 2026-06-11

### Added
- **Cross-classifier module (Tier 3)** — optional second-opinion layer running local clinical ML models alongside the regex engine. Suggested by Professor Stevie Chancellor (University of Minnesota).
- **Five backends** — MindGuard (Sword Health 4B/8B crisis classifiers), MentalLLaMA (7B/13B interpretable mental health analysis), Ollama, Transformers/OpenAI-compatible APIs, and custom classification functions.
- **Merge rules** — the classifier never downgrades a regex detection; it can only confirm or escalate. Regex HIGH stays HIGH regardless of model opinion.
- **`Shield.processAsync()`** — async processing path with cross-classifier verification, response-mode re-determination, and resource re-resolution on escalation.
- **71 new tests** (517 total) — label mapping, merge rules, confidence thresholds, error handling, callbacks, Shield integration.

### Security
- All inference local or developer-controlled; no message content transmitted to external services.
- Classifier errors fall back silently to regex results — the safety floor never depends on model availability.

---

## [1.1.0] - 2026-05-29

### Added
- **Configurable Shield class** — developers can now toggle safety modes (interrupt, inject, flag, log, callback, none) per detection level. 6 presets: companion, chatbot, moderation, strict, shadow, museum.
- **Subtle signal accumulation** — 42 patterns across 8 categories (withdrawal, sleep, anhedonia, farewell, self-worth, future loss, reckless, pain) detect accumulating distress across a conversation session without storing message content.
- **ConversationTracker** — session-level accumulation with configurable thresholds (4 points LOW, 8 points HIGH) and 30-minute sliding window.
- **12 new HIGH signals** — wanting to disappear, ready to die, saying goodbye to everyone, this is my last night/message, no one can save me, putting affairs in order, making final will, no coming back, need it to end, life isn't worth the pain, made my decision.
- **18 new LOW signals** — can't keep going, feeling numb, don't feel anything, completely alone, never getting better, don't want to wake up, can't face tomorrow, tired of living/fighting, nobody will understand, don't belong, broken beyond repair, given up, always be alone, can't escape the pain, don't deserve to live/be happy.
- **7 new false-positive guards** — magic trick disappear, numb fingers, tired of cooking, giving away promotions, can't sleep from coffee, deleting old files.
- **Negation normalisation** — "do not", "cannot", "will not" etc. now correctly contract before matching, eliminating detection gaps for formal/expanded phrasing.
- **Contraction consistency** — "there is no coming back" now matches alongside "there's no coming back"; "i am tired of living" matches alongside "i'm tired of living".
- **CARE Principles integration** — white paper, Substack, and LinkedIn content now include CARE framework for indigenous data sovereignty.
- **White paper .docx** — generated academic document with build script.

### Changed
- Browser bundle (browser.js) fully synced with detect.js v1.1 — was missing all expanded patterns.
- Package version bumped to 1.1.0.
- `docx` moved from dependencies to devDependencies (build tooling only).
- License header in index.js corrected from MIT to BSL-1.1.
- Repository URL fixed in package.json.

### Security
- All 420 tests passing, including adversarial inputs, ReDoS protection, type coercion, and HTML injection tests.
- No message content stored by ConversationTracker — only signal categories and numerical weights.

---

## [1.0.0] - 2026-05-22

### Added
- Initial release.
- Regex-based crisis detection: HIGH and LOW signal tiers.
- Input normalisation: misspellings, text-speak, unicode, whitespace.
- False-positive guards: figurative language, idioms, sports terms, HTML classes.
- Geo-detection cascade: locale, timezone, CDN headers, Accept-Language, fallback.
- Crisis resources: 100+ verified helplines across 34 countries.
- Browser bundle with modal, banner, and popup UI.
- Node.js module with Express middleware.
- AI prompt overrides for LLM system prompt injection.
- PWA-capable popup with offline support.
- 205 automated tests.
- BSL-1.1 license with comprehensive liability disclaimer.
- Legal disclaimer and acceptance gate.

---

## Testing Philosophy

Every release must pass all existing tests before shipping. New detection patterns require:
1. True positive tests (does it catch what it should?)
2. True negative tests (does it leave safe content alone?)
3. False-positive guard tests (does figurative language pass through?)
4. Edge case tests (casing, whitespace, punctuation, unicode)

Test count history: 205 (v1.0.0) -> 308 (subtle signals) -> 403 (Shield) -> 420 (negation fix, v1.1.0)

## Verification Schedule

- Automated resource checks cover structure, phone formatting, and chat-link reachability; service details require human verification.
- Detection patterns are reviewed against published clinical literature on suicide risk assessment.
- False-positive reports from users are triaged within 48 hours.
- False-negative reports are treated as critical defects.
