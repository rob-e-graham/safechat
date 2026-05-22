/**
 * Safechat — Crisis signal detection
 *
 * Regex-based classifier that runs locally (no API calls, no data leaves the device).
 * Returns 'high', 'low', or 'none'.
 *
 * High = explicit self-harm or suicidal language → should trigger immediate intervention
 * Low  = hopelessness, worthlessness, feeling trapped → should trigger soft safety response
 * None = no crisis signals detected
 *
 * DESIGN PRINCIPLES:
 *   1. False negatives are more dangerous than false positives.
 *      Missing a real crisis could cost a life. A false alarm just shows a help modal.
 *   2. Input is normalised before matching — smart quotes, extra whitespace,
 *      common misspellings, and text-speak are all handled.
 *   3. False-positive guards prevent triggering on figurative language
 *      ("cut my hair", "hurt my ankle", "suicide squeeze play").
 */

// ── Input normalisation ──────────────────────────────────────────────────────
// Runs before all regex matching. Expands misspellings, text-speak, and
// normalises unicode so patterns can stay readable.

function normalise(text) {
  let t = text.toLowerCase();

  // Collapse all whitespace (tabs, multiple spaces, nbsp) to single space
  t = t.replace(/[\s ]+/g, " ").trim();

  // Smart quotes → ASCII
  t = t.replace(/[‘’‚‛]/g, "'");  // ' ' ‚ ‛  → '
  t = t.replace(/[“”„‟]/g, '"');  // " " „ ‟  → "

  // Common misspellings of crisis terms
  t = t.replace(/\bsuicde\b/g, "suicide");
  t = t.replace(/\bsuiside\b/g, "suicide");
  t = t.replace(/\bsuciide?\b/g, "suicide");
  t = t.replace(/\bsuidice?\b/g, "suicide");
  t = t.replace(/\bsuicd\b/g, "suicide");
  t = t.replace(/\boverdoze\b/g, "overdose");
  t = t.replace(/\boverdoase\b/g, "overdose");
  t = t.replace(/\bkil\b/g, "kill");

  // Text-speak and abbreviations
  t = t.replace(/\bwanna\b/g, "want to");
  t = t.replace(/\bgonna\b/g, "going to");
  t = t.replace(/\bgotta\b/g, "got to");
  t = t.replace(/\bwant 2\b/g, "want to");
  t = t.replace(/\b2 die\b/g, "to die");
  t = t.replace(/\bkms\b/g, "kill myself");
  t = t.replace(/\bkys\b/g, "kill yourself");

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
};

function isFalsePositive(text, matchedPattern) {
  // Check if the matched text falls under a known false-positive context
  if (/cut/.test(matchedPattern) && FP_GUARDS.cut_my.test(text)) return true;
  if (/hurt/.test(matchedPattern) && FP_GUARDS.hurt_my.test(text)) return true;
  if (/bleed/.test(matchedPattern) && (FP_GUARDS.bleed_economy.test(text) || FP_GUARDS.bleed_economy2.test(text))) return true;
  if (/suicid/.test(matchedPattern) && (FP_GUARDS.suicide_idiom.test(text) || FP_GUARDS.suicide_idiom2.test(text) || FP_GUARDS.html_class.test(text))) return true;
  if (/jump/.test(matchedPattern) && FP_GUARDS.jump_idiom.test(text)) return true;
  if (/overdose/.test(matchedPattern) && FP_GUARDS.overdose_idiom.test(text)) return true;
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

  // Passive but high-risk
  /\bbetter off dead\b/i,
  /\b(easiest|best|fastest|quickest|simplest) way to die\b/i,
  /\bhow (to|do i|can i|would i) (kill|end|off) (myself|my life|it all)\b/i,

  // Indirect warning signs — behavioural
  /\b(writing|wrote|write) (my )?(goodbye|suicide) (letters?|notes?)\b/i,
  /\bgave away (all |everything|my stuff|my things|my possessions)\b/i,
  /\bwon'?t be (here|around|alive) (much )?longer\b/i,
  /\bdon'?t care if i (wake|die|live)\b/i,
  /\bi have a plan\b.*\b(tonight|today|tomorrow|this week|the night)\b/i,
];

const LOW_SIGNALS = [
  /\bcan'?t go on\b/i,
  /\bno point\b/i,
  /\bnobody (cares|would miss me|would notice)\b/i,
  /\beveryone (would be |is )?better off (without me)?\b/i,
  /\bworthless\b/i,
  /\b(completely |utterly |totally )?hopeless\b/i,
  /\bending it (all)?\b/i,
  /\bnot worth (living|it)\b/i,
  /\bgive up on (life|everything|myself)\b/i,
  /\bwhat('?s| is) the point\b/i,
  /\bi (just )?can'?t (do this|take it|anymore)\b/i,
  /\bno way out\b/i,
  /\btoo much to bear\b/i,
  /\bno one (cares|understands|would miss)\b/i,
  /\bi('?m| am) (a |so |such a )?burden\b/i,
  /\blife is(n'?t| not) worth\b/i,
  /\bwish i (wasn'?t|weren'?t) (here|alive|born)\b/i,
  /\bcan'?t (see|find) (a |any )?(way |reason )?(to go on|forward|out)\b/i,
  /\btrapped\b.*\b(no|can'?t|won'?t)\b/i,
  /\bnothing (left|matters|to live for)\b/i,

  // Passive / indirect low-risk signals
  /\bdon'?t see a future\b/i,
  /\b(easier|better) if i (wasn'?t|weren'?t|am not) here\b/i,
];

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

  for (const re of LOW_SIGNALS) {
    const m = t.match(re);
    if (m) {
      if (isFalsePositive(t, m[0])) continue;
      return { level: "low", matched: m[0] };
    }
  }

  return { level: "none", matched: null };
}

function isHighCrisis(text) {
  return detect(text).level === "high";
}

function isAnyCrisis(text) {
  return detect(text).level !== "none";
}

module.exports = { detect, isHighCrisis, isAnyCrisis, HIGH_SIGNALS, LOW_SIGNALS };
