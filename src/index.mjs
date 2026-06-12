/**
 * Safechat ESM entry point.
 *
 * The core library is CommonJS; this wrapper keeps `import` consumers working
 * while preserving the existing require() API.
 */

import { createRequire } from "module";

const require = createRequire(import.meta.url);
const safechat = require("./index.js");

export const check = safechat.check;
export const promptOverride = safechat.promptOverride;
export const middleware = safechat.middleware;

export const detect = safechat.detect;
export const detectModeration = safechat.detectModeration;
export const detectSubtle = safechat.detectSubtle;
export const isHighCrisis = safechat.isHighCrisis;
export const isAnyCrisis = safechat.isAnyCrisis;

export const ConversationTracker = safechat.ConversationTracker;

export const locate = safechat.locate;
export const locateSync = safechat.locateSync;
export const fromRequest = safechat.fromRequest;
export const fromLocale = safechat.fromLocale;
export const fromTimezone = safechat.fromTimezone;

export const getResources = safechat.getResources;
export const listCountries = safechat.listCountries;
export const getEmergencyNumber = safechat.getEmergencyNumber;
export const search = safechat.search;
export const formatForChat = safechat.formatForChat;
export const formatForHTML = safechat.formatForHTML;
export const loadData = safechat.loadData;

export const Shield = safechat.Shield;
export const createShield = safechat.createShield;
export const PRESETS = safechat.PRESETS;

export const CrossClassifier = safechat.CrossClassifier;
export const createCrossClassifier = safechat.createCrossClassifier;
export const CC_PRESETS = safechat.CC_PRESETS;

export const SemanticLayer = safechat.SemanticLayer;
export const createSemanticLayer = safechat.createSemanticLayer;
export const cosineSimilarity = safechat.cosineSimilarity;
export const DEFAULT_EXEMPLARS = safechat.DEFAULT_EXEMPLARS;

export default safechat;
