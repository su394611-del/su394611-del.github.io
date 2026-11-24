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

  var stylesheet = new URL('privacy.css', document.currentScript.src).href;

  function sentence() {
    return COUNTER
      ? 'This site sets no cookies and runs no ad or social trackers. Visits are counted in aggregate, without cookies and without following you anywhere.'
      : 'This site sets no cookies and runs no ad or social trackers. Any visit counting is aggregate only, without cookies and without following you anywhere.';
  }

  function build(host, inline) {
    var root = host.attachShadow ? host.attachShadow({ mode: 'open' }) : host;
    var style = document.createElement('link');
    style.rel = 'stylesheet';
    style.href = stylesheet;
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
