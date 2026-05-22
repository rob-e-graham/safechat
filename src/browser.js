/**
 * Safechat — Browser bundle
 *
 * Standalone version that works in any browser without Node.js.
 * Loads crisis resources inline (no filesystem access needed).
 *
 * Usage:
 *   <script src="https://unpkg.com/safechat/src/browser.js"></script>
 *   <script>
 *     const result = Safechat.check("I feel hopeless");
 *     if (result.level !== "none") Safechat.showModal(result);
 *   </script>
 */

(function (root) {
  "use strict";

  // ── Input normalisation ──

  function normalise(text) {
    var t = text.toLowerCase();
    t = t.replace(/[\s ]+/g, " ").trim();
    t = t.replace(/[‘’‚‛]/g, "'");
    t = t.replace(/[“”„‟]/g, '"');
    t = t.replace(/\bsuicde\b/g,"suicide").replace(/\bsuiside\b/g,"suicide");
    t = t.replace(/\bsuciide?\b/g,"suicide").replace(/\bsuidice?\b/g,"suicide").replace(/\bsuicd\b/g,"suicide");
    t = t.replace(/\boverdoze\b/g,"overdose").replace(/\boverdoase\b/g,"overdose");
    t = t.replace(/\bkil\b/g,"kill");
    t = t.replace(/\bwanna\b/g,"want to").replace(/\bgonna\b/g,"going to");
    t = t.replace(/\bwant 2\b/g,"want to").replace(/\b2 die\b/g,"to die");
    t = t.replace(/\bkms\b/g,"kill myself").replace(/\bkys\b/g,"kill yourself");
    return t;
  }

  // ── False-positive guards ──

  var FP_CUT = /\bcut(ting)? my (hair|nails?|finger|losses?|cake|lawn|grass|ties|cord|cards?|teeth)\b/i;
  var FP_HURT = /\bhurt(ing|s)? my (ankle|back|knee|leg|arm|hand|foot|feet|neck|shoulder|wrist|finger|elbow|head|eye|feelings?|pride)\b/i;
  var FP_BLEED = /\b(economy|market|company|stock|budget|money)\b.*\bbleed|\bbleed.*\b(economy|market|company|stock|budget|money)\b/i;
  var FP_SUICIDE = /\bsuicide (squeeze|bunt|pass|mission|door|prevention|awareness|hotline|class)\b|\b(that|this) (joke|movie|show|game|song|set) was suicide\b/i;
  var FP_JUMP = /\bjump(ing)? (off|from) (the topic|that|this topic|there|here|one thing)\b/i;
  var FP_OD = /\boverdose[ds]? on (coffee|caffeine|sugar|chocolate|candy|pizza|food|information|data)\b/i;
  var FP_HTML = /class\s*=\s*['"][^'"]*suicid/i;

  function isFP(t, matched) {
    if (/cut/.test(matched) && FP_CUT.test(t)) return true;
    if (/hurt/.test(matched) && FP_HURT.test(t)) return true;
    if (/bleed/.test(matched) && FP_BLEED.test(t)) return true;
    if (/suicid/.test(matched) && (FP_SUICIDE.test(t) || FP_HTML.test(t))) return true;
    if (/jump/.test(matched) && FP_JUMP.test(t)) return true;
    if (/overdose/.test(matched) && FP_OD.test(t)) return true;
    return false;
  }

  // ── Detection (synced with detect.js) ──

  var HIGH_SIGNALS = [
    /\bsuicid/i, /\bkill (my|myself|me)\b/i, /\bend(ing)? (my|this) life\b/i,
    /\btake my (own )?life\b/i, /\bwant to die\b/i,
    /\bwish (i was|i were|i'm) dead\b/i, /\bdon'?t want to (be here|live|exist|be alive)\b/i,
    /\bno reason to live\b/i, /\bself[- ]?harm/i, /\bhurt(ing)? (my|myself)\b/i,
    /\bcut(ting)? (my|myself)\b/i, /\boverdose\b/i, /\bhanging (my|myself)\b/i,
    /\bjump(ing)? (off|from)\b/i, /\bpills?\b.*\b(take|swallow|end)\b/i,
    /\b(end|stop) the pain\b/i, /\bslit(ting)? my\b/i, /\bbleed(ing)? out\b/i,
    /\bshoot(ing)? (my|myself)\b/i, /\bdrown(ing)? (my|myself)\b/i,
    /\boff myself\b/i, /\btop myself\b/i, /\bbetter off dead\b/i,
    /\b(easiest|best|fastest|quickest|simplest) way to die\b/i,
    /\bhow (to|do i|can i|would i) (kill|end|off) (myself|my life|it all)\b/i,
    /\b(writing|wrote|write) (my )?(goodbye|suicide) (letters?|notes?)\b/i,
    /\bgave away (all |everything|my stuff|my things|my possessions)\b/i,
    /\bwon'?t be (here|around|alive) (much )?longer\b/i,
    /\bdon'?t care if i (wake|die|live)\b/i,
    /\bi have a plan\b.*\b(tonight|today|tomorrow|this week|the night)\b/i,
  ];

  var LOW_SIGNALS = [
    /\bcan'?t go on\b/i, /\bno point\b/i, /\bnobody (cares|would miss me|would notice)\b/i,
    /\beveryone (would be |is )?better off (without me)?\b/i, /\bworthless\b/i,
    /\b(completely |utterly |totally )?hopeless\b/i, /\bending it (all)?\b/i,
    /\bnot worth (living|it)\b/i, /\bgive up on (life|everything|myself)\b/i,
    /\bwhat('?s| is) the point\b/i, /\bi (just )?can'?t (do this|take it|anymore)\b/i,
    /\bno way out\b/i, /\btoo much to bear\b/i, /\bno one (cares|understands|would miss)\b/i,
    /\bi('?m| am) (a |so |such a )?burden\b/i, /\blife is(n'?t| not) worth\b/i,
    /\bwish i (wasn'?t|weren'?t) (here|alive|born)\b/i,
    /\bcan'?t (see|find) (a |any )?(way |reason )?(to go on|forward|out)\b/i,
    /\btrapped\b.*\b(no|can'?t|won'?t)\b/i, /\bnothing (left|matters|to live for)\b/i,
    /\bdon'?t see a future\b/i,
    /\b(easier|better) if i (wasn'?t|weren'?t|am not) here\b/i,
  ];

  function detect(text) {
    if (!text || typeof text !== "string") return { level: "none", matched: null };
    var t = normalise(text);
    for (var i = 0; i < HIGH_SIGNALS.length; i++) {
      var m = t.match(HIGH_SIGNALS[i]);
      if (m && !isFP(t, m[0])) return { level: "high", matched: m[0] };
    }
    for (var j = 0; j < LOW_SIGNALS.length; j++) {
      var m2 = t.match(LOW_SIGNALS[j]);
      if (m2 && !isFP(t, m2[0])) return { level: "low", matched: m2[0] };
    }
    return { level: "none", matched: null };
  }

  // ── Geo-detection ──

  var TZ_MAP = {
    "Australia":"AU","Europe/Vienna":"AT","Europe/Brussels":"BE","America/Sao_Paulo":"BR",
    "America/Toronto":"CA","America/Vancouver":"CA","Asia/Shanghai":"CN","Europe/Copenhagen":"DK",
    "Europe/Helsinki":"FI","Europe/Paris":"FR","Europe/Berlin":"DE","Africa/Accra":"GH",
    "Asia/Hong_Kong":"HK","Asia/Kolkata":"IN","Asia/Calcutta":"IN","Europe/Dublin":"IE",
    "Asia/Jerusalem":"IL","Europe/Rome":"IT","Asia/Tokyo":"JP","Africa/Nairobi":"KE",
    "America/Mexico_City":"MX","Europe/Amsterdam":"NL","Pacific/Auckland":"NZ","Africa/Lagos":"NG",
    "Europe/Oslo":"NO","Asia/Karachi":"PK","Asia/Manila":"PH","Europe/Lisbon":"PT",
    "Europe/Moscow":"RU","Africa/Johannesburg":"ZA","Asia/Seoul":"KR","Europe/Madrid":"ES",
    "Europe/Stockholm":"SE","Europe/Zurich":"CH","Europe/London":"GB",
    "America/New_York":"US","America/Chicago":"US","America/Los_Angeles":"US",
    "America/Denver":"US","America/Phoenix":"US",
  };

  function locateCountry(manual) {
    if (manual) return manual.toUpperCase();
    try {
      var locale = navigator.language || "";
      var parts = locale.split("-");
      if (parts.length >= 2) {
        var code = parts[parts.length - 1].toUpperCase();
        if (code.length === 2) return code;
      }
    } catch (_) {}
    try {
      var tz = Intl.DateTimeFormat().resolvedOptions().timeZone || "";
      if (TZ_MAP[tz]) return TZ_MAP[tz];
      for (var prefix in TZ_MAP) {
        if (tz.indexOf(prefix) === 0 || tz.indexOf(prefix) !== -1) return TZ_MAP[prefix];
      }
    } catch (_) {}
    return null;
  }

  // ── Inline crisis resources (top 3 per country to keep bundle small) ──

  var RESOURCES = {
    AU:{name:"Australia",emergency:"000",resources:[
      {name:"Lifeline Australia",phone:"13 11 14",hours:"24/7"},
      {name:"Beyond Blue",phone:"1300 22 4636",hours:"24/7"},
      {name:"Kids Helpline",phone:"1800 55 1800",hours:"24/7"}
    ]},
    AT:{name:"Austria",emergency:"112",resources:[{name:"Telefonseelsorge",phone:"142",hours:"24/7"}]},
    BE:{name:"Belgium",emergency:"112",resources:[{name:"Centrum ter Preventie van Zelfdoding",phone:"0800 32 123",hours:"24/7"}]},
    BR:{name:"Brazil",emergency:"192",resources:[{name:"CVV",phone:"188",hours:"24/7"}]},
    CA:{name:"Canada",emergency:"911",resources:[
      {name:"Crisis Services Canada",phone:"1-833-456-4566",hours:"24/7"},
      {name:"Kids Help Phone",phone:"1-800-668-6868",hours:"24/7"}
    ]},
    CN:{name:"China",emergency:"120",resources:[{name:"Beijing Crisis Centre",phone:"800-810-1117",hours:"24/7"}]},
    DK:{name:"Denmark",emergency:"112",resources:[{name:"Livslinien",phone:"70 201 201",hours:"11:00-05:00"}]},
    FI:{name:"Finland",emergency:"112",resources:[{name:"Suomen Mielenterveysseura",phone:"09 2525 0111",hours:"24/7"}]},
    FR:{name:"France",emergency:"15",resources:[{name:"Numéro National Prévention Suicide",phone:"3114",hours:"24/7"}]},
    DE:{name:"Germany",emergency:"112",resources:[{name:"Telefonseelsorge",phone:"0800 111 0 111",hours:"24/7"}]},
    GH:{name:"Ghana",emergency:"999",resources:[{name:"Mental Health Authority",phone:"+233 800 111 222",hours:"Business hours"}]},
    HK:{name:"Hong Kong",emergency:"999",resources:[{name:"Samaritans of Hong Kong",phone:"2389 2222",hours:"24/7"}]},
    IN:{name:"India",emergency:"112",resources:[
      {name:"Vandrevala Foundation",phone:"1860-2662-345",hours:"24/7"},
      {name:"iCall",phone:"9152987821",hours:"Mon-Sat 8am-10pm"}
    ]},
    IE:{name:"Ireland",emergency:"112",resources:[
      {name:"Samaritans Ireland",phone:"116 123",hours:"24/7"},
      {name:"Pieta House",phone:"1800 247 247",hours:"24/7"}
    ]},
    IL:{name:"Israel",emergency:"101",resources:[{name:"ERAN",phone:"1201",hours:"24/7"}]},
    IT:{name:"Italy",emergency:"118",resources:[{name:"Telefono Azzurro",phone:"19696",hours:"24/7"}]},
    JP:{name:"Japan",emergency:"119",resources:[{name:"Inochi no Denwa",phone:"0120-783-556",hours:"24/7"}]},
    KE:{name:"Kenya",emergency:"999",resources:[{name:"Befrienders Kenya",phone:"0800 723 253",hours:"24/7"}]},
    MX:{name:"Mexico",emergency:"911",resources:[{name:"SAPTEL",phone:"55 5259-8121",hours:"24/7"}]},
    NL:{name:"Netherlands",emergency:"112",resources:[{name:"113 Zelfmoordpreventie",phone:"0900 0113",hours:"24/7"}]},
    NZ:{name:"New Zealand",emergency:"111",resources:[
      {name:"Lifeline Aotearoa",phone:"0800 543 354",hours:"24/7"},
      {name:"Youthline",phone:"0800 376 633",hours:"24/7"}
    ]},
    NG:{name:"Nigeria",emergency:"199",resources:[{name:"SURPIN",phone:"08111909909",hours:"24/7"}]},
    NO:{name:"Norway",emergency:"113",resources:[{name:"Mental Helse",phone:"116 123",hours:"24/7"}]},
    PK:{name:"Pakistan",emergency:"115",resources:[{name:"Umang Pakistan",phone:"0317-4288665",hours:"Mon-Sat"}]},
    PH:{name:"Philippines",emergency:"911",resources:[{name:"Hopeline",phone:"2919",hours:"24/7"}]},
    PT:{name:"Portugal",emergency:"112",resources:[{name:"SOS Voz Amiga",phone:"213 544 545",hours:"15:30-00:30"}]},
    RU:{name:"Russia",emergency:"112",resources:[{name:"Moscow Psych Help",phone:"8-800-2000-122",hours:"24/7"}]},
    ZA:{name:"South Africa",emergency:"10177",resources:[{name:"SADAG",phone:"0800 456 789",hours:"24/7"}]},
    KR:{name:"South Korea",emergency:"119",resources:[{name:"Suicide Prevention Hotline",phone:"1393",hours:"24/7"}]},
    ES:{name:"Spain",emergency:"112",resources:[
      {name:"Teléfono de la Esperanza",phone:"717 003 717",hours:"24/7"},
      {name:"024 Línea suicida",phone:"024",hours:"24/7"}
    ]},
    SE:{name:"Sweden",emergency:"112",resources:[{name:"Mind Självmordslinjen",phone:"90101",hours:"24/7"}]},
    CH:{name:"Switzerland",emergency:"144",resources:[{name:"Die Dargebotene Hand",phone:"143",hours:"24/7"}]},
    GB:{name:"United Kingdom",emergency:"999",resources:[
      {name:"Samaritans",phone:"116 123",hours:"24/7"},
      {name:"Crisis Text Line",sms:"Text SHOUT to 85258",hours:"24/7"},
      {name:"PAPYRUS (Youth)",phone:"0800 068 4141",hours:"Mon-Fri 10-22, Weekends 14-22"}
    ]},
    US:{name:"United States",emergency:"911",resources:[
      {name:"988 Suicide & Crisis Lifeline",phone:"988",sms:"Text 988",hours:"24/7"},
      {name:"Crisis Text Line",sms:"Text HOME to 741741",hours:"24/7"},
      {name:"Trevor Project (LGBTQ+ Youth)",phone:"1-866-488-7386",hours:"24/7"}
    ]}
  };

  var FALLBACK = [
    {name:"Find a Helpline (175+ countries)",url:"https://findahelpline.com",hours:"24/7"},
    {name:"Befrienders Worldwide",url:"https://www.befrienders.org",hours:"24/7"}
  ];

  function getResources(countryCode) {
    var code = (countryCode || "").toUpperCase();
    var entry = RESOURCES[code];
    if (entry) return {country:entry.name, emergency:entry.emergency, resources:entry.resources, fallback:false, globalResources:[]};
    return {country:null, emergency:null, resources:[], fallback:true, globalResources:FALLBACK};
  }

  // ── One-call check ──

  function check(text, options) {
    options = options || {};
    var result = detect(text);
    var country = locateCountry(options.country);
    var resources = result.level !== "none" ? getResources(country) : {resources:[],fallback:false,globalResources:[]};
    var action = result.level === "high" ? "crisis_intervention" : result.level === "low" ? "soft_warning" : "none";
    return {level:result.level, matched:result.matched, country:country, resources:resources, action:action};
  }

  // ── Built-in UI: modal and banner ──

  var MODAL_CSS = '\
.safechat-backdrop{display:none;position:fixed;inset:0;z-index:99999;background:rgba(0,0,0,0.85);backdrop-filter:blur(6px);-webkit-backdrop-filter:blur(6px);align-items:flex-end;justify-content:center;padding:0 0 max(16px,env(safe-area-inset-bottom,16px));animation:safechatFadeIn 300ms ease forwards}\
.safechat-backdrop.active{display:flex}\
@keyframes safechatFadeIn{from{opacity:0}to{opacity:1}}\
.safechat-modal{width:100%;max-width:440px;background:#0e1018;border:1px solid rgba(255,255,255,0.1);border-radius:20px 20px 14px 14px;padding:28px 24px 24px;box-shadow:0 -4px 48px rgba(0,0,0,0.6);animation:safechatSlideUp 350ms cubic-bezier(0.22,1,0.36,1) forwards;font-family:-apple-system,BlinkMacSystemFont,Segoe UI,Roboto,sans-serif;color:rgba(255,255,255,0.85)}\
@keyframes safechatSlideUp{from{transform:translateY(60px);opacity:0}to{transform:translateY(0);opacity:1}}\
.safechat-title{font-size:20px;font-weight:400;margin-bottom:12px;line-height:1.3}\
.safechat-body{font-size:14px;color:rgba(255,255,255,0.6);line-height:1.6;margin-bottom:18px}\
.safechat-resource{background:rgba(255,255,255,0.05);border:1px solid rgba(255,255,255,0.09);border-radius:10px;padding:12px 14px;margin-bottom:8px}\
.safechat-resource strong{display:block;font-size:13px;color:rgba(255,255,255,0.9);margin-bottom:4px}\
.safechat-resource div{font-size:12px;color:rgba(180,160,220,0.75)}\
.safechat-resource a{color:rgba(180,160,220,0.75);text-decoration:none}\
.safechat-emergency{font-size:12px;color:rgba(255,255,255,0.38);text-align:center;margin:12px 0}\
.safechat-emergency a{color:rgba(255,255,255,0.38);text-decoration:none}\
.safechat-dismiss{width:100%;padding:12px;background:none;border:1px solid rgba(255,255,255,0.12);border-radius:10px;color:rgba(255,255,255,0.5);font-size:13px;cursor:pointer}\
.safechat-banner{position:fixed;top:0;left:0;right:0;z-index:99998;background:rgba(14,16,24,0.95);border-bottom:1px solid rgba(180,160,220,0.2);padding:14px 20px;text-align:center;font-size:13px;color:rgba(255,255,255,0.7);line-height:1.5;font-family:-apple-system,BlinkMacSystemFont,Segoe UI,Roboto,sans-serif;animation:safechatFadeIn 300ms ease forwards}\
.safechat-banner a,.safechat-banner button{background:none;border:none;color:rgba(180,160,220,0.9);cursor:pointer;font-size:13px;text-decoration:underline;padding:0;margin-left:4px}\
.safechat-banner .safechat-banner-close{color:rgba(255,255,255,0.35);font-size:16px;text-decoration:none;padding:0 0 0 10px;line-height:1}';

  var styleInjected = false;
  function injectStyle() {
    if (styleInjected) return;
    var s = document.createElement("style");
    s.textContent = MODAL_CSS;
    document.head.appendChild(s);
    styleInjected = true;
  }

  function renderResourceHTML(result) {
    var all = result.resources.length > 0 ? result.resources : result.globalResources || [];
    return all.map(function(r) {
      var parts = [];
      if (r.phone) parts.push('<a href="tel:' + r.phone.replace(/\s/g,"") + '">' + r.phone + '</a>');
      if (r.sms) parts.push('<span>' + r.sms + '</span>');
      if (r.url) parts.push('<a href="' + r.url + '" target="_blank" rel="noopener">Online</a>');
      if (r.hours) parts.push('<span>' + r.hours + '</span>');
      return '<div class="safechat-resource"><strong>' + r.name + '</strong><div>' + parts.join(" &middot; ") + '</div></div>';
    }).join("");
  }

  function showModal(resultOrCountry) {
    injectStyle();
    var result = typeof resultOrCountry === "string" ? getResources(resultOrCountry) : (resultOrCountry.resources || getResources(resultOrCountry.country));
    if (result.level) result = result.resources; // handle check() result

    var existing = document.getElementById("safechat-modal-backdrop");
    if (existing) existing.remove();

    var backdrop = document.createElement("div");
    backdrop.className = "safechat-backdrop active";
    backdrop.id = "safechat-modal-backdrop";
    backdrop.setAttribute("role", "dialog");
    backdrop.setAttribute("aria-modal", "true");

    var emergency = result.emergency ? '<div class="safechat-emergency">Emergency: <a href="tel:' + result.emergency + '">' + result.emergency + '</a></div>' : '';

    backdrop.innerHTML = '<div class="safechat-modal">' +
      '<div class="safechat-title">You don\'t have to carry this alone.</div>' +
      '<div class="safechat-body">Someone is available right now, and they want to hear from you.</div>' +
      renderResourceHTML(result) +
      emergency +
      '<button class="safechat-dismiss" onclick="Safechat.hideModal()">I\'m okay — continue</button>' +
      '</div>';

    document.body.appendChild(backdrop);
    document.body.style.overflow = "hidden";
  }

  function hideModal() {
    var el = document.getElementById("safechat-modal-backdrop");
    if (el) el.remove();
    document.body.style.overflow = "";
  }

  function showBanner(options) {
    injectStyle();
    options = options || {};
    var existing = document.getElementById("safechat-banner");
    if (existing) return;

    var banner = document.createElement("div");
    banner.className = "safechat-banner";
    banner.id = "safechat-banner";
    banner.innerHTML = (options.message || 'If things feel heavy right now, support is available.') +
      ' <button onclick="Safechat.showModal(\'' + (options.country || locateCountry()) + '\')">View crisis resources</button>' +
      '<button class="safechat-banner-close" onclick="this.parentElement.remove()" aria-label="Dismiss">&times;</button>';
    document.body.appendChild(banner);

    if (options.autoDismiss !== false) {
      setTimeout(function() { if (banner.parentElement) banner.remove(); }, options.duration || 12000);
    }
  }

  /**
   * Auto-protect: intercept form submissions and input events.
   * Call once to monitor all text inputs/textareas for crisis signals.
   *
   * Safechat.protect({ selector: 'textarea.chat-input' });
   */
  function protect(options) {
    options = options || {};
    var selector = options.selector || 'textarea, input[type="text"]';
    var country = options.country || locateCountry();

    document.addEventListener("keydown", function(e) {
      if (e.key !== "Enter" || e.shiftKey) return;
      var el = e.target;
      if (!el || !el.matches(selector)) return;
      var text = el.value || "";
      var result = detect(text);
      if (result.level === "high") {
        showModal(getResources(country));
      } else if (result.level === "low") {
        showBanner({ country: country });
      }
    }, true);
  }

  // ── Export ──

  var Safechat = {
    detect: detect,
    check: check,
    locateCountry: locateCountry,
    getResources: getResources,
    showModal: showModal,
    hideModal: hideModal,
    showBanner: showBanner,
    protect: protect,
    RESOURCES: RESOURCES,
    FALLBACK: FALLBACK,
    version: "1.1.0",
    credit: "SafeChat by FAMTEC — fineartmedia.tech"
  };

  if (typeof module !== "undefined" && module.exports) {
    module.exports = Safechat;
  } else {
    root.Safechat = Safechat;
  }

})(typeof globalThis !== "undefined" ? globalThis : typeof window !== "undefined" ? window : this);
