/**
 * SafeChat embed loader — drop-in crisis safety for any page.
 * Created by FAMTEC — fineartmedia.tech
 *
 * Usage:
 *   <script src="https://cdn.jsdelivr.net/gh/rob-e-graham/safechat@main/src/embed.js"
 *           data-safechat-monitor="true"></script>
 *
 * Options (via data attributes on the script tag):
 *   data-safechat-monitor="true"  — auto-monitor all text inputs
 *   data-safechat-popup="true"    — preload popup for instant offline access
 *   data-safechat-position="bottom-right" — banner position
 */
(function () {
  'use strict';
  if (typeof window === 'undefined' || window.__safechatEmbed) return;
  window.__safechatEmbed = true;

  var SCRIPT = document.currentScript;
  var CDN_BASE = 'https://cdn.jsdelivr.net/gh/rob-e-graham/safechat@main';

  function attr(name) {
    return SCRIPT && SCRIPT.getAttribute('data-safechat-' + name);
  }

  // Load the browser bundle
  var s = document.createElement('script');
  s.src = CDN_BASE + '/src/browser.js';
  s.onload = function () {
    if (attr('monitor') === 'true') {
      Safechat.protect();
    }

    // Preload popup iframe for instant access
    if (attr('popup') === 'true') {
      var link = document.createElement('link');
      link.rel = 'prefetch';
      link.href = CDN_BASE + '/app/popup.html';
      document.head.appendChild(link);
    }
  };
  document.head.appendChild(s);
})();
