/* AI Lab shared site chrome: small enhancements for the stamped header, section bar and footer.
 * Everything works without this file (menus are <details>); this adds closing behaviour,
 * the stuck state of the section bar and the active-section highlight.
 * Vue owns the disclosure state; the stamped links remain usable without JavaScript.
 */
(function () {
  'use strict';
  var doc = document;

  function mountNavigation() {
    var bar = doc.querySelector('.ailab-header .ailab-bar');
    if (!bar || !window.Vue) return;
    var menus = bar.querySelectorAll('details.ailab-dd, details.ailab-menu');
    menus.forEach(function (menu) {
      var name = menu.classList.contains('ailab-menu') ? 'mobile' : 'desktop';
      menu.setAttribute('v-bind:open', "active === '" + name + "'");
      menu.querySelector('summary').setAttribute('v-on:click.prevent', "toggle('" + name + "')");
    });
    Vue.createApp({
      data: function () { return { active: null }; },
      methods: {
        toggle: function (name) { this.active = this.active === name ? null : name; },
        dismiss: function (event) {
          if (!event.target.closest('.ailab-dd, .ailab-menu') || event.target.closest('a')) this.active = null;
        },
        escape: function (event) {
          if (event.key !== 'Escape' || !this.active) return;
          var summary = bar.querySelector('details[open] > summary');
          if (summary) summary.focus();
          this.active = null;
        }
      },
      mounted: function () {
        doc.addEventListener('click', this.dismiss);
        doc.addEventListener('keydown', this.escape);
      },
      beforeUnmount: function () {
        doc.removeEventListener('click', this.dismiss);
        doc.removeEventListener('keydown', this.escape);
      }
    }).mount(bar);
  }

  function ready(fn) {
    if (doc.readyState === 'loading') doc.addEventListener('DOMContentLoaded', fn); else fn();
  }

  ready(function () {
    mountNavigation();
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
