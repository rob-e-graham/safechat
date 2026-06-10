# SafeChat Legal Disclaimer

Last updated: 2026-05-29

---

## 1. Nature of SafeChat

SafeChat is a **routing layer**, not a diagnostic tool. It identifies textual signals that may indicate distress and connects users to verified professional crisis resources. It does not assess clinical risk, provide therapeutic intervention, make diagnoses, or replace professional mental health services, emergency services, qualified clinicians, safeguarding teams, legal counsel, or local crisis response procedures.

SafeChat is provided **as is**, without warranty of any kind, express or implied.

---

## 2. Acceptance of Terms

By downloading, installing, copying, modifying, deploying, integrating, operating, or otherwise using SafeChat, you accept all responsibility for your own installation, configuration, compliance, testing, supervision, moderation, user communications, and use of the software.

You are solely responsible for determining whether your use of SafeChat is lawful, safe, suitable, and compliant with all applicable laws, regulations, platform rules, clinical obligations, safeguarding duties, privacy requirements, consumer protection duties, and professional standards in your jurisdiction.

If you do not accept these terms, do not download, install, deploy, integrate, operate, or use SafeChat.

---

## 3. Limitation of Liability

To the maximum extent permitted by law, Rob Graham, FAMTEC, contributors, maintainers, copyright holders, and licensors are not liable for any direct, indirect, incidental, special, consequential, exemplary, punitive, or other damages, losses, costs, charges, claims, penalties, fines, legal fees, regulatory actions, business interruption, data loss, device or system damage, personal injury, death, emotional distress, failure to obtain help, failure to detect or respond to crisis content, unlawful use, or other harm arising from or related to the installation, configuration, deployment, integration, operation, reliance on, inability to use, or use of SafeChat, even if advised of the possibility of such damages.

You may not seek to charge, recover, claim, or transfer any damages, losses, costs, penalties, fines, legal fees, regulatory exposure, or other liability against Rob Graham, FAMTEC, contributors, maintainers, copyright holders, or licensors arising from your installation, configuration, deployment, integration, operation, reliance on, inability to use, or use of SafeChat, except where such limitation is prohibited by applicable law.

---

## 4. Detection Limitations

SafeChat uses regex-based pattern matching. This approach has inherent limitations:

- **Language coverage.** Detection patterns currently target English-language input only.
- **Indirect signals.** Highly metaphorical, culturally specific, or novel expressions of distress may not be detected.
- **False negatives.** No detection system achieves 100% recall. SafeChat is calibrated to minimise false negatives (prioritising sensitivity over specificity), but gaps will exist.
- **False positives.** False-positive guards reduce but do not eliminate false alarms.
- **Not real-time clinical assessment.** SafeChat cannot evaluate tone, context, history, or clinical risk factors beyond the text patterns it matches.

SafeChat is one layer in a safety strategy, not a complete safety solution. Integrators should implement additional safeguards appropriate to their application and user population.

---

## 5. Integrator Responsibilities

If you integrate SafeChat into a product or service, you are responsible for:

- **Testing** SafeChat's detection in your specific context before production deployment.
- **Supplementing** SafeChat with additional safety measures appropriate to your application (human moderation, escalation procedures, clinical oversight where applicable).
- **Monitoring** SafeChat's performance and reporting detection gaps via GitHub Issues.
- **Updating** to the latest version to receive detection improvements and resource data updates.
- **Compliance** with all applicable laws and regulations in the jurisdictions where your product operates, including but not limited to consumer protection, mental health, AI safety, data privacy, and duty-of-care requirements.
- **User communication** about the nature and limitations of automated safety measures in your application.

---

## 6. Ongoing Development

SafeChat is under active, continuous development. The project maintains:

- A public **CHANGELOG** documenting all detection improvements, new patterns, and accuracy gains.
- A public **test suite** (currently 446 automated tests) that must pass before any release.
- A **twice-monthly verification** process for crisis resource data (phone numbers, URLs, operating hours).
- A **false-negative-first** triage policy: reports of missed crisis signals are treated as critical defects.
- A public **git history** providing a complete, timestamped record of every change to detection patterns, false-positive guards, and safety infrastructure.

This ongoing process reflects the project's commitment to continuous safety improvement. It does not constitute a warranty, guarantee of fitness, or assumption of liability.

---

## 7. Data and Privacy

SafeChat collects zero user data. All detection runs locally on the user's device. No message content is transmitted, stored, or logged by SafeChat. The ConversationTracker stores only signal categories and numerical weights in session memory, never message content, and all data is garbage-collected when the session ends.

---

## 8. Crisis Resources

Crisis resource data (phone numbers, URLs, operating hours) is verified twice monthly but may become outdated between verification cycles. SafeChat provides resource information as a convenience. Rob Graham, FAMTEC, and contributors do not operate, endorse, or guarantee the availability, quality, or suitability of any listed crisis service.

In an emergency, always contact local emergency services directly.

---

## 9. Governing Law

This disclaimer is governed by the laws of the State of Victoria, Australia, to the extent that they are applicable. Nothing in this disclaimer excludes or limits any rights that cannot be excluded or limited under applicable law, including the Australian Consumer Law.

---

## Update Log

### 2026-05-29
- Added sections: Detection Limitations, Integrator Responsibilities, Ongoing Development, Data and Privacy, Crisis Resources, Governing Law.
- Restructured into numbered sections for clarity.
- Added language establishing SafeChat as a "routing layer, not a diagnostic tool."

### 2026-05-22
- Initial legal disclaimer.
- Added to LICENSE, README.md, and app download section.
- Added affirmative acceptance checkbox gating downloads.
