/**
 * Safechat — Crisis signal detection
 *
 * Regex-based classifier that runs locally (no API calls, no data leaves the device).
 * Returns 'high', 'low', or 'none'.
 *
 * High = explicit self-harm or suicidal language → should trigger immediate intervention
 * Low  = hopelessness, worthlessness, feeling trapped → should trigger soft safety response
 * None = no crisis signals detected
 */

const HIGH_SIGNALS = [
  /\bsuicid/i,
  /\bkill (my|myself|me)\b/i,
  /\bend(ing)? (my|this) life\b/i,
  /\btake my (own )?life\b/i,
  /\bwant to die\b/i,
  /\bwish (i was|i were|i'm) dead\b/i,
  /\bdon'?t want to (be here|live|exist)\b/i,
  /\bno reason to live\b/i,
  /\bself[- ]?harm/i,
  /\bhurt(ing)? (my|myself)\b/i,
  /\bcut(ting)? (my|myself)\b/i,
  /\boverdose\b/i,
  /\bhanging (my|myself)\b/i,
  /\bjump(ing)? (off|from)\b/i,
  /\bpills?\b.*\b(take|swallow|end)\b/i,
  /\b(end|stop) the pain\b/i,
  /\bslit(ting)? my\b/i,
  /\bbleed(ing)? out\b/i,
  /\bshoot(ing)? (my|myself)\b/i,
  /\bdrown(ing)? (my|myself)\b/i,
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
];

function detect(text) {
  if (!text || typeof text !== "string") return { level: "none", matched: null };
  const t = text.toLowerCase();

  for (const re of HIGH_SIGNALS) {
    const m = t.match(re);
    if (m) return { level: "high", matched: m[0] };
  }

  for (const re of LOW_SIGNALS) {
    const m = t.match(re);
    if (m) return { level: "low", matched: m[0] };
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
