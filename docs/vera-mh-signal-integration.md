# VERA-MH Signal Integration Note

## Scope

SafeChat reviewed the public VERA-MH v1.1.1 persona and rubric materials at repository revision `d4d1934644f4cdff287e25e7cbf7d4eaa30eea1d` on 2026-06-18.

Source: `https://github.com/SpringCare/VERA-MH`

VERA-MH is a multi-turn evaluation of chatbot responses. It is not a trigger-word dictionary, and its persona risk labels are not ground truth for what a deterministic detector should infer from one opening sentence. SafeChat has not been run through or scored by VERA-MH.

## What Was Integrated

Public VERA-MH risk-presentation concepts informed reviewed regression families for:

- hedged active suicidal thoughts and references to ways of ending or being gone;
- passive wishes not to be present, alive, awake, or in existence;
- near-term plan and intent language;
- recent, aborted, or interrupted attempt language;
- preparatory behaviour and self-referential method research;
- loss of immediate self-safety;
- minimisation, escalating thoughts, isolation, help barriers, acute timeframe, sleep disruption, substance escalation, and overwhelm as contextual session signals.

SafeChat did not import the full persona biographies, diagnoses, demographic attributes, hidden risk labels, or generated conversation transcripts into the production detector.

## Multi-Turn Routing

Contextual signals contribute configured routing weights from 1 to 3:

| Example category | Weight |
|---|---:|
| Overwhelm, minimisation, help barrier | 1 |
| Isolation, escalating thoughts, acute timeframe | 2 |
| Contextual method-information query | 3 |

- Total below `4`: no crisis-routing trigger.
- Total `4-7`: LOW routing and a soft safety check.
- Total `8+`: HIGH routing and immediate crisis-resource presentation.

Example: a method-information query contributes `3` and does not trigger alone. A later overwhelm signal contributes `1`, bringing the session to `4` and producing LOW routing.

The numbers are deterministic software controls. They are not probabilities, diagnoses, clinical risk levels, or a validated suicide-risk score. Only categories, weights, and timestamps are held in memory; message content is not retained, and signals expire after 30 minutes by default.

## Audit Result

All 100 public final seed phrases were inspected as a coverage audit. The audit was used to find missing observable language families and contextual categories, not to calculate sensitivity or specificity. Some persona openings deliberately omit or obscure the hidden risk condition, so treating every persona label as inferable from its first phrase would create unsafe false positives and invalid performance claims.

## Governance

- Every production reviewed rule remains source-attributed and passes false-positive guards.
- Ambiguous method questions remain contextual unless self-reference, distress, preparation, or intent makes them directly actionable.
- VERA-MH-derived regression cases test software behaviour only.
- Clinical calibration, subgroup analysis, cultural review, and a formal VERA-MH evaluation remain future research tasks.
- The VERA-MH license states that use does not imply endorsement and does not guarantee safety or better health outcomes; SafeChat preserves that distinction in public claims.
