/**
 * Safechat — Crisis signal detection
 *
 * Regex-based classifier that runs locally (no API calls, no data leaves the device).
 * Returns 'high', 'low', or 'none' for single-message detection.
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

  // Misspellings — self-harm / methods
  t = t.replace(/\bselfharm\b/g, "self-harm");
  t = t.replace(/\bselh[- ]?arm\b/g, "self-harm");
  t = t.replace(/\bhaning\b/g, "hanging");
  t = t.replace(/\bjumpin\b/g, "jumping");
  t = t.replace(/\bswalowing\b/g, "swallowing");
  t = t.replace(/\bbleding\b/g, "bleeding");

  // Text-speak and abbreviations
  t = t.replace(/\bwanna\b/g, "want to");
  t = t.replace(/\bgonna\b/g, "going to");
  t = t.replace(/\bgotta\b/g, "got to");
  t = t.replace(/\bwant 2\b/g, "want to");
  t = t.replace(/\b2 die\b/g, "to die");
  t = t.replace(/\bkms\b/g, "kill myself");
  t = t.replace(/\bkys\b/g, "kill yourself");
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
  /\bthere'?s no (coming back|turning back|going back)\b/i,
  /\bi (just )?need (it|everything|this) to (stop|end|be over)\b/i,
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
  /\bi (just )?can'?t (do this|take (it|this)( anymore)?|anymore)\b/i,
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
  /\bi'?m (so |just )?(tired|sick) of (living|life|everything|fighting|trying)\b/i,
  /\bno(body| one) (would|will) (ever )?(understand|help|miss|notice)\b/i,
  /\bdon'?t (belong|fit in) (here|anywhere)\b/i,
  /\b(broken|damaged) beyond (repair|fixing|help)\b/i,
  /\bgiven up (on|trying|hope|myself|everything)\b/i,
  /\b(always|forever) (be |feel )?(alone|lonely|miserable|unhappy)\b/i,
  /\bcan'?t (escape|get away from) (this|it|the pain|my thoughts?)\b/i,
  /\bdon'?t (deserve|have the right) to (live|be happy|be alive|be here)\b/i,
];

// ── Subtle signals ──────────────────────────────────────────────────────────
// Individually these are NOT crisis signals. But when 3+ appear in a session,
// they indicate accumulating distress that should trigger a safety check.
// Each has a weight (1-3). Threshold to escalate = 5 points within a session.

const SUBTLE_SIGNALS = [
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
  detectSubtle,
  isHighCrisis,
  isAnyCrisis,
  ConversationTracker,
  HIGH_SIGNALS,
  LOW_SIGNALS,
  SUBTLE_SIGNALS,
  SUBTLE_THRESHOLD_LOW,
  SUBTLE_THRESHOLD_HIGH,
};
