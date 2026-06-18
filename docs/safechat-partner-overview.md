# SafeChat

## A privacy-preserving crisis-routing layer for AI conversations

SafeChat is a source-available software component that helps AI applications recognise textual signs of distress and connect people with appropriate human support. Detection runs locally on the user's device, so SafeChat does not need to transmit, store, or analyse conversation text on an external server.

SafeChat is not a chatbot, diagnostic tool, clinical risk score, counselling service, or replacement for emergency services. It is one safety layer that a responsible AI product can integrate into a wider safeguarding system.

**Interactive demonstration:** [Open the SafeChat inspector](https://rob-e-graham.github.io/safechat/app/inspector.html)

**Project repository:** [View SafeChat on GitHub](https://github.com/rob-e-graham/safechat)

## Why it exists

People increasingly disclose distress, self-harm, and suicidal thoughts to general-purpose and companion chatbots. The conversational model may miss an indirect disclosure, respond inconsistently, or fail to connect the person with appropriate human care.

SafeChat gives developers a separate, inspectable routing layer. It is designed to remain available even when a model changes, an API is unavailable, or the device is offline.

## How it works

1. **Observe locally.** SafeChat reads text inside the host application. The standard detection path runs on the device and sends no message content to SafeChat or FAMTEC.
2. **Recognise signals.** Deterministic, reviewed signal families cover explicit crisis language, passive or indirect expressions, common misspellings, slang, and false-positive boundaries. Optional local semantic and ML tiers can provide a second opinion without downgrading a deterministic detection.
3. **Accumulate context.** Individually ambiguous contextual signals can contribute transparent, configurable weights during a session. SafeChat retains categories, weights, and timestamps rather than message text.
4. **Route proportionately.** A deployment can show a gentle support banner, interrupt with a crisis-resource modal, notify a moderator, or invoke its own escalation pathway. Threat and hate-speech moderation remain separate from self-directed crisis routing.
5. **Connect to human help.** The included resource dataset contains 67 records across 34 countries and 94 phone, text, chat, email, WhatsApp, and web contact methods. Automated checks cover structure, phone formatting, and chat-link reachability; operating details still require human verification.

The current engineering suite contains 647 automated tests. These tests demonstrate repeatable software behaviour and regression protection. They do not establish clinical validity, population-level accuracy, fairness, or improved health outcomes.

## What the demonstration shows

The interactive inspector makes each layer visible. It can show:

- an idiom correctly rejected as a false positive;
- explicit crisis language routed immediately;
- a hedged passive expression routed to a gentle support response;
- contextual signals accumulating from no route, through LOW, to HIGH;
- threat language entering a separate moderation lane; and
- the actual banner or crisis-resource modal that an integrated application can display.

Scenario wording is drawn from verified pools so the demonstration can vary without changing the expected classification.

## Relationship to VERA-MH

VERA-MH is a clinically grounded framework for evaluating how a chatbot behaves across a multi-turn mental-health conversation. Its scope includes recognising potential risk, confirming risk appropriately, guiding a person toward human care, communicating effectively, and maintaining safe boundaries.

SafeChat is a routing component rather than a complete chatbot. It directly supports parts of the recognition and human-care-routing workflow. Empathy, clarifying questions, conversational quality, clinical appropriateness, and safe response generation remain responsibilities of the host chatbot and deployment.

Public VERA-MH v1.1 risk-presentation concepts have informed attributed SafeChat regression families and contextual categories. SafeChat did not import complete persona biographies, diagnoses, demographic attributes, hidden risk labels, or generated conversations into its production detector.

SafeChat has not been run through, scored, endorsed, certified, or clinically validated by VERA-MH. Using public VERA-MH materials for regression design does not imply a relationship with Spring Health or the VERA-MH authors.

## A responsible VERA-MH integration study

A useful evaluation object would be a pinned chatbot-plus-SafeChat deployment rather than the detector in isolation. A small pilot could:

1. pin one reference chatbot and record its model, prompt, SafeChat version, thresholds, resources, and interface behaviour;
2. expose both the chatbot response and SafeChat routing event to the evaluator;
3. run relevant VERA-MH multi-turn personas and rubric branches, using blinded human review where required; and
4. report successful and failed behaviours while separating component findings from claims about the safety or clinical quality of the complete deployment.

The immediate request to VERA-MH researchers is methodological guidance on the correct unit of evaluation, applicable rubric dimensions, interface design, human-review process, and claims boundary. It is not a request for endorsement.

## Potential applications

SafeChat may be useful as one layer within:

- general-purpose, companion, education, wellbeing, and customer-support chatbots;
- community, nonprofit, library, youth, and public-interest digital services;
- human moderation and safeguarding workflows;
- employee-assistance and workplace wellbeing platforms;
- research prototypes comparing local deterministic, semantic, and model-based safety approaches;
- offline or low-connectivity applications where cloud-only safeguards are unreliable; and
- regulatory or procurement demonstrations that require inspectable crisis-routing behaviour.

Every deployment requires its own testing, governance, escalation procedures, user communication, legal review, and clinical oversight where appropriate.

## Research opportunities

Priority research questions include:

- **Evaluation design:** how a component-level routing event should be represented inside a chatbot-response framework such as VERA-MH.
- **Independent benchmarking:** sensitivity, specificity, false-positive behaviour, subgroup performance, and comparison with local semantic or ML classifiers.
- **Multi-turn calibration:** whether transparent accumulation rules improve routing without overreacting to ordinary conversation.
- **Human factors:** how users understand, trust, dismiss, or act on banners, modals, and transitions to human support.
- **Cultural and linguistic coverage:** co-designed evaluation beyond current English-language patterns.
- **Resource quality:** sustainable human verification of international crisis-resource availability and accessibility.
- **Privacy engineering:** measuring the practical advantages and limitations of local-first safeguarding.
- **Deployment outcomes:** whether integrated routing improves access to appropriate help without introducing new harms.

Research should include clinical expertise, suicide-prevention expertise, lived experience, accessibility review, cultural review, ethics oversight, and appropriate institutional governance.

## Licensing and collaboration

SafeChat is distributed under the Business Source License 1.1. The current Additional Use Grant permits personal, education, research, nonprofit, community, public-interest, crisis-support, public-institution, and qualifying small-commercial use under the licence terms.

Commercial entities generating more than USD 100,000 annually from products or services substantially incorporating SafeChat require a commercial licence. The licensed work is scheduled to change to the Mozilla Public License 2.0 on 1 January 2029.

Possible collaboration models include:

- independent research or replication studies;
- a reference chatbot adapter and VERA-MH evaluation harness;
- clinical, lived-experience, cultural, accessibility, or ethics review;
- multilingual signal and resource partnerships;
- enterprise integration and commercial licensing;
- sponsored development of moderation, audit, governance, and deployment tooling; and
- public-interest funding for open evaluation infrastructure.

Licence terms and the full legal disclaimer should be reviewed before integration. Implementers remain responsible for configuration, testing, supervision, compliance, safeguarding, and their own escalation pathway.

## Proposed next step

Define a small, reproducible pilot around one reference chatbot, one pinned SafeChat release, a documented intervention interface, applicable VERA-MH rubric branches, and an agreed review protocol. Publish the configuration, strengths, failures, and limitations without presenting engineering tests as clinical evidence.

## Contact and links

**Rob Graham**

PhD Researcher, RMIT University | FAMTEC

**Email:** rob@fineartmedia.tech

[Interactive inspector](https://rob-e-graham.github.io/safechat/app/inspector.html) | [Project overview](https://fineartmedia.tech/safechat) | [SafeChat repository](https://github.com/rob-e-graham/safechat) | [VERA-MH](https://www.vera-mh.com/) | [Legal disclaimer](https://github.com/rob-e-graham/safechat/blob/main/docs/legal-disclaimer.md)

*Prepared 18 June 2026. SafeChat is under active development.*
