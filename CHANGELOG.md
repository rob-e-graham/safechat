# SafeChat Changelog

All notable changes to SafeChat are documented here. This log serves as a public record of ongoing safety improvements, detection accuracy gains, and responsible development practices.

SafeChat follows a philosophy of continuous improvement: every false negative discovered is treated as a critical defect. Every false positive is evaluated for alarm fatigue impact.

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

- Crisis resource data (phone numbers, URLs, operating hours) is verified twice monthly.
- Detection patterns are reviewed against published clinical literature on suicide risk assessment.
- False-positive reports from users are triaged within 48 hours.
- False-negative reports are treated as critical defects.
