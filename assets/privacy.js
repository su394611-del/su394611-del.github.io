// Shared by the portfolio and its project sites. An embed relies on its parent
// for consent controls and never counts an additional visit.
(function () {
  'use strict';
  if (window.self !== window.top || window.ssPrivacy) return;

  const COUNTER = ''; // Optional HTTPS GoatCounter /count endpoint.
  const KEY = 'ss-privacy-choice';
  const stylesheet = new URL('privacy.css?v=20261124-consent2', document.currentScript.src);
  const privacyUrl = new URL('https://su394611-del.github.io/privacy/');
  let memo = null;
  let counted = false;
  let refresh = () => {};

  function readChoice() {
    try {
      const value = localStorage.getItem(KEY);
      memo = value === 'in' || value === 'out' ? value : null;
    } catch (_) { /* Keep the in-memory preference if storage is unavailable. */ }
  }
  function privacySignal() {
    return navigator.globalPrivacyControl === true || navigator.doNotTrack === '1' || window.doNotTrack === '1';
  }
  function counting() {
    return Boolean(COUNTER && memo === 'in' && !privacySignal());
  }
  function sync() {
    readChoice();
    refresh();
    if (counted || !counting()) return;
    const url = new URL(COUNTER);
    url.searchParams.set('p', location.pathname);
    url.searchParams.set('rnd', String(Date.now()));
    const visit = new Image();
    visit.referrerPolicy = 'no-referrer';
    counted = true;
    visit.src = url.href;
  }
  function choose(value) {
    if (value === 'in' && privacySignal()) return;
    memo = value;
    try { localStorage.setItem(KEY, value); } catch (_) { /* This page still honours the choice. */ }
    refresh();
    if (counting()) sync();
  }
  readChoice();
  window.ssPrivacy = {
    choice: () => memo,
    counting,
    optIn: () => choose('in'),
    optOut: () => choose('out')
  };
  window.addEventListener('storage', event => {
    if (event.key === KEY || event.key === null) sync();
  });
  window.addEventListener('pageshow', sync);

  function init() {
    const slot = document.getElementById('privacy-controls');
    // Pages with the shared footer provide a spot for the "Privacy settings" button in its bottom row;
    // the notice card itself stays position:fixed, so it still floats over the page.
    const footerSlot = slot ? null : document.querySelector('[data-privacy-settings]');
    const host = slot || footerSlot || document.createElement('div');
    if (!slot) host.id = 'ss-privacy-notice';
    if (!slot && !footerSlot) document.body.append(host);
    const root = host.attachShadow({mode: 'open'});
    const style = document.createElement('link');
    style.rel = 'stylesheet';
    style.href = stylesheet.href;
    const panel = document.createElement('section');
    panel.className = slot ? 'card inline' : 'card';
    panel.setAttribute('aria-label', 'Visit counting preferences');
    panel.innerHTML = '<div class="head">Visit counting</div><p></p><div class="row"><button type="button" data-v="in">Opt in</button><button type="button" data-v="out">Opt out</button></div><div class="note" aria-live="polite"></div>';
    const details = document.createElement('a');
    details.textContent = 'Privacy details';
    details.href = privacyUrl.href;
    if (!slot) panel.querySelector('.row').append(details);
    const settings = document.createElement('button');
    settings.type = 'button';
    settings.className = 'settings';
    settings.textContent = 'Privacy settings';
    settings.setAttribute('aria-controls', 'visit-preferences');
    panel.id = 'visit-preferences';
    let reopened = false;
    const allow = panel.querySelector('[data-v="in"]');
    const decline = panel.querySelector('[data-v="out"]');
    settings.addEventListener('click', () => {
      reopened = !reopened;
      refresh();
      if (reopened) (allow.disabled ? decline : allow).focus();
    });
    function save(value) {
      const returnToSettings = reopened;
      reopened = false;
      choose(value);
      if (returnToSettings) settings.focus({preventScroll: true});
    }
    panel.addEventListener('keydown', event => {
      if (event.key === 'Escape' && reopened) {
        reopened = false;
        refresh();
        settings.focus();
      }
    });
    allow.addEventListener('click', () => save('in'));
    decline.addEventListener('click', () => save('out'));
    root.append(style, settings, panel);
    refresh = () => {
      const signal = privacySignal();
      panel.hidden = !slot && !reopened && (memo !== null || signal);
      settings.hidden = Boolean(slot) || (!panel.hidden && !reopened);
      settings.setAttribute('aria-expanded', String(!panel.hidden));
      allow.disabled = signal;
      allow.setAttribute('aria-pressed', String(memo === 'in' && !signal));
      decline.setAttribute('aria-pressed', String(signal || memo === 'out'));
      panel.querySelector('p').textContent = COUNTER
        ? 'Allow anonymous visit counting across this site and its project pages?'
        : 'Choose whether to allow anonymous visit counting. No counter is active.';
      panel.querySelector('.note').textContent = signal ? 'Your browser requests no tracking. Counting is off.' :
        memo === 'in' ? 'Opted in.' : memo === 'out' ? 'Opted out.' : '';
    };
    for (const flag of document.querySelectorAll('[data-privacy-if]')) {
      flag.hidden = (flag.dataset.privacyIf === 'counter') !== Boolean(COUNTER);
    }
    sync();
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init);
  else init();
})();
