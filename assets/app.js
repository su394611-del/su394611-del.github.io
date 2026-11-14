/* Production-oriented Vue 3 enhancement for a server-readable GitHub Pages portfolio.
   All nine projects and their hyperlinks are static HTML. No API is needed to see them.
   When the Vue CDN is blocked, native JS enables the same search and filtering. */
(() => {
  'use strict';
  const records = Array.from(document.querySelectorAll('#projects-grid .project-card[data-repo]')).map(card => ({
    slug: card.dataset.repo,
    category: card.dataset.category,
    search: (card.dataset.search || card.textContent || '').toLocaleLowerCase(),
    element: card
  }));
  const lookup = new Map(records.map(p => [p.slug, p]));
  function addKeyboardFeedback() {
    // In both Vue and the native fallback, links are true hrefs and work without JavaScript.
    document.querySelectorAll('a[target="_blank"]').forEach(link => {
      if (!link.rel.includes('noopener')) link.rel = 'noopener noreferrer';
    });
  }
  function initNativeFallback() {
    let category = 'all';
    let query = '';
    const status = document.getElementById('project-results-count');
    const search = document.querySelector('.search-control input');
    const empty = document.createElement('div');
    empty.className = 'zero-results';
    empty.setAttribute('role', 'status');
    empty.hidden = true;
    empty.innerHTML = '<strong>No matching projects</strong><p>Try another keyword or select All projects.</p>';
    document.getElementById('projects-grid')?.insertAdjacentElement('afterend', empty);
    const buttons = Array.from(document.querySelectorAll('.filter-chip'));
    const render = () => {
      const q = query.trim().toLocaleLowerCase();
      let visible = 0;
      records.forEach(p => {
        const show = (category === 'all' || p.category === category) && (!q || p.search.includes(q));
        p.element.hidden = !show;
        p.element.style.display = show ? '' : 'none';
        if (show) visible++;
      });
      buttons.forEach(button => {
        const match = button.getAttribute('@click')?.match(/category = '([^']+)'/);
        const selected = (match ? match[1] : 'all') === category;
        button.classList.toggle('active', selected);
        button.setAttribute('aria-pressed', String(selected));
      });
      if (status) status.textContent = `Showing ${visible} of ${records.length} projects`;
      empty.hidden = visible > 0;
    };
    buttons.forEach(button => button.addEventListener('click', () => {
      const match = button.getAttribute('@click')?.match(/category = '([^']+)'/);
      category = match ? match[1] : 'all';
      render();
    }));
    document.querySelectorAll('.focus-tile').forEach((tile, i) => {
      const topic = ['retrieval', 'agents', 'training', 'inference'][i];
      tile.addEventListener('click', () => { category = topic; query = ''; if (search) search.value = ''; render(); });
    });
    if (search) search.addEventListener('input', event => { query = event.target.value || ''; render(); });
    // A visible basic reset option for the non-Vue interface.
    const reset = document.createElement('button');
    reset.type = 'button';
    reset.className = 'reset-control native-reset';
    reset.textContent = 'Clear filters';
    reset.addEventListener('click', () => { category = 'all'; query = ''; if (search) search.value = ''; render(); });
    document.querySelector('.results-line')?.appendChild(reset);
    document.documentElement.classList.add('native-fallback');
    render();
  }
  addKeyboardFeedback();
  if (window.Vue && typeof window.Vue.createApp === 'function') {
    try {
      const { createApp } = window.Vue;
      createApp({
        data() { return { category: 'all', query: '' }; },
        computed: {
          totalCount() { return records.length; },
          visibleCount() { return records.filter(item => this.matches(item.category,item.slug)).length; }
        },
        methods: {
          resetFilters() { this.category = 'all'; this.query = ''; },
          matches(category,slug) {
            const item = lookup.get(slug);
            if (!item) return false;
            const q = this.query.trim().toLocaleLowerCase();
            return (this.category === 'all' || this.category === category) && (!q || item.search.includes(q));
          }
        }
      }).mount('#app');
      document.documentElement.classList.add('vue-ready');
      return;
    } catch (error) {
      console.warn('Vue failed to mount; using accessible native filter fallback.', error);
    }
  }
  initNativeFallback();
})();
