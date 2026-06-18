/**
 * Safechat — Crisis signal detection
 *
 * Regex-based classifier that runs locally (no API calls, no data leaves the device).
 * Returns 'high', 'low', or 'none' for single-message detection.
 * Also exposes a separate moderation detector for threats and hate speech.
 *
 * SIGNAL TIERS:
 *   High   = explicit self-harm or suicidal language → immediate intervention
 *   Low    = hopelessness, worthlessness, feeling trapped → soft safety response
 *   Subtle = individually harmless signals (withdrawal, fatigue, farewell language)
 *            that accumulate across a conversation session. When 3+ subtle signals
 *            occur within a session window, the system escalates to LOW or HIGH.
 *   None   = no crisis signals detected
 *
 * DESIGN PRINCIPLES:
 *   1. False negatives are more dangerous than false positives.
 *      Missing a real crisis could cost a life. A false alarm just shows a help modal.
 *   2. Input is normalised before matching — smart quotes, extra whitespace,
 *      common misspellings, and text-speak are all handled.
 *   3. False-positive guards prevent triggering on figurative language
 *      ("cut my hair", "hurt my ankle", "suicide squeeze play").
 *   4. Session-level accumulation catches people who won't say it directly
 *      but show multiple warning signs across a conversation.
 */

// ── Input normalisation ──────────────────────────────────────────────────────
// Runs before all regex matching. Expands misspellings, text-speak, and
// normalises unicode so patterns can stay readable.

function normalise(text) {
  let t = text.toLowerCase();

  // Collapse all whitespace (tabs, multiple spaces, nbsp) to single space
  t = t.replace(/[\s ]+/g, " ").trim();
  t = t.replace(/[\u200B-\u200D\uFEFF]/g, "");

  // Smart quotes → ASCII
  t = t.replace(/[‘’‚‛]/g, "'");  // ' ' ‚ ‛  → '
  t = t.replace(/[“”„‟]/g, '"');  // " " „ ‟  → "

  // Common misspellings of crisis terms
  t = t.replace(/\bsuicde\b/g, "suicide");
  t = t.replace(/\bsuiside\b/g, "suicide");
  t = t.replace(/\bsu[i1!|]c[i1!|]de\b/g, "suicide");
  t = t.replace(/\bsuciide?\b/g, "suicide");
  t = t.replace(/\bsuidice?\b/g, "suicide");
  t = t.replace(/\bsuicd\b/g, "suicide");
  t = t.replace(/\boverdoze\b/g, "overdose");
  t = t.replace(/\boverdoase\b/g, "overdose");
  t = t.replace(/\bdiss?ap+ear\b/g, "disappear");
  t = t.replace(/\bdisapear\b/g, "disappear");
  t = t.replace(/\bsewer[- ]?slide\b/g, "suicide");
  t = t.replace(/\bsue[- ]?aside\b/g, "suicide");
  t = t.replace(/\bk[1!|i]ll\b/g, "kill");
  t = t.replace(/\bkil\b/g, "kill");
  t = t.replace(/\bimma\b/g, "i am going to");
  t = t.replace(/\bthnking\b/g, "thinking");

  // Misspellings — self-harm / methods
  t = t.replace(/\bselfharm\b/g, "self-harm");
  t = t.replace(/\bselh[- ]?arm\b/g, "self-harm");
  t = t.replace(/\bhaning\b/g, "hanging");
  t = t.replace(/\bjumpin\b/g, "jumping");
  t = t.replace(/\bswalowing\b/g, "swallowing");
  t = t.replace(/\bbleding\b/g, "bleeding");

  // Expanded negations → contractions (so patterns only need one form)
  t = t.replace(/\bdo not\b/g, "don't");
  t = t.replace(/\bcannot\b/g, "can't");
  t = t.replace(/\bcan not\b/g, "can't");
  t = t.replace(/\bwill not\b/g, "won't");
  t = t.replace(/\bshould not\b/g, "shouldn't");
  t = t.replace(/\bwould not\b/g, "wouldn't");
  t = t.replace(/\bdoes not\b/g, "doesn't");
  t = t.replace(/\bdid not\b/g, "didn't");
  t = t.replace(/\bhave not\b/g, "haven't");
  t = t.replace(/\bhas not\b/g, "hasn't");
  t = t.replace(/\bis not\b/g, "isn't");
  t = t.replace(/\bare not\b/g, "aren't");
  t = t.replace(/\bwere not\b/g, "weren't");
  t = t.replace(/\bwas not\b/g, "wasn't");

  // Text-speak and abbreviations
  t = t.replace(/\bwanna\b/g, "want to");
  t = t.replace(/\bgonna\b/g, "going to");
  t = t.replace(/\bgotta\b/g, "got to");
  t = t.replace(/\bwant 2\b/g, "want to");
  t = t.replace(/\b2 die\b/g, "to die");
  t = t.replace(/\bkms\b/g, "kill myself");
  t = t.replace(/\bkys\b/g, "kill yourself");
  t = t.replace(/\bk\s*m\s*s\b/g, "kill myself");
  t = t.replace(/\bk\s*y\s*s\b/g, "kill yourself");
  t = t.replace(/\bidk\b/g, "i don't know");
  t = t.replace(/\birl\b/g, "in real life");
  t = t.replace(/\btbh\b/g, "to be honest");
  t = t.replace(/\bngl\b/g, "not going to lie");
  t = t.replace(/\bsm\b/g, "so much");
  t = t.replace(/\brn\b/g, "right now");
  t = t.replace(/\bcan'?t be arsed\b/g, "can't be bothered");
  t = t.replace(/\bcba\b/g, "can't be bothered");
  t = t.replace(/\bcbb\b/g, "can't be bothered");
  t = t.replace(/\bdon'?t wanna\b/g, "don't want to");
  t = t.replace(/\bi'?m done\b/g, "i am done");

  return t;
}

// ── False-positive guards ────────────────────────────────────────────────────
// Patterns that look like crisis but aren't. Checked BEFORE crisis matching.
// If any guard matches, that specific pattern is skipped.

const FP_GUARDS = {
  // "cut my hair/nails/finger/cake" — not self-harm
  cut_my: /\bcut(ting)? my (hair|nails?|finger|losses?|cake|lawn|grass|ties|cord|cards?|teeth)\b/i,
  // "hurt my ankle/back/knee/feelings" — not self-harm
  hurt_my: /\bhurt(ing|s)? my (ankle|back|knee|leg|arm|hand|foot|feet|neck|shoulder|wrist|finger|elbow|head|eye|feelings?|pride)\b/i,
  // "bleeding out" in non-crisis contexts
  bleed_economy: /\b(economy|market|company|stock|budget|money)\b.*\bbleed/i,
  bleed_economy2: /\bbleed.*\b(economy|market|company|stock|budget|money)\b/i,
  // "suicide" in non-crisis contexts (sports, awareness, prevention class names)
  suicide_idiom: /\bsuicide (squeeze|bunt|pass|mission|door|door|prevention|awareness|hotline|class)\b/i,
  suicide_idiom2: /\b(that|this) (joke|movie|show|game|song|set) was suicide\b/i,
  // "jump off" in non-crisis contexts
  jump_idiom: /\bjump(ing)? (off|from) (the topic|that|this topic|there|here|one thing)\b/i,
  // "overdose on" non-drug items
  overdose_idiom: /\boverdose[ds]? on (coffee|caffeine|sugar|chocolate|candy|pizza|food|information|data)\b/i,
  // HTML class names / prevention resources containing "suicid"
  html_class: /class\s*=\s*['"][^'"]*suicid/i,
  // "the game is over for me" — not crisis
  over_idiom: /\b(game|match|race|show|round|season|movie|film|series|tournament|semester|chapter)\b.*\bover for me\b/i,
  // "want to disappear" in fantasy/magic contexts
  disappear_idiom: /\b(magic trick|magician|card|coin|rabbit)\b.*\bdisappear\b/i,
  // "numb" in physical context
  numb_physical: /\b(finger|hand|foot|toe|arm|leg|face|lip|tongue)s?\b.*\bnumb\b/i,
  numb_physical2: /\bnumb\b.*\b(finger|hand|foot|toe|arm|leg|face|lip|tongue)s?\b/i,
  // "tired of" in mundane contexts
  tired_mundane: /\b(tired|sick|exhausted) of (waiting|cooking|cleaning|working|commuting|traffic|my job|the weather|this meeting|homework|studying)\b/i,
  // "giving away" in commerce/charity context
  giving_commerce: /\b(giv(e|ing) away|gave away)\b.*\b(free|promotion|contest|charity|raffle|giveaway)\b/i,
  // "can't sleep" followed by mundane reason
  sleep_mundane: /\bcan'?t sleep\b.*\b(coffee|caffeine|noisy|loud|snoring|neighbou?r|heat|cold|jet lag|excited)\b/i,
  // "deleting" in tech/cleanup context
  deleting_tech: /\b(delet(e|ing|ed))\b.*\b(files?|folders?|apps?|cache|duplicates?|old (photos?|emails?|files?))\b/i,
};

function isFalsePositive(text, matchedPattern) {
  // Check if the matched text falls under a known false-positive context
  if (/cut/.test(matchedPattern) && FP_GUARDS.cut_my.test(text)) return true;
  if (/hurt/.test(matchedPattern) && FP_GUARDS.hurt_my.test(text)) return true;
  if (/bleed/.test(matchedPattern) && (FP_GUARDS.bleed_economy.test(text) || FP_GUARDS.bleed_economy2.test(text))) return true;
  if (/suicid/.test(matchedPattern) && (FP_GUARDS.suicide_idiom.test(text) || FP_GUARDS.suicide_idiom2.test(text) || FP_GUARDS.html_class.test(text))) return true;
  if (/jump/.test(matchedPattern) && FP_GUARDS.jump_idiom.test(text)) return true;
  if (/overdose/.test(matchedPattern) && FP_GUARDS.overdose_idiom.test(text)) return true;
  if (/over for me/.test(matchedPattern) && FP_GUARDS.over_idiom.test(text)) return true;
  if (/disappear/.test(matchedPattern) && FP_GUARDS.disappear_idiom.test(text)) return true;
  if (/numb/.test(matchedPattern) && (FP_GUARDS.numb_physical.test(text) || FP_GUARDS.numb_physical2.test(text))) return true;
  if (/tired|exhausted|sick/.test(matchedPattern) && FP_GUARDS.tired_mundane.test(text)) return true;
  if (/giv/.test(matchedPattern) && FP_GUARDS.giving_commerce.test(text)) return true;
  if (/sleep/.test(matchedPattern) && FP_GUARDS.sleep_mundane.test(text)) return true;
  if (/delet/.test(matchedPattern) && FP_GUARDS.deleting_tech.test(text)) return true;
  return false;
}

// ── Crisis patterns ──────────────────────────────────────────────────────────

const HIGH_SIGNALS = [
  // Explicit suicidal language
  /\bsuicid/i,
  /\bkill (my|myself|me)\b/i,
  /\bend(ing)? (my|this) life\b/i,
  /\btake my (own )?life\b/i,
  /\bwant to die\b/i,
  /\bwish (i was|i were|i'm) dead\b/i,
  /\bdon'?t want to (be here|live|exist|be alive)\b/i,
  /\bno reason to live\b/i,
  /\bself[- ]?harm/i,

  // Self-harm with body-part guard (FP_GUARDS handles "cut my hair", "hurt my ankle")
  /\bhurt(ing)? (my|myself)\b/i,
  /\bcut(ting)? (my|myself)\b/i,

  // Methods
  /\boverdose\b/i,
  /\bhanging (my|myself)\b/i,
  /\bjump(ing)? (off|from)\b/i,
  /\bpills?\b.*\b(take|swallow|end)\b/i,
  /\b(end|stop) the pain\b/i,
  /\bslit(ting)? my\b/i,
  /\bbleed(ing)? out\b/i,
  /\bshoot(ing)? (my|myself)\b/i,
  /\bdrown(ing)? (my|myself)\b/i,

  // Text-speak / slang (after normalisation, but keep originals for safety)
  /\boff myself\b/i,
  /\btop myself\b/i,
  /\bunalive (myself|me)\b/i,
  /\bself[- ]?delete\b/i,
  /\bdelete myself\b/i,
  /\berase myself\b/i,
  /\b(log out|checkout|check out) (of life|forever|for good)\b/i,

  // Passive but high-risk
  /\bbetter off dead\b/i,
  /\b(easiest|best|fastest|quickest|simplest) way to die\b/i,
  /\bhow (to|do i|can i|would i) (kill|end|off) (myself|my life|it all)\b/i,

  // Finality about self
  /\b(this is )?the end (for|of) me\b/i,
  /\bwant (it all|everything|this) to (end|be over|stop)\b/i,
  /\bwant the pain to (stop|end|go away)\b/i,
  /\b(it|this) will (all )?be over soon\b/i,

  // Indirect warning signs — behavioural
  /\b(writing|wrote|write) (my )?(goodbye|suicide|farewell) (letters?|notes?|message)\b/i,
  /\bgave away (all |everything|my stuff|my things|my possessions)\b/i,
  /\bwon'?t be (here|around|alive) (much )?longer\b/i,
  /\bwon'?t (be a problem|have to worry about me|bother anyone)\b/i,
  /\bdon'?t care if i (wake|die|live)\b/i,
  /\bi have a plan\b.*\b(tonight|today|tomorrow|this week|the night)\b/i,
  /\b(do|doing) something (stupid|drastic|rash|permanent)\b/i,

  // Additional explicit signals
  /\bwant(ing)? to disappear\b/i,
  /\b(nobody|no one) (will|would) (even )?(notice|care|miss me) (if|when) i('?m| am) gone\b/i,
  /\bready to (die|go|end it|leave this world)\b/i,
  /\b(put|putting) (my|the) affairs in order\b/i,
  /\bmaking (my |a )?(last|final) (wish|will|arrangement)\b/i,
  /\bsay(ing)? goodbye to everyone\b/i,
  /\bno(thing| one)? (can|will) (save|help|stop) me\b/i,
  /\b(life|living) is(n'?t| not) worth (it|the (pain|effort|struggle))\b/i,
  /\bi'?ve (made|reached) (my|a) decision\b.*\b(end|die|gone|tonight|tomorrow)\b/i,
  /\bthis (is |will be )?(my )?last (day|night|time|message|goodbye)\b/i,
  /\bthere('?s| is) no (coming back|turning back|going back)\b/i,
  /\bi (just )?need (it|everything|this) to (stop|end|be over)\b/i,
];

const LOW_SIGNALS = [
  /\bcan'?t go on\b/i,
  /\bno point\b/i,
  /\bnobody (cares|would miss me|will miss me|would notice|will notice)\b/i,
  /\beveryone (would be |is )?better off (without me)?\b/i,
  /\bworthless\b/i,
  /\b(completely |utterly |totally )?hopeless\b/i,
  /\bending it (all)?\b/i,
  /\bnot worth (living|it)\b/i,
  /\bgive up on (life|everything|myself)\b/i,
  /\bwhat('?s| is) the point\b/i,
  /\bi (just )?can'?t (do this|take (it|this)( anymore)?|anymore)\b/i,
  /\bno way out\b/i,
  /\btoo much to bear\b/i,
  /\bno one (cares|understands|would miss|will miss|would notice|will notice)\b/i,
  /\bi('?m| am) (a |so |such a )?burden\b/i,
  /\blife is(n'?t| not) worth\b/i,
  /\bwish i (wasn'?t|weren'?t) (here|alive|born)\b/i,
  /\bcan'?t (see|find) (a |any )?(way |reason )?(to go on|forward|out)\b/i,
  /\btrapped\b.*\b(no|can'?t|won'?t)\b/i,
  /\bnothing (left|matters|to live for)\b/i,

  // Passive / indirect low-risk signals
  /\bdon'?t see a future\b/i,
  /\b(easier|better) if i (wasn'?t|weren'?t|am not) here\b/i,
  /\b(it'?s |it is )?over for me\b/i,
  /\bdone with (life|everything|all of this|living)\b/i,
  /\bno hope (for me|left|anymore)\b/i,

  // Expanded low-risk signals
  /\bwhat'?s (even )?the point of (living|being alive|going on|trying)\b/i,
  /\bcan'?t (keep|carry on|continue|keep going) (like this|anymore)\b/i,
  /\bworld (would be|is) better (off )?without me\b/i,
  /\b(i |i'?m )?(so |really |just )?(exhausted|drained|empty) (inside|of (life|everything|living))\b/i,
  /\bfeel(ing|s)? (like |so )?numb\b/i,
  /\bdon'?t (feel|have) (anything|any emotions?|any feelings?)\b/i,
  /\b(i |i'?m )?(completely|totally|utterly) (alone|isolated|empty)\b/i,
  /\bnever get(ting|s)? better\b/i,
  /\bdon'?t (want to|wanna) wake up\b/i,
  /\bcan'?t (face|handle) (another|tomorrow|the morning)\b/i,
  /\b(i'?m|i am) (so |just )?(tired|sick) of (living|life|everything|fighting|trying)\b/i,
  /\bno(body| one) (would|will) (ever )?(understand|help|miss|notice)\b/i,
  /\bdon'?t (belong|fit in) (here|anywhere)\b/i,
  /\b(broken|damaged) beyond (repair|fixing|help)\b/i,
  /\bgiven up (on|trying|hope|myself|everything)\b/i,
  /\b(always|forever) (be |feel )?(alone|lonely|miserable|unhappy)\b/i,
  /\bcan'?t (escape|get away from) (this|it|the pain|my thoughts?)\b/i,
  /\bdon'?t (deserve|have the right) to (live|be happy|be alive|be here)\b/i,
];

// ── Reviewed crisis-language signal pack ───────────────────────────────────
// Source-linked signal families distilled from peer-reviewed or clinically
// governed crisis-language resources. We do not ship raw restricted datasets or
// user-authored posts here; these are auditable signal concepts and synthetic
// phrasings derived from public descriptions, clinical taxonomies, and papers.

const REVIEWED_SIGNAL_PACK = {
  version: "2026-06-18",
  status: "draft-research",
  language: "en",
  reviewAfter: "2026-09-18",
  governance: [
    "No raw sensitive social-media posts are embedded in the package.",
    "Signals are source-linked and can be individually reviewed, expired, or disabled.",
    "False-positive guards remain active before any reviewed signal can trigger.",
    "The pack is a routing aid only; it is not a diagnostic or risk-scoring instrument.",
  ],
};

const REVIEWED_SIGNAL_SOURCES = {
  cssrs_2011: {
    shortName: "C-SSRS",
    title: "Columbia-Suicide Severity Rating Scale: initial validity and internal consistency findings",
    authors: "Posner et al.",
    year: 2011,
    url: "https://doi.org/10.1176/appi.ajp.2011.10111704",
    sourceType: "peer_reviewed_clinical_scale",
    useInSafeChat: "Signal families for wish-to-be-dead, active suicidal thoughts, method, intent, plan, and preparatory behaviour.",
  },
  reddit_cssrs_2019: {
    shortName: "Reddit C-SSRS",
    title: "Knowledge-aware assessment of severity of suicide risk for early intervention",
    authors: "Gaur et al.",
    year: 2019,
    url: "https://doi.org/10.1145/3308558.3313698",
    sourceType: "peer_reviewed_dataset",
    useInSafeChat: "Severity-linked concepts based on medical knowledge bases, suicide ontology, and psychiatrist C-SSRS annotations.",
  },
  clpsych_2019: {
    shortName: "CLPsych 2019",
    title: "CLPsych 2019 Shared Task: Predicting the Degree of Suicide Risk in Reddit Posts",
    authors: "Zirikly et al.",
    year: 2019,
    url: "https://aclanthology.org/W19-3003/",
    sourceType: "peer_reviewed_shared_task",
    useInSafeChat: "Risk-tier framing for no, low, moderate, and severe risk language without importing restricted Reddit data.",
  },
  clpsych_2021: {
    shortName: "CLPsych 2021",
    title: "Community-level Research on Suicidality Prediction in a Secure Environment",
    authors: "MacAvaney et al.",
    year: 2021,
    url: "https://aclanthology.org/2021.clpsych-1.7/",
    sourceType: "peer_reviewed_secure_enclave_task",
    useInSafeChat: "Longitudinal and privacy-preserving design lesson: derive indicators, do not redistribute sensitive donated text.",
  },
  erisk_self_harm_2021: {
    shortName: "eRisk Self-Harm",
    title: "CLEF eRisk early detection of signs of self-harm",
    authors: "Losada et al. / CLEF eRisk Lab",
    year: 2021,
    url: "https://erisk.irlab.org/2021/index.html",
    sourceType: "peer_reviewed_evaluation_lab",
    useInSafeChat: "Sequential evidence model for accumulating subtle self-harm signals over a session.",
  },
  mindguard_2026: {
    shortName: "MindGuard",
    title: "MindGuard: Guardrail Classifiers for Multi-Turn Mental Health Support",
    authors: "Farinhas et al.",
    year: 2026,
    url: "https://arxiv.org/abs/2602.00950",
    sourceType: "clinically_annotated_public_benchmark",
    useInSafeChat: "Actionable-harm taxonomy: distinguish therapeutic disclosure from self-harm or harm-to-others crisis.",
  },
  mentalchat16k_2025: {
    shortName: "MentalChat16K",
    title: "MentalChat16K: A Benchmark Dataset for Conversational Mental Health Assistance",
    authors: "Xu et al.",
    year: 2025,
    url: "https://doi.org/10.1145/3711896.3737393",
    sourceType: "peer_reviewed_benchmark_dataset",
    useInSafeChat: "Conversational mental-health assistance benchmark for future local evaluation, not raw trigger import.",
  },
  mentalllama_2023: {
    shortName: "MentalLLaMA",
    title: "MentalLLaMA: Interpretable Mental Health Analysis on Social Media with Large Language Models",
    authors: "Yang et al.",
    year: 2023,
    url: "https://github.com/SteveKGYang/MentalLLaMA",
    sourceType: "open_source_research_model_and_instruction_data",
    useInSafeChat: "Optional local cross-classifier target for interpretable mental-health analysis.",
  },
  vera_mh_2026: {
    shortName: "VERA-MH v1.1",
    title: "Validation of Ethical and Responsible AI in Mental Health",
    authors: "Belli, Bentley et al.",
    year: 2026,
    url: "https://github.com/SpringCare/VERA-MH",
    sourceType: "clinically_grounded_open_evaluation",
    useInSafeChat: "Public risk-presentation families and synthetic persona seed phrases used for regression design; VERA-MH remains a chatbot-response evaluation, not a trigger dictionary or validation of SafeChat.",
  },
};

const REVIEWED_HIGH_SIGNALS = [
  {
    level: "high",
    sourceId: "vera_mh_2026",
    family: "active_ideation_or_method",
    rationale: "VERA-MH includes hedged active-ideation presentations that refer to ways of ending or being gone.",
    re: /\b(keep |kept |been )?(thinking|thought) about ways? (i (could|might|would) )?(to )?(end it|end things|be gone|not be here|do it)\b/i,
  },
  {
    level: "high",
    sourceId: "vera_mh_2026",
    family: "intent_plan_and_timeframe",
    rationale: "A stated plan or intent combined with a near-term timeframe requires immediate routing.",
    re: /\b(have|got|made) (a )?plan\b.*\b(tonight|today|right now|next hour|soon|follow through)\b|\b(planning|going) to (end it|end things|do it) (all )?(tonight|today|right now)\b/i,
  },
  {
    level: "high",
    sourceId: "vera_mh_2026",
    family: "preparatory_behaviour",
    rationale: "Preparing means or setting items aside alongside self-directed intent is a high-urgency presentation.",
    re: /\b(gathered|got|set|put|have) (some |my |the )?(pills|things|stuff|means) (ready|aside|together)\b.*\b(end it|do it|not be here|tonight|in case)\b|\b(ready|aside|together)\b.*\b(pills|means)\b.*\b(end it|do it|not be here)\b/i,
  },
  {
    level: "high",
    sourceId: "vera_mh_2026",
    family: "recent_attempt_or_interruption",
    rationale: "VERA-MH treats recent attempts, aborted attempts, and interrupted attempts as immediate-risk presentations.",
    re: /\b(tried|attempted) to end it( all)?\b|\btried something\b.*\b(stopped|someone stopped me|not do it again)\b/i,
  },
  {
    level: "high",
    sourceId: "vera_mh_2026",
    family: "method_research_with_self_reference",
    rationale: "Self-referential method research or preparatory searching is actionable even when hedged.",
    re: /\b(looked|looking|searching) up (how|ways?|methods?|how many pills)\b.*\b(end|do it|die|not wake|last night|tonight)\b|\bhow many pills\b.*\b(do it|would do it|to die|not wake)\b/i,
  },
  {
    level: "high",
    sourceId: "vera_mh_2026",
    family: "loss_of_self_safety",
    rationale: "Feeling unsafe with one's own thoughts indicates an immediate need for human support.",
    re: /\bi (don'?t|do not) feel safe with (my|these) (own )?thoughts?( tonight| right now| anymore)?\b/i,
  },
  {
    level: "high",
    sourceId: "vera_mh_2026",
    family: "imminent_finality",
    rationale: "Direct finality language plus a near-term timeframe is treated as high urgency.",
    re: /\b(going to|gonna|i have to) (end it|do it) (all )?(tonight|today|right now)\b|\b(i have|everything is|things are) (all )?ready\b.*\b(tonight|end it|do it)\b/i,
  },
  {
    level: "high",
    sourceId: "cssrs_2011",
    family: "active_suicidal_thoughts",
    rationale: "C-SSRS active suicidal thoughts map to immediate routing.",
    re: /\b(thoughts?|thinking|keep thinking|been thinking) (of|about) (killing|ending|hurting|harming) (myself|my life)\b/i,
  },
  {
    level: "high",
    sourceId: "cssrs_2011",
    family: "method_or_plan",
    rationale: "C-SSRS method/plan/intent language is treated as high urgency.",
    re: /\bi (know|have|had|found|chose|chosen|picked|worked out|made|have worked out|have found|have chosen|have picked|have made) (a )?(method|way|plan)\b.*\b(kill|end|hurt|harm|die|overdose)\b/i,
  },
  {
    level: "high",
    sourceId: "cssrs_2011",
    family: "method_or_plan",
    rationale: "Specific method knowledge or planning requires crisis routing.",
    re: /\b(i know how|i have worked out how|i figured out how) (i would|to|i can) (do it|end it|kill myself|end my life)\b/i,
  },
  {
    level: "high",
    sourceId: "cssrs_2011",
    family: "intent_or_imminence",
    rationale: "Self-described loss of immediate safety is actionable crisis language.",
    re: /\bi can'?t keep myself safe( tonight| today| right now| anymore)?\b/i,
  },
  {
    level: "high",
    sourceId: "mindguard_2026",
    family: "actionable_self_harm",
    rationale: "MindGuard-style actionable-harm signals include imminent self-harm risk.",
    re: /\bi('?m| am) (scared|afraid|worried) i (will|might|could|may) (hurt|harm|kill|cut) myself\b/i,
  },
  {
    level: "high",
    sourceId: "reddit_cssrs_2019",
    family: "self_harm_urge",
    rationale: "Self-harm urge language maps to self-directed harm indicators.",
    re: /\b(the urge|urges|impulse|impulses) to (cut|hurt|harm|kill) myself\b/i,
  },
  {
    level: "high",
    sourceId: "reddit_cssrs_2019",
    family: "self_harm_recurrence",
    rationale: "Recent recurrence of self-harm behaviour should route to support.",
    re: /\bi (relapsed|started|began) (cutting|self[- ]?harming|hurting myself|harming myself) again\b/i,
  },
  {
    level: "high",
    sourceId: "clpsych_2019",
    family: "preparatory_or_farewell",
    rationale: "Preparatory behaviour and farewell language align with severe-risk evidence families.",
    re: /\bi('?ve| have) (been )?(saying goodbye|making goodbye messages|writing goodbye messages|writing goodbye notes)\b/i,
  },
  {
    level: "high",
    sourceId: "clpsych_2021",
    family: "recent_attempt_or_near_attempt",
    rationale: "Recent attempt or near-attempt disclosure requires immediate crisis routing.",
    re: /\bi (tried|attempted|almost|nearly) to (kill|end|hurt|harm) (myself|my life)\b/i,
  },
  {
    level: "high",
    sourceId: "mindguard_2026",
    family: "immediate_self_safety",
    rationale: "Actionable self-harm risk includes inability to trust oneself alone.",
    re: /\bi don'?t trust myself (alone|by myself|right now|tonight|today)\b/i,
  },
];

const REVIEWED_LOW_SIGNALS = [
  {
    level: "low",
    sourceId: "vera_mh_2026",
    family: "passive_absence",
    rationale: "VERA-MH personas include hedged wishes that it would be easier not to be present or alive.",
    re: /\b(it would|it'?d|things would|everything would) be easier (for everyone )?(if i (just )?)?(wasn'?t|weren'?t|was not|were not|am not) (here|around|alive)\b|\beasier (to|if i could) (just )?(not be here|not exist|disappear|be gone)\b/i,
  },
  {
    level: "low",
    sourceId: "vera_mh_2026",
    family: "passive_absence",
    rationale: "Repeated thoughts about not being present are routed softly even when intent is denied.",
    re: /\b(keep |kept |been )?(thinking|think|thoughts?) (about )?(it would be easier )?(if i )?(just )?(wasn'?t|weren'?t|was not|were not|not being|not be) (here|around|alive)\b/i,
  },
  {
    level: "low",
    sourceId: "vera_mh_2026",
    family: "passive_death_wish",
    rationale: "Not-waking language is a passive suicidal-thought presentation in VERA-MH.",
    re: /\b(it would|it'?d|might) be easier (if i )?(just )?(didn'?t|did not|don'?t|do not|couldn'?t|could not) wake up\b|\bwouldn'?t matter if i didn'?t wake up\b/i,
  },
  {
    level: "low",
    sourceId: "vera_mh_2026",
    family: "passive_nonexistence",
    rationale: "A wish not to exist is routed as passive ideation unless stronger intent is present.",
    re: /\b(wish|wishing) i could (just )?(not exist|disappear|be gone|check out)\b|\bbetter if i (just )?(didn'?t|did not) exist\b/i,
  },
  {
    level: "low",
    sourceId: "vera_mh_2026",
    family: "social_withdrawal_finality",
    rationale: "Questioning whether it is worth remaining is a crisis-adjacent presentation.",
    re: /\b(wonder|wondering|not sure) if (it'?s|it is) (even )?worth (sticking around|being here|carrying on)\b/i,
  },
  {
    level: "low",
    sourceId: "vera_mh_2026",
    family: "loss_of_reason_for_presence",
    rationale: "A stated lack of reason to remain present should trigger a soft safety response.",
    re: /\b(i )?(don'?t|do not|can'?t|cannot) (really )?(see|have|find) a reason to be here\b/i,
  },
  {
    level: "low",
    sourceId: "cssrs_2011",
    family: "wish_to_be_dead",
    rationale: "C-SSRS wish-to-be-dead language maps to passive ideation and should at least trigger a soft safety response.",
    re: /\bwish (i could |i would |i'?d |i can )?(go to sleep|fall asleep) and (not|never) wake up\b/i,
  },
  {
    level: "low",
    sourceId: "cssrs_2011",
    family: "wish_to_be_dead",
    rationale: "Passive non-existence language is a crisis-adjacent signal even without stated intent.",
    re: /\bi (would rather|wish i could|wish i would) (not exist|not be alive|never have been born)\b/i,
  },
  {
    level: "low",
    sourceId: "reddit_cssrs_2019",
    family: "perceived_burdensomeness",
    rationale: "Perceived burdensomeness is a recurrent suicide-risk language family.",
    re: /\bi('?m| am| feel like) (just )?(taking up space|a waste of space|a burden to everyone|nothing but a burden)\b/i,
  },
  {
    level: "low",
    sourceId: "clpsych_2019",
    family: "social_erasure",
    rationale: "Low-to-moderate risk language often includes social erasure and not-being-missed themes.",
    re: /\b(people|everyone|they) (would be|would feel|will be) (relieved|better|happier) if i (was gone|were gone|left|disappeared|vanished)\b/i,
  },
  {
    level: "low",
    sourceId: "clpsych_2019",
    family: "social_erasure",
    rationale: "Vanishing/not mattering language is routed softly unless intent or method is present.",
    re: /\bit wouldn'?t matter if i (disappeared|vanished|was gone|were gone|stopped showing up)\b/i,
  },
  {
    level: "low",
    sourceId: "erisk_self_harm_2021",
    family: "future_loss",
    rationale: "Sequential early-risk work treats future-loss language as an accumulating risk marker.",
    re: /\bi (have|see) no future( for myself| ahead of me)?\b/i,
  },
  {
    level: "low",
    sourceId: "erisk_self_harm_2021",
    family: "future_loss",
    rationale: "Loss of future orientation should contribute to distress routing.",
    re: /\bi have nothing to look forward to\b/i,
  },
  {
    level: "low",
    sourceId: "mentalchat16k_2025",
    family: "conversational_distress",
    rationale: "Conversational mental-health benchmarks include persistent exhaustion, despair, and support-seeking contexts.",
    re: /\bi('?m| am) tired in a way (sleep|rest) (doesn'?t|does not|won'?t|will not) fix\b/i,
  },
  {
    level: "low",
    sourceId: "mentalllama_2023",
    family: "interpretable_distress",
    rationale: "Interpretable mental-health analysis tasks include loneliness, hopelessness, and perceived isolation.",
    re: /\bi feel (invisible|unseen|like nobody sees me|like nobody hears me)\b/i,
  },
];

// ── Moderation patterns ─────────────────────────────────────────────────────
// Separate from crisis detection so threats/hate speech can be flagged without
// automatically showing crisis helplines.

const THREAT_SIGNALS = [
  { level: "high", re: /\bi'?ll (kill|murder|stab|shoot|hurt|beat|attack) (you|u|him|her|them|everyone|somebody|someone)\b/i },
  { level: "high", re: /\bi (want to|am going to|gonna|will|'ll) (kill|murder|stab|shoot|hurt|beat|attack) (you|u|him|her|them|everyone|somebody|someone)\b/i },
  { level: "high", re: /\bi('?m| am) (going to|gonna) (kill|murder|stab|shoot|hurt|beat|attack) (you|u|him|her|them|everyone|somebody|someone)\b/i },
  { level: "high", re: /\bi (want to|am going to|gonna|will|'ll) (find|track down|come for) (you|u|him|her|them)\b/i },
  { level: "high", re: /\bi('?m| am) (going to|gonna) (find|track down|come for) (you|u|him|her|them)\b/i },
  { level: "high", re: /\b(kill|hurt) yourself\b/i },
  { level: "high", re: /\byou (deserve|need) to (die|be killed|get hurt)\b/i },
  { level: "high", re: /\bgoing to (bomb|shoot up|burn down|attack) (the|this|that|your|their|my)? ?(school|office|building|house|home|place|event|campus|store|workplace)\b/i },
  { level: "high", re: /\bput (a )?(bomb|knife|gun) (in|through|to|at)\b/i },
  { level: "high", re: /\bbring(ing)? (a )?(gun|knife|weapon) (to|into)\b.*\b(school|work|office|campus|event|building)\b/i },
  { level: "high", re: /\bmake (you|u|him|her|them) pay\b.*\b(tonight|today|tomorrow|soon|now)\b/i },
  { level: "low", re: /\bi (want to|am going to|gonna|will|'ll) (ruin|destroy) (you|your life|your career|them)\b/i },
  { level: "low", re: /\bi('?m| am) (going to|gonna) (ruin|destroy) (you|your life|your career|them)\b/i },
  { level: "low", re: /\bwatch your back\b/i },
  { level: "low", re: /\byou haven'?t seen the last of me\b/i },
];

const PROTECTED_GROUP =
  "(black|white|asian|jewish|muslim|christian|hindu|sikh|arab|indigenous|aboriginal|gay|lesbian|trans|queer|lgbtq|disabled|autistic|immigrant|refugee|migrant|women|men|girls|boys|old people)";
const PROTECTED_GROUP_TARGET = "(" + PROTECTED_GROUP + ")( people|s)?";
const SLUR_TERM =
  "(n[i1!|]gg(?:er|a)s?|k[i1!|]kes?|f[a@]gg?(?:ot|ots)?|tr[a@]nn(?:y|ies)|r[e3]t[a@]rds?|sp[a@]stics?|ch[i1!|]nks?|g[o0]{2}ks?|p[a@]k[i1!|]s?|d[yv]kes?)";

const HATE_SIGNALS = [
  { level: "high", re: new RegExp("\\b" + PROTECTED_GROUP_TARGET + " (should|must|need to|ought to) (die|be killed|be eliminated|be wiped out|not exist)\\b", "i") },
  { level: "high", re: new RegExp("\\b(kill|hurt|attack|eliminate|wipe out) (all |every )?" + PROTECTED_GROUP_TARGET + "\\b", "i") },
  { level: "high", re: new RegExp("\\b" + PROTECTED_GROUP_TARGET + " (are|aren't) (subhuman|inferior|not human|human)\\b", "i") },
  { level: "high", re: new RegExp("\\b" + SLUR_TERM + " (should|must|need to|ought to) (die|be killed|be eliminated|be wiped out|not exist|leave)\\b", "i") },
  { level: "high", re: new RegExp("\\b(kill|hurt|attack|eliminate|wipe out) (all |every )?" + SLUR_TERM + "\\b", "i") },
  { level: "low", re: new RegExp("\\bi hate " + PROTECTED_GROUP_TARGET + "\\b", "i") },
  { level: "low", re: new RegExp("\\b" + PROTECTED_GROUP_TARGET + " (do not|don't|shouldn'?t|should not) belong (here|anywhere|in this country|in our country)\\b", "i") },
  { level: "low", re: /\bgo back to (your|their) country\b/i },
  { level: "low", re: new RegExp("\\bno " + PROTECTED_GROUP_TARGET + " allowed\\b", "i") },
  { level: "low", re: new RegExp("\\b(you|u|they|those people|these people|all of them) (are|are all|look like|sound like) (a |an |the )?" + SLUR_TERM + "\\b", "i") },
  { level: "low", re: new RegExp("\\b(i hate|no|ban|keep out|go away) " + SLUR_TERM + "\\b", "i") },
];

const MODERATION_FP_GUARDS = {
  kill_idiom: /\b(kill|killed|killing) (time|the lights|a process|the server|a task|a habit|the mood|the performance|it|this)\b/i,
  shoot_idiom: /\bshoot(ing)? (hoops|a video|photos?|an email|a message|the breeze)\b/i,
  bomb_idiom: /\b(bombed|bombing|bomb) (the exam|an exam|a test|on stage|at karaoke|a performance|a joke)\b/i,
  attack_idiom: /\b(attack|attacking) (the problem|a bug|this task|the issue|the project)\b/i,
  threat_model: /\b(threat model|threat detection|security threat|threat assessment|threat level)\b/i,
  hate_mundane: /\bi hate (monday|mondays|traffic|homework|this app|this bug|my job|the weather|cooking|waiting)\b/i,
  slur_context: /\b(flame retardant|fire retardant|retardant paint|dyke wall|dyke geology)\b/i,
};

function isModerationFalsePositive(text, matchedPattern) {
  if (/kill|killed|killing/.test(matchedPattern) && MODERATION_FP_GUARDS.kill_idiom.test(text)) return true;
  if (/shoot/.test(matchedPattern) && MODERATION_FP_GUARDS.shoot_idiom.test(text)) return true;
  if (/bomb/.test(matchedPattern) && MODERATION_FP_GUARDS.bomb_idiom.test(text)) return true;
  if (/attack/.test(matchedPattern) && MODERATION_FP_GUARDS.attack_idiom.test(text)) return true;
  if (/threat/.test(matchedPattern) && MODERATION_FP_GUARDS.threat_model.test(text)) return true;
  if (/hate/.test(matchedPattern) && MODERATION_FP_GUARDS.hate_mundane.test(text)) return true;
  if (MODERATION_FP_GUARDS.slur_context.test(text)) return true;
  return false;
}

// ── Subtle signals ──────────────────────────────────────────────────────────
// Individually these are NOT crisis signals. But when 3+ appear in a session,
// they indicate accumulating distress that should trigger a safety check.
// Each has a weight (1-3). Threshold to escalate = 5 points within a session.

const SUBTLE_SIGNALS = [
  // VERA-MH contextual presentations. These do not trigger alone; they combine
  // with other session signals under the same transparent 4/8 thresholds.
  { re: /\b(what|which)('?s| is| are)? (the )?(highest|tallest|nearest|closest) (bridge|building|cliff)\b|\b(lethal|deadly) household (chemicals?|substances?)\b|\bsurvive a (car )?crash (if|at|going)\b/i, cat: "method_research", weight: 3 },
  { re: /\b(my |the )?(thoughts?|idea|ideas) (keep |keeps |are |is )?(getting louder|won'?t shut off|will not shut off|won'?t stop|will not stop)\b|\bcan'?t get (the |this )?(idea|thought)\b.*\bout of my head\b/i, cat: "escalating_thoughts", weight: 2 },
  { re: /\b(not trying to|don'?t want to|dont want to) (be dramatic|make (this|it) a big (deal|thing))\b|\b(it'?s|it is) not a crisis\b/i, cat: "minimisation", weight: 1 },
  { re: /\b(don'?t|dont|do not) (tell|ask) me to (call|talk to|see) (someone|anyone|a therapist|hotlines?)\b|\b(can'?t|cannot) afford (therapy|help|treatment)\b/i, cat: "help_barrier", weight: 1 },
  { re: /\b(no one|nobody|don'?t have anyone|there'?s no one) (to talk to|to turn to|i can tell|who understands)\b/i, cat: "isolation", weight: 2 },
  { re: /\b(everything|things|it)('?s| is| are| has been| have been)? (just )?(piling up|too much|falling apart)\b/i, cat: "overwhelm", weight: 1 },
  { re: /\b(help me )?(get|make it) through (tonight|the night|the next hour|right now)\b|\b(might not|won'?t|will not) make it through (tonight|the night|today)\b/i, cat: "acute_timeframe", weight: 2 },
  { re: /\b(sleep('?s| is) (awful|gone|wrecked)|not sleeping much|no sleep all (week|wk)|haven'?t been sleeping)\b/i, cat: "sleep", weight: 1 },
  { re: /\b(drinking|smoking|using) (a lot |much )?more (at night|lately|recently)?\b/i, cat: "substance", weight: 1 },
  { re: /\b(dark|scary|intrusive) thoughts? (keep |keeps |are |is )?(showing up|coming back|scaring me|getting worse)\b/i, cat: "distressing_thoughts", weight: 2 },
  // Withdrawal / isolation (weight 2)
  { re: /\b(don'?t want to|can'?t) (see|talk to|be around|face) (anyone|anybody|people|them)\b/i, cat: "withdrawal", weight: 2 },
  { re: /\b(staying|stay|been) (in bed|home|inside|in my room) (all day|all week|for days|again)\b/i, cat: "withdrawal", weight: 1 },
  { re: /\b(pushing|pushed) (everyone|people|them|friends|family) away\b/i, cat: "withdrawal", weight: 2 },
  { re: /\b(stopped|quit|gave up) (going out|seeing friends|answering|responding|talking)\b/i, cat: "withdrawal", weight: 2 },
  { re: /\b(haven'?t|don'?t) (left|leave) (the house|my room|bed|home) (in|for) (days|weeks|a while|ages)\b/i, cat: "withdrawal", weight: 2 },

  // Sleep disturbance (weight 1)
  { re: /\b(can'?t|couldn'?t|unable to) (sleep|fall asleep|stay asleep) (again|anymore|at all|for days|for weeks)\b/i, cat: "sleep", weight: 1 },
  { re: /\b(barely|haven'?t|not) (slept|sleeping|sleep) (in|for) (days|weeks|ages|a long time)\b/i, cat: "sleep", weight: 1 },
  { re: /\bawake (all night|at 3|at 4|every night|again)\b/i, cat: "sleep", weight: 1 },
  { re: /\b(sleep|sleeping) (too much|all day|14|16|18|20 hours)\b/i, cat: "sleep", weight: 1 },

  // Loss of interest / pleasure (weight 1)
  { re: /\b(don'?t|can'?t) (enjoy|care about|feel anything|find joy|find pleasure) (in )?(anything|anymore|any)\b/i, cat: "anhedonia", weight: 2 },
  { re: /\b(nothing|nothings?) (is |feels? )?(fun|interesting|worth|enjoyable|good) (any ?more)\b/i, cat: "anhedonia", weight: 1 },
  { re: /\b(stopped|quit|given up) (caring|trying|eating|showering|washing)\b/i, cat: "anhedonia", weight: 2 },
  { re: /\b(can'?t (be bothered|muster|bring myself)|don'?t have the energy) (to do anything|to get up|to eat|to shower|to move)\b/i, cat: "anhedonia", weight: 1 },
  { re: /\b(haven'?t|not) (eaten|showered|washed|brushed|changed) (in|for) (days|weeks|a while)\b/i, cat: "anhedonia", weight: 2 },

  // Farewell / settling affairs (weight 3 — higher risk)
  { re: /\b(thank(ing|s)?|want to thank) (you|everyone) for everything\b/i, cat: "farewell", weight: 2 },
  { re: /\b(wanted|want|need) to (say|tell) (goodbye|how much you mean|i love you|thanks)\b.*\b(before|while|in case)\b/i, cat: "farewell", weight: 3 },
  { re: /\b(giving|gave|give) (away|back) my (things|stuff|belongings|money|car|pet)\b/i, cat: "farewell", weight: 3 },
  { re: /\b(tying|tie|tied) up loose ends\b/i, cat: "farewell", weight: 2 },
  { re: /\b(deleting|deleted|clearing|cleared) (all )?(my )?(accounts?|social media|photos?|messages?|history)\b/i, cat: "farewell", weight: 2 },
  { re: /\b(writing|wrote) (letters?|messages?) to (everyone|my family|my friends|people i love|the people)\b/i, cat: "farewell", weight: 3 },

  // Self-worth erosion (weight 1)
  { re: /\b(i'?m |i am )(just |only )?(a (waste|failure|disappointment|mistake|nothing|nobody))\b/i, cat: "self_worth", weight: 1 },
  { re: /\beverything i (do|touch|try) (fails|goes wrong|falls apart|turns to)\b/i, cat: "self_worth", weight: 1 },
  { re: /\b(hate|despise|can'?t stand) (myself|who i am|what i'?ve become|looking at myself)\b/i, cat: "self_worth", weight: 2 },
  { re: /\bi (don'?t|can'?t) (love|like|stand|accept) myself\b/i, cat: "self_worth", weight: 1 },
  { re: /\b(everyone|they|people) (would be|are) (happier|better) (without me|if i left|if i wasn'?t)\b/i, cat: "self_worth", weight: 2 },

  // Loss of future orientation (weight 2)
  { re: /\b(can'?t|don'?t) (imagine|picture|see) (a |my )?(future|tomorrow|next year|getting old)\b/i, cat: "future_loss", weight: 2 },
  { re: /\b(doesn'?t|won'?t|don'?t) matter (soon|in the end|anyway|anymore)\b/i, cat: "future_loss", weight: 1 },
  { re: /\bnone of this (will |is going to )?(matter|last|mean anything)\b/i, cat: "future_loss", weight: 2 },
  { re: /\bwhat'?s the point of (planning|trying|making plans|the future)\b/i, cat: "future_loss", weight: 2 },

  // Substance / reckless behaviour (weight 1)
  { re: /\b(drinking|drunk|high|wasted|smashed|using) (every|all|most) (day|night|time|evening)\b/i, cat: "substance", weight: 1 },
  { re: /\b(don'?t care|doesn'?t matter) (what happens|if i get hurt|about (myself|my safety|consequences))\b/i, cat: "reckless", weight: 2 },
  { re: /\b(driving|drove) (recklessly|dangerously|way too fast|drunk|while drunk)\b/i, cat: "reckless", weight: 2 },

  // Persistent pain / suffering (weight 1)
  { re: /\bthe pain (never|won'?t|doesn'?t) (stops?|ends?|go away|get better)\b/i, cat: "pain", weight: 2 },
  { re: /\b(i'?m |i am )?(so |really )?(tired|exhausted|worn out) of (the pain|suffering|struggling|fighting)\b/i, cat: "pain", weight: 2 },
  { re: /\b(every|each) day (is |gets |feels )(worse|harder|more painful|more difficult)\b/i, cat: "pain", weight: 1 },
];

// ── Session-level accumulation (ConversationTracker) ────────────────────────
// Tracks subtle signals across messages in a conversation session.
// When accumulated weight crosses the threshold, escalates the crisis level.
//
// Privacy: NO message content is stored. Only signal categories and weights.
// Everything stays in memory and is garbage-collected when the tracker is destroyed.

const SUBTLE_THRESHOLD_LOW = 4;    // 4+ points → escalate to LOW
const SUBTLE_THRESHOLD_HIGH = 8;   // 8+ points → escalate to HIGH
const SESSION_WINDOW_MS = 30 * 60 * 1000; // 30-minute sliding window

class ConversationTracker {
  constructor(options = {}) {
    this.thresholdLow = options.thresholdLow || SUBTLE_THRESHOLD_LOW;
    this.thresholdHigh = options.thresholdHigh || SUBTLE_THRESHOLD_HIGH;
    this.windowMs = options.windowMs || SESSION_WINDOW_MS;
    this.signals = [];  // { timestamp, category, weight }
  }

  // Prune signals older than the session window
  _prune() {
    const cutoff = Date.now() - this.windowMs;
    this.signals = this.signals.filter(s => s.timestamp > cutoff);
  }

  // Get current accumulated weight
  getWeight() {
    this._prune();
    return this.signals.reduce((sum, s) => sum + s.weight, 0);
  }

  // Get unique categories triggered
  getCategories() {
    this._prune();
    return [...new Set(this.signals.map(s => s.category))];
  }

  // Get signal count
  getSignalCount() {
    this._prune();
    return this.signals.length;
  }

  // Process a message and return the effective crisis level (considering accumulation)
  process(text) {
    const singleResult = detect(text);

    // If HIGH or LOW already, record any subtle signals but return immediately
    if (singleResult.level === "high" || singleResult.level === "low") {
      this._recordSubtle(text); // still record for trend data
      return {
        ...singleResult,
        accumulated: false,
        sessionWeight: this.getWeight(),
        sessionCategories: this.getCategories(),
        sessionSignalCount: this.getSignalCount(),
      };
    }

    // Check for subtle signals
    const subtleHits = this._recordSubtle(text);
    const weight = this.getWeight();
    const categories = this.getCategories();
    const signalCount = this.getSignalCount();

    // Escalate based on accumulated weight
    let effectiveLevel = "none";
    let action = null;
    if (weight >= this.thresholdHigh) {
      effectiveLevel = "high";
      action = "accumulated_crisis";
    } else if (weight >= this.thresholdLow) {
      effectiveLevel = "low";
      action = "accumulated_distress";
    }

    return {
      level: effectiveLevel,
      matched: singleResult.matched,
      subtleSignals: subtleHits,
      accumulated: effectiveLevel !== "none",
      sessionWeight: weight,
      sessionCategories: categories,
      sessionSignalCount: signalCount,
    };
  }

  // Record subtle signal matches from a message
  _recordSubtle(text) {
    if (!text || typeof text !== "string") return [];
    const t = normalise(text);
    const hits = [];

    for (const sig of SUBTLE_SIGNALS) {
      const m = t.match(sig.re);
      if (m) {
        // Don't double-count same category within same message
        if (!hits.some(h => h.category === sig.cat)) {
          this.signals.push({
            timestamp: Date.now(),
            category: sig.cat,
            weight: sig.weight,
          });
          hits.push({ category: sig.cat, weight: sig.weight, matched: m[0] });
        }
      }
    }

    return hits;
  }

  // Reset the session (e.g., new conversation)
  reset() {
    this.signals = [];
  }

  // Get a summary for logging/debugging (no user content stored)
  summary() {
    this._prune();
    return {
      totalWeight: this.getWeight(),
      signalCount: this.getSignalCount(),
      categories: this.getCategories(),
      thresholdLow: this.thresholdLow,
      thresholdHigh: this.thresholdHigh,
      wouldEscalate: this.getWeight() >= this.thresholdLow,
    };
  }
}

// ── Single-message detection ────────────────────────────────────────────────

function detect(text) {
  if (!text || typeof text !== "string") return { level: "none", matched: null };

  const t = normalise(text);

  for (const re of HIGH_SIGNALS) {
    const m = t.match(re);
    if (m) {
      // Check false-positive guards before flagging
      if (isFalsePositive(t, m[0])) continue;
      return { level: "high", matched: m[0] };
    }
  }

  const reviewedHits = scanReviewedSignals(text);
  const reviewedHigh = reviewedHits.find((hit) => hit.level === "high");
  if (reviewedHigh) {
    return {
      level: "high",
      matched: reviewedHigh.matched,
      reviewed: reviewedHigh,
    };
  }

  for (const re of LOW_SIGNALS) {
    const m = t.match(re);
    if (m) {
      if (isFalsePositive(t, m[0])) continue;
      return { level: "low", matched: m[0] };
    }
  }

  const reviewedLow = reviewedHits.find((hit) => hit.level === "low");
  if (reviewedLow) {
    return {
      level: "low",
      matched: reviewedLow.matched,
      reviewed: reviewedLow,
    };
  }

  return { level: "none", matched: null };
}

function isHighCrisis(text) {
  return detect(text).level === "high";
}

function isAnyCrisis(text) {
  return detect(text).level !== "none";
}

function detectModeration(text) {
  if (!text || typeof text !== "string") {
    return { level: "none", category: null, matched: null };
  }

  const t = normalise(text);
  const groups = [
    { category: "threat", signals: THREAT_SIGNALS },
    { category: "hate", signals: HATE_SIGNALS },
  ];

  for (const group of groups) {
    for (const sig of group.signals) {
      const m = t.match(sig.re);
      if (m) {
        if (isModerationFalsePositive(t, m[0])) continue;
        return { level: sig.level, category: group.category, matched: m[0] };
      }
    }
  }

  return { level: "none", category: null, matched: null };
}

function scanReviewedSignals(text) {
  if (!text || typeof text !== "string") return [];

  const t = normalise(text);
  const hits = [];
  const addHits = (signals) => {
    for (const sig of signals) {
      const m = t.match(sig.re);
      if (!m || isFalsePositive(t, m[0])) continue;
      hits.push({
        level: sig.level,
        matched: m[0],
        sourceId: sig.sourceId,
        source: REVIEWED_SIGNAL_SOURCES[sig.sourceId] || null,
        family: sig.family,
        rationale: sig.rationale,
      });
    }
  };

  addHits(REVIEWED_HIGH_SIGNALS);
  addHits(REVIEWED_LOW_SIGNALS);
  return hits;
}

function detectReviewed(text) {
  const hits = scanReviewedSignals(text);
  const high = hits.find((h) => h.level === "high");
  const low = hits.find((h) => h.level === "low");
  const best = high || low;

  if (!best) {
    return {
      level: "none",
      matched: null,
      sourceId: null,
      source: null,
      family: null,
      rationale: null,
      hits,
    };
  }

  return { ...best, hits };
}

// Single-message subtle signal check (no accumulation, just detection)
function detectSubtle(text) {
  if (!text || typeof text !== "string") return [];
  const t = normalise(text);
  const hits = [];
  for (const sig of SUBTLE_SIGNALS) {
    const m = t.match(sig.re);
    if (m && !hits.some(h => h.category === sig.cat)) {
      hits.push({ category: sig.cat, weight: sig.weight, matched: m[0] });
    }
  }
  return hits;
}

module.exports = {
  detect,
  detectModeration,
  detectReviewed,
  scanReviewedSignals,
  detectSubtle,
  isHighCrisis,
  isAnyCrisis,
  ConversationTracker,
  REVIEWED_SIGNAL_PACK,
  REVIEWED_SIGNAL_SOURCES,
  REVIEWED_HIGH_SIGNALS,
  REVIEWED_LOW_SIGNALS,
  HIGH_SIGNALS,
  LOW_SIGNALS,
  THREAT_SIGNALS,
  HATE_SIGNALS,
  SUBTLE_SIGNALS,
  SUBTLE_THRESHOLD_LOW,
  SUBTLE_THRESHOLD_HIGH,
};
