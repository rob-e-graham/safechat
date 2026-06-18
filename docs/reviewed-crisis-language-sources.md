# Reviewed Crisis-Language Sources

SafeChat uses a local reviewed signal pack, not a raw crisis-language dump. The pack distils public signal families from peer-reviewed, clinically governed, or public benchmark work and links each reviewed trigger to a source ID in `src/detect.js`.

## Current Source Families

| Source | What SafeChat Uses | What SafeChat Does Not Use |
|--------|--------------------|----------------------------|
| C-SSRS / Posner et al. 2011 | Wish-to-be-dead, active suicidal thoughts, method, intent, plan, and preparatory-behaviour signal families. | No clinical scoring, diagnosis, or C-SSRS administration. |
| Reddit C-SSRS / Gaur et al. 2019 | Severity-linked concepts from medical knowledge bases, suicide ontology, and psychiatrist C-SSRS annotations. | No raw Reddit posts or identifiable user material. |
| CLPsych 2019 | Risk-tier framing for no, low, moderate, and severe suicide-risk language. | No restricted Reddit shared-task data. |
| CLPsych 2021 | Privacy-preserving design lesson: sensitive donated text belongs in secure environments. | No Twitter data or attempt labels. |
| eRisk self-harm tasks | Sequential-evidence design for accumulating weak signals over time. | No task collection redistribution. |
| VERA-MH v1.1 | Public risk-presentation families, disclosure styles, contextual markers, and synthetic seed phrases used to design regression cases and multi-turn accumulation. | No claim that VERA-MH is a trigger dictionary, that its hidden persona labels can be inferred from every opening phrase, or that it validates SafeChat. |
| MindGuard | Actionable-harm taxonomy separating safe disclosure, self-harm risk, and harm-to-others risk. | No claim that SafeChat is MindGuard or clinically validated by it. |
| MentalLLaMA | Optional local cross-classifier direction for interpretable mental-health analysis. | No mandatory LLM inference and no cloud calls. |
| MentalChat16K | Benchmark direction for conversational mental-health evaluation. | No raw transcripts embedded in SafeChat. |

## Why Not Ship Millions Of Phrases?

A literal onboard phrase bank with millions of examples would be large, hard to govern, legally messy, and likely to contain sensitive user-authored text. SafeChat should behave like it has broad coverage without carrying a giant sensitive corpus.

The safer architecture is:

1. Keep a small deterministic reviewed signal pack for obvious and clinically meaningful text.
2. Add a compact semantic/embedding tier for paraphrases and metaphorical distress.
3. Add an optional local classifier for developers who can run MindGuard, MentalLLaMA, or a distilled model locally.
4. Use large datasets for evaluation, distillation, and governance review, not as copied phrase dumps.

See `docs/living-signal-database.md` for the broader compression and growth model across slang, misspellings, protected-class slur moderation, countries, and social scenarios.

See `docs/vera-mh-signal-integration.md` for the VERA-MH v1.1 provenance, integration boundary, accumulation example, and audit limitations.

## Governance Rules

- Every reviewed signal must have a source ID, level, family, rationale, review status, and review date.
- Raw restricted posts, transcripts, and donated data must not be embedded in the public package.
- False-positive guards remain active before reviewed signals can trigger.
- Threat and hate-speech moderation stays separate from crisis-resource routing.
- The system remains a routing layer, not a diagnostic tool or suicide-risk predictor.

## References

- Posner, K. et al. (2011). The Columbia-Suicide Severity Rating Scale: initial validity and internal consistency findings. `https://doi.org/10.1176/appi.ajp.2011.10111704`
- Gaur, M. et al. (2019). Knowledge-aware assessment of severity of suicide risk for early intervention. `https://doi.org/10.1145/3308558.3313698`
- Zirikly, A. et al. (2019). CLPsych 2019 Shared Task: Predicting the Degree of Suicide Risk in Reddit Posts. `https://aclanthology.org/W19-3003/`
- MacAvaney, S. et al. (2021). Community-level Research on Suicidality Prediction in a Secure Environment. `https://aclanthology.org/2021.clpsych-1.7/`
- CLEF eRisk Lab. Early Detection of Signs of Self-Harm. `https://erisk.irlab.org/2021/index.html`
- Belli, L., Bentley, K. H. et al. (2026). VERA-MH: Validation of Ethical and Responsible AI in Mental Health. `https://arxiv.org/abs/2605.13318`; code and v1.1 personas: `https://github.com/SpringCare/VERA-MH`
- Farinhas, A. et al. (2026). MindGuard: Guardrail Classifiers for Multi-Turn Mental Health Support. `https://arxiv.org/abs/2602.00950`
- Yang, K. et al. (2023). MentalLLaMA: Interpretable Mental Health Analysis on Social Media with Large Language Models. `https://github.com/SteveKGYang/MentalLLaMA`
- Xu, J. et al. (2025). MentalChat16K: A Benchmark Dataset for Conversational Mental Health Assistance. `https://doi.org/10.1145/3711896.3737393`
