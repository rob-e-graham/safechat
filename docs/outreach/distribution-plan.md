# SafeChat Distribution Plan

**Date:** 2026-06-07
**Version:** 1.1.0
**Status:** Mail-out ready. All disclaimers in place. 446 tests passing. Outreach should ask for review and verification, not endorsement.

---

## Legal Checklist (Completed)

Every public-facing surface includes:
- [x] "Routing layer, not a diagnostic tool" positioning
- [x] Not medical/clinical/therapeutic disclaimer
- [x] Not a substitute for emergency services
- [x] No clinical risk assessment claims
- [x] Limitation of liability (personal injury, death, failure to detect)
- [x] Acceptance-gated ("if you do not accept, do not use")
- [x] Samaritans safe messaging compliance (no method details)
- [x] Zero data collection stated
- [x] Integrator responsibilities documented
- [x] Governing law (Victoria, Australia, ACL carve-out)
- [x] Full legal disclaimer linked from all pages
- [x] BSL-1.1 license with commercial trigger stated

**Required disclaimer for all outreach:**
> SafeChat is a routing layer, not a diagnostic tool. It identifies textual signals that may indicate distress and connects users to verified professional crisis resources. It does not assess clinical risk or replace professional mental health services, emergency services, or local crisis procedures.

---

## Phase 1: Immediate (This Week)

### LinkedIn Post
- Post the long version from `safechat-linkedin-post.md`
- Tag: RMIT University, FAMTEC
- Hashtags: #AIEthics #OpenSource #MentalHealth #AISafety #SuicidePrevention
- Best time: Tuesday-Thursday, morning AEST

### Priority 1 Emails
Send personalised emails using `priority-20-mailout-pack.md`. Start with crisis organisations, RMIT, Australian safety bodies, and expert reviewers before broader media.

---
**Subject:** SafeChat -- source-available crisis safety protocol for AI chat systems

[Personalised line from CSV]

SafeChat is a free, source-available crisis safety protocol that detects distress signals in AI chat conversations and connects users to verified professional crisis resources. It runs entirely on the user's device -- zero data collection, works offline, 34 countries, 446 automated tests.

It's a routing layer, not a diagnostic tool. It does not assess clinical risk or replace professional services. Threat and hate-speech signals are exposed separately for moderation and do not trigger crisis-resource routing by default.

Live site: https://rob-e-graham.github.io/safechat
Get help now (PWA): https://rob-e-graham.github.io/safechat/app/popup.html
Source: https://github.com/rob-e-graham/safechat

I'd welcome your feedback, review, or any guidance on how SafeChat can better serve [their domain].

Rob Graham
PhD Researcher, RMIT University
FAMTEC | fineartmedia.tech

SafeChat is provided as is. It does not replace professional mental health services or emergency services. Full disclaimer: https://github.com/rob-e-graham/safechat/blob/main/docs/legal-disclaimer.md

---

### Priority 1 Contacts (send this week)
Use the ranked 20-contact list in `docs/outreach/priority-20-mailout-pack.md`.

### Hacker News
- Post: "Show HN: SafeChat -- source-available crisis detection for AI chatbots (no API, runs locally, 34 countries)"
- URL: https://rob-e-graham.github.io/safechat
- Best time: Tuesday-Thursday, 9-11am US Eastern (11pm-1am AEST)
- Be ready to answer comments for the first 2 hours

### PWA Direct Sharing
- The PWA link is the most immediately useful thing to share: https://rob-e-graham.github.io/safechat/app/popup.html
- Anyone can install it on their phone right now
- Share this link directly with anyone who works in mental health, crisis support, or community services
- It works without any technical knowledge

---

## Phase 2: Week 2-3

### X/Twitter Thread
Hook tweet + 5-6 follow-ups covering: the problem, what SafeChat does, how detection works, the regulatory landscape, and the PWA link.

### Substack Article
Publish the long-form piece from `safechat-substack.md`. Cross-post to Medium and Dev.to.

### Priority 2 Emails
Send to all Priority 2 contacts in the CSV: EU AI Office, UK DSIT, IASP, Befrienders, Replika, DeepMind, Meta, Snap, xAI, researchers, standards bodies, Mozilla, NLnet (follow-up on application), OTF, Digital Rights Watch.

### Reddit Posts
Post to subreddits (one per day, different angles):
- r/opensource -- "SafeChat: source-available crisis safety protocol for AI chat systems" (only post here if the BSL-1.1 licence is stated clearly)
- r/webdev -- "Drop-in crisis detection for any web app -- one script tag"
- r/javascript -- "Built a regex-based crisis detection engine with 446 tests"
- r/artificial -- "Source-available crisis safety infrastructure for AI chatbots"
- r/ChatGPT -- "Why AI chatbots need crisis detection (and a source-available solution)"
- r/privacy -- "Crisis detection that runs locally with zero data collection"
- r/selfhosted -- "Self-hosted crisis helpline PWA -- works offline, 34 countries"
- r/SideProject -- "Built a crisis safety protocol for AI chatbots during my PhD"

### RMIT Media Pitch
Pitch to RMIT media office for university press release: "RMIT PhD researcher builds source-available crisis safety toolkit for AI chatbots -- addressing issues the FTC is investigating."

---

## Phase 3: Month 2

### Conference Submissions
- **ISEA2026 Dubai** -- already confirmed
- **linux.conf.au 2027** -- public-interest infrastructure talk
- **YOW! Conference (Melbourne)** -- developer audience
- **Australian Computer Society events** -- AI safety focus
- **Web Directions (Sydney)** -- web developer audience
- **Digital Mental Health Conference** -- clinical/tech crossover
- **FOSDEM 2027 (Brussels)** -- only if licence path or OSI-licensed components are clarified

### Academic Output
- Submit short paper to CHI Late-Breaking Work or CSCW (ACM conferences on human-computer interaction)
- Submit to Journal of Medical Internet Research (JMIR) Mental Health -- position paper on local-first crisis detection
- Present at RMIT HDR seminars

### Product Hunt Launch
- Schedule for a Tuesday
- Prepare screenshots, tagline, description
- Rally first-day upvotes from network

### Digital Public Goods Alliance Registration
- Register SafeChat as a Digital Public Good (SDG 3: Good Health and Well-being)
- URL: https://www.digitalpublicgoods.net/registry
- Free, rolling, raises profile for UN-adjacent funding

---

## Phase 4: Ongoing

### Partnerships to Pursue
- **Samaritans** -- formal review or endorsement of detection patterns
- **findahelpline.com** -- data sharing agreement, API integration
- **Lifeline Australia** -- verification partnership for AU resources
- **Crisis Text Line** -- integration case study
- **beyondblue** -- Australian mental health partnership

### Developer Adoption
- Write integration guides for: Next.js, React, Vue, Express, Django, Rails
- Create npm package with proper TypeScript types
- Submit to awesome-lists: awesome-mental-health, awesome-safety, awesome-ai
- Publish on JSDelivr, unpkg, cdnjs (already on JSDelivr via GitHub)
- Create CodePen/CodeSandbox demos

### Government/Regulatory Engagement
- Respond to any FTC or eSafety consultations on AI chatbot safety
- Submit SafeChat as evidence/example in regulatory proceedings
- Engage with Australia's AI Safety Institute now that it has launched

### Helpline Organisation Outreach
- Contact national helpline organisations in each of the 34 countries
- Ask them to verify how SafeChat presents their services
- Build ongoing verification partnerships
- This creates both accuracy and legitimacy

---

## Funding Pipeline

### Immediate (Applied)
- [x] NLnet NGI Zero Commons Fund -- EUR 35,000 (submitted June 1, 2026)

### Near-Term (Apply by end of 2026)
- [ ] Sovereign Tech Fund -- EUR 50,000+ (rolling)
- [ ] Open Technology Fund -- $10,000-$900,000 (rolling)
- [ ] Shuttleworth Foundation Fellowship -- $275,000/year (deadline Nov 1, 2026)
- [ ] CZI EOSS -- $50,000-$200,000/year (deadline Oct 18, 2026)
- [ ] Echoing Green Fellowship -- $100,000 (expected to open Sept 2026)
- [ ] Coefficient Giving / Open Philanthropy -- $200,000-$2M (rolling)

### Australian Government (2026-2027)
- [ ] MRFF Million Minds Mental Health -- check GrantConnect
- [ ] ARC Linkage Projects 2027 -- expected Jan 2027
- [ ] Australian AI Safety Institute -- contact `AISafetyResearch@industry.gov.au` for technical review and monitor for programs
- [ ] Suicide Prevention Australia Research Grants -- apply by June 23, 2026
- [ ] VicHealth Grants -- check current rounds
- [ ] National Industry PhD Program Round 8 -- expected late 2026

### Corporate Partnerships
- [ ] OpenAI AI and Mental Health Grants -- watch for 2027 cycle
- [ ] Anthropic Economic Futures Program -- $10,000-$50,000
- [ ] Google.org Impact Challenge -- requires institutional applicant

### Crowdfunding/Community
- [ ] PayPal donations (already live: paypal.me/specialrequest)
- [ ] Buy Me a Coffee (already live: buymeacoffee.com/famtec)
- [ ] GitHub Sponsors -- set up for recurring community support
- [ ] Open Collective -- transparent funding for open-source projects

### Revenue (Longer-term)
- BSL-1.1 commercial licensing for entities over $100K revenue
- Enterprise support contracts
- Custom integration consulting
- Training/workshops for health organisations

---

## New Distribution Ideas

### 1. Helpline Organisations as Distribution Partners
Contact helpline orgs directly and ask them to link to the PWA from their websites. The PWA is free, works offline, and sends people to THEIR services. They have every reason to promote it.

### 2. University Mental Health Services
Australian universities (start with RMIT, expand to Go8) have counselling services and student welfare teams. SafeChat's PWA could be shared with students directly or integrated into university apps.

### 3. App Store Wrappers
Wrap the PWA in a minimal native shell (using Capacitor or TWA) and publish to:
- Apple App Store (via Capacitor)
- Google Play Store (via TWA -- Trusted Web Activity)
This puts SafeChat in front of people searching "crisis help" or "mental health" in app stores.

### 4. QR Code Posters
Generate QR codes linking to the PWA. Distribute as printable posters to:
- University counselling centres
- GP waiting rooms
- Community health centres
- Libraries
- Youth centres

### 5. WordPress/Shopify/Squarespace Plugins
Package browser.js as a one-click plugin for popular website builders. Millions of sites could add crisis detection without any coding.

### 6. AI Framework Integrations
Build official integrations for:
- LangChain (Python) -- middleware that intercepts user messages
- Vercel AI SDK -- server-side detection before LLM call
- Hugging Face Spaces -- demo deployment
- Ollama/LM Studio -- local LLM users need this most

### 7. Education Sector
- Pitch to education departments for student-facing AI tools
- Schools using AI tutoring tools need crisis detection
- SafeChat could be mandated as part of responsible AI deployment in education

### 8. Telehealth Platforms
- Australian telehealth platforms (Coviu, Healthdirect Video Call) could integrate SafeChat for text-based interactions
- Position as compliance tooling, not clinical software

### 9. International NPM Package
- Proper npm package with semantic versioning
- TypeScript declarations
- Framework-specific wrappers (React hook, Vue composable, Svelte action)
- This is how developers actually adopt tools

### 10. White-Label for AI Companies
- Offer SafeChat as a white-label safety layer that AI companies can embed
- They get compliance, you get distribution
- BSL-1.1 commercial license covers this

---

## Key Messages (Use Everywhere)

**One-liner:** "SafeChat is a routing layer that detects distress signals and connects users to verified professional crisis resources."

**For developers:** "One script tag adds crisis detection and verified helplines across 34 countries to any web app. Runs locally, zero data collection, works offline."

**For regulators:** "SafeChat is a source-available implementation of the crisis-response protocols now being mandated for AI companion systems."

**For health professionals:** "SafeChat is a routing layer, not a diagnostic tool. It detects textual distress signals and connects users to your services. It does not assess clinical risk."

**For media:** "Australian PhD researcher builds source-available crisis safety infrastructure that regulators are now mandating for AI chatbots."

**For expert reviewers:** "SafeChat needs a governed, evidence-linked trigger database with clinical, lived-experience, legal, cultural-safety, and platform-safety review before it expands beyond the current tested patterns."

**Always include:** "SafeChat is a routing layer, not a diagnostic tool. It does not replace professional mental health services or emergency services."

**Always link:** findahelpline.com for anyone in crisis.

---

*This plan is a living document. Update as outreach progresses and new opportunities emerge.*
