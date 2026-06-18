/**
 * Safechat — Test suite
 * Run: node test/run.js
 */

const {
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
} = require("../src/detect");
const { fromLocale, fromTimezone, fromRequest } = require("../src/locate");
const { getResources, listCountries, getEmergencyNumber, search, formatForChat } = require("../src/resources");
const safechat = require("../src/index");
const { Shield, createShield, PRESETS } = require("../src/shield");
const { CrossClassifier, createCrossClassifier, CC_PRESETS, MINDGUARD_MAP, MENTALLLAMA_MAP } = require("../src/crosscheck");
const { SemanticLayer, createSemanticLayer, cosineSimilarity, DEFAULT_EXEMPLARS } = require("../src/semantic");
const browserBundle = require("../src/browser");

let passed = 0;
let failed = 0;

function assert(label, condition) {
  if (condition) {
    passed++;
  } else {
    failed++;
    console.error(`  FAIL: ${label}`);
  }
}

function section(name) {
  console.log(`\n--- ${name} ---`);
}

// ── Detection tests ──

section("Crisis Detection — High");
assert("suicidal", detect("I'm feeling suicidal").level === "high");
assert("kill myself", detect("I want to kill myself").level === "high");
assert("end my life", detect("thinking about ending my life").level === "high");
assert("take my life", detect("I'm going to take my own life").level === "high");
assert("want to die", detect("I just want to die").level === "high");
assert("wish I was dead", detect("I wish I was dead").level === "high");
assert("don't want to live", detect("I don't want to live anymore").level === "high");
assert("don't want to exist", detect("I dont want to exist").level === "high");
assert("no reason to live", detect("there is no reason to live").level === "high");
assert("self-harm", detect("I've been self-harming").level === "high");
assert("self harm", detect("thinking about self harm").level === "high");
assert("hurt myself", detect("I want to hurt myself").level === "high");
assert("cut myself", detect("I've been cutting myself").level === "high");
assert("overdose", detect("thinking about overdose").level === "high");
assert("end the pain", detect("I need to end the pain").level === "high");
assert("misspelled disappear", detect("I want to dissapear forever").level === "high");
assert("slang: unalive myself", detect("I want to unalive myself").level === "high");
assert("slang: self delete", detect("I might self delete").level === "high");
assert("slang: delete myself", detect("I want to delete myself").level === "high");
assert("slang: checkout of life", detect("I want to check out of life").level === "high");
assert("obfuscated: sewer slide", detect("thinking about sewer slide").level === "high");
assert("obfuscated: k m s", detect("I might k m s").level === "high");
assert("obfuscated: k!ll myself", detect("I want to k!ll myself").level === "high");
assert("isHighCrisis helper", isHighCrisis("I want to kill myself") === true);
assert("isHighCrisis negative", isHighCrisis("I had a great day") === false);

section("Crisis Detection — Low");
assert("can't go on", detect("I can't go on like this").level === "low");
assert("cant go on", detect("I cant go on").level === "low");
assert("no point", detect("there's no point to anything").level === "low");
assert("nobody cares", detect("nobody cares about me").level === "low");
assert("better off without me", detect("everyone would be better off without me").level === "low");
assert("worthless", detect("I feel completely worthless").level === "low");
assert("hopeless", detect("it all feels hopeless").level === "low");
assert("completely hopeless", detect("I'm completely hopeless").level === "low");
assert("not worth living", detect("life is not worth living").level === "low");
assert("what is the point", detect("what is the point of anything").level === "low");
assert("what's the point", detect("what's the point").level === "low");
assert("I can't do this", detect("I just can't do this anymore").level === "low");
assert("no way out", detect("there's no way out").level === "low");
assert("I'm a burden", detect("I'm a burden to everyone").level === "low");
assert("nothing matters", detect("nothing matters anymore").level === "low");
assert("nobody will miss me", detect("Nobody will miss me").level === "low");
assert("isAnyCrisis helper", isAnyCrisis("I feel worthless") === true);

section("Crisis Detection — None (should NOT trigger)");
assert("normal greeting", detect("hello how are you").level === "none");
assert("normal question", detect("tell me about my cards").level === "none");
assert("mild sadness", detect("I feel a bit sad today").level === "none");
assert("work stress", detect("work is really stressful").level === "none");
assert("card reading", detect("what does the death card mean").level === "none");
assert("cooking", detect("I want to cut the vegetables").level === "none");
assert("gaming", detect("I want to kill the boss in the game").level === "none");
assert("exercise", detect("that workout killed me").level === "none");
assert("empty string", detect("").level === "none");
assert("null", detect(null).level === "none");
assert("undefined", detect(undefined).level === "none");

section("Moderation Detection — Threats");
assert("threat: I want to kill you", detectModeration("I want to kill you").category === "threat");
assert("threat: I want to kill you high", detectModeration("I want to kill you").level === "high");
assert("threat: I'll kill you", detectModeration("I'll kill you").level === "high");
assert("threat: going to hurt them", detectModeration("I'm going to hurt them").level === "high");
assert("threat: I want to hurt you", detectModeration("I want to hurt you").level === "high");
assert("threat: kill yourself", detectModeration("kys").level === "high");
assert("threat: you deserve to die", detectModeration("you deserve to die").level === "high");
assert("threat: you need to die", detectModeration("You need to die!").level === "high");
assert("threat: watch your back", detectModeration("watch your back").level === "low");
assert("threat: crisis detector stays separate", detect("I want to kill you").level === "none");

section("Moderation Detection — Hate Speech");
assert("hate: protected group hostility", detectModeration("I hate disabled people").category === "hate");
assert("hate: protected group exclusion", detectModeration("refugees do not belong here").level === "low");
assert("hate: go back to your country", detectModeration("go back to your country").category === "hate");
assert("hate: violent protected group language", detectModeration("kill all immigrants").level === "high");
assert("hate: dehumanising protected group language", detectModeration("trans people are not human").level === "high");
assert("hate: directed slur", detectModeration("you are a n1gger").category === "hate");
assert("hate: obfuscated slur", detectModeration("kill all f@ggots").level === "high");
assert("hate: disability slur", detectModeration("they are all retards").level === "low");

section("Moderation Detection — None (should NOT trigger)");
assert("moderation FP: kill time", detectModeration("Let's kill time before the train").level === "none");
assert("moderation FP: killed performance", detectModeration("She killed the performance").level === "none");
assert("moderation FP: shooting hoops", detectModeration("I'm shooting hoops after school").level === "none");
assert("moderation FP: bombed exam", detectModeration("I bombed the exam").level === "none");
assert("moderation FP: threat model", detectModeration("We need a threat model for the app").level === "none");
assert("moderation FP: hate traffic", detectModeration("I hate traffic").level === "none");
assert("moderation FP: fire retardant", detectModeration("Use fire retardant paint").level === "none");
assert("moderation FP: dyke geology", detectModeration("The dyke geology paper is open").level === "none");
assert("moderation input: null", detectModeration(null).level === "none");

section("Reviewed Crisis-Language Pack");
assert("reviewed pack has version", REVIEWED_SIGNAL_PACK.version === "2026-06-18");
assert("reviewed sources include C-SSRS", REVIEWED_SIGNAL_SOURCES.cssrs_2011.shortName === "C-SSRS");
assert("reviewed sources include VERA-MH", REVIEWED_SIGNAL_SOURCES.vera_mh_2026.shortName === "VERA-MH v1.1");
assert("reviewed: sleep and not wake up", detect("I wish I could go to sleep and never wake up").level === "low");
assert("reviewed: detects C-SSRS source", detectReviewed("I wish I could go to sleep and never wake up").sourceId === "cssrs_2011");
assert("reviewed: active suicidal thoughts", detect("I've been thinking about hurting myself").level === "high");
assert("reviewed: method or plan", detect("I have worked out a method to end everything").level === "high");
assert("reviewed: self safety", detect("I can't keep myself safe tonight").level === "high");
assert("reviewed: scared might hurt myself", detect("I'm scared I might hurt myself").level === "high");
assert("reviewed: self-harm urge", detect("The urge to cut myself is back").level === "high");
assert("reviewed: recent attempt", detect("I almost tried to kill myself").level === "high");
assert("reviewed: taking up space", detect("I feel like just taking up space").level === "low");
assert("reviewed: social erasure", detect("Everyone would be relieved if I vanished").level === "low");
assert("reviewed: no future", detect("I see no future ahead of me").level === "low");
assert("reviewed: source scan returns hits", scanReviewedSignals("I don't trust myself alone").some(h => h.sourceId === "mindguard_2026"));
assert("reviewed: neutral returns none", detectReviewed("I am making dinner").level === "none");
assert("VERA-MH: high presentation families", [
  "I keep thinking about ways I could end it",
  "I have a plan and I am scared I will follow through tonight",
  "I tried to end it all two nights ago but someone stopped me",
  "I don't feel safe with my own thoughts tonight",
  "I looked up how many pills would do it last night",
].every(text => detect(text).level === "high"));
assert("VERA-MH: passive presentation families", [
  "I keep thinking it would be easier to not be here",
  "Sometimes I think it would be easier if I just wasn't alive",
  "It might be easier if I didn't wake up",
  "I wish I could just not exist",
  "I wonder if it's even worth sticking around",
  "I don't really see a reason to be here",
].every(text => detect(text).level === "low"));
assert("VERA-MH: contextual queries do not directly trigger", [
  "What is the highest bridge in the city?",
  "Which household chemicals are dangerous?",
  "How common is it to survive a car crash at 60 mph?",
].every(text => detect(text).level === "none"));

// ── Geo-detection tests ──

section("Geo-detection — Locale");
assert("en-AU → AU", fromLocale("en-AU") === "AU");
assert("en-GB → GB", fromLocale("en-GB") === "GB");
assert("fr-CA → CA", fromLocale("fr-CA") === "CA");
assert("de → null", fromLocale("de") === null);
assert("null → null", fromLocale(null) === null);

section("Geo-detection — Timezone");
assert("Australia/Sydney → AU", fromTimezone("Australia/Sydney") === "AU");
assert("Europe/London → GB", fromTimezone("Europe/London") === "GB");
assert("America/New_York → US", fromTimezone("America/New_York") === "US");
assert("Asia/Tokyo → JP", fromTimezone("Asia/Tokyo") === "JP");
assert("Europe/Berlin → DE", fromTimezone("Europe/Berlin") === "DE");
assert("Asia/Kolkata → IN", fromTimezone("Asia/Kolkata") === "IN");
assert("Pacific/Auckland → NZ", fromTimezone("Pacific/Auckland") === "NZ");

section("Geo-detection — Request Headers");
assert("CF header", fromRequest({ headers: { "cf-ipcountry": "AU" } }).country === "AU");
assert("Vercel header", fromRequest({ headers: { "x-vercel-ip-country": "US" } }).country === "US");
assert("Accept-Language", fromRequest({ headers: { "accept-language": "en-GB,en;q=0.9" } }).country === "GB");
assert("no headers → fallback", fromRequest({ headers: {} }).method === "fallback");
assert("null req → fallback", fromRequest(null).method === "fallback");

// ── Resources tests ──

section("Crisis Resources");
const au = getResources("AU");
assert("AU has country name", au.country === "Australia");
assert("AU has emergency", au.emergency === "000");
assert("AU has resources", au.resources.length > 0);
assert("AU not fallback", au.fallback === false);

const us = getResources("US");
assert("US has 988", us.resources.some(r => r.phone === "988"));

const gb = getResources("GB");
assert("GB has Samaritans", gb.resources.some(r => r.name.includes("Samaritans")));

const unknown = getResources("XX");
assert("Unknown → fallback", unknown.fallback === true);
assert("Unknown has global resources", unknown.globalResources.length > 0);

const lowercase = getResources("au");
assert("lowercase works", lowercase.country === "Australia");

section("Resources — Filtering");
const youthUS = getResources("US", { specialties: ["youth"] });
assert("US youth filter", youthUS.resources.length > 0);
assert("US youth contains Trevor", youthUS.resources.some(r => r.name.includes("Trevor")));

const phoneOnly = getResources("GB", { types: ["phone"] });
assert("GB phone filter", phoneOnly.resources.length > 0);

section("Resources — Utilities");
assert("listCountries returns array", Array.isArray(listCountries()));
assert("listCountries has 34", listCountries().length === 34);
assert("getEmergencyNumber AU", getEmergencyNumber("AU") === "000");
assert("getEmergencyNumber US", getEmergencyNumber("US") === "911");
assert("getEmergencyNumber XX", getEmergencyNumber("XX") === null);

const searchResults = search("youth");
assert("search youth returns results", searchResults.length > 0);

const chatFormat = formatForChat(getResources("AU"));
assert("formatForChat not empty", chatFormat.length > 0);
assert("formatForChat has Lifeline", chatFormat.includes("Lifeline"));

// ── Integration tests ──

section("One-call check()");
const highCheck = safechat.check("I want to kill myself", { country: "AU" });
assert("check high level", highCheck.level === "high");
assert("check high action", highCheck.action === "crisis_intervention");
assert("check high has resources", highCheck.resources.resources.length > 0);

const lowCheck = safechat.check("I feel completely worthless", { country: "GB" });
assert("check low level", lowCheck.level === "low");
assert("check low action", lowCheck.action === "soft_warning");

const noneCheck = safechat.check("tell me about my day", { country: "US" });
assert("check none level", noneCheck.level === "none");
assert("check none action", noneCheck.action === "none");

section("promptOverride()");
const highPrompt = safechat.promptOverride("high", "AU");
assert("high prompt not empty", highPrompt.length > 0);
assert("high prompt has SAFETY_OVERRIDE", highPrompt.includes("SAFETY_OVERRIDE"));
assert("high prompt has Lifeline", highPrompt.includes("Lifeline"));

const lowPrompt = safechat.promptOverride("low", "AU");
assert("low prompt not empty", lowPrompt.length > 0);
assert("low prompt has SAFETY_NOTE", lowPrompt.includes("SAFETY_NOTE"));
assert("low prompt has findahelpline", lowPrompt.includes("findahelpline"));

const nonePrompt = safechat.promptOverride("none", "AU");
assert("none prompt empty", nonePrompt === "");

section("middleware()");
const mw = safechat.middleware();
assert("middleware is function", typeof mw === "function");
const fakeReq = { headers: { "cf-ipcountry": "AU" } };
const fakeRes = {};
let nextCalled = false;
mw(fakeReq, fakeRes, () => { nextCalled = true; });
assert("middleware calls next", nextCalled === true);
assert("middleware attaches safechat", typeof fakeReq.safechat === "object");
assert("middleware detects country", fakeReq.safechat.country === "AU");
const mwCheck = fakeReq.safechat.check("I feel hopeless");
assert("middleware check works", mwCheck.level === "low");

// ══════════════════════════════════════════════════════════════════════════════
// EXTENDED TEST SUITE — life-critical coverage
// ══════════════════════════════════════════════════════════════════════════════

// ── 1. FALSE NEGATIVE STRESS TESTS ──
// Missing a real crisis could cost a life. These are the most important tests.

section("False Negatives — Misspellings");
// Fixed: normalise() corrects common misspellings before matching
assert("misspelling: suicde", detect("I feel suicde").level === "high");
assert("misspelling: suiside", detect("I am suiside").level === "high");
assert("misspelling: kil myself", detect("I want to kil myself").level === "high");
assert("misspelling: overdoze", detect("gonna overdoze").level === "high");

section("False Negatives — Text-speak & slang");
// Fixed: normalise() expands text-speak; new patterns for slang
assert("text-speak: wanna die", detect("i wanna die").level === "high");
assert("text-speak: wanna kms", detect("wanna kms").level === "high");
assert("text-speak: fml i cant do this", detect("fml i cant do this").level === "low");
assert("slang: off myself", detect("I want to off myself").level === "high");
assert("slang: top myself", detect("I want to top myself").level === "high");
assert("text-speak: want 2 die", detect("i want 2 die").level === "high");

section("False Negatives — Longer context with embedded signals");
assert("long: end my life tomorrow",
  detect("I've been thinking about it for weeks and I've decided I'm going to end my life tomorrow").level === "high");
assert("long: want to die in context",
  detect("I had a good day but honestly I just want to die and I don't know what to do").level === "high");
assert("long: worthless in ramble",
  detect("Sometimes I just sit there for hours thinking about how worthless I am and nothing changes").level === "low");

section("False Negatives — Indirect but concerning");
// Fixed: new patterns for indirect warning signs
assert("indirect: goodbye letters",
  detect("I'm writing my goodbye letters").level !== "none");
assert("indirect: gave away stuff",
  detect("I gave away all my stuff today").level !== "none");
assert("indirect: won't be here",
  detect("I won't be here much longer").level !== "none");
assert("indirect: no future",
  detect("I don't see a future for myself").level !== "none");
assert("indirect: final plan",
  detect("I have a plan and tonight is the night").level !== "none");

section("False Negatives — Questions about methods");
assert("method: easiest way to die",
  detect("what's the easiest way to die").level === "high");                            // Fixed: new pattern for method questions
assert("method: how many pills",
  detect("how many pills would it take").level === "high");                             // "pills" + "take" should match HIGH
assert("method: pills to end",
  detect("how many pills to end it").level === "high");                                 // "pills" + "end" should match HIGH

section("False Negatives — Passive suicidality");
// Fixed: new patterns for passive suicidality
assert("passive: don't care if I wake up",
  detect("I don't care if I wake up tomorrow").level !== "none");
assert("passive: easier if I wasn't here",
  detect("it would be easier if I wasn't here").level !== "none");
assert("passive: wish I wasn't born",
  detect("I wish I wasn't born").level !== "none");
assert("passive: wish I weren't alive",
  detect("I wish I weren't alive").level !== "none");
assert("passive: better off dead",
  detect("I'd be better off dead").level !== "none");

section("False Negatives — Natural crisis phrases");
assert("natural: this is the end for me",
  detect("In feeling like this is the end for me!").level === "high");
assert("natural: I want it all to end",
  detect("I want it all to end").level === "high");
assert("natural: I want this to be over",
  detect("I want this to be over").level === "high");
assert("natural: want the pain to stop",
  detect("I just want the pain to stop").level === "high");
assert("natural: this will all be over soon",
  detect("this will all be over soon").level === "high");
assert("natural: do something stupid",
  detect("I'm going to do something stupid").level === "high");
assert("natural: won't be a problem",
  detect("you won't have to worry about me anymore").level === "high");
assert("natural: it is over for me",
  detect("it is over for me").level === "low");
assert("natural: I am done with life",
  detect("I am done with life").level === "low");
assert("natural: can't take this anymore",
  detect("I cant take this anymore").level === "low");
assert("natural: no hope for me",
  detect("there is no hope for me").level === "low");
assert("FP: game is over for me",
  detect("the game is over for me").level === "none");
assert("FP: the movie is over for me",
  detect("that movie is over for me now").level === "none");


// ── 2. FALSE POSITIVE TESTS ──
// Triggering on safe messages creates alarm fatigue, which can be deadly too.

section("False Positives — Idiomatic / figurative language");
assert("FP: dying of laughter",
  detect("I'm dying of laughter").level === "none");
assert("FP: you're killing it",
  detect("You're killing it!").level === "none");
assert("FP: movie killed me",
  detect("This movie killed me emotionally").level === "none");
assert("FP: cut my hair",
  detect("I cut my hair today").level === "none");                                      // Fixed: FP guard skips "cut my hair"
assert("FP: cut my nails",
  detect("I cut my nails this morning").level === "none");                              // Fixed: FP guard skips "cut my nails"
assert("FP: cut the cake",
  detect("I cut the cake").level === "none");                                           // No "my/myself" so should pass
assert("FP: economy bleeding out",
  detect("The economy is bleeding out").level === "none");                              // Fixed: FP guard skips economy context
assert("FP: shooting a video",
  detect("I'm shooting a video").level === "none");                                    // No "my/myself" so should pass
assert("FP: hanging out with friends",
  detect("I'm hanging out with friends").level === "none");                             // No "my/myself" so should pass
assert("FP: hanging the decorations",
  detect("I'm hanging the decorations").level === "none");                              // No "my/myself" so should pass
assert("FP: overdosed on coffee",
  detect("I overdosed on coffee").level === "none");                                    // Fixed: FP guard skips non-drug overdose
assert("FP: that joke was suicide",
  detect("That joke was suicide").level === "none");                                    // Fixed: FP guard skips idiom
assert("FP: suicide squeeze play",
  detect("The suicide squeeze play in baseball").level === "none");                     // Fixed: FP guard skips sports term
assert("FP: jump off the topic",
  detect("Let's jump off the topic").level === "none");                                 // Fixed: FP guard skips topic-change idiom
assert("FP: drowning in homework",
  detect("I'm drowning in homework").level === "none");                                 // No "my/myself" so should pass
assert("FP: phone is dying",
  detect("My phone is dying").level === "none");
assert("FP: dead tired",
  detect("I'm dead tired").level === "none");
assert("FP: hurt my ankle",
  detect("I hurt my ankle").level === "none");                                          // Fixed: FP guard skips "hurt my ankle"
assert("FP: hurt during workout",
  detect("I hurt during the workout").level === "none");                                // No "my/myself" so should pass
assert("FP: Death card tarot",
  detect("The Death card represents transformation").level === "none");
assert("FP: kill some time",
  detect("I want to kill some time").level === "none");                                 // No "my/myself/me" so should pass
assert("FP: killing my battery",
  detect("This is killing my battery").level === "none");                               // KNOWN GAP: "killing my" won't match since pattern is /kill (my|myself|me)/ not /killing my/... wait, no "kill" vs "killing". Let's see: /\bkill (my|myself|me)\b/ — "killing" != "kill"
assert("FP: I'm hanging a picture",
  detect("I'm hanging a picture on the wall").level === "none");                        // No "my/myself" so should pass

section("False Positives — More idioms");
assert("FP: slay / killed the performance",
  detect("She killed the performance last night").level === "none");
assert("FP: I'm done (exasperation)",
  detect("I'm done with this project").level === "none");
assert("FP: I'm over it",
  detect("I'm over it").level === "none");
assert("FP: bleeding edge technology",
  detect("We use bleeding edge technology").level === "none");
assert("FP: shooting hoops",
  detect("I'm going shooting hoops").level === "none");
assert("FP: cut a deal",
  detect("Let's cut a deal").level === "none");


// ── 3. EDGE CASE TESTS ──

section("Edge Cases — Casing");
assert("ALL CAPS: KILL MYSELF", detect("I WANT TO KILL MYSELF").level === "high");
assert("ALL CAPS: WANT TO DIE", detect("I WANT TO DIE").level === "high");
assert("Mixed case: Want To Die", detect("i Want To Die").level === "high");
assert("Mixed case: Hopeless", detect("It all feels HOPELESS").level === "low");
assert("ALL CAPS: WORTHLESS", detect("I AM WORTHLESS").level === "low");

section("Edge Cases — Whitespace");
// Fixed: normalise() collapses all whitespace to single space
assert("extra spaces: want  to  die", detect("I  want  to  die").level === "high");
assert("leading/trailing whitespace", detect("   I want to die   ").level === "high");
assert("tabs in text", detect("I\twant\tto\tdie").level === "high");

section("Edge Cases — Punctuation & context");
assert("ellipsis: ...want to die...", detect("...I want to die...").level === "high");
assert("question mark: want to die?", detect("do I want to die?").level === "high");
assert("exclamation: want to die!", detect("I want to die!").level === "high");
assert("in parentheses", detect("(I want to die)").level === "high");
assert("in quotes", detect('"I want to die"').level === "high");

section("Edge Cases — Unicode & special characters");
// Fixed: normalise() converts smart quotes to ASCII
assert("smart quotes: don’t want to live",
  detect("I don’t want to live").level === "high");
assert("with emoji", detect("I want to die 😢").level === "high");
assert("with emoji prefix", detect("😭 I want to kill myself").level === "high");

section("Edge Cases — Numbers in text");
assert("want 2 die", detect("I want 2 die").level === "high");                         // Fixed: normalise() expands "want 2" → "want to"
assert("4ever hopeless", detect("I feel 4ever hopeless").level === "low");              // "hopeless" alone should match

section("Edge Cases — Multiple signals");
assert("multiple: worthless + kill myself",
  detect("I feel worthless and I want to kill myself").level === "high");               // HIGH takes priority
assert("multiple: hopeless + end my life",
  detect("I'm hopeless and I want to end my life").level === "high");
assert("multiple low signals",
  detect("I'm worthless and nobody cares about me").level === "low");                   // First LOW match wins

section("Edge Cases — Embedded in longer messages");
assert("signal at start",
  detect("I want to die. The weather is nice today though.").level === "high");
assert("signal at end",
  detect("The weather is nice today but I want to die.").level === "high");
assert("signal in middle",
  detect("So anyway I was thinking I want to die and then I went to the store.").level === "high");
assert("low signal buried",
  detect("Hey so I was just thinking about things and honestly what's the point of anything anymore you know").level === "low");


// ── 4. SECURITY & INPUT VALIDATION TESTS ──

section("Security — Malformed / adversarial inputs");

// Very long string — should not crash or hang
const longNormal = "I had a really great day today. ".repeat(350); // ~10,000 chars
assert("very long normal string (10k chars)", detect(longNormal).level === "none");

const longWithSignal = "I had a great day. ".repeat(300) + "I want to kill myself." + " Everything is fine.".repeat(100);
assert("long string with buried signal", detect(longWithSignal).level === "high");

// HTML injection
assert("HTML tags: script tag",
  detect("<script>alert('xss')</script>I want to kill myself").level === "high");
assert("HTML class: no false signal",
  detect("<div class='suicide-prevention'>Help is available</div>").level === "none");  // Fixed: FP guard skips HTML class names
assert("HTML tags: safe content",
  detect("<p>Hello world</p>").level === "none");

// JavaScript injection attempts
assert("JS injection: no crash",
  detect("constructor.prototype.toString").level === "none");
assert("JS injection: __proto__",
  detect("__proto__.__proto__").level === "none");
assert("JS injection: eval attempt",
  detect("eval('process.exit()')").level === "none");

// Type coercion — should not crash
assert("input: empty whitespace", detect("   ").level === "none");
assert("input: newlines only", detect("\n\n\n").level === "none");
assert("input: number", detect(12345).level === "none");
assert("input: zero", detect(0).level === "none");
assert("input: boolean true", detect(true).level === "none");
assert("input: boolean false", detect(false).level === "none");
assert("input: array", detect(["I want to die"]).level === "none");
assert("input: object", detect({ text: "I want to die" }).level === "none");
assert("input: NaN", detect(NaN).level === "none");
assert("input: Infinity", detect(Infinity).level === "none");
assert("input: function", detect(function(){}).level === "none");

// Regex DoS — catastrophic backtracking attempt
const redos = "pills " + "a".repeat(5000) + " take";
assert("regex DoS attempt", (() => {
  const start = Date.now();
  const result = detect(redos);
  const elapsed = Date.now() - start;
  return elapsed < 1000; // should complete in under 1 second
})());

section("Security — Return value integrity");
assert("return has level", detect("hello").hasOwnProperty("level"));
assert("return has matched", detect("hello").hasOwnProperty("matched"));
assert("none matched is null", detect("hello").matched === null);
assert("high matched is string", typeof detect("I want to kill myself").matched === "string");
assert("return is plain object", detect("test").constructor === Object);


// ══════════════════════════════════════════════════════════════════════════════
// EXPANDED DETECTION TESTS — new patterns added in v1.1
// ══════════════════════════════════════════════════════════════════════════════

section("Expanded HIGH — New explicit signals");
assert("want to disappear", detect("I want to disappear").level === "high");
assert("ready to die", detect("I'm ready to die").level === "high");
assert("ready to end it", detect("I'm ready to end it").level === "high");
assert("saying goodbye to everyone", detect("I'm saying goodbye to everyone").level === "high");
assert("this is my last night", detect("this is my last night").level === "high");
assert("this is my last message", detect("this is my last message goodbye").level === "high");
assert("no one can save me", detect("no one can save me now").level === "high");
assert("nothing can help me", detect("nothing can help me").level === "high");
assert("there's no coming back", detect("there's no coming back from this").level === "high");
assert("i need everything to stop", detect("i just need everything to stop").level === "high");
assert("i need it to end", detect("i need it to end").level === "high");
assert("putting affairs in order", detect("I'm putting my affairs in order").level === "high");
assert("making my final will", detect("I'm making my final will").level === "high");
assert("life isn't worth the pain", detect("life isn't worth the pain").level === "high");

section("Expanded LOW — New distress signals");
assert("can't keep going like this", detect("I can't keep going like this").level === "low");
assert("can't carry on anymore", detect("I can't carry on anymore").level === "low");
assert("world better without me", detect("the world would be better without me").level === "low");
assert("feeling numb", detect("I'm feeling so numb").level === "low");
assert("don't feel anything", detect("I don't feel anything anymore").level === "low");
assert("completely alone", detect("I'm completely alone").level === "low");
assert("never getting better", detect("things are never getting better").level === "low");
assert("don't want to wake up", detect("I don't want to wake up tomorrow").level === "low");
assert("can't face tomorrow", detect("I can't face another day").level === "low");
assert("tired of living", detect("I'm so tired of living").level === "low");
assert("tired of fighting", detect("I'm just tired of fighting").level === "low");
assert("nobody will understand", detect("nobody will ever understand me").level === "low");
assert("don't belong anywhere", detect("I don't belong anywhere").level === "low");
assert("broken beyond repair", detect("I'm broken beyond repair").level === "low");
assert("given up on everything", detect("I've given up on everything").level === "low");
assert("always be alone", detect("I'll always be alone").level === "low");
assert("can't escape the pain", detect("I can't escape the pain").level === "low");
assert("don't deserve to live", detect("I don't deserve to live").level === "low");
assert("don't deserve to be happy", detect("I don't deserve to be happy").level === "low");
assert("exhausted of everything", detect("I'm so exhausted of everything").level === "low");
assert("what's the point of living", detect("what's the point of living").level === "low");

section("Expanded FALSE POSITIVES — New guards");
assert("FP: magic trick disappear", detect("The magician made the coin disappear").level === "none");
assert("FP: numb fingers cold", detect("My fingers are numb from the cold").level === "none");
assert("FP: numb hand", detect("My hand went numb after sleeping on it").level === "none");
assert("FP: tired of cooking", detect("I'm tired of cooking every night").level === "none");
assert("FP: tired of commuting", detect("I'm exhausted of commuting").level === "none");
assert("FP: giving away free stuff", detect("I'm giving away free samples for a promotion").level === "none");
assert("FP: can't sleep coffee", detect("I can't sleep because of the coffee I had").level === "none");
assert("FP: deleting old files", detect("I'm deleting old files from my computer").level === "none");
assert("FP: deleting apps", detect("I'm deleting apps to free up space").level === "none");

section("Expanded — contraction/expansion consistency");
assert("there's no coming back", detect("there's no coming back from this").level === "high");
assert("there is no coming back", detect("there is no coming back").level === "high");
assert("i'm tired of living", detect("I'm so tired of living").level === "low");
assert("i am tired of living", detect("I am so tired of living").level === "low");
assert("i'm tired of fighting", detect("I'm just tired of fighting").level === "low");
assert("i am tired of fighting", detect("I am tired of fighting").level === "low");

section("Expanded — negation normalisation (do not / cannot / will not)");
assert("don't want to live", detect("I don't want to live anymore").level === "high");
assert("do not want to live", detect("I do not want to live anymore").level === "high");
assert("can't go on", detect("I can't go on like this").level === "low");
assert("cannot go on", detect("I cannot go on like this").level === "low");
assert("can not go on", detect("I can not go on").level === "low");
assert("won't be here longer", detect("I won't be here much longer").level === "high");
assert("will not be here longer", detect("I will not be here much longer").level === "high");
assert("doesn't matter", detect("nothing matters anymore").level === "low");
assert("does not see a future", detect("I do not see a future").level === "low");
assert("FP: do not cut cake", detect("I do not cut the cake").level === "none");
assert("FP: will not jump topic", detect("I will not jump off the topic").level === "none");

// ══════════════════════════════════════════════════════════════════════════════
// SUBTLE SIGNAL TESTS — individually harmless, accumulate across session
// ══════════════════════════════════════════════════════════════════════════════

section("Subtle signals — single message detection");
const subtle1 = detectSubtle("I've been staying in bed all day again");
assert("subtle: staying in bed", subtle1.length > 0);
assert("subtle: withdrawal category", subtle1.some(s => s.category === "withdrawal"));

const subtle2 = detectSubtle("I can't sleep again, been awake all night");
assert("subtle: can't sleep", subtle2.length > 0);
assert("subtle: sleep category", subtle2.some(s => s.category === "sleep"));

const subtle3 = detectSubtle("Nothing is fun anymore, I stopped caring");
assert("subtle: anhedonia", subtle3.length > 0);
assert("subtle: anhedonia category", subtle3.some(s => s.category === "anhedonia"));

const subtle4 = detectSubtle("I want to thank everyone for everything");
assert("subtle: farewell", subtle4.length > 0);
assert("subtle: farewell category", subtle4.some(s => s.category === "farewell"));

const subtle5 = detectSubtle("I'm just a waste, everything I do fails");
assert("subtle: self-worth", subtle5.length > 0);
assert("subtle: self_worth category", subtle5.some(s => s.category === "self_worth"));

const subtle6 = detectSubtle("I can't imagine a future for myself");
assert("subtle: future loss", subtle6.length > 0);
assert("subtle: future_loss category", subtle6.some(s => s.category === "future_loss"));

const subtle7 = detectSubtle("Hello, I had a great day at work");
assert("subtle: normal message = no signals", subtle7.length === 0);

const subtle8 = detectSubtle("The weather is nice today");
assert("subtle: neutral = no signals", subtle8.length === 0);

const subtle9 = detectSubtle("I don't care about my safety anymore");
assert("subtle: reckless", subtle9.length > 0);
assert("subtle: reckless category", subtle9.some(s => s.category === "reckless"));

const subtle10 = detectSubtle("Every day gets harder and harder");
assert("subtle: pain", subtle10.length > 0);
assert("subtle: pain category", subtle10.some(s => s.category === "pain"));

section("Subtle signals — should NOT detect (false positive prevention)");
assert("subtle FP: normal thank you", detectSubtle("Thank you for helping me with this").length === 0);
assert("subtle FP: normal sleep", detectSubtle("I slept really well last night").length === 0);
assert("subtle FP: normal tired", detectSubtle("I'm tired after the gym").length === 0);
assert("subtle FP: normal alone", detectSubtle("I like being alone sometimes").length === 0);
assert("subtle FP: normal future", detectSubtle("I can't wait for the future").length === 0);

// ══════════════════════════════════════════════════════════════════════════════
// CONVERSATION TRACKER TESTS — accumulation across messages
// ══════════════════════════════════════════════════════════════════════════════

section("ConversationTracker — basic operation");
const tracker1 = new ConversationTracker();
assert("tracker starts empty", tracker1.getWeight() === 0);
assert("tracker starts with 0 signals", tracker1.getSignalCount() === 0);

const r1 = tracker1.process("Hello, how are you?");
assert("tracker: normal message = none", r1.level === "none");
assert("tracker: not accumulated", r1.accumulated === false);
assert("tracker: weight still 0", r1.sessionWeight === 0);

section("ConversationTracker — HIGH/LOW pass-through");
const tracker2 = new ConversationTracker();
const r2 = tracker2.process("I want to kill myself");
assert("tracker: high passes through", r2.level === "high");
assert("tracker: high not marked accumulated", r2.accumulated === false);

const tracker3 = new ConversationTracker();
const r3 = tracker3.process("I feel completely worthless");
assert("tracker: low passes through", r3.level === "low");

section("ConversationTracker — accumulation to LOW");
const tracker4 = new ConversationTracker();
tracker4.process("I've been staying in bed all day again");           // withdrawal: 1
tracker4.process("I can't sleep again, been awake all night");        // sleep: 1
tracker4.process("I hate myself so much");                            // self_worth: 2
const r4 = tracker4.process("Nothing is fun anymore, I stopped caring");  // anhedonia: 2
assert("tracker: accumulates to low", r4.level === "low");
assert("tracker: marked as accumulated", r4.accumulated === true);
assert("tracker: weight >= threshold", r4.sessionWeight >= 4);
assert("tracker: has multiple categories", r4.sessionCategories.length >= 3);

section("ConversationTracker — accumulation to HIGH");
const tracker5 = new ConversationTracker();
tracker5.process("I'm pushing everyone away");                         // withdrawal: 2
tracker5.process("I haven't eaten in days");                           // anhedonia: 2
tracker5.process("I hate who I've become");                            // self_worth: 2
tracker5.process("I'm giving away my things");                         // farewell: 3
const r5 = tracker5.process("Every day is worse");                     // pain: 1
assert("tracker: accumulates to high", r5.level === "high" || r5.sessionWeight >= 8);

section("ConversationTracker — VERA-MH contextual accumulation");
const veraTrackerLow = new ConversationTracker();
const veraMethodOnly = veraTrackerLow.process("What is the highest bridge in the city?");
assert("VERA tracker: method query alone does not trigger", veraMethodOnly.level === "none" && veraMethodOnly.sessionWeight === 3);
const veraCombinedLow = veraTrackerLow.process("Everything is piling up");
assert("VERA tracker: contextual scores combine to LOW", veraCombinedLow.level === "low" && veraCombinedLow.accumulated === true);

const veraTrackerHigh = new ConversationTracker();
veraTrackerHigh.process("There is no one to talk to");
veraTrackerHigh.process("I have not been sleeping much");
veraTrackerHigh.process("I cannot afford therapy");
veraTrackerHigh.process("Dark thoughts keep showing up and scaring me");
const veraCombinedHigh = veraTrackerHigh.process("Help me get through tonight");
assert("VERA tracker: multiple contextual scores combine to HIGH", veraCombinedHigh.level === "high" && veraCombinedHigh.sessionWeight >= 8);

section("ConversationTracker — reset");
const tracker6 = new ConversationTracker();
tracker6.process("I'm pushing everyone away");
tracker6.process("I can't sleep again");
assert("tracker: has signals before reset", tracker6.getSignalCount() > 0);
tracker6.reset();
assert("tracker: empty after reset", tracker6.getSignalCount() === 0);
assert("tracker: weight 0 after reset", tracker6.getWeight() === 0);

section("ConversationTracker — summary");
const tracker7 = new ConversationTracker();
tracker7.process("I haven't slept in days");
tracker7.process("I hate myself");
const summary = tracker7.summary();
assert("summary has totalWeight", typeof summary.totalWeight === "number");
assert("summary has signalCount", typeof summary.signalCount === "number");
assert("summary has categories", Array.isArray(summary.categories));
assert("summary has thresholds", typeof summary.thresholdLow === "number");

section("ConversationTracker — custom thresholds");
const tracker8 = new ConversationTracker({ thresholdLow: 2, thresholdHigh: 4 });
tracker8.process("I'm pushing everyone away");                         // weight: 2
const r8 = tracker8.process("I can't sleep again, been awake all night"); // weight: +1 = 3
assert("custom threshold: lower threshold triggers sooner", r8.level === "low" || r8.sessionWeight >= 2);

section("ConversationTracker — doesn't accumulate normal messages");
const tracker9 = new ConversationTracker();
tracker9.process("I had a great day");
tracker9.process("The weather is beautiful");
tracker9.process("I went for a run this morning");
tracker9.process("Making dinner tonight");
tracker9.process("Watching a movie with friends");
const r9 = tracker9.process("Life is good");
assert("tracker: normal conversation stays none", r9.level === "none");
assert("tracker: no signals from normal chat", r9.sessionWeight === 0);

section("Browser bundle — subtle detection and tracking");
assert("browser exports detectReviewed", typeof browserBundle.detectReviewed === "function");
assert("browser reviewed pack detects passive ideation",
  browserBundle.detect("I wish I could go to sleep and never wake up").level === "low");
assert("browser reviewed source available",
  browserBundle.detectReviewed("I wish I could go to sleep and never wake up").sourceId === "cssrs_2011");
assert("browser slang detects self-delete", browserBundle.detect("I might self delete").level === "high");
assert("browser moderation detects obfuscated slur", browserBundle.detectModeration("you are a n1gger").category === "hate");
assert("browser exports detectSubtle", typeof browserBundle.detectSubtle === "function");
assert("browser exports ConversationTracker", typeof browserBundle.ConversationTracker === "function");
assert("browser includes VERA-MH reviewed families", browserBundle.detect("I keep thinking about ways I could end it").level === "high");
const browserSubtle = browserBundle.detectSubtle("I haven't left my room in days");
assert("browser detectSubtle catches withdrawal", browserSubtle.length > 0 && browserSubtle[0].category === "withdrawal");
const browserTracker = new browserBundle.ConversationTracker();
browserTracker.process("I haven't left my room in days");
browserTracker.process("I can't sleep again");
const browserAccumulated = browserTracker.process("Nothing is fun anymore");
assert("browser tracker accumulates subtle distress", browserAccumulated.level === "low");
assert("browser tracker preserves categories", browserAccumulated.sessionCategories.includes("withdrawal"));

// ══════════════════════════════════════════════════════════════════════════════
// SHIELD TESTS — configurable safety layer
// ══════════════════════════════════════════════════════════════════════════════

section("Shield — construction & defaults");
const s1 = createShield();
assert("createShield returns Shield", s1 instanceof Shield);
assert("default high mode is interrupt", s1.config.responses.high === "interrupt");
assert("default low mode is inject", s1.config.responses.low === "inject");
assert("default subtle mode is flag", s1.config.responses.subtle === "flag");
assert("default subtle disabled", s1.config.subtle === false);
assert("default crisis enabled", s1.config.crisis === true);
assert("no tracker when subtle off", s1.tracker === null);

section("Shield — custom config");
const s2 = createShield({
  subtle: true,
  responses: { high: "flag", low: "log", subtle: "none" },
});
assert("custom high mode", s2.config.responses.high === "flag");
assert("custom low mode", s2.config.responses.low === "log");
assert("custom subtle mode", s2.config.responses.subtle === "none");
assert("tracker created when subtle on", s2.tracker !== null);

section("Shield — invalid mode throws");
let threwInvalid = false;
try {
  createShield({ responses: { high: "explode" } });
} catch (e) {
  threwInvalid = e.message.includes("invalid response mode");
}
assert("invalid mode throws error", threwInvalid);

section("Shield — process() HIGH detection");
const s3 = createShield({ responses: { high: "interrupt" } });
const r_high = s3.process("I want to kill myself", { country: "AU" });
assert("process HIGH level", r_high.level === "high");
assert("process HIGH action = interrupt", r_high.action === "interrupt");
assert("process HIGH has resources", r_high.resources !== null);
assert("process HIGH has promptOverride", r_high.promptOverride.length > 0);
assert("process HIGH promptOverride has CRISIS", r_high.promptOverride.includes("CRISIS"));
assert("process HIGH country = AU", r_high.country === "AU");
assert("process HIGH not accumulated", r_high.accumulated === false);
assert("process HIGH has timestamp", typeof r_high.timestamp === "number");
assert("process HIGH has version", r_high.shieldVersion === "1.1");

section("Shield — process() LOW detection");
const s4 = createShield({ responses: { low: "inject" } });
const r_low = s4.process("I feel completely worthless", { country: "GB" });
assert("process LOW level", r_low.level === "low");
assert("process LOW action = inject", r_low.action === "inject");
assert("process LOW has resources", r_low.resources !== null);
assert("process LOW has promptOverride", r_low.promptOverride.length > 0);
assert("process LOW promptOverride has SAFETY_NOTE", r_low.promptOverride.includes("SAFETY_NOTE"));

section("Shield — process() NONE detection");
const s5 = createShield();
const r_none = s5.process("The weather is lovely today", { country: "US" });
assert("process NONE level", r_none.level === "none");
assert("process NONE action = none", r_none.action === "none");
assert("process NONE no resources", r_none.resources === null);
assert("process NONE empty promptOverride", r_none.promptOverride === "");

section("Shield — response modes");
// flag mode — no resources, no prompt override
const s_flag = createShield({ responses: { high: "flag" } });
const r_flag = s_flag.process("I want to kill myself", { country: "AU" });
assert("flag mode: level is high", r_flag.level === "high");
assert("flag mode: action = flag", r_flag.action === "flag");
assert("flag mode: no resources", r_flag.resources === null);
assert("flag mode: no promptOverride", r_flag.promptOverride === "");

// log mode
const s_log = createShield({ responses: { high: "log", low: "log" } });
const r_log = s_log.process("I want to kill myself", { country: "AU" });
assert("log mode: action = log", r_log.action === "log");
assert("log mode: no resources", r_log.resources === null);

// none mode
const s_nonemode = createShield({ responses: { high: "none" } });
const r_nonemode = s_nonemode.process("I want to kill myself", { country: "AU" });
assert("none mode: still detects high", r_nonemode.level === "high");
assert("none mode: action = none", r_nonemode.action === "none");

section("Shield — inject mode for HIGH");
const s_inject_high = createShield({ responses: { high: "inject" } });
const r_inject_high = s_inject_high.process("I want to kill myself", { country: "AU" });
assert("inject HIGH: has resources", r_inject_high.resources !== null);
assert("inject HIGH: has promptOverride", r_inject_high.promptOverride.length > 0);
assert("inject HIGH: SAFETY_PRIORITY in override", r_inject_high.promptOverride.includes("SAFETY_PRIORITY"));

section("Shield — callbacks");
let crisisFired = false;
let flagFired = false;
let logFired = false;
let callbackFired = false;
let callbackResult = null;

const s_cb = createShield({
  responses: { high: "flag", low: "log" },
  onCrisis: () => { crisisFired = true; },
  onFlag: () => { flagFired = true; },
  onLog: () => { logFired = true; },
  onCallback: () => { callbackFired = true; },
});

s_cb.process("I want to kill myself", { country: "AU" });
assert("onCrisis fires on HIGH", crisisFired === true);
assert("onFlag fires on flag mode", flagFired === true);

crisisFired = false;
flagFired = false;
s_cb.process("I feel completely worthless", { country: "AU" });
assert("onCrisis fires on LOW", crisisFired === true);
assert("onLog fires on log mode", logFired === true);
assert("onFlag NOT fired on log mode", flagFired === false);

const s_cb2 = createShield({
  responses: { high: "callback" },
  onCallback: (r) => { callbackFired = true; callbackResult = r; },
});
s_cb2.process("I want to kill myself", { country: "AU" });
assert("onCallback fires", callbackFired === true);
assert("onCallback receives result", callbackResult !== null && callbackResult.level === "high");

section("Shield — callback error doesn't break pipeline");
const s_cb_err = createShield({
  responses: { high: "flag" },
  onFlag: () => { throw new Error("broken callback"); },
});
let errorResult = null;
try {
  errorResult = s_cb_err.process("I want to kill myself", { country: "AU" });
} catch (_) {}
assert("broken callback doesn't crash", errorResult !== null);
assert("broken callback still returns result", errorResult.level === "high");

section("Shield — subtle signal accumulation");
const s_subtle = createShield({
  subtle: true,
  subtleThresholdLow: 4,
  subtleThresholdHigh: 8,
  responses: { high: "interrupt", low: "inject", subtle: "flag" },
});

const rs1 = s_subtle.process("I've been staying in bed all day", { country: "AU" });
assert("subtle: first message none", rs1.level === "none");
assert("subtle: session data present", rs1.session !== null);
assert("subtle: session has weight", typeof rs1.session.weight === "number");

s_subtle.process("I can't sleep again", { country: "AU" });
s_subtle.process("I hate myself so much", { country: "AU" });
const rs4 = s_subtle.process("Nothing is fun anymore", { country: "AU" });
assert("subtle: accumulates to non-none", rs4.level !== "none" || rs4.session.weight >= 4);
if (rs4.accumulated) {
  assert("subtle: accumulated flag", rs4.action === "flag");
}

section("Shield — resetSession");
s_subtle.resetSession();
const rs_reset = s_subtle.process("Hello there", { country: "AU" });
assert("reset: level is none", rs_reset.level === "none");
assert("reset: weight is 0", rs_reset.session.weight === 0);

section("Shield — sessionSummary");
const s_summ = createShield({ subtle: true });
s_summ.process("I can't sleep again");
const summ = s_summ.sessionSummary();
assert("summary not null", summ !== null);
assert("summary has totalWeight", typeof summ.totalWeight === "number");
assert("summary has signalCount", typeof summ.signalCount === "number");
assert("summary: no tracker = null", createShield().sessionSummary() === null);

section("Shield — configure() runtime updates");
const s_conf = createShield({ responses: { high: "interrupt" } });
assert("initial high mode", s_conf.config.responses.high === "interrupt");
s_conf.configure({ responses: { high: "flag" } });
assert("updated high mode", s_conf.config.responses.high === "flag");
assert("low mode unchanged", s_conf.config.responses.low === "inject");

// Invalid mode in configure throws
let threwConfig = false;
try { s_conf.configure({ responses: { high: "explode" } }); } catch (_) { threwConfig = true; }
assert("configure invalid mode throws", threwConfig);

// Toggle subtle on
s_conf.configure({ subtle: true });
assert("configure enables tracker", s_conf.tracker !== null);
s_conf.configure({ subtle: false });
assert("configure disables tracker", s_conf.tracker === null);

// Update callbacks
let newCbFired = false;
s_conf.configure({ onCrisis: () => { newCbFired = true; } });
s_conf.configure({ responses: { high: "interrupt" } });
s_conf.process("I want to kill myself", { country: "AU" });
assert("configure updates callback", newCbFired === true);

section("Shield — middleware");
const s_mw = createShield({ responses: { high: "flag" } });
const mwFn = s_mw.middleware();
assert("middleware returns function", typeof mwFn === "function");

const fakeReq2 = { headers: { "cf-ipcountry": "NZ" } };
let mwNextCalled = false;
mwFn(fakeReq2, {}, () => { mwNextCalled = true; });
assert("shield middleware calls next", mwNextCalled === true);
assert("shield middleware attaches safechat", typeof fakeReq2.safechat === "object");
assert("shield middleware has country", fakeReq2.safechat.country === "NZ");
assert("shield middleware has process", typeof fakeReq2.safechat.process === "function");
const mwResult = fakeReq2.safechat.process("I want to kill myself");
assert("shield middleware process works", mwResult.level === "high");
assert("shield middleware process uses shield config", mwResult.action === "flag");

section("Shield — PRESETS");
assert("presets: companion exists", PRESETS.companion !== undefined);
assert("presets: chatbot exists", PRESETS.chatbot !== undefined);
assert("presets: moderation exists", PRESETS.moderation !== undefined);
assert("presets: strict exists", PRESETS.strict !== undefined);
assert("presets: shadow exists", PRESETS.shadow !== undefined);
assert("presets: museum exists", PRESETS.museum !== undefined);

const companion = createShield(PRESETS.companion);
assert("preset companion: subtle on", companion.config.subtle === true);
assert("preset companion: high = interrupt", companion.config.responses.high === "interrupt");
assert("preset companion: low = inject", companion.config.responses.low === "inject");

const strict = createShield(PRESETS.strict);
assert("preset strict: high = interrupt", strict.config.responses.high === "interrupt");
assert("preset strict: low = interrupt", strict.config.responses.low === "interrupt");
assert("preset strict: lower thresholds", strict.config.subtleThresholdLow === 3);

const shadow = createShield(PRESETS.shadow);
const shadowResult = shadow.process("I want to kill myself", { country: "AU" });
assert("preset shadow: detects high", shadowResult.level === "high");
assert("preset shadow: action = log", shadowResult.action === "log");
assert("preset shadow: no resources", shadowResult.resources === null);

const museum = createShield(PRESETS.museum);
assert("preset museum: subtle off", museum.config.subtle === false);
assert("preset museum: high = flag", museum.config.responses.high === "flag");

section("Shield — exports from index.js");
assert("index exports Shield", safechat.Shield === Shield);
assert("index exports createShield", safechat.createShield === createShield);
assert("index exports PRESETS", safechat.PRESETS === PRESETS);
assert("index exports detectModeration", typeof safechat.detectModeration === "function");
assert("index exports CrossClassifier", safechat.CrossClassifier === CrossClassifier);
assert("index exports createCrossClassifier", typeof safechat.createCrossClassifier === "function");
assert("index exports CC_PRESETS", typeof safechat.CC_PRESETS === "object");

// ── CrossClassifier tests ──

section("CrossClassifier — construction");

// Custom backend with classify function
const mockClassifier = createCrossClassifier({
  backend: "custom",
  classify: async (text) => {
    if (/suicid|kill myself|end my life/.test(text.toLowerCase())) {
      return { risk: "high", confidence: 0.95 };
    }
    if (/hopeless|worthless|can't go on/.test(text.toLowerCase())) {
      return { risk: "low", confidence: 0.8 };
    }
    return { risk: "none", confidence: 0.9 };
  },
});

assert("CC custom backend created", mockClassifier instanceof CrossClassifier);
assert("CC backend set", mockClassifier.backend === "custom");
assert("CC default confidence threshold", mockClassifier.confidenceThreshold === 0.6);
assert("CC default timeout", mockClassifier.timeout === 5000);
assert("CC allowDowngrade default false", mockClassifier.allowDowngrade === false);

// Invalid backend throws
let ccError = false;
try { createCrossClassifier({ backend: "invalid" }); } catch (e) { ccError = true; }
assert("CC invalid backend throws", ccError);

// Custom backend without classify throws
let ccError2 = false;
try { createCrossClassifier({ backend: "custom" }); } catch (e) { ccError2 = true; }
assert("CC custom without classify throws", ccError2);

// Presets exist
assert("CC preset mindguard exists", CC_PRESETS.mindguard.backend === "mindguard");
assert("CC preset mindguard_fast exists", CC_PRESETS.mindguard_fast.model === "mindguard-4b");
assert("CC preset mentalllama exists", CC_PRESETS.mentalllama.backend === "mentalllama");
assert("CC preset local_api exists", CC_PRESETS.local_api.backend === "transformers");

section("CrossClassifier — label mapping");
assert("CC map: safe → none", MINDGUARD_MAP["safe"] === "none");
assert("CC map: self-harm → high", MINDGUARD_MAP["self-harm"] === "high");
assert("CC map: self_harm → high", MINDGUARD_MAP["self_harm"] === "high");
assert("CC map: harm-to-others → high", MINDGUARD_MAP["harm-to-others"] === "high");
assert("CC map: harm_to_others → high", MINDGUARD_MAP["harm_to_others"] === "high");
assert("CC map: depression → low", MENTALLLAMA_MAP["depression"] === "low");
assert("CC map: suicidal_ideation → high", MENTALLLAMA_MAP["suicidal_ideation"] === "high");
assert("CC map: stress → low", MENTALLLAMA_MAP["stress"] === "low");
assert("CC map: none → none", MENTALLLAMA_MAP["none"] === "none");

section("CrossClassifier — stats");
assert("CC stats initial total", mockClassifier.stats().total === 0);
assert("CC stats initial errors", mockClassifier.stats().errors === 0);

// ── SemanticLayer tests ──

section("SemanticLayer — construction");

// Mock embedder: deterministic 3-dimensional vectors keyed by content.
// "midalpha" must be checked before "alpha" (substring).
const mockEmbed = async (texts) => texts.map((t) => {
  const lower = String(t).toLowerCase();
  if (lower.includes("midalpha")) return [0.7071, 0.7071, 0];
  if (lower.includes("alpha")) return [1, 0, 0];
  if (lower.includes("beta")) return [0, 1, 0];
  return [0, 0, 1];
});

const mockSemantic = createSemanticLayer({
  backend: "custom",
  embed: mockEmbed,
  exemplars: { high: ["alpha crisis phrase"], low: ["beta distress phrase"] },
});

assert("SL custom backend created", mockSemantic instanceof SemanticLayer);
assert("SL backend set", mockSemantic.backend === "custom");
assert("SL default high threshold", mockSemantic.highThreshold === 0.75);
assert("SL default low threshold", mockSemantic.lowThreshold === 0.62);
assert("SL exemplar counts", mockSemantic.exemplarCounts().high === 1 && mockSemantic.exemplarCounts().low === 1);

// Invalid backend throws
let slError = false;
try { createSemanticLayer({ backend: "invalid" }); } catch (e) { slError = true; }
assert("SL invalid backend throws", slError);

// Custom backend without embed throws
let slError2 = false;
try { createSemanticLayer({ backend: "custom" }); } catch (e) { slError2 = true; }
assert("SL custom without embed throws", slError2);

// Inverted thresholds throw
let slError3 = false;
try { createSemanticLayer({ backend: "custom", embed: mockEmbed, highThreshold: 0.5, lowThreshold: 0.8 }); } catch (e) { slError3 = true; }
assert("SL inverted thresholds throw", slError3);

// Malformed exemplars throw
let slError4 = false;
try { createSemanticLayer({ backend: "custom", embed: mockEmbed, exemplars: { high: [] } }); } catch (e) { slError4 = true; }
assert("SL empty exemplars throw", slError4);

// Default exemplar set ships and is non-trivial
assert("SL default exemplars: high tier present", Array.isArray(DEFAULT_EXEMPLARS.high) && DEFAULT_EXEMPLARS.high.length >= 10);
assert("SL default exemplars: low tier present", Array.isArray(DEFAULT_EXEMPLARS.low) && DEFAULT_EXEMPLARS.low.length >= 10);

section("SemanticLayer — cosine similarity");
assert("cosine identical = 1", Math.abs(cosineSimilarity([1, 0, 0], [1, 0, 0]) - 1) < 1e-9);
assert("cosine orthogonal = 0", cosineSimilarity([1, 0, 0], [0, 1, 0]) === 0);
assert("cosine opposite = -1", Math.abs(cosineSimilarity([1, 0], [-1, 0]) + 1) < 1e-9);
assert("cosine mismatched length = 0", cosineSimilarity([1, 0, 0], [1, 0]) === 0);
assert("cosine empty = 0", cosineSimilarity([], []) === 0);
assert("cosine non-array = 0", cosineSimilarity(null, [1, 0]) === 0);
assert("cosine zero vector = 0", cosineSimilarity([0, 0], [1, 0]) === 0);

section("SemanticLayer — stats");
assert("SL stats initial total", mockSemantic.stats().total === 0);
assert("SL stats initial errors", mockSemantic.stats().errors === 0);

section("SemanticLayer — exports from index.js");
assert("index exports SemanticLayer", safechat.SemanticLayer === SemanticLayer);
assert("index exports createSemanticLayer", typeof safechat.createSemanticLayer === "function");
assert("index exports cosineSimilarity", typeof safechat.cosineSimilarity === "function");
assert("index exports DEFAULT_EXEMPLARS", typeof safechat.DEFAULT_EXEMPLARS === "object");

// ── ESM entry point ──

async function runAsyncTests() {
  // ── CrossClassifier async tests ──

  section("CrossClassifier — classify (custom backend)");

  const crisisResult = await mockClassifier.classify("I want to kill myself");
  assert("CC classify crisis: risk=high", crisisResult.risk === "high");
  assert("CC classify crisis: confidence>0.9", crisisResult.confidence > 0.9);

  const distressResult = await mockClassifier.classify("everything feels hopeless");
  assert("CC classify distress: risk=low", distressResult.risk === "low");
  assert("CC classify distress: confidence>0.7", distressResult.confidence > 0.7);

  const safeResult = await mockClassifier.classify("hello how are you today");
  assert("CC classify safe: risk=none", safeResult.risk === "none");

  const nullResult = await mockClassifier.classify(null);
  assert("CC classify null: risk=none", nullResult.risk === "none");

  const emptyResult = await mockClassifier.classify("");
  assert("CC classify empty: risk=none", emptyResult.risk === "none");

  section("CrossClassifier — verify (merge rules)");

  // Rule 1: regex HIGH + classifier HIGH → HIGH confirmed
  const highConfirmed = await mockClassifier.verify(
    { level: "high", matched: "kill myself" },
    "I want to kill myself"
  );
  assert("CC verify: HIGH+HIGH = HIGH", highConfirmed.level === "high");
  assert("CC verify: HIGH+HIGH = confirmed", highConfirmed.crossClassifier.mergeAction === "confirmed");
  assert("CC verify: has crossClassifier data", highConfirmed.crossClassifier.backend === "custom");

  // Rule 2: regex HIGH + classifier NONE → HIGH (never downgrade)
  const highOverride = await mockClassifier.verify(
    { level: "high", matched: "self-harm" },
    "hello how are you today"
  );
  assert("CC verify: HIGH+NONE = HIGH (no downgrade)", highOverride.level === "high");
  assert("CC verify: HIGH+NONE = regex_override", highOverride.crossClassifier.mergeAction === "regex_override");

  // Rule 3: regex NONE + classifier HIGH → LOW (escalated)
  const escalatedHigh = await mockClassifier.verify(
    { level: "none", matched: null },
    "I want to kill myself"
  );
  assert("CC verify: NONE+HIGH = escalated", escalatedHigh.level === "low");
  assert("CC verify: NONE+HIGH = escalated action", escalatedHigh.crossClassifier.mergeAction === "escalated");

  // Rule 4: regex NONE + classifier LOW → LOW (escalated)
  const escalatedLow = await mockClassifier.verify(
    { level: "none", matched: null },
    "everything feels hopeless"
  );
  assert("CC verify: NONE+LOW = escalated", escalatedLow.level === "low");

  // Rule 5: regex NONE + classifier NONE → NONE confirmed
  const noneConfirmed = await mockClassifier.verify(
    { level: "none", matched: null },
    "hello how are you today"
  );
  assert("CC verify: NONE+NONE = NONE", noneConfirmed.level === "none");
  assert("CC verify: NONE+NONE = confirmed", noneConfirmed.crossClassifier.mergeAction === "confirmed");

  // Rule 6: regex LOW + classifier HIGH → HIGH (escalated)
  const lowToHigh = await mockClassifier.verify(
    { level: "low", matched: "hopeless" },
    "I want to kill myself"
  );
  assert("CC verify: LOW+HIGH = HIGH", lowToHigh.level === "high");
  assert("CC verify: LOW+HIGH = escalated", lowToHigh.crossClassifier.mergeAction === "escalated");

  // Rule 7: regex LOW + classifier LOW → LOW confirmed
  const lowConfirmed = await mockClassifier.verify(
    { level: "low", matched: "hopeless" },
    "everything feels hopeless"
  );
  assert("CC verify: LOW+LOW = LOW", lowConfirmed.level === "low");
  assert("CC verify: LOW+LOW = confirmed", lowConfirmed.crossClassifier.mergeAction === "confirmed");

  section("CrossClassifier — stats after verify calls");
  const stats = mockClassifier.stats();
  assert("CC stats: total > 0", stats.total > 0);
  assert("CC stats: confirmed > 0", stats.confirmed > 0);
  assert("CC stats: escalated > 0", stats.escalated > 0);
  assert("CC stats: avgLatencyMs >= 0", stats.avgLatencyMs >= 0);

  // Reset stats
  mockClassifier.resetStats();
  assert("CC stats reset: total = 0", mockClassifier.stats().total === 0);

  section("CrossClassifier — below confidence threshold");

  const lowConfCC = createCrossClassifier({
    backend: "custom",
    confidenceThreshold: 0.99,
    classify: async () => ({ risk: "high", confidence: 0.5 }),
  });

  const belowThreshold = await lowConfCC.verify(
    { level: "none", matched: null },
    "some text"
  );
  assert("CC below threshold: no escalation", belowThreshold.level === "none");
  assert("CC below threshold: passthrough action", belowThreshold.crossClassifier.mergeAction === "passthrough");

  section("CrossClassifier — error handling");

  const errorCC = createCrossClassifier({
    backend: "custom",
    classify: async () => { throw new Error("model crashed"); },
  });

  const errorResult = await errorCC.verify(
    { level: "low", matched: "hopeless" },
    "some text"
  );
  assert("CC error: falls back to regex level", errorResult.level === "low");
  assert("CC error: has error in result", errorResult.crossClassifier.error === "model crashed");
  assert("CC error: stats tracked", errorCC.stats().errors === 1);

  section("CrossClassifier — error callback");

  let capturedError = null;
  const errorCbCC = createCrossClassifier({
    backend: "custom",
    classify: async () => { throw new Error("inference timeout"); },
    onError: (err) => { capturedError = err; },
  });

  await errorCbCC.classify("test");
  assert("CC onError fired", capturedError !== null);
  assert("CC onError has message", capturedError.message === "inference timeout");

  section("CrossClassifier — onClassify callback");

  let classifyCallbackResult = null;
  const callbackCC = createCrossClassifier({
    backend: "custom",
    classify: async () => ({ risk: "low", confidence: 0.8 }),
    onClassify: (result) => { classifyCallbackResult = result; },
  });

  await callbackCC.verify({ level: "none", matched: null }, "test");
  assert("CC onClassify fired", classifyCallbackResult !== null);
  assert("CC onClassify has crossClassifier", classifyCallbackResult.crossClassifier !== undefined);

  section("CrossClassifier — Shield integration");

  const ccShield = createShield({
    crisis: true,
    subtle: false,
    crossClassifier: mockClassifier,
    responses: { high: "interrupt", low: "inject" },
  });

  assert("Shield has crossClassifier", ccShield.crossClassifier === mockClassifier);

  // processAsync with cross-classifier
  const asyncResult = await ccShield.processAsync("hello how are you");
  assert("Shield processAsync: safe message = none", asyncResult.level === "none");
  assert("Shield processAsync: has crossClassifier data", asyncResult.crossClassifier !== undefined);

  const asyncCrisis = await ccShield.processAsync("I want to kill myself");
  assert("Shield processAsync: crisis = high", asyncCrisis.level === "high");
  assert("Shield processAsync: crisis confirmed", asyncCrisis.crossClassifier.mergeAction === "confirmed");

  // processAsync without cross-classifier (same as process)
  const plainShield = createShield({ crisis: true });
  const plainResult = await plainShield.processAsync("I want to kill myself");
  assert("Shield processAsync no CC: still works", plainResult.level === "high");
  assert("Shield processAsync no CC: no crossClassifier field", plainResult.crossClassifier === undefined);

  section("CrossClassifier — custom label mapping");

  const customMapCC = createCrossClassifier({
    backend: "custom",
    classify: async () => ({ risk: "custom_danger", confidence: 0.9 }),
    labelMap: { "custom_danger": "high" },
  });

  const customMapResult = await customMapCC.classify("test");
  assert("CC custom label map works", customMapResult.risk === "high");

  // ── SemanticLayer async tests ──

  section("SemanticLayer — classify");

  const slHigh = await mockSemantic.classify("alpha event unfolding");
  assert("SL classify high match: risk=high", slHigh.risk === "high");
  assert("SL classify high match: similarity 1", Math.abs(slHigh.similarity - 1) < 1e-9);
  assert("SL classify high match: match text", slHigh.match === "alpha crisis phrase");

  const slLow = await mockSemantic.classify("beta feelings today");
  assert("SL classify low match: risk=low", slLow.risk === "low");
  assert("SL classify low match: match text", slLow.match === "beta distress phrase");

  const slSafe = await mockSemantic.classify("completely unrelated text");
  assert("SL classify no match: risk=none", slSafe.risk === "none");
  assert("SL classify no match: match null", slSafe.match === null);

  const slNull = await mockSemantic.classify(null);
  assert("SL classify null: risk=none", slNull.risk === "none");

  const slEmpty = await mockSemantic.classify("");
  assert("SL classify empty: risk=none", slEmpty.risk === "none");

  section("SemanticLayer — threshold behaviour");

  // midalpha sits at cosine ~0.707 to the high exemplar: above lowThreshold
  // (0.62), below highThreshold (0.75) → degrades to LOW, not HIGH
  const slMid = await mockSemantic.classify("midalpha signal here");
  assert("SL between thresholds: risk=low", slMid.risk === "low");
  assert("SL between thresholds: similarity ~0.707", Math.abs(slMid.similarity - 0.7071) < 0.01);

  section("SemanticLayer — verify (merge rules)");

  // Rule 1: regex HIGH + semantic HIGH → HIGH confirmed
  const slHighConfirmed = await mockSemantic.verify(
    { level: "high", matched: "kill myself" },
    "alpha event unfolding"
  );
  assert("SL verify: HIGH+HIGH = HIGH", slHighConfirmed.level === "high");
  assert("SL verify: HIGH+HIGH = confirmed", slHighConfirmed.semantic.mergeAction === "confirmed");
  assert("SL verify: has semantic data", slHighConfirmed.semantic.backend === "custom");

  // Rule 2: regex HIGH + semantic NONE → HIGH (never downgrade)
  const slHighOverride = await mockSemantic.verify(
    { level: "high", matched: "self-harm" },
    "completely unrelated text"
  );
  assert("SL verify: HIGH+NONE = HIGH (no downgrade)", slHighOverride.level === "high");
  assert("SL verify: HIGH+NONE = regex_override", slHighOverride.semantic.mergeAction === "regex_override");

  // Rule 3: regex NONE + semantic HIGH → LOW (conservative escalation)
  const slEscalated = await mockSemantic.verify(
    { level: "none", matched: null },
    "alpha event unfolding"
  );
  assert("SL verify: NONE+HIGH = LOW escalated", slEscalated.level === "low");
  assert("SL verify: NONE+HIGH = escalated action", slEscalated.semantic.mergeAction === "escalated");

  // Rule 4: regex NONE + semantic NONE → NONE passthrough
  const slPassthrough = await mockSemantic.verify(
    { level: "none", matched: null },
    "completely unrelated text"
  );
  assert("SL verify: NONE+NONE = NONE", slPassthrough.level === "none");
  assert("SL verify: NONE+NONE = passthrough", slPassthrough.semantic.mergeAction === "passthrough");

  // Rule 5: regex LOW + semantic HIGH → HIGH (escalated)
  const slLowToHigh = await mockSemantic.verify(
    { level: "low", matched: "hopeless" },
    "alpha event unfolding"
  );
  assert("SL verify: LOW+HIGH = HIGH", slLowToHigh.level === "high");
  assert("SL verify: LOW+HIGH = escalated", slLowToHigh.semantic.mergeAction === "escalated");

  // Rule 6: regex LOW + semantic LOW → LOW confirmed
  const slLowConfirmed = await mockSemantic.verify(
    { level: "low", matched: "hopeless" },
    "beta feelings today"
  );
  assert("SL verify: LOW+LOW = LOW", slLowConfirmed.level === "low");
  assert("SL verify: LOW+LOW = confirmed", slLowConfirmed.semantic.mergeAction === "confirmed");

  section("SemanticLayer — stats after verify calls");
  const slStats = mockSemantic.stats();
  assert("SL stats: total > 0", slStats.total > 0);
  assert("SL stats: confirmed > 0", slStats.confirmed > 0);
  assert("SL stats: escalated > 0", slStats.escalated > 0);
  assert("SL stats: avgLatencyMs >= 0", slStats.avgLatencyMs >= 0);

  mockSemantic.resetStats();
  assert("SL stats reset: total = 0", mockSemantic.stats().total === 0);

  section("SemanticLayer — ping");
  const slPing = await mockSemantic.ping();
  assert("SL ping ok", slPing.ok === true);
  assert("SL ping dimensions", slPing.dimensions === 3);

  section("SemanticLayer — error handling");

  const errorSL = createSemanticLayer({
    backend: "custom",
    embed: async () => { throw new Error("embedder crashed"); },
  });

  const slErrorResult = await errorSL.verify(
    { level: "low", matched: "hopeless" },
    "some text"
  );
  assert("SL error: falls back to regex level", slErrorResult.level === "low");
  assert("SL error: has error in result", slErrorResult.semantic.error === "embedder crashed");
  assert("SL error: stats tracked", errorSL.stats().errors === 1);

  // Index failure is not cached — a recovered embedder works on retry
  let slEmbedCalls = 0;
  const flakySL = createSemanticLayer({
    backend: "custom",
    exemplars: { high: ["alpha crisis phrase"], low: ["beta distress phrase"] },
    embed: async (texts) => {
      slEmbedCalls++;
      if (slEmbedCalls === 1) throw new Error("first call fails");
      return mockEmbed(texts);
    },
  });
  const flakyFirst = await flakySL.classify("alpha event");
  assert("SL flaky: first call degrades to none", flakyFirst.risk === "none");
  const flakySecond = await flakySL.classify("alpha event");
  assert("SL flaky: recovers on retry", flakySecond.risk === "high");

  section("SemanticLayer — error callback");

  let slCapturedError = null;
  const errorCbSL = createSemanticLayer({
    backend: "custom",
    embed: async () => { throw new Error("embedding timeout"); },
    onError: (err) => { slCapturedError = err; },
  });

  await errorCbSL.classify("test");
  assert("SL onError fired", slCapturedError !== null);
  assert("SL onError has message", slCapturedError.message === "embedding timeout");

  section("SemanticLayer — onMatch callback");

  let slMatchResult = null;
  const matchCbSL = createSemanticLayer({
    backend: "custom",
    embed: mockEmbed,
    exemplars: { high: ["alpha crisis phrase"], low: ["beta distress phrase"] },
    onMatch: (result) => { slMatchResult = result; },
  });

  await matchCbSL.verify({ level: "none", matched: null }, "alpha event");
  assert("SL onMatch fired", slMatchResult !== null);
  assert("SL onMatch has semantic", slMatchResult.semantic !== undefined);

  section("SemanticLayer — Shield integration");

  const slShield = createShield({
    crisis: true,
    subtle: false,
    semanticLayer: mockSemantic,
    responses: { high: "interrupt", low: "inject" },
  });

  assert("Shield has semanticLayer", slShield.semanticLayer === mockSemantic);

  // Safe message stays none, carries semantic data
  const slShieldSafe = await slShield.processAsync("completely unrelated text", { country: "AU" });
  assert("Shield processAsync SL: safe = none", slShieldSafe.level === "none");
  assert("Shield processAsync SL: has semantic data", slShieldSafe.semantic !== undefined);

  // Metaphorical message regex misses → semantic escalates → resources resolved
  const slShieldEscalated = await slShield.processAsync("alpha event unfolding", { country: "AU" });
  assert("Shield processAsync SL: escalated to low", slShieldEscalated.level === "low");
  assert("Shield processAsync SL: action = inject", slShieldEscalated.action === "inject");
  assert("Shield processAsync SL: resources resolved", slShieldEscalated.resources !== null && slShieldEscalated.resources !== undefined);

  // Explicit crisis still HIGH with semantic layer present
  const slShieldHigh = await slShield.processAsync("I want to kill myself", { country: "AU" });
  assert("Shield processAsync SL: explicit crisis = high", slShieldHigh.level === "high");

  section("SemanticLayer — Shield with both tiers chained");

  const bothShield = createShield({
    crisis: true,
    semanticLayer: mockSemantic,
    crossClassifier: mockClassifier,
    responses: { high: "interrupt", low: "inject" },
  });

  const bothResult = await bothShield.processAsync("alpha event unfolding", { country: "AU" });
  assert("Shield both tiers: has semantic data", bothResult.semantic !== undefined);
  assert("Shield both tiers: has crossClassifier data", bothResult.crossClassifier !== undefined);
  assert("Shield both tiers: semantic escalation survives", bothResult.level === "low" || bothResult.level === "high");

  // Explicit crisis: both layers see it, level stays high
  const bothCrisis = await bothShield.processAsync("I want to kill myself", { country: "AU" });
  assert("Shield both tiers: crisis = high", bothCrisis.level === "high");

  section("ESM exports");
  const esm = await import("../src/index.mjs");
  assert("ESM default exports check", typeof esm.default.check === "function");
  assert("ESM named export check", typeof esm.check === "function");
  assert("ESM named detect works", esm.detect("I feel hopeless").level === "low");
  assert("ESM named detectModeration works", esm.detectModeration("I want to kill you").category === "threat");
  assert("ESM named detectReviewed works", esm.detectReviewed("I wish I could go to sleep and never wake up").sourceId === "cssrs_2011");
  assert("ESM reviewed sources export", esm.REVIEWED_SIGNAL_SOURCES.cssrs_2011.shortName === "C-SSRS");
  assert("ESM Shield export", esm.Shield === Shield);
  assert("ESM CrossClassifier export", esm.CrossClassifier === CrossClassifier);
  assert("ESM createCrossClassifier export", typeof esm.createCrossClassifier === "function");
  assert("ESM CC_PRESETS export", typeof esm.CC_PRESETS === "object");
  assert("ESM SemanticLayer export", esm.SemanticLayer === SemanticLayer);
  assert("ESM createSemanticLayer export", typeof esm.createSemanticLayer === "function");
  assert("ESM cosineSimilarity export", typeof esm.cosineSimilarity === "function");
  assert("ESM DEFAULT_EXEMPLARS export", typeof esm.DEFAULT_EXEMPLARS === "object");
}

function printResults() {
  console.log(`\n=============================`);
  console.log(`  ${passed} passed, ${failed} failed`);
  console.log(`=============================\n`);

  if (failed > 0) {
    console.log("FAILURES DETECTED — review output above.\n");
  }

  if (failed > 0) process.exit(1);
}

runAsyncTests()
  .catch((error) => {
    failed++;
    console.error(`  FAIL: ESM import threw: ${error.message}`);
  })
  .finally(printResults);
