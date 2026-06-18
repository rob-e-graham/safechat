# Living Signal Database Architecture

SafeChat needs deep language coverage without becoming a surveillance corpus. The right model is not a public database of millions of raw crisis phrases. The right model is a governed, compressed, local signal system that can learn from large reviewed datasets while shipping only small auditable artefacts.

## Core Principle

Use large datasets for research, evaluation, calibration, and distillation. Ship compact local artefacts:

- normalisation rules
- misspelling and obfuscation maps
- slang and code-word lexicons
- phrase templates
- false-positive guards
- reviewed exemplar phrases
- small embedding indexes
- optional distilled local classifiers

This gives the system depth without redistributing sensitive user-authored posts, transcripts, or donated crisis data.

## Compression Layers

| Layer | What It Stores | Why It Stays Small |
|-------|----------------|--------------------|
| Normalisation | spelling, spacing, leetspeak, slang expansion | One rule covers thousands of variants |
| Phrase templates | "I can't keep myself safe [time]" | One template covers many sentences |
| Lexicons | methods, time markers, protected classes, code words | Small lists combine with templates |
| False-positive guards | harmless contexts and idioms | Prevents broad patterns from over-triggering |
| Reviewed exemplars | representative crisis/distress phrasings | Dozens to thousands, not millions |
| Embeddings | vectors for exemplars or prototypes | Compact semantic memory for paraphrases |
| Distilled classifier | tiny local model trained/evaluated on reviewed datasets | Captures nuance without shipping raw text |

## Growth Model

Each signal update should be a small governed package:

```json
{
  "id": "en-au-youth-slang-2026-q3",
  "language": "en",
  "region": ["AU"],
  "communityScope": "youth slang",
  "status": "draft_review",
  "reviewAfter": "2026-09-12",
  "sources": ["expert_review", "helpline_feedback", "published_literature"],
  "normalisation": [],
  "templates": [],
  "lexicons": [],
  "falsePositiveGuards": [],
  "tests": []
}
```

Updates can then be reviewed, versioned, disabled, expired, or replaced without changing the whole engine.

## Social And Cultural Scope

Human distress language changes by country, age, platform, disability culture, migration context, gender, sexuality, faith, and local slang. A phrase that is high-risk in one setting may be ordinary or reclaimed in another. SafeChat should therefore treat language packs as scoped artefacts, not universal truth.

Recommended scopes:

- language
- region/country
- platform or social setting
- age group where ethically appropriate
- cultural/community review status
- false-positive risk
- evidence strength
- expiry/review date

## Multi-Country Strategy

Do not translate English triggers word-for-word. For each language or region:

1. Gather published literature and helpline guidance.
2. Ask local experts and lived-experience reviewers what indirect distress looks like.
3. Build language-specific normalisation and false-positive guards.
4. Test against safe everyday language from that region.
5. Keep crisis-resource routing local to the user's country.
6. Mark packs as provisional until reviewed.

## Privacy Boundary

The public SafeChat package should never include:

- raw restricted social-media posts
- crisis-line transcripts
- donated private text
- user profiles
- account-level risk labels
- demographic inference rules
- automatic reporting logic

The package may include:

- synthetic examples
- reviewed signal families
- public clinical taxonomy concepts
- source metadata
- local-only model weights where licensing allows
- test cases written for safety validation

## Near-Term Implementation Path

1. Keep the deterministic regex layer as the always-on fallback.
2. Expand `detectReviewed()` into external versioned signal packs.
3. Add a build step that compiles templates and lexicons into compact regexes.
4. Add optional compressed embedding indexes for reviewed exemplars.
5. Train/evaluate a small local classifier from permitted datasets and synthetic reviewer-approved variants.
6. Keep MindGuard and MentalLLaMA as optional local second-opinion paths for capable devices.
7. Publish governance notes with every pack update.

## Ethical Boundary

The aim is to notice language that may indicate someone needs support and route them to professional resources. It is not to label people, diagnose them, police them, infer identity, or create a surveillance feed. Growth must improve care without creating a new mechanism for harm.
