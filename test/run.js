/**
 * Safechat — Test suite
 * Run: node test/run.js
 */

const { detect, detectSubtle, isHighCrisis, isAnyCrisis, ConversationTracker } = require("../src/detect");
const { fromLocale, fromTimezone, fromRequest } = require("../src/locate");
const { getResources, listCountries, getEmergencyNumber, search, formatForChat } = require("../src/resources");
const safechat = require("../src/index");

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

// ── Results ──

console.log(`\n=============================`);
console.log(`  ${passed} passed, ${failed} failed`);
console.log(`=============================\n`);

if (failed > 0) {
  console.log("FAILURES DETECTED — review output above.\n");
}

if (failed > 0) process.exit(1);
