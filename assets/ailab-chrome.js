/* AI Lab shared site chrome: small enhancements for the stamped header, section bar and footer.
 * Everything works without this file (menus are <details>); this adds closing behaviour,
 * the stuck state of the section bar and the active-section highlight.
 * Listeners are delegated to document so pages that re-render their DOM (Vue) do not drop them.
 */
(function () {
  'use strict';
  var doc = document;

  function menus() { return doc.querySelectorAll('details.ailab-dd[open], details.ailab-menu[open]'); }
  function closeAll(except) {
    menus().forEach(function (d) { if (d !== except) d.open = false; });
  }

  // Only one menu open at a time.
  doc.addEventListener('toggle', function (e) {
    var d = e.target;
    if (d && d.matches && d.matches('details.ailab-dd, details.ailab-menu') && d.open) closeAll(d);
  }, true);

  // Close on outside click, and after following a link inside a menu.
  doc.addEventListener('click', function (e) {
    var t = e.target;
    if (!t || !t.closest) return;
    var inside = t.closest('details.ailab-dd, details.ailab-menu');
    if (!inside) { closeAll(null); return; }
    if (t.closest('a')) inside.open = false;
  });

  // Escape closes and returns focus to the button that opened the menu.
  doc.addEventListener('keydown', function (e) {
    if (e.key !== 'Escape') return;
    menus().forEach(function (d) {
      d.open = false;
      var s = d.querySelector('summary');
      if (s && d.contains(doc.activeElement)) s.focus();
    });
  });

  function ready(fn) {
    if (doc.readyState === 'loading') doc.addEventListener('DOMContentLoaded', fn); else fn();
  }

  ready(function () {
    var bar = doc.querySelector('.ailab-subnav');
    var header = doc.querySelector('.ailab-header');
    if (!bar || !('IntersectionObserver' in window)) return;

    // Show the small AI Lab mark in the section bar once the main header has scrolled away.
    if (header) {
      new IntersectionObserver(function (entries) {
        bar.classList.toggle('is-stuck', !entries[0].isIntersecting);
      }).observe(header);
    }

    // Highlight the section currently in view.
    var links = Array.prototype.slice.call(bar.querySelectorAll('.ailab-subnav-links a[href^="#"]'));
    var strip = bar.querySelector('.ailab-subnav-links');
    var byId = {};
    var targets = [];
    links.forEach(function (a) {
      var id = decodeURIComponent(a.getAttribute('href').slice(1));
      var el = id && doc.getElementById(id);
      if (el) { byId[id] = a; targets.push(el); }
    });
    if (!targets.length) return;
    var visible = {};
    var current = null;
    function setActive(id) {
      if (id === current) return;
      current = id;
      links.forEach(function (a) { a.classList.remove('is-active'); a.removeAttribute('aria-current'); });
      var a = id && byId[id];
      if (!a) return;
      a.classList.add('is-active');
      a.setAttribute('aria-current', 'location');
      // Keep the active link visible in the horizontal strip without moving the page.
      if (strip && strip.scrollWidth > strip.clientWidth) {
        var left = a.offsetLeft - strip.clientWidth / 2 + a.offsetWidth / 2;
        strip.scrollTo({ left: Math.max(0, left), behavior: 'auto' });
      }
    }
    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (en) { visible[en.target.id] = en.isIntersecting; });
      var pick = null;
      for (var i = 0; i < targets.length; i++) { if (visible[targets[i].id]) { pick = targets[i].id; break; } }
      if (pick || window.scrollY < 200) setActive(pick);
    }, { rootMargin: '-80px 0px -55% 0px', threshold: 0 });
    targets.forEach(function (el) { io.observe(el); });
  });
})();
