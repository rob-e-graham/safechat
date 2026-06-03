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
        para([new TextRun({ text: "PhD Candidate, School of Design, RMIT University", font: "Cambria", size: 22, color: "555555" })], { center: true }),
        new Paragraph({ spacing: { before: 400 }, alignment: AlignmentType.CENTER, children: [
          new TextRun({ text: "June 2026 (v1.1.0)", font: "Cambria", size: 24, color: "777777" }),
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
        para("As AI chatbots become primary channels for intimate human conversation, the absence of crisis-response infrastructure represents a critical safety gap. SafeChat is an open-source international chat safety protocol that detects crisis signals in user input, determines the user's geographic location without device permissions, and delivers verified helpline resources across 34 countries. The system runs entirely on-device with zero data collection, addressing both the regulatory demands of emerging AI safety legislation and the ethical obligations of developers building emotionally responsive AI. This paper presents SafeChat's architecture, detection methodology, and its relationship to the broader challenge of building sovereign, privacy-respecting AI infrastructure for communities."),

        // ── 1. INTRODUCTION ──
        heading(1, "1. Introduction"),
        para("AI companion applications now facilitate some of the most emotionally vulnerable conversations people have with any system, human or machine. Products including Character.AI, Replika, and general-purpose assistants like ChatGPT routinely encounter users expressing suicidal ideation, self-harm, and acute psychological distress. The consequences of failing to respond appropriately are not theoretical: documented cases have linked AI companion interactions to self-harm and suicide attempts, prompting regulatory action across multiple jurisdictions."),
        para("In 2026, the regulatory landscape shifted decisively. New York enacted the first US law mandating crisis-response protocols for AI companions. The US Federal Trade Commission opened formal investigations into chatbot safety practices at Alphabet, Meta, OpenAI, Snap, xAI, and Character Technologies. The VERA-MH framework, the first open-source evaluation for AI mental health safety, demonstrated that major AI systems exhibit significant gaps in detecting and responding to suicidal ideation."),
        para("SafeChat responds to this landscape by providing free, open-source crisis safety infrastructure that any developer can integrate into any AI chat application. Its design principles emerge from the same research programme as ARCHAI, a sovereign AI toolkit for cultural heritage: the conviction that critical infrastructure should be locally deployable, privacy-respecting, and independent of commercial cloud services."),

        // ── 2. DESIGN PRINCIPLES ──
        heading(1, "2. Design Principles"),
        para("SafeChat's architecture reflects five core principles drawn from the author's broader research into sovereign AI systems:"),
        boldPara("2.1 Local-first processing. ", "All crisis detection runs on the user's device using regex pattern matching. No API calls are made. No user data leaves the device. This eliminates the privacy, latency, and availability risks inherent in cloud-based content moderation, and ensures the system functions offline."),
        boldPara("2.2 Zero-permission operation. ", "Geographic location is determined through a cascade of browser-native signals (locale, timezone, cached data) rather than GPS or IP geolocation. No device permissions are requested. This removes the consent friction that could delay help-seeking behaviour."),
        boldPara("2.3 False-negative minimisation. ", "The detection engine is calibrated to prioritise sensitivity over specificity. A false positive (showing crisis resources to someone not in crisis) produces minimal harm: the user sees a help modal and dismisses it. A false negative (missing a genuine crisis signal) could cost a life. The system includes explicit false-positive guards to reduce alarm fatigue without compromising recall."),
        boldPara("2.4 Verified, auto-updating data. ", "The helpline database covers 100+ verified resources across 34 countries, with phone, text, chat, email, and WhatsApp contact methods. Data is served from CDN with fallback to GitHub raw, localStorage cache, and inline emergency numbers. A verification workflow checks all resources twice monthly."),
        boldPara("2.5 Drop-in integration. ", "SafeChat can be added to any web application with a single script tag. No build step, no API key, no account creation. The system provides modal, banner, and full-page popup interfaces, an Express middleware for server-side integration, and AI prompt overrides that inject crisis-response instructions into any LLM system prompt."),

        // ── 3. DETECTION ARCHITECTURE ──
        heading(1, "3. Detection Architecture"),
        heading(2, "3.1 Input Normalisation"),
        para("User input undergoes preprocessing before pattern matching:"),
        bulletItem("Unicode normalisation (smart quotes to ASCII)"),
        bulletItem("Whitespace collapse"),
        bulletItem("Common misspelling correction (e.g., \"suicde\", \"suiside\", \"overdoze\")"),
        bulletItem("Text-speak expansion (e.g., \"kms\" to \"kill myself\", \"wanna\" to \"want to\", \"2 die\" to \"to die\")"),
        para("This layer ensures that crisis signals are not missed due to spelling errors, text-speak conventions, or unicode variation, which are common in the informal register typical of chat interactions."),

        heading(2, "3.2 Signal Classification"),
        para("Normalised input is matched against two tiers of regex patterns:"),
        boldPara("HIGH signals ", "indicate explicit suicidal language, self-harm, or crisis-level distress. These include direct statements of intent (\"kill myself\", \"end my life\"), method references (\"overdose\", \"jumping off\"), finality language (\"the end for me\", \"this will all be over soon\"), and behavioural indicators (\"writing goodbye letters\", \"gave away everything\"). HIGH signals trigger immediate crisis intervention with full helpline resources."),
        boldPara("LOW signals ", "indicate hopelessness, worthlessness, or passive distress without explicit intent. These include expressions of hopelessness (\"can't go on\", \"no point\"), worthlessness (\"I'm a burden\", \"nobody cares\"), and passive ideation (\"done with life\", \"no hope left\"). LOW signals trigger a softer safety response with helpline links embedded in the AI's normal response."),
        para("The current engine includes 45 HIGH patterns, 22 LOW patterns, and 424 automated tests covering true positives, true negatives, false-positive guards, misspellings, text-speak, adversarial inputs, and security edge cases."),

        heading(2, "3.3 False-Positive Guards"),
        para("Context-aware guards prevent triggering on figurative or idiomatic language:"),
        bulletItem("\"cut my hair\" / \"hurt my ankle\" (body-part context)"),
        bulletItem("\"suicide squeeze\" / \"suicide prevention class\" (non-crisis usage)"),
        bulletItem("\"overdosed on coffee\" (non-drug context)"),
        bulletItem("\"the game is over for me\" (entertainment context)"),
        bulletItem("\"the economy is bleeding\" (financial metaphor)"),
        para("Guards are checked before crisis classification. If a matched pattern falls within a known false-positive context, that match is skipped and detection continues."),

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

        // ── 5. RELATIONSHIP TO ARCHAI ──
        heading(1, "5. Relationship to ARCHAI and Sovereign AI Research"),
        para("SafeChat emerged from the same research programme as ARCHAI, a sovereign AI toolkit for cultural heritage institutions. Both projects share a foundational position: that critical AI infrastructure should be locally deployable, privacy-respecting, and independent of commercial cloud dependencies."),
        para("ARCHAI addresses the problem of making museum collections accessible through locally-hosted language models and vector search, ensuring that cultural heritage data remains under institutional control. SafeChat addresses the parallel problem of ensuring that AI chat systems have a duty-of-care layer that does not depend on external services, does not collect user data, and continues to function when network connectivity is unavailable."),
        para("The shared architectural pattern is what the author terms \"sovereign AI infrastructure\": systems that provide full functionality from local resources while optionally enhancing from network sources when available. In ARCHAI, this manifests as a layered architecture separating permanent heritage assets from regenerable AI processing. In SafeChat, it manifests as a four-tier resource fallback (CDN, GitHub raw, localStorage cache, inline emergency numbers) that degrades gracefully from rich helpline data to basic emergency numbers without ever failing to provide some form of help."),
        para("Both projects also share a commitment to reducing barriers to adoption. ARCHAI targets a deployment cost of $3,500–5,000 USD in one-time hardware investment. SafeChat targets zero cost, zero permissions, and a single line of code to integrate."),
        para("This work contributes to the author’s PhD research question: “How can sovereign AI infrastructure create more accessible, interpretive, and ethically grounded systems of cultural memory that enhance rather than replace curatorial expertise?” SafeChat extends the ethical dimension of this question from cultural heritage to human safety, arguing that the same principles of sovereignty, privacy, and local-first operation that protect cultural data also protect vulnerable users."),

        // ── 6. REGULATORY ALIGNMENT ──
        heading(1, "6. Regulatory Alignment"),
        para("SafeChat’s design anticipates and addresses requirements from multiple regulatory frameworks:"),
        boldPara("New York AI Companion Law (2026): ", "Mandates detection of suicidal ideation, referral to crisis services, and disclosure of AI’s non-human nature. SafeChat provides the detection and referral components as drop-in infrastructure."),
        boldPara("FTC Chatbot Safety Inquiry (2026): ", "Investigating duty-of-care standards for emotionally responsive AI across major platforms. SafeChat demonstrates that meaningful crisis detection is achievable without surveillance infrastructure or cloud dependencies."),
        boldPara("VERA-MH Framework (Spring Health, 2026): ", "The first open-source evaluation for AI mental health safety, documenting significant gaps in how major AI chatbots respond to suicidal ideation. SafeChat’s 424-test suite addresses the categories of failure identified by VERA-MH."),
        boldPara("Samaritans Safe Messaging Guidelines: ", "SafeChat follows established safe messaging principles in its resource presentation, avoiding sensationalisation, providing actionable contact information, and using warm, non-clinical language."),

        // ── 7. LIMITATIONS ──
        heading(1, "7. Limitations"),
        para("SafeChat’s regex-based approach has inherent limitations:"),
        bulletItem("Language coverage: Detection patterns currently target English-language input only. Multilingual expansion is planned but non-trivial due to the cultural and linguistic variation in crisis expression."),
        bulletItem("Indirect signals: Highly indirect or metaphorical expressions of distress may not trigger detection. The system is calibrated for explicit and semi-explicit signals rather than subtle contextual cues."),
        bulletItem("Not a clinical tool: SafeChat is a routing layer, not a diagnostic tool. It identifies signals and connects users to professional resources. It does not assess clinical risk, provide therapeutic intervention, or replace professional mental health services."),
        bulletItem("Helpline data currency: Despite twice-monthly verification, helpline numbers, URLs, and operating hours can change between verification cycles."),

        // ── 8. AVAILABILITY ──
        heading(1, "8. Availability"),
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

        // ── REFERENCES ──
        heading(1, "References"),
        new Paragraph({ numbering: { reference: "numbers", level: 0 }, spacing: { after: 100, line: 276 }, children: [new TextRun({ text: "New York State Legislature. (2026). AI Companion Safety Act.", font: "Cambria", size: 22 })] }),
        new Paragraph({ numbering: { reference: "numbers", level: 0 }, spacing: { after: 100, line: 276 }, children: [new TextRun({ text: "Federal Trade Commission. (2026). Orders to AI Companies Regarding Chatbot Safety Practices.", font: "Cambria", size: 22 })] }),
        new Paragraph({ numbering: { reference: "numbers", level: 0 }, spacing: { after: 100, line: 276 }, children: [new TextRun({ text: "Spring Health. (2026). VERA-MH: Validated Evaluation for Responsible AI in Mental Health.", font: "Cambria", size: 22 })] }),
        new Paragraph({ numbering: { reference: "numbers", level: 0 }, spacing: { after: 100, line: 276 }, children: [new TextRun({ text: "Samaritans. (2020). Media Guidelines for Reporting Suicide.", font: "Cambria", size: 22 })] }),
        new Paragraph({ numbering: { reference: "numbers", level: 0 }, spacing: { after: 100, line: 276 }, children: [new TextRun({ text: "Graham, R. (2026). Cultivating a Living Archive: Sovereign AI for Cultural Heritage. ISEA2026 Dubai.", font: "Cambria", size: 22, italics: true })] }),
        new Paragraph({ numbering: { reference: "numbers", level: 0 }, spacing: { after: 100, line: 276 }, children: [new TextRun({ text: "International Association for Suicide Prevention. (2023). IASP Guidelines for Crisis Centre and Helpline Operations.", font: "Cambria", size: 22 })] }),
      ],
    },
  ],
});

Packer.toBuffer(doc).then(buffer => {
  fs.writeFileSync("/Users/robgraham/Desktop/APPS/Global help AI/docs/SafeChat-White-Paper.docx", buffer);
  console.log("White paper saved: docs/SafeChat-White-Paper.docx (" + Math.round(buffer.length / 1024) + " KB)");
});
