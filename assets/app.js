(() => {
  'use strict';
  const records = [...document.querySelectorAll('#projects-grid .project-card[data-repo]')].map(card => {
    const link = card.querySelector('h3 a[href]');
    return {
      slug: card.id.replace(/^project-/, ''),
      repo: card.dataset.repo,
      category: card.dataset.category,
      title: card.dataset.title || link?.textContent.trim() || '',
      url: card.dataset.url || link?.href || '',
      search: normalize([card.dataset.search, card.dataset.keywords, card.textContent].join(' ')),
      element: card
    };
  });
  const lookup = new Map(records.map(item => [item.slug, item]));
  const categoryNames = { all:'All projects', retrieval:'Retrieval / RAG', agents:'Agents / MCP', training:'Model training', inference:'Inference / scale' };
  const input = document.querySelector('#project-search');
  function normalize(value) {
    return String(value || '').normalize('NFKD').toLocaleLowerCase('en').replace(/[\u0300-\u036f]/g, '').replace(/[—–_]/g, ' ').replace(/[^a-z0-9.\s+-]/g, ' ').replace(/\s+/g, ' ').trim();
  }
  function textMatches(item, query) {
    return normalize(query).split(' ').filter(Boolean).every(part => item.search.includes(part));
  }
  function scoreSuggestion(item, query) {
    const q = normalize(query), title = normalize(item.title);
    if (title === q) return 0;
    if (title.startsWith(q)) return 1;
    if (title.includes(q)) return 2;
    return 3;
  }
  function suggest(query, cat='all') {
    const q = normalize(query);
    if (!q) return [];
    return records.filter(item => (cat === 'all' || item.category === cat) && textMatches(item, q))
      .sort((a,b) => scoreSuggestion(a,q)-scoreSuggestion(b,q) || a.title.localeCompare(b.title))
      .slice(0,6);
  }
  function scrollToPreview() {
    const pane = document.getElementById('live-preview');
    if (!pane) return;
    pane.scrollIntoView({block:'start', behavior:window.matchMedia('(prefers-reduced-motion: reduce)').matches ? 'auto':'smooth'});
  }
  function ensureRel() {
    document.querySelectorAll('a[target="_blank"]').forEach(link => {
      if (!link.rel.includes('noopener')) link.rel = 'noopener noreferrer';
    });
  }
  function installShortcut() {
    document.addEventListener('keydown', e => {
      const target = e.target;
      if (e.key !== '/' || e.altKey || e.metaKey || e.ctrlKey || target?.closest('input, textarea, select, [contenteditable="true"]')) return;
      e.preventDefault();
      document.getElementById('project-search')?.focus();
      document.getElementById('projects')?.scrollIntoView({block:'start'});
    });
  }
  ensureRel();
  installShortcut();

  function initDirectory() {
    let category='all', query='', active=-1, matchesList=[];
    const status=document.getElementById('project-results-count');
    const buttons=[...document.querySelectorAll('.filter-chip')];
    const suggestionsEl=document.getElementById('project-suggestions');
    const previewSection=document.getElementById('live-preview');
    const empty=document.createElement('div');
    empty.className='zero-results'; empty.hidden=true;
    empty.innerHTML='<strong>No matching projects</strong><p>Try a different search, or clear the filters.</p>';
    document.getElementById('projects-grid')?.insertAdjacentElement('afterend',empty);
    const reset=document.createElement('button');reset.type='button';reset.textContent='Clear filters';reset.className='reset-control native-reset';
    document.querySelector('.results-line')?.appendChild(reset);
    function render() {
      let visible=0;
      records.forEach(item => {
        const show=(category==='all'||item.category===category)&&textMatches(item,query);
        item.element.hidden=!show;item.element.style.display=show?'':'none';if(show)visible++;
      });
      buttons.forEach(b => {
        const cat=b.dataset.category;
        b.classList.toggle('active',cat===category);b.setAttribute('aria-pressed',String(cat===category));
      });
      if(status)status.textContent=`Showing ${visible} of ${records.length} projects`;
      empty.hidden=visible!==0;
      reset.hidden=category==='all'&&!query;
      renderSuggestions();
    }
    function renderSuggestions() {
      matchesList=suggest(query,category);active=-1;input?.removeAttribute('aria-activedescendant');
      if(!suggestionsEl)return;
      suggestionsEl.replaceChildren();
      suggestionsEl.hidden=!(matchesList.length && document.activeElement===input);
      input?.setAttribute('aria-expanded',String(!suggestionsEl.hidden));
      for(const item of matchesList){
        const option=document.createElement('button');option.type='button';option.className='suggestion-item';option.setAttribute('role','option');
        option.id='suggestion-'+item.slug;option.setAttribute('aria-selected','false');
        option.textContent=item.title+' · '+categoryNames[item.category];
        option.addEventListener('mousedown',e=>e.preventDefault());
        option.addEventListener('click',()=>choose(item));suggestionsEl.appendChild(option);
      }
    }
    function choose(item){category='all';query=item.title;input.value=query;input.blur();render();suggestionsEl.hidden=true;item.element.scrollIntoView({block:'center'});}
    buttons.forEach(btn=>btn.addEventListener('click',()=>{category=btn.dataset.category;render();}));
    document.querySelectorAll('.focus-tile').forEach((tile,i)=>tile.addEventListener('click',()=>{category=['retrieval','agents','training','inference'][i];query='';if(input)input.value='';render();}));
    input?.addEventListener('input',()=>{query=input.value;render();});
    input?.addEventListener('focus',renderSuggestions);
    input?.addEventListener('blur',()=>window.setTimeout(()=>{if(suggestionsEl)suggestionsEl.hidden=true;input.setAttribute('aria-expanded','false');},120));
    input?.addEventListener('keydown',e=>{
      if(e.key==='Escape'){suggestionsEl.hidden=true;input.setAttribute('aria-expanded','false');input.removeAttribute('aria-activedescendant');return;}
      if(e.key==='ArrowDown'||e.key==='ArrowUp'){
        if(!matchesList.length)return;e.preventDefault();active=(active+(e.key==='ArrowDown'?1:-1)+matchesList.length)%matchesList.length;
        const opts=[...suggestionsEl.querySelectorAll('.suggestion-item')];opts.forEach((el,i)=>{el.classList.toggle('selected',i===active);el.setAttribute('aria-selected',String(i===active));});
        input.setAttribute('aria-activedescendant',opts[active].id);
        suggestionsEl.hidden=false;
      }
      if(e.key==='Enter'&&matchesList.length&&document.activeElement===input){e.preventDefault();choose(matchesList[Math.max(active,0)]);}
    });
    reset.addEventListener('click',()=>{category='all';query='';if(input)input.value='';render();});
    document.querySelectorAll('[data-preview]').forEach(btn=>btn.addEventListener('click',()=>{
      const item=lookup.get(btn.dataset.preview);if(!item||!previewSection)return;
      const destination=new URL(item.url,location.href);
      if(!['https://su394611-del.github.io','https://huggingface.co'].includes(destination.origin))return;
      previewSection.style.display='block';
      previewSection.querySelector('.preview-description').textContent=item.title;
      previewSection.querySelector('.chrome-url').textContent=item.url;
      const link=previewSection.querySelector('.preview-actions a');link.href=item.url;
      const iframe=previewSection.querySelector('iframe');if(iframe){iframe.src=item.url;iframe.title='Website preview: '+item.title;}
      scrollToPreview();
    }));
    previewSection?.querySelector('.preview-actions button')?.addEventListener('click',()=>{
      previewSection.style.display='none';const iframe=previewSection.querySelector('iframe');if(iframe)iframe.removeAttribute('src');
    });
    document.documentElement.classList.add('native-fallback');
    render();
  }
  initDirectory();
})();
