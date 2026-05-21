/**
 * Safechat — Test suite
 * Run: node test/run.js
 */

const { detect, isHighCrisis, isAnyCrisis } = require("../src/detect");
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

// ── Results ──

console.log(`\n=============================`);
console.log(`  ${passed} passed, ${failed} failed`);
console.log(`=============================\n`);

if (failed > 0) process.exit(1);
