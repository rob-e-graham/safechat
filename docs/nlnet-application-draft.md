# NLnet NGI Zero Commons Fund — Application Draft

**IMPORTANT:** NLnet strongly prefers applications written by the applicant, not by AI. This draft is a starting point — rewrite in your own voice before submitting. You must disclose AI usage in the form's "Generative AI Disclosure" section.

**Deadline:** June 1, 2026, 12:00 CEST (noon)
**Submit at:** https://nlnet.nl/propose/

---

## Call Selection

**NGI Zero Commons Fund**

---

## Contact Information

- **Name:** Rob Graham
- **Email:** rob@fineartmedia.tech
- **Phone:** [your phone]
- **Organisation:** FAMTEC (Fine Art Media Technology)
- **Country:** Australia

---

## General Project Information

### Proposal Name

SafeChat — Open Crisis Safety Protocol for AI Chat Systems

### Website / Wiki

https://rob-e-graham.github.io/safechat

Source: https://github.com/rob-e-graham/safechat

### Abstract

*(Explain the whole project and expected outcomes. Keep it short and to the point — what and how.)*

SafeChat is an open-source crisis safety protocol that detects distress signals in AI chat conversations and connects users to verified professional crisis resources. It runs entirely on the user's device — no data is collected, no messages are transmitted, and no permissions are required.

The project provides three things: a regex-based detection engine that catches explicit and indirect crisis language (including misspellings, text-speak, and negation variants), a geo-location system that finds the user's country from timezone and locale without GPS, and a verified database of 100+ crisis helplines across 34 countries (15 European) covering phone, text, chat, email, and WhatsApp.

SafeChat is designed as a routing layer, not a diagnostic tool. It does not assess clinical risk or replace professional services. It identifies textual signals and routes users to professionals who can help.

The technology is currently live as a progressive web app (works offline, installable on any device) and as a drop-in JavaScript library that developers can integrate into any AI chat interface with a single script tag. It includes a configurable Shield class with presets for different deployment contexts (companion apps, chatbots, moderation systems, research).

Expected outcomes from this funding:
- Expand detection to 3–5 additional languages (starting with French, German, Spanish, Dutch — serving European users directly)
- Expand the verified helpline database from 34 to 50+ countries
- Develop and publish an open standard specification for AI chat safety protocols, suitable for W3C or IETF community review
- Build automated verification infrastructure for helpline data (phone number validation, URL checking, hours confirmation)
- Security audit of the detection engine and browser bundle
- Publish detection accuracy benchmarks against the VERA-MH evaluation framework

### Have you been involved with projects or organisations relevant to this proposal before?

*(Describe relevant past projects or organisational involvement.)*

I am a PhD candidate at RMIT University (Melbourne, Australia) in the School of Design, researching sovereign AI infrastructure — local-first, privacy-respecting systems independent of cloud services. SafeChat emerged directly from this research as a practical application of privacy-preserving AI safety.

Through FAMTEC (Fine Art Media Technology), I develop ethical AI tools and creative technology. SafeChat is FAMTEC's first open-source public infrastructure project.

I have presented work on AI ethics and sovereign technology at international conferences, and I am presenting at ISEA2026 in Dubai on related themes. My supervisor is Chris Barker at RMIT.

SafeChat is already live and functional — it is not a concept. The current release (v1.1.0) includes 420 automated tests, a public changelog documenting every detection improvement, and a twice-monthly verification process for crisis resource data. The project follows Samaritans safe messaging guidelines for responsible communication about crisis topics.

---

## Requested Support

### Requested Amount

**EUR 35,000**

### Budget Breakdown

*(Provide main tasks and effort estimates.)*

| Task | Effort | Amount (EUR) |
|------|--------|-------------|
| **Multilingual detection engine** — Develop detection patterns for French, German, Spanish, and Dutch. Research clinical literature for each language. Build language-specific false-positive guards and test suites. | 3 months (0.5 FTE) | 10,000 |
| **Helpline database expansion** — Research, verify, and add crisis resources for 16+ additional countries. Build automated phone/URL verification tooling. Establish verification partnerships with national helpline organisations. | 2 months (0.5 FTE) | 6,000 |
| **Open standard specification** — Draft an open specification for AI chat safety protocols (detection signalling, resource routing, integration API). Prepare for community review through W3C Community Group or similar process. | 2 months (0.5 FTE) | 6,000 |
| **Security audit** — Commission independent security review of detection engine, browser bundle, service worker, and data pipeline. Address findings. Publish report. | External contract | 5,000 |
| **Accuracy benchmarking** — Run SafeChat detection against VERA-MH evaluation framework and publish results. Build continuous benchmark infrastructure. | 1 month (0.5 FTE) | 3,000 |
| **Community infrastructure** — Documentation for integrators, contributor onboarding, translation workflow tooling, CI/CD pipeline improvements. | 1 month (0.5 FTE) | 3,000 |
| **Project management and coordination** | Ongoing | 2,000 |
| **Total** | | **35,000** |

### Explain What the Budget Will Be Used For

The majority of the budget covers direct development work: extending SafeChat's detection engine to European languages, expanding the verified helpline database, and drafting an open standard for AI chat safety protocols. The security audit is the only externally contracted component. There are no facilities and administration costs — all work is done by the lead developer and small contracted contributions. Infrastructure costs (CDN, CI/CD, hosting) are covered by FAMTEC independently.

### Have You Applied for or Received Other Funding?

SafeChat has not received external funding to date. All development has been self-funded through FAMTEC. My PhD research at RMIT University is separately funded through the university.

I plan to apply for ARC Linkage Projects (Australia) in early 2027 for longer-term research funding, and I am exploring Suicide Prevention Australia research grants for clinical validation work. These would complement rather than duplicate the work proposed here — the NLnet funding covers foundational multilingual expansion and standardisation, while future grants would cover clinical research and long-term maintenance.

### Compare Your Effort with Existing or Historical Efforts

The closest existing efforts are:

**Find A Helpline** (findahelpline.com) — A helpline directory covering 175+ countries. SafeChat uses Find A Helpline as a fallback, but differs fundamentally: SafeChat provides *detection* (identifying crisis language in real-time) and *integration* (drop-in library for AI systems), not just a directory. Find A Helpline is a destination website; SafeChat is infrastructure that other systems embed.

**VERA-MH** (Spring Health) — An evaluation framework for assessing AI mental health safety. VERA-MH measures the problem; SafeChat addresses it. They are complementary — SafeChat intends to benchmark against VERA-MH.

**EmoAgent** (research) — A multi-agent framework for AI-human mental health interaction. EmoAgent requires LLM inference and cloud connectivity; SafeChat runs entirely locally with regex, requires no API calls, works offline, and collects zero data.

No existing tool provides SafeChat's combination: local-only detection, geo-routing without permissions, verified helpline database, configurable integration presets, and offline PWA — all as open-source infrastructure.

### Describe the Technical Challenges

1. **Multilingual detection without NLP models.** SafeChat uses regex for privacy (no data leaves the device), but extending regex-based detection to morphologically complex languages (French, German) is significantly harder than English. Each language needs its own false-positive guards calibrated to local idioms and figurative language. Clinical literature on language-specific suicidal expression must inform pattern design.

2. **Helpline verification at scale.** Phone numbers change, organisations merge, hours shift. Automated verification must handle international dialling formats, distinguish between disconnected numbers and temporary outages, and verify web chat URLs across different platforms. This needs to work reliably for 50+ countries without manual intervention.

3. **Standardisation across diverse AI systems.** Different AI frameworks (companion apps, chatbots, moderation tools, research platforms) need different safety responses. The Shield class currently offers 6 presets, but a formal open standard must be flexible enough for diverse use cases while being specific enough to be implementable. Finding this balance through community input is a design challenge.

4. **False-positive calibration across cultures.** Figurative language about death, pain, and hopelessness varies enormously across cultures. A phrase that signals genuine distress in one culture may be a common idiom in another. Each language expansion requires native-speaker review and culturally-informed false-positive guard development.

### Describe How Your Effort Will Engage the Broader Ecosystem

- **Open standard publication.** The AI chat safety protocol specification will be published for community review, targeting a W3C Community Group or similar open standards body. This directly invites ecosystem participation in defining how AI systems should handle crisis situations.

- **Integrator community.** SafeChat is designed for drop-in integration. Documentation, contributor guidelines, and the GitHub Discussions forum are already active. Multilingual expansion will engage native-speaker contributors from European communities.

- **Crisis service partnerships.** Helpline database expansion requires direct engagement with national crisis organisations across Europe. These relationships create ongoing verification partnerships.

- **Conference presentation.** I will present SafeChat and the open standard work at relevant European technology and digital health conferences. ISEA2026 (Dubai, late 2026) is already confirmed.

- **Research community.** Publishing VERA-MH benchmark results creates a reference point for other AI safety researchers. The detection engine's approach (local regex vs. cloud ML) contributes to the broader conversation about privacy-preserving safety infrastructure.

---

## European Dimension

*(This is a knockout criterion for non-EU applicants. Address it clearly.)*

SafeChat has direct European relevance across multiple dimensions:

1. **15 European countries already covered.** The verified helpline database includes Austria, Belgium, Denmark, Finland, France, Germany, Ireland, Italy, Netherlands, Norway, Portugal, Russia, Spain, Sweden, Switzerland, and the United Kingdom.

2. **Privacy architecture aligned with European values.** SafeChat's zero-data-collection, local-first design embodies the privacy principles at the heart of GDPR and the European data sovereignty agenda. No message content is ever transmitted, stored, or logged. This is infrastructure built the way Europe says technology should work.

3. **Multilingual expansion targets European languages first.** The proposed work prioritises French, German, Spanish, and Dutch — directly serving European users and communities.

4. **Open standard for European regulatory compliance.** The EU AI Act and emerging national regulations increasingly require safety measures in AI systems. An open standard for chat safety protocols gives European developers a compliance-ready, vendor-independent solution.

5. **Digital commons contribution.** SafeChat's crisis resource database is CC0 public domain. The detection engine and integration tools will be available under open licenses. This is public infrastructure for the European digital commons.

---

## Licensing Note

SafeChat currently uses BSL-1.1 (Business Source License), which is source-available with a change date to MPL 2.0 (OSI-approved) on 2029-01-01. The BSL permits free use for personal, educational, research, nonprofit, community, and small commercial purposes.

For the purposes of this grant, I am willing to:
- Release all NLnet-funded work (multilingual detection, helpline data, standard specification, benchmarks) under MPL 2.0 or Apache 2.0 immediately
- Accelerate the BSL-1.1 change date for the core project if required
- Dual-license grant-funded components under an OSI-approved license

The crisis resource database is already CC0 public domain. The intent is maximum openness for safety infrastructure — the BSL exists only to prevent large commercial entities from reselling the toolkit without contributing back.

---

## Attachments

Consider attaching:
- [ ] SafeChat White Paper (docs/SafeChat-White-Paper.docx)
- [ ] CHANGELOG.md (demonstrates ongoing development process)
- [ ] Screenshot of live PWA

---

## AI Disclosure

**You must disclose that AI was used in drafting this application.**

Suggested disclosure: "I used Claude (Anthropic) to research funding opportunities and generate a first draft of this application, which I then substantially revised and rewrote in my own words. The SafeChat project itself was developed by me; the AI assisted only with the grant application text."

---

## Pre-Submission Checklist

- [ ] Rewrite all sections in your own voice (NLnet values authentic applications)
- [ ] Add your phone number
- [ ] Verify the EUR 35,000 amount feels right (can adjust 5K–50K)
- [ ] Decide on licensing position (recommend offering MPL 2.0 for grant-funded work)
- [ ] Prepare attachments (white paper, screenshots)
- [ ] Complete AI disclosure honestly
- [ ] Read privacy statement and check the acknowledgment box
- [ ] Submit at https://nlnet.nl/propose/ before June 1, 12:00 CEST

---

*Draft prepared 2026-05-29. This is a starting document — rewrite before submitting.*
