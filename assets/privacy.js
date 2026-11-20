/*
 * Privacy notice shared by su394611-del.github.io and every project site under it.
 *
 * - Sets no cookies. The visitor's choice is one localStorage key (KEY below).
 * - Never shows inside embedded frames (contact form, playground preview).
 * - Visit counting is OFF until COUNTER is filled in. When it is, the counter
 *   script loads only for visitors who have not opted out and whose browser
 *   does not send Do Not Track or Global Privacy Control.
 *
 * To turn on cookieless counting with GoatCounter (https://www.goatcounter.com):
 *   var COUNTER = 'https://YOUR-CODE.goatcounter.com/count';
 */
(function () {
  'use strict';
  if (window.self !== window.top) return;

  var COUNTER = '';
  var KEY = 'ss-privacy-choice'; // "in" | "out"
  var PRIVACY_URL = '/privacy/';

  var signal = navigator.globalPrivacyControl === true ||
    navigator.doNotTrack === '1' || window.doNotTrack === '1';

  function getChoice() {
    try { return localStorage.getItem(KEY); } catch (e) { return null; }
  }
  function setChoice(value) {
    try { localStorage.setItem(KEY, value); } catch (e) { /* storage blocked: choice lasts this page only */ }
    memo = value;
  }
  var memo = getChoice();

  // Opted in, or no choice yet and no Do Not Track / GPC signal.
  function effectiveIn() {
    return memo === 'in' || (memo === null && !signal);
  }
  function counting() {
    return !!COUNTER && effectiveIn();
  }

  var counterLoaded = false;
  function maybeLoadCounter() {
    if (counterLoaded || !counting()) return;
    counterLoaded = true;
    var s = document.createElement('script');
    s.async = true;
    s.src = 'https://gc.zgo.at/count.js';
    s.setAttribute('data-goatcounter', COUNTER);
    document.head.appendChild(s);
  }

  var CSS = [
    ':host{all:initial}',
    '*,*::before,*::after{box-sizing:border-box}',
    '.card{position:fixed;left:20px;bottom:20px;z-index:2147483000;width:min(392px,calc(100vw - 40px));',
    'padding:18px 18px 16px;border-radius:16px;border:1px solid #29415d;',
    'background:linear-gradient(160deg,#11233b,#0b1729);color:#eef5ff;',
    'font:14px/1.55 Inter,ui-sans-serif,system-ui,-apple-system,BlinkMacSystemFont,"Segoe UI",sans-serif;',
    '-webkit-font-smoothing:antialiased;box-shadow:0 18px 50px rgba(0,0,0,.45);',
    'animation:in .32s ease-out both}',
    '@keyframes in{from{opacity:0;transform:translateY(12px)}to{opacity:1;transform:none}}',
    '@media (prefers-reduced-motion:reduce){.card{animation:none}}',
    '.head{display:flex;align-items:center;gap:9px;margin:0 0 6px;font-size:11px;font-weight:800;',
    'letter-spacing:.16em;text-transform:uppercase;color:#7be2f0}',
    '.dot{width:8px;height:8px;border-radius:50%;background:#87e4c7;box-shadow:0 0 0 4px rgba(135,228,199,.14)}',
    'p{margin:0 0 12px;color:#aabed5}',
    '.row{display:flex;align-items:center;flex-wrap:wrap;gap:8px}',
    'a{color:#7be2f0;font-weight:650;text-decoration:none;margin-right:auto}',
    'a:hover{text-decoration:underline}',
    'button{font:inherit;font-size:13px;font-weight:700;cursor:pointer;padding:7px 14px;border-radius:999px;',
    'border:1px solid #3a5a7c;background:#132841;color:#eef5ff}',
    'button:hover{border-color:#7be2f0}',
    'button[aria-pressed="true"]{background:#7be2f0;border-color:#7be2f0;color:#06111f}',
    'a:focus-visible,button:focus-visible{outline:3px solid #95eaff;outline-offset:2px}',
    '.note{margin:10px 0 0;font-size:12px;color:#829bb6}',
    '.inline{position:static;width:auto;box-shadow:none;animation:none}',
    '@media (max-width:520px){.card:not(.inline){left:10px;right:10px;bottom:10px;width:auto}}'
  ].join('');

  function sentence() {
    return COUNTER
      ? 'This site sets no cookies and runs no ad or social trackers. Visits are counted in aggregate, without cookies and without following you anywhere.'
      : 'This site sets no cookies and runs no ad or social trackers. Any visit counting is aggregate only, without cookies and without following you anywhere.';
  }

  function build(host, inline) {
    var root = host.attachShadow ? host.attachShadow({ mode: 'open' }) : host;
    var style = document.createElement('style');
    style.textContent = CSS;
    root.appendChild(style);

    var card = document.createElement('section');
    card.className = inline ? 'card inline' : 'card';
    card.setAttribute('role', 'region');
    card.setAttribute('aria-label', 'Privacy notice');
    card.innerHTML =
      '<div class="head"><span class="dot" aria-hidden="true"></span>No tracking cookies</div>' +
      '<p></p>' +
      '<div class="row">' +
      (inline ? '' : '<a href="' + PRIVACY_URL + '">What is collected</a>') +
      '<button type="button" data-v="in">Opt in</button>' +
      '<button type="button" data-v="out">Opt out</button>' +
      '</div>' +
      (inline ? '<div class="note" aria-live="polite"></div>' : '');
    card.querySelector('p').textContent = sentence();
    if (inline) card.querySelector('.row').style.justifyContent = 'flex-start';
    root.appendChild(card);

    var buttons = card.querySelectorAll('button');
    var note = card.querySelector('.note');
    function paint() {
      var on = effectiveIn();
      var show = inline || memo !== null;
      for (var i = 0; i < buttons.length; i++) {
        var v = buttons[i].getAttribute('data-v');
        buttons[i].setAttribute('aria-pressed', String(show && (v === 'in') === on));
      }
      if (note) {
        var state = memo === 'out' ? 'You have opted out.' :
          memo === 'in' ? 'You have opted in.' :
          signal ? 'Your browser sends Do Not Track / Global Privacy Control, so you are treated as opted out.' :
          'No choice saved yet.';
        note.textContent = state + (COUNTER ? '' : ' No visit counter is active on this site right now.');
      }
    }
    for (var i = 0; i < buttons.length; i++) {
      buttons[i].addEventListener('click', function (e) {
        setChoice(e.currentTarget.getAttribute('data-v'));
        maybeLoadCounter();
        if (inline) { paint(); return; }
        host.remove();
      });
    }
    paint();
  }

  function init() {
    maybeLoadCounter();

    var slot = document.getElementById('privacy-controls');
    if (slot) build(slot, true);

    if (memo === null && !slot) {
      var host = document.createElement('div');
      host.id = 'ss-privacy-notice';
      document.body.appendChild(host);
      build(host, false);
    }

    var flags = document.querySelectorAll('[data-privacy-if]');
    for (var j = 0; j < flags.length; j++) {
      var want = flags[j].getAttribute('data-privacy-if');
      flags[j].hidden = want === 'counter' ? !COUNTER : !!COUNTER;
    }
  }

  window.ssPrivacy = {
    choice: function () { return memo; },
    counting: counting,
    optIn: function () { setChoice('in'); maybeLoadCounter(); },
    optOut: function () { setChoice('out'); }
  };

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init);
  else init();
})();
