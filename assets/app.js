/* Vue 3 progressive enhancement; known projects are server-visible static HTML. */
(() => {
  'use strict';
  const OWNER = 'su394611-del';
  const curated = [{"slug": "RAG-service", "text": "rag-service multi-tenant retrieval & rag service a fastapi and qdrant retrieval demonstration with tenant-filtered search, sentence transformers embeddings, semantic caching, and illustrative safeguards. python,qdrant,fastapi retrieval-oriented / extractive demo", "category": "retrieval"}, {"slug": "Mutli-agents-using-LangGraph", "text": "mutli-agents-using-langgraph multi-agent workflows with langgraph runnable python and notebook examples for stateful graphs, conditional routing, and agent orchestration. offline examples do not train a model. langgraph,python,agents workflow orchestration demo", "category": "agents"}, {"slug": "Pre-training-and-Fine-tuning", "text": "pre-training-and-fine-tuning llm fine-tuning: lora, sft, dpo & orpo small-dataset examples using qwen, smollm, hugging face transformers and trl for supervised tuning and preference optimization. lora,trl,qwen small-scale training examples", "category": "training"}, {"slug": "Distributed-Data-Parallel-Processing", "text": "distributed-data-parallel-processing distributed training with pytorch ddp a data-parallel training walkthrough using torchrun, a small causal transformer, and optional qwen lora fine-tuning. not a model-serving service. pytorch,ddp,torchrun training / distribution demo", "category": "inference"}, {"slug": "Parallel-LLM-Inference", "text": "parallel-llm-inference parallel llm batch inference multiprocessing workers run separate qwen model replicas for batch sentiment inference with jsonl input and ordered output; distinct from tensor parallelism. qwen,python,multi-gpu batch inference demo", "category": "inference"}, {"slug": "LLM-from-scratch", "text": "llm-from-scratch transformer encoder from scratch an educational pytorch transformer encoder for sentiment classification, including multi-head attention and positional encodings. not a generative llm. pytorch,attention,transformers encoder classification demo", "category": "training"}, {"slug": "Full-Fine-Training-Pre-Training-Mid-Training", "text": "full-fine-training-pre-training-mid-training distilbert full vs. head-only fine-tuning customer-support message classification comparing full distilbert fine-tuning with a frozen backbone and trained classification head on a small dataset. distilbert,pytorch,nlp small-dataset classifier demo", "category": "training"}, {"slug": "Tarnsformers-Training", "text": "tarnsformers-training transformer classification & alignment draft distilbert classification examples accompanied by an unfinished phi-2 sft/dpo draft. review its validation notes before attempting the draft. distilbert,transformers,sft contains unfinished work", "category": "training"}, {"slug": "Stock-market-trading-Application-using-MCP-langchain-langgraph", "text": "stock-market-trading-application-using-mcp-langchain-langgraph simulated market tools with mcp & langgraph a demonstration of mcp servers, langchain tools and langgraph workflows using simulated quotes, news and trade actions; no real orders are placed. mcp,langchain,langgraph simulation only · no live trading", "category": "agents"}];
  const known = new Set(curated.map(p => p.slug.toLowerCase()));
  const categoryLabels = {retrieval:'Retrieval / RAG',agents:'Agents / MCP',training:'Model training',inference:'Inference / scale',other:'Other'};
  const categorySymbols = {retrieval:'⌕',agents:'◇',training:'∑',inference:'↗',other:'✧'};
  if (!window.Vue || !window.Vue.createApp) {
    // The static HTML remains usable and indexable if the CDN is blocked.
    const status = document.querySelector('.sync-line');
    if (status) status.textContent = 'All nine verified repositories are listed. Live search requires Vue.js to load.';
    return;
  }
  const { createApp } = window.Vue;
  createApp({
    data() {
      return { category:'all', query:'', extraRepos:[], syncStatus:'Nine verified projects are displayed. Checking GitHub for additional public repositories…' };
    },
    computed: {
      totalCount() { return curated.length + this.extraRepos.length; },
      visibleCount() {
        return curated.filter(p => this.matches(p.category,p.slug)).length + this.extraRepos.filter(p => this.matchesDynamic(p)).length;
      }
    },
    methods: {
      resetFilters() { this.category = 'all'; this.query = ''; },
      matches(category,slug) {
        const item = curated.find(p => p.slug === slug);
        if (!item) return false;
        const q = this.query.trim().toLocaleLowerCase();
        return (this.category === 'all' || this.category === category) && (!q || item.text.includes(q));
      },
      matchesDynamic(item) {
        const q = this.query.trim().toLocaleLowerCase();
        return (this.category === 'all' || this.category === item.category) && (!q || item.searchText.includes(q));
      },
      classify(repo) {
        const s = [repo.name,repo.description,...(Array.isArray(repo.topics)?repo.topics:[])].join(' ').toLowerCase();
        if (/rag|retrieval|vector|embedding|qdrant/.test(s)) return 'retrieval';
        if (/agent|langgraph|langchain|mcp|workflow/.test(s)) return 'agents';
        if (/inference|serving|parallel|distributed|ddp/.test(s)) return 'inference';
        if (/training|fine.tun|pre.train|llm|transformer|bert|pytorch|model/.test(s)) return 'training';
        return 'other';
      },
      async syncGitHub() {
        const controller = new AbortController();
        const timeout = setTimeout(() => controller.abort(), 9000);
        let added = 0;
        try {
          // GitHub's public API has unauthenticated rate limits; do not require it for basic page content.
          for (let page=1; page<=10; page++) {
            const response = await fetch(`https://api.github.com/users/${OWNER}/repos?type=owner&sort=updated&per_page=100&page=${page}`, {
              headers:{Accept:'application/vnd.github+json'}, signal:controller.signal
            });
            if (!response.ok) throw new Error('GitHub API response '+response.status);
            const rows = await response.json();
            if (!Array.isArray(rows)) throw new Error('Unexpected API format');
            for (const repo of rows) {
              if (!repo || typeof repo.name !== 'string' || repo.private || repo.fork) continue;
              const slug = repo.name;
              const key = slug.toLowerCase();
              if (known.has(key) || key === OWNER || key === OWNER + '.github.io') continue;
              // Use a URL derived from the fixed owner, not arbitrary remote HTML.
              const url = `https://github.com/${OWNER}/${encodeURIComponent(slug)}`;
              const desc = typeof repo.description === 'string' && repo.description.trim() ? repo.description.trim().slice(0,260) : 'Browse this public repository for its source code, README and implementation details.';
              const tags = Array.isArray(repo.topics) ? repo.topics.filter(t => typeof t==='string').slice(0,3) : [];
              if (!tags.length && typeof repo.language==='string') tags.push(repo.language);
              const category = this.classify(repo);
              const item = {slug,url,docs:url+'/blob/'+encodeURIComponent(repo.default_branch || 'main')+'/README.md',title:slug.replace(/[-_]+/g,' '),description:desc,tags,category,categoryLabel:categoryLabels[category],symbol:categorySymbols[category]};
              item.searchText = [item.title,item.description,item.tags.join(' ')].join(' ').toLocaleLowerCase();
              this.extraRepos.push(item);
              known.add(key);
              added++;
            }
            if (rows.length < 100) break;
          }
          this.syncStatus = added ? `${added} additional public ${added===1?'repository':'repositories'} discovered from GitHub.` : 'All currently discovered public project repositories are listed.';
        } catch(e) {
          this.syncStatus = added ? `Discovered ${added} additional public projects; GitHub sync was interrupted.` : 'Nine verified projects are displayed. Live GitHub sync is temporarily unavailable.';
        } finally { clearTimeout(timeout); }
      }
    },
    mounted() { this.syncGitHub(); }
  }).mount('#app');
})();
