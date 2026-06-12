const fs = require("fs");
const {
  Document, Packer, Paragraph, TextRun, Table, TableRow, TableCell,
  ImageRun, Header, Footer, AlignmentType, HeadingLevel, BorderStyle,
  WidthType, ShadingType, PageNumber, PageBreak, TableOfContents,
  ExternalHyperlink, LevelFormat
} = require("docx");

const logoData = fs.readFileSync("/Users/robgraham/Desktop/APPS/Global help AI/app/images/icon-512.png");

const border = { style: BorderStyle.SINGLE, size: 1, color: "BBBBBB" };
const borders = { top: border, bottom: border, left: border, right: border };
const cellMargins = { top: 80, bottom: 80, left: 120, right: 120 };

function heading(level, text) {
  const headingMap = {
    1: HeadingLevel.HEADING_1,
    2: HeadingLevel.HEADING_2,
    3: HeadingLevel.HEADING_3,
  };
  return new Paragraph({
    heading: headingMap[level],
    spacing: { before: level === 1 ? 360 : 240, after: 200 },
    children: [new TextRun({ text, bold: true, font: "Cambria", size: level === 1 ? 32 : level === 2 ? 28 : 24 })],
  });
}

function para(text, opts = {}) {
  return new Paragraph({
    spacing: { after: 200, line: 276 },
    alignment: opts.center ? AlignmentType.CENTER : AlignmentType.JUSTIFIED,
    indent: opts.indent ? { left: 360 } : undefined,
    children: Array.isArray(text) ? text : [new TextRun({ text, font: "Cambria", size: 22 })],
  });
}

function boldPara(boldText, rest) {
  return new Paragraph({
    spacing: { after: 200, line: 276 },
    alignment: AlignmentType.JUSTIFIED,
    children: [
      new TextRun({ text: boldText, bold: true, font: "Cambria", size: 22 }),
      new TextRun({ text: rest, font: "Cambria", size: 22 }),
    ],
  });
}

function bulletItem(text) {
  return new Paragraph({
    numbering: { reference: "bullets", level: 0 },
    spacing: { after: 120, line: 276 },
    children: [new TextRun({ text, font: "Cambria", size: 22 })],
  });
}

function tableHeaderCell(text, width) {
  return new TableCell({
    borders,
    width: { size: width, type: WidthType.DXA },
    shading: { fill: "2C3E50", type: ShadingType.CLEAR },
    margins: cellMargins,
    children: [new Paragraph({ children: [new TextRun({ text, bold: true, font: "Cambria", size: 20, color: "FFFFFF" })] })],
  });
}

function tableCell(text, width) {
  return new TableCell({
    borders,
    width: { size: width, type: WidthType.DXA },
    margins: cellMargins,
    children: [new Paragraph({ children: [new TextRun({ text, font: "Cambria", size: 20 })] })],
  });
}

function codeCellText(text, width) {
  return new TableCell({
    borders,
    width: { size: width, type: WidthType.DXA },
    margins: cellMargins,
    children: [new Paragraph({ children: [new TextRun({ text, font: "Consolas", size: 18, color: "7F8C8D" })] })],
  });
}

// Build the document
const doc = new Document({
  styles: {
    default: {
      document: { run: { font: "Cambria", size: 22 } },
    },
    paragraphStyles: [
      {
        id: "Heading1", name: "Heading 1", basedOn: "Normal", next: "Normal", quickFormat: true,
        run: { size: 32, bold: true, font: "Cambria", color: "1A1A2E" },
        paragraph: { spacing: { before: 360, after: 200 }, outlineLevel: 0 },
      },
      {
        id: "Heading2", name: "Heading 2", basedOn: "Normal", next: "Normal", quickFormat: true,
        run: { size: 28, bold: true, font: "Cambria", color: "2C3E50" },
        paragraph: { spacing: { before: 240, after: 180 }, outlineLevel: 1 },
      },
      {
        id: "Heading3", name: "Heading 3", basedOn: "Normal", next: "Normal", quickFormat: true,
        run: { size: 24, bold: true, font: "Cambria", color: "34495E" },
        paragraph: { spacing: { before: 200, after: 160 }, outlineLevel: 2 },
      },
    ],
  },
  numbering: {
    config: [
      {
        reference: "bullets",
        levels: [{
          level: 0, format: LevelFormat.BULLET, text: "•", alignment: AlignmentType.LEFT,
          style: { paragraph: { indent: { left: 720, hanging: 360 } } },
        }],
      },
      {
        reference: "numbers",
        levels: [{
          level: 0, format: LevelFormat.DECIMAL, text: "%1.", alignment: AlignmentType.LEFT,
          style: { paragraph: { indent: { left: 720, hanging: 360 } } },
        }],
      },
    ],
  },
  sections: [
    // ── TITLE PAGE ──
    {
      properties: {
        page: {
          size: { width: 11906, height: 16838 },
          margin: { top: 1440, right: 1440, bottom: 1440, left: 1440 },
        },
      },
      children: [
        new Paragraph({ spacing: { before: 3600 }, children: [] }),
        new Paragraph({
          alignment: AlignmentType.CENTER,
          children: [new ImageRun({
            type: "png",
            data: logoData,
            transformation: { width: 120, height: 120 },
            altText: { title: "SafeChat", description: "SafeChat logo", name: "logo" },
          })],
        }),
        new Paragraph({ spacing: { before: 600 }, alignment: AlignmentType.CENTER, children: [
          new TextRun({ text: "SafeChat", font: "Cambria", size: 56, bold: true, color: "1A1A2E" }),
        ]}),
        new Paragraph({ alignment: AlignmentType.CENTER, spacing: { after: 120 }, children: [
          new TextRun({ text: "An Open-Source Crisis Safety Protocol", font: "Cambria", size: 32, color: "2C3E50" }),
        ]}),
        new Paragraph({ alignment: AlignmentType.CENTER, spacing: { after: 600 }, children: [
          new TextRun({ text: "for AI Chat Systems", font: "Cambria", size: 32, color: "2C3E50" }),
        ]}),
        new Paragraph({ spacing: { before: 200 }, children: [] }),
        new Paragraph({
          alignment: AlignmentType.CENTER,
          spacing: { after: 80 },
          children: [new TextRun({ text: "Rob Graham", font: "Cambria", size: 28, bold: true })],
        }),
        para([new TextRun({ text: "FAMTEC (Fine Art Media Technology)", font: "Cambria", size: 22, color: "555555" })], { center: true }),
        para([new TextRun({ text: "PhD Researcher, School of Design, RMIT University", font: "Cambria", size: 22, color: "555555" })], { center: true }),
        new Paragraph({ spacing: { before: 400 }, alignment: AlignmentType.CENTER, children: [
          new TextRun({ text: "June 2026 (v1.3.0)", font: "Cambria", size: 24, color: "777777" }),
        ]}),
      ],
    },

    // ── TABLE OF CONTENTS ──
    {
      properties: {
        page: {
          size: { width: 11906, height: 16838 },
          margin: { top: 1440, right: 1440, bottom: 1440, left: 1440 },
        },
      },
      headers: {
        default: new Header({
          children: [new Paragraph({
            alignment: AlignmentType.RIGHT,
            children: [new TextRun({ text: "SafeChat White Paper", font: "Cambria", size: 18, color: "999999", italics: true })],
          })],
        }),
      },
      footers: {
        default: new Footer({
          children: [new Paragraph({
            alignment: AlignmentType.CENTER,
            children: [new TextRun({ text: "Page ", font: "Cambria", size: 18, color: "999999" }), new TextRun({ children: [PageNumber.CURRENT], font: "Cambria", size: 18, color: "999999" })],
          })],
        }),
      },
      children: [
        new Paragraph({
          heading: HeadingLevel.HEADING_1,
          children: [new TextRun({ text: "Contents", font: "Cambria", size: 32, bold: true, color: "1A1A2E" })],
        }),
        new TableOfContents("Table of Contents", { hyperlink: true, headingStyleRange: "1-3" }),
        new Paragraph({ children: [new PageBreak()] }),

        // ── ABSTRACT ──
        heading(1, "Abstract"),
        para("As AI chatbots become primary channels for intimate human conversation, the absence of crisis-response infrastructure represents a critical safety gap. SafeChat is a source-available international chat safety protocol that detects crisis signals in user input, determines the user's geographic location without device permissions, and delivers verified helpline resources across 34 countries. The system runs entirely on-device with zero data collection, addressing both the regulatory demands of emerging AI safety legislation and the ethical obligations of developers building emotionally responsive AI. This paper presents SafeChat's architecture, detection methodology, and its relationship to the broader challenge of building sovereign, privacy-respecting AI infrastructure for communities."),

        // ── 1. INTRODUCTION ──
        heading(1, "1. Introduction"),
        para("AI companion applications now facilitate some of the most emotionally vulnerable conversations people have with any system, human or machine. Products including Character.AI, Replika, and general-purpose assistants like ChatGPT routinely encounter users expressing suicidal ideation, self-harm, and acute psychological distress. The consequences of failing to respond appropriately are not theoretical: documented cases have linked AI companion interactions to self-harm and suicide attempts, prompting regulatory action across multiple jurisdictions."),
        para("In 2026, the regulatory landscape shifted decisively. New York enacted the first US law mandating crisis-response protocols for AI companions. The US Federal Trade Commission opened formal investigations into chatbot safety practices at Alphabet, Meta, OpenAI, Snap, xAI, and Character Technologies. The VERA-MH framework, the first open-source evaluation for AI mental health safety, demonstrated that major AI systems exhibit significant gaps in detecting and responding to suicidal ideation."),
        para("SafeChat responds to this landscape by providing free, source-available crisis safety infrastructure that any developer can integrate into any AI chat application. Its design principles emerge from the same research programme as ARCHAI, a sovereign AI toolkit for cultural heritage: the conviction that critical infrastructure should be locally deployable, privacy-respecting, and independent of commercial cloud services."),

        // ── 2. DESIGN PRINCIPLES ──
        heading(1, "2. Design Principles"),
        para("SafeChat's architecture reflects five core principles drawn from the author's broader research into sovereign AI systems:"),
        boldPara("2.1 Local-first processing. ", "All crisis detection runs on the user's device using regex pattern matching. No API calls are made. No user data leaves the device. This eliminates the privacy, latency, and availability risks inherent in cloud-based content moderation, and ensures the system functions offline."),
        boldPara("2.2 Zero-permission operation. ", "Geographic location is determined through a cascade of browser-native signals (locale, timezone, cached data) rather than GPS or IP geolocation. No device permissions are requested. This removes the consent friction that could delay help-seeking behaviour."),
        boldPara("2.3 False-negative minimisation. ", "The detection engine is calibrated to prioritise sensitivity over specificity. A false positive (showing crisis resources to someone not in crisis) produces minimal harm: the user sees a help modal and dismisses it. A false negative (missing a genuine crisis signal) could cost a life. The system includes explicit false-positive guards to reduce alarm fatigue without compromising recall."),
        boldPara("2.4 Verified, auto-updating data. ", "The helpline database currently covers 67 resource records across 34 countries, providing 94 phone, text, chat, email, WhatsApp, and web contact methods. Data is served from CDN with fallback to GitHub raw, localStorage cache, and inline emergency numbers. A verification workflow checks all resources twice monthly."),
        boldPara("2.5 Drop-in integration. ", "SafeChat can be added to any web application with a single script tag. No build step, no API key, no account creation. The system provides modal, banner, and full-page popup interfaces, an Express middleware for server-side integration, and AI prompt overrides that inject crisis-response instructions into any LLM system prompt."),

        // ── 3. DETECTION ARCHITECTURE ──
        heading(1, "3. Detection Architecture"),
        heading(2, "3.1 Input Normalisation"),
        para("User input undergoes preprocessing before pattern matching:"),
        bulletItem("Unicode normalisation (smart quotes to ASCII)"),
        bulletItem("Whitespace collapse"),
        bulletItem("Common misspelling correction (e.g., \"suicde\", \"suiside\", \"overdoze\")"),
        bulletItem("Text-speak expansion (e.g., \"kms\" to \"kill myself\", \"wanna\" to \"want to\", \"2 die\" to \"to die\")"),
        bulletItem("Negation normalisation: expanded negations are contracted before pattern matching (e.g., \"do not\" to \"don't\", \"cannot\" to \"can't\", \"will not\" to \"won't\"). This ensures that formal or expanded phrasing is detected by the same patterns that catch contracted forms. Fourteen negation rules are applied."),
        bulletItem("Contraction consistency: patterns accept both contracted and expanded forms (e.g., \"there's no coming back\" and \"there is no coming back\" both match; \"I'm tired of living\" and \"I am tired of living\" both match)."),
        para("This layer ensures that crisis signals are not missed due to spelling errors, text-speak conventions, formal phrasing, or unicode variation, which are common in the varied registers of chat interactions."),

        heading(2, "3.2 Signal Classification"),
        para("Normalised input is matched against two tiers of regex patterns:"),
        boldPara("HIGH signals ", "indicate explicit suicidal language, self-harm, or crisis-level distress. These include direct statements of intent (\"kill myself\", \"end my life\"), method references (\"overdose\", \"jumping off\"), finality language (\"the end for me\", \"this will all be over soon\"), and behavioural indicators (\"writing goodbye letters\", \"gave away everything\"). HIGH signals trigger immediate crisis intervention with full helpline resources."),
        boldPara("LOW signals ", "indicate hopelessness, worthlessness, or passive distress without explicit intent. These include expressions of hopelessness (\"can't go on\", \"no point\"), worthlessness (\"I'm a burden\", \"nobody cares\"), and passive ideation (\"done with life\", \"no hope left\"). LOW signals trigger a softer safety response with helpline links embedded in the AI's normal response."),
        para("The current engine (v1.3.0) includes 48 HIGH patterns, 43 LOW patterns, 35 SUBTLE patterns (see Section 3.4), and 601 automated tests covering true positives, true negatives, false-positive guards, misspellings, text-speak, negation variants, contraction consistency, adversarial inputs, session accumulation, ReDoS protection, type coercion, HTML injection, and security edge cases."),

        heading(2, "3.3 False-Positive Guards"),
        para("Context-aware guards prevent triggering on figurative or idiomatic language:"),
        bulletItem("\"cut my hair\" / \"hurt my ankle\" (body-part context)"),
        bulletItem("\"suicide squeeze\" / \"suicide prevention class\" (non-crisis usage)"),
        bulletItem("\"overdosed on coffee\" (non-drug context)"),
        bulletItem("\"the game is over for me\" (entertainment context)"),
        bulletItem("\"the economy is bleeding\" (financial metaphor)"),
        bulletItem("\"magic trick disappear\" / \"numb fingers\" / \"tired of cooking\" (non-crisis context)"),
        bulletItem("\"giving away promotions\" / \"deleting old files\" (non-farewell context)"),
        para("Guards are checked before crisis classification. If a matched pattern falls within a known false-positive context, that match is skipped and detection continues."),

        // ── 3.4 SUBTLE SIGNAL ACCUMULATION ──
        heading(2, "3.4 Subtle Signal Accumulation"),
        para("Many people in crisis do not use explicit language. Instead, they exhibit clusters of individually unremarkable behaviours that together indicate accumulating distress: social withdrawal, sleep disruption, loss of interest, farewell-like language, self-worth erosion, loss of future orientation, escalating substance use, reckless behaviour, and persistent expressions of pain."),
        para("SafeChat addresses this through a ConversationTracker that monitors signals across a conversation session. Thirty-five SUBTLE patterns are organised into nine categories, each weighted by clinical significance (1–3 points). When accumulated weight crosses a threshold (4 points for LOW escalation, 8 points for HIGH), the system escalates its response as if an explicit signal had been detected."),
        para("Critically, the tracker stores no message content. Only signal categories and numerical weights are retained in memory, and all data is garbage-collected when the session ends. This preserves the zero-data-collection principle while enabling multi-message risk assessment."),
        new Table({
          width: { size: 9026, type: WidthType.DXA },
          columnWidths: [1800, 4426, 1400, 1400],
          rows: [
            new TableRow({ children: [
              tableHeaderCell("Category", 1800),
              tableHeaderCell("Example Signals", 4426),
              tableHeaderCell("Weight", 1400),
              tableHeaderCell("Threshold", 1400),
            ]}),
            new TableRow({ children: [tableCell("Withdrawal", 1800), tableCell("\"pushing everyone away\", \"haven't left my room in days\"", 4426), tableCell("1–2", 1400), tableCell("", 1400)] }),
            new TableRow({ children: [tableCell("Sleep", 1800), tableCell("\"can't sleep again\", \"awake all night\"", 4426), tableCell("1", 1400), tableCell("", 1400)] }),
            new TableRow({ children: [tableCell("Anhedonia", 1800), tableCell("\"nothing is fun anymore\", \"stopped caring\"", 4426), tableCell("1–2", 1400), tableCell("", 1400)] }),
            new TableRow({ children: [tableCell("Farewell", 1800), tableCell("\"giving away my things\", \"writing letters to everyone\"", 4426), tableCell("2–3", 1400), tableCell("", 1400)] }),
            new TableRow({ children: [tableCell("Self-worth", 1800), tableCell("\"I'm just a waste\", \"hate who I've become\"", 4426), tableCell("1–2", 1400), tableCell("", 1400)] }),
            new TableRow({ children: [tableCell("Future loss", 1800), tableCell("\"can't imagine a future\", \"none of this will matter\"", 4426), tableCell("1–2", 1400), tableCell("", 1400)] }),
            new TableRow({ children: [tableCell("Substance", 1800), tableCell("\"drinking every night\", \"using every day\"", 4426), tableCell("1", 1400), tableCell("", 1400)] }),
            new TableRow({ children: [tableCell("Reckless", 1800), tableCell("\"don't care about my safety\", \"driving drunk\"", 4426), tableCell("2", 1400), tableCell("", 1400)] }),
            new TableRow({ children: [tableCell("Pain", 1800), tableCell("\"the pain never stops\", \"every day gets worse\"", 4426), tableCell("1–2", 1400), tableCell("", 1400)] }),
          ],
        }),
        para(""),
        para("This approach reflects clinical literature on suicide risk assessment, where the accumulation of warning signs across multiple domains is a stronger predictor than any single statement."),

        // ── 4. GEO-DETECTION CASCADE ──
        heading(1, "4. Geo-Detection Cascade"),
        para("SafeChat determines the user's country without location permissions through a priority cascade:"),
        new Table({
          width: { size: 9026, type: WidthType.DXA },
          columnWidths: [1200, 2800, 5026],
          rows: [
            new TableRow({ children: [
              tableHeaderCell("Priority", 1200),
              tableHeaderCell("Method", 2800),
              tableHeaderCell("Source", 5026),
            ]}),
            new TableRow({ children: [tableCell("1", 1200), tableCell("Browser locale", 2800), codeCellText("navigator.languages", 5026)] }),
            new TableRow({ children: [tableCell("2", 1200), tableCell("Timezone mapping", 2800), codeCellText("Intl.DateTimeFormat", 5026)] }),
            new TableRow({ children: [tableCell("3", 1200), tableCell("CDN headers", 2800), codeCellText("CF-IPCountry, X-Vercel-IP-Country", 5026)] }),
            new TableRow({ children: [tableCell("4", 1200), tableCell("Accept-Language header", 2800), tableCell("Server-side", 5026)] }),
            new TableRow({ children: [tableCell("5", 1200), tableCell("Cached country", 2800), codeCellText("localStorage", 5026)] }),
            new TableRow({ children: [tableCell("6", 1200), tableCell("Global fallback", 2800), tableCell("findahelpline.com", 5026)] }),
          ],
        }),
        para(""),
        para("The timezone mapping covers 50+ timezone-to-country entries including regional variants (e.g., six US timezones, six Canadian timezones, all Australian state zones). This approach sacrifices precision in edge cases (e.g., a user in a timezone shared by multiple countries) for the significant gain of requiring zero permissions and functioning offline."),

        // ── 5. CONFIGURABLE SHIELD CLASS ──
        heading(1, "5. Configurable Shield Class"),
        para("Different AI deployment contexts require different safety responses. A companion chatbot should interrupt conversation and show crisis resources immediately. A research platform might flag and log signals for later review. A museum exhibit might use a softer approach. SafeChat addresses this through the Shield class, a configurable safety layer that wraps the detection engine."),

        heading(2, "5.1 Response Modes"),
        para("The Shield supports six response modes, configurable independently for HIGH and LOW signal levels:"),
        new Table({
          width: { size: 9026, type: WidthType.DXA },
          columnWidths: [2000, 7026],
          rows: [
            new TableRow({ children: [
              tableHeaderCell("Mode", 2000),
              tableHeaderCell("Behaviour", 7026),
            ]}),
            new TableRow({ children: [tableCell("interrupt", 2000), tableCell("Stop normal flow, return crisis resources immediately", 7026)] }),
            new TableRow({ children: [tableCell("inject", 2000), tableCell("Prepend crisis context to the AI system prompt", 7026)] }),
            new TableRow({ children: [tableCell("flag", 2000), tableCell("Mark the message with signal metadata for downstream handling", 7026)] }),
            new TableRow({ children: [tableCell("log", 2000), tableCell("Record the detection event without altering the response", 7026)] }),
            new TableRow({ children: [tableCell("callback", 2000), tableCell("Execute a developer-defined function (e.g., alert a human moderator)", 7026)] }),
            new TableRow({ children: [tableCell("none", 2000), tableCell("No action for this signal level", 7026)] }),
          ],
        }),
        para(""),

        heading(2, "5.2 Deployment Presets"),
        para("Six presets provide sensible defaults for common deployment contexts:"),
        new Table({
          width: { size: 9026, type: WidthType.DXA },
          columnWidths: [1800, 1800, 1800, 3626],
          rows: [
            new TableRow({ children: [
              tableHeaderCell("Preset", 1800),
              tableHeaderCell("HIGH Mode", 1800),
              tableHeaderCell("LOW Mode", 1800),
              tableHeaderCell("Use Case", 3626),
            ]}),
            new TableRow({ children: [tableCell("companion", 1800), tableCell("interrupt", 1800), tableCell("inject", 1800), tableCell("AI companion apps (Character.AI, Replika-style)", 3626)] }),
            new TableRow({ children: [tableCell("chatbot", 1800), tableCell("inject", 1800), tableCell("flag", 1800), tableCell("General chatbots (customer service, assistants)", 3626)] }),
            new TableRow({ children: [tableCell("moderation", 1800), tableCell("flag", 1800), tableCell("log", 1800), tableCell("Content moderation pipelines", 3626)] }),
            new TableRow({ children: [tableCell("strict", 1800), tableCell("interrupt", 1800), tableCell("interrupt", 1800), tableCell("High-risk contexts (youth, clinical adjacency)", 3626)] }),
            new TableRow({ children: [tableCell("shadow", 1800), tableCell("log", 1800), tableCell("log", 1800), tableCell("Research and monitoring", 3626)] }),
            new TableRow({ children: [tableCell("museum", 1800), tableCell("inject", 1800), tableCell("none", 1800), tableCell("Cultural heritage exhibits (ARCHAI integration)", 3626)] }),
          ],
        }),
        para(""),
        para("The Shield also provides resetSession() for clearing accumulated subtle signals, sessionSummary() for reviewing session-level risk data, configure() for runtime updates, and Express middleware for server-side integration."),
        para("Callbacks support error resilience: if a callback throws, the Shield continues processing rather than failing silently or crashing the host application."),

        // ── 6. RELATIONSHIP TO ARCHAI ──
        heading(1, "6. Relationship to ARCHAI, Sovereign AI, and the CARE Principles"),
        para("SafeChat emerged from the same research programme as ARCHAI, a sovereign AI toolkit for cultural heritage institutions. Both projects share a foundational position: that critical AI infrastructure should be locally deployable, privacy-respecting, and independent of commercial cloud dependencies."),
        para("ARCHAI addresses the problem of making museum collections accessible through locally-hosted language models and vector search, ensuring that cultural heritage data remains under institutional control. SafeChat addresses the parallel problem of ensuring that AI chat systems have a duty-of-care layer that does not depend on external services, does not collect user data, and continues to function when network connectivity is unavailable."),
        para("The shared architectural pattern is what the author terms \"sovereign AI infrastructure\": systems that provide full functionality from local resources while optionally enhancing from network sources when available. In ARCHAI, this manifests as a layered architecture separating permanent heritage assets from regenerable AI processing. In SafeChat, it manifests as a four-tier resource fallback (CDN, GitHub raw, localStorage cache, inline emergency numbers) that degrades gracefully from rich helpline data to basic emergency numbers without ever failing to provide some form of help."),
        heading(2, "6.1 The CARE Principles and Indigenous Data Sovereignty"),
        para("The sovereign architecture shared by ARCHAI and SafeChat is not merely a technical preference but an ethical obligation, particularly when collections hold indigenous cultural material. The CARE Principles for Indigenous Data Governance (Carroll et al., 2020), developed by the Global Indigenous Data Alliance, establish that data ecosystems involving indigenous peoples must uphold four commitments:"),
        bulletItem("Collective Benefit. Data ecosystems should enable indigenous peoples to derive benefit and facilitate indigenous-led development and self-determination."),
        bulletItem("Authority to Control. Indigenous peoples have rights to govern data about them, their territories, cultures, and resources, including control over collection, access, and use."),
        bulletItem("Responsibility. Those working with indigenous data must nurture respectful relationships and share how data is used, supporting indigenous self-determination and governance."),
        bulletItem("Ethics. Indigenous peoples' rights and wellbeing should be the primary concern at all stages of the data lifecycle, minimising harm and maximising benefit as defined by the communities themselves."),
        para("Cloud-based AI services violate CARE by design. Sending indigenous collection data to commercial APIs means communities lose authority over how their cultural knowledge is processed, stored, and potentially used for model training. ARCHAI's on-premises architecture directly addresses this: cultural data never leaves the institution, the community retains authority, and processing remains under institutional and community governance."),
        para("CARE complements the FAIR principles (Findable, Accessible, Interoperable, Reusable) that dominate technical data governance. Together, CARE + FAIR represents current best practice in the GLAM (Galleries, Libraries, Archives, Museums) and digital humanities sector. SafeChat's architecture contributes to this synthesis by demonstrating that safety-critical systems can be both technically open (FAIR) and ethically sovereign (CARE)."),

        heading(2, "6.2 Shared Commitments"),
        para("Both projects share a commitment to reducing barriers to adoption. ARCHAI targets a deployment cost of $3,500–5,000 USD in one-time hardware investment. SafeChat targets zero cost, zero permissions, and a single line of code to integrate."),
        para("This work contributes to the author's PhD research question: \"How can sovereign AI infrastructure create more accessible, interpretive, and ethically grounded systems of cultural memory that enhance rather than replace curatorial expertise?\" SafeChat extends the ethical dimension of this question from cultural heritage to human safety, arguing that the same principles of sovereignty, privacy, and local-first operation that protect cultural data also protect vulnerable users. The CARE Principles provide the ethical framework that unifies both projects: sovereign infrastructure is not just better engineering, it is a precondition for respectful engagement with communities and their data."),

        // ── 7. REGULATORY ALIGNMENT ──
        heading(1, "7. Regulatory Alignment"),
        para("SafeChat's design anticipates and addresses requirements from multiple regulatory frameworks:"),
        boldPara("New York AI Companion Law (2026): ", "Mandates detection of suicidal ideation, referral to crisis services, and disclosure of AI's non-human nature. SafeChat provides the detection and referral components as drop-in infrastructure."),
        boldPara("FTC Chatbot Safety Inquiry (2026): ", "Investigating duty-of-care standards for emotionally responsive AI across major platforms. SafeChat demonstrates that meaningful crisis detection is achievable without surveillance infrastructure or cloud dependencies."),
        boldPara("VERA-MH Framework (Spring Health, 2026): ", "The first open-source evaluation for AI mental health safety, documenting significant gaps in how major AI chatbots respond to suicidal ideation. SafeChat's 601-test suite addresses the categories of failure identified by VERA-MH."),
        boldPara("EU AI Act (2024–2026): ", "Establishes risk-based requirements for AI systems, with high-risk systems requiring safety measures and human oversight. SafeChat provides vendor-independent, source-available safety infrastructure that supports compliance without creating cloud dependencies."),
        boldPara("Samaritans Safe Messaging Guidelines: ", "SafeChat follows established safe messaging principles in its resource presentation, avoiding sensationalisation, providing actionable contact information, and using warm, non-clinical language."),

        // ── 8. LIMITATIONS ──
        heading(1, "8. Limitations"),
        para("SafeChat's regex-based approach has inherent limitations:"),
        bulletItem("Language coverage: Detection patterns currently target English-language input only. Multilingual expansion is planned but non-trivial due to the cultural and linguistic variation in crisis expression."),
        bulletItem("Indirect signals: While the subtle signal accumulation system (Section 3.4) addresses multi-message distress patterns, highly metaphorical or culturally specific expressions of distress may still evade detection. The cross-classifier module (Section 9) addresses this by running local ML models alongside the regex engine."),
        bulletItem("Not a clinical tool: SafeChat is a routing layer, not a diagnostic tool. It identifies signals and connects users to professional resources. It does not assess clinical risk, provide therapeutic intervention, or replace professional mental health services."),
        bulletItem("Helpline data currency: Despite twice-monthly verification, helpline numbers, URLs, and operating hours can change between verification cycles."),

        // ── 9. CROSS-CLASSIFIER MODULE ──
        heading(1, "9. Cross-Classifier Module"),
        para("SafeChat v1.2 introduces an optional cross-classifier layer that runs local machine learning models alongside the deterministic regex engine. This approach was suggested by Professor Stevie Chancellor (University of Minnesota), building on published work in mental health NLP."),
        boldPara("Architecture. ", "The regex layer remains the fast, deterministic, always-on first pass. The cross-classifier provides a second opinion using clinically trained models:"),
        bulletItem("MindGuard (Sword Health): Lightweight safety classifiers (4B/8B parameters) trained on clinically annotated conversations. Three categories: safe, self-harm risk, harm-to-others risk. AUROC up to 0.982."),
        bulletItem("MentalLLaMA: Open-source instruction-following LLMs (7B/13B parameters) for interpretable mental health analysis across eight tasks including depression, stress, and suicidal ideation detection."),
        bulletItem("MentalChat16K: Benchmark dataset combining synthetic counselling conversations and real-world clinical transcripts for model evaluation."),
        boldPara("Merge rules. ", "The cross-classifier never downgrades a regex detection. If the regex engine flags HIGH and the classifier says safe, the result stays HIGH. This preserves the false-negative-first calibration philosophy. The classifier can escalate: if regex detects nothing but the model identifies risk, the result escalates to LOW."),
        boldPara("Privacy. ", "All inference runs locally on the user's device or a developer-controlled endpoint. No message content is transmitted to external services. The module supports Ollama, Transformers.js, LM Studio, or custom classification functions."),
        boldPara("Optional. ", "The cross-classifier adds zero dependencies to the core library. SafeChat works identically without it. Developers opt in by configuring a backend and passing it to Shield."),

        heading(2, "9.1 Semantic Layer and Tiered Architecture (v1.3)"),
        para("SafeChat v1.3 adds a semantic layer: an embedding-similarity tier that sits between the regex engine and the LLM cross-classifier. A curated set of exemplar phrases — indirect, metaphorical expressions of distress drawn from clinical warning-sign literature — is embedded once on-device. Each incoming message is embedded and compared to the exemplar set by cosine similarity; a strong match escalates the result under the same merge contract as the cross-classifier (confirm or escalate, never downgrade)."),
        para("The semantic layer requires only a small sentence-embedding model (approximately 25 MB, e.g. all-MiniLM-L6-v2 via Transformers.js), making it the first ML tier in SafeChat that runs in any modern browser, including installed progressive web apps on phones, fully offline after first load. Exemplar sets are plain, auditable text and can be replaced wholesale, enabling community-authored, culturally specific pattern sets governed under the CARE Principles (Section 6.1)."),
        para("This completes a progressive enhancement architecture for safety:"),
        new Table({
          width: { size: 9026, type: WidthType.DXA },
          columnWidths: [800, 3826, 1800, 2600],
          rows: [
            new TableRow({ children: [
              tableHeaderCell("Tier", 800),
              tableHeaderCell("Layer", 3826),
              tableHeaderCell("Footprint", 1800),
              tableHeaderCell("Runs on", 2600),
            ]}),
            new TableRow({ children: [tableCell("0", 800), tableCell("Regex engine + ConversationTracker", 3826), tableCell("KBs", 1800), tableCell("Everything, always, offline", 2600)] }),
            new TableRow({ children: [tableCell("1", 800), tableCell("Semantic layer (embedding similarity)", 3826), tableCell("~25 MB", 1800), tableCell("Any modern browser, PWA", 2600)] }),
            new TableRow({ children: [tableCell("2", 800), tableCell("Distilled crisis classifier (planned)", 3826), tableCell("~50 MB", 1800), tableCell("Browser/phone, offline", 2600)] }),
            new TableRow({ children: [tableCell("3", 800), tableCell("LLM cross-classifier", 3826), tableCell("GBs", 1800), tableCell("Server/desktop, opt-in", 2600)] }),
          ],
        }),
        para(""),
        para("Every tier is sovereign, every tier above 0 is optional, and the merge rules guarantee that adding a tier can only reduce false negatives, never introduce them: the failure mode of any ML tier is \"no worse than the tier below.\""),

        // ── 10. ONGOING DEVELOPMENT ──
        heading(1, "10. Ongoing Development"),
        para("SafeChat is under continuous, active development. The project maintains:"),
        bulletItem("A public CHANGELOG documenting all detection improvements, new patterns, and accuracy gains."),
        bulletItem("A test suite (currently 601 automated tests) that must pass before any release."),
        bulletItem("A twice-monthly verification process for crisis resource data (phone numbers, URLs, operating hours)."),
        bulletItem("A false-negative-first triage policy: reports of missed crisis signals are treated as critical defects."),
        bulletItem("A public git history providing a complete, timestamped record of every change to detection patterns, false-positive guards, and safety infrastructure."),
        bulletItem("Expert guidance and literature review are being incorporated for cross-classifier approaches and evaluation design, including feedback from Professor Stevie Chancellor and public work such as VERA-MH, MindGuard, MentalLLaMA, and MentalChat16K."),
        para("This ongoing process reflects the project's commitment to continuous safety improvement. It does not constitute a warranty, guarantee of fitness, or assumption of liability."),

        // ── 11. AVAILABILITY ──
        heading(1, "11. Availability"),
        para("SafeChat is released under the Business Source License 1.1, free for personal, educational, research, nonprofit, community, and small commercial use. The helpline database is released under CC0 public domain dedication. The change license (MPL 2.0) takes effect on 2029-01-01."),
        new Paragraph({
          spacing: { after: 80, line: 276 },
          children: [
            new TextRun({ text: "Live site: ", bold: true, font: "Cambria", size: 22 }),
            new ExternalHyperlink({ children: [new TextRun({ text: "rob-e-graham.github.io/safechat", font: "Cambria", size: 22, style: "Hyperlink" })], link: "https://rob-e-graham.github.io/safechat" }),
          ],
        }),
        new Paragraph({
          spacing: { after: 80, line: 276 },
          children: [
            new TextRun({ text: "Get help now (PWA): ", bold: true, font: "Cambria", size: 22 }),
            new ExternalHyperlink({ children: [new TextRun({ text: "rob-e-graham.github.io/safechat/app/popup.html", font: "Cambria", size: 22, style: "Hyperlink" })], link: "https://rob-e-graham.github.io/safechat/app/popup.html" }),
          ],
        }),
        new Paragraph({
          spacing: { after: 80, line: 276 },
          children: [
            new TextRun({ text: "Source code: ", bold: true, font: "Cambria", size: 22 }),
            new ExternalHyperlink({ children: [new TextRun({ text: "github.com/rob-e-graham/safechat", font: "Cambria", size: 22, style: "Hyperlink" })], link: "https://github.com/rob-e-graham/safechat" }),
          ],
        }),
        new Paragraph({
          spacing: { after: 200, line: 276 },
          children: [
            new TextRun({ text: "Contact: ", bold: true, font: "Cambria", size: 22 }),
            new ExternalHyperlink({ children: [new TextRun({ text: "rob@fineartmedia.tech", font: "Cambria", size: 22, style: "Hyperlink" })], link: "mailto:rob@fineartmedia.tech" }),
          ],
        }),

        // ── 12. DISCLAIMER ──
        heading(1, "12. Disclaimer"),
        para("SafeChat is a routing layer, not a diagnostic tool. It identifies textual signals that may indicate distress and connects users to verified professional crisis resources. It does not assess clinical risk, provide therapeutic intervention, make diagnoses, or replace professional mental health services, emergency services, qualified clinicians, safeguarding teams, or local crisis response procedures."),
        para("SafeChat is provided as is, without warranty of any kind, express or implied. To the maximum extent permitted by law, Rob Graham, FAMTEC, contributors, maintainers, copyright holders, and licensors are not liable for any damages, losses, or harm arising from the use or inability to use SafeChat."),
        para([
          new TextRun({ text: "If you or someone you know is in crisis, contact your local emergency services or visit ", font: "Cambria", size: 22 }),
          new ExternalHyperlink({ children: [new TextRun({ text: "findahelpline.com", font: "Cambria", size: 22, style: "Hyperlink" })], link: "https://findahelpline.com" }),
          new TextRun({ text: ".", font: "Cambria", size: 22 }),
        ]),

        // ── REFERENCES ──
        heading(1, "References"),
        new Paragraph({ numbering: { reference: "numbers", level: 0 }, spacing: { after: 100, line: 276 }, children: [new TextRun({ text: "New York State Legislature. (2026). AI Companion Safety Act.", font: "Cambria", size: 22 })] }),
        new Paragraph({ numbering: { reference: "numbers", level: 0 }, spacing: { after: 100, line: 276 }, children: [new TextRun({ text: "Federal Trade Commission. (2026). Orders to AI Companies Regarding Chatbot Safety Practices.", font: "Cambria", size: 22 })] }),
        new Paragraph({ numbering: { reference: "numbers", level: 0 }, spacing: { after: 100, line: 276 }, children: [new TextRun({ text: "Spring Health. (2026). VERA-MH: Validated Evaluation for Responsible AI in Mental Health.", font: "Cambria", size: 22 })] }),
        new Paragraph({ numbering: { reference: "numbers", level: 0 }, spacing: { after: 100, line: 276 }, children: [new TextRun({ text: "Samaritans. (2020). Media Guidelines for Reporting Suicide.", font: "Cambria", size: 22 })] }),
        new Paragraph({ numbering: { reference: "numbers", level: 0 }, spacing: { after: 100, line: 276 }, children: [new TextRun({ text: "Graham, R. (2026). Cultivating a Living Archive: Sovereign AI for Cultural Heritage. ISEA2026 Dubai.", font: "Cambria", size: 22, italics: true })] }),
        new Paragraph({ numbering: { reference: "numbers", level: 0 }, spacing: { after: 100, line: 276 }, children: [new TextRun({ text: "International Association for Suicide Prevention. (2023). IASP Guidelines for Crisis Centre and Helpline Operations.", font: "Cambria", size: 22 })] }),
        new Paragraph({ numbering: { reference: "numbers", level: 0 }, spacing: { after: 100, line: 276 }, children: [new TextRun({ text: "Carroll, S.R. et al. (2020). The CARE Principles for Indigenous Data Governance. Data Science Journal, 19(1), 43.", font: "Cambria", size: 22, italics: true })] }),
        new Paragraph({ numbering: { reference: "numbers", level: 0 }, spacing: { after: 100, line: 276 }, children: [new TextRun({ text: "Wilkinson, M.D. et al. (2016). The FAIR Guiding Principles for scientific data management and stewardship. Scientific Data, 3, 160018.", font: "Cambria", size: 22, italics: true })] }),
        new Paragraph({ numbering: { reference: "numbers", level: 0 }, spacing: { after: 100, line: 276 }, children: [new TextRun({ text: "Sword Health. (2026). MindGuard: Guardrail Classifiers for Multi-Turn Mental Health Support. arXiv:2602.00950.", font: "Cambria", size: 22, italics: true })] }),
        new Paragraph({ numbering: { reference: "numbers", level: 0 }, spacing: { after: 100, line: 276 }, children: [new TextRun({ text: "Yang, K. et al. (2024). MentalLLaMA: Interpretable Mental Health Analysis on Social Media with Large Language Models. arXiv:2309.13567.", font: "Cambria", size: 22, italics: true })] }),
        new Paragraph({ numbering: { reference: "numbers", level: 0 }, spacing: { after: 100, line: 276 }, children: [new TextRun({ text: "Xu, J. et al. (2025). MentalChat16K: A Benchmark Dataset for Conversational Mental Health Assistance. Proceedings of the 31st ACM SIGKDD Conference.", font: "Cambria", size: 22, italics: true })] }),
      ],
    },
  ],
});

Packer.toBuffer(doc).then(buffer => {
  fs.writeFileSync("/Users/robgraham/Desktop/APPS/Global help AI/docs/SafeChat-White-Paper.docx", buffer);
  console.log("White paper saved: docs/SafeChat-White-Paper.docx (" + Math.round(buffer.length / 1024) + " KB)");
});
