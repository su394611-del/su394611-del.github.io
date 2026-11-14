# Deploy the Vue portfolio homepage

The ZIP includes the complete replacement `index.html`, `assets/app.js`, `assets/styles.css`, a sitemap, robots file, and project URL map. The project cards are present in HTML before JavaScript loads and use Vue 3 for filtering/search when the CDN is available. A native JavaScript fallback keeps filtering/search operational when Vue is blocked.

## Deployment

1. Open https://github.com/su394611-del/su394611-del.github.io on the **main** branch.
2. Replace root-level `index.html` and `assets/app.js` and `assets/styles.css` with the ZIP files; upload `sitemap.xml` and `robots.txt` at the root.
3. **Preserve** existing `.nojekyll`, `assets/favicon.svg`, `assets/social-preview.png`, and `google52e604ac7dffee7b.html`.
4. Check Settings > Pages. The owner site should publish `main / (root)` (or whatever actual source is active). Wait for GitHub's deployment to finish before doing a hard refresh.
5. Visit https://su394611-del.github.io/ and test each project card's **Open website** button, plus Source and README.

## Why all nine sites might still be missing

Changing the homepage links fixes **navigation**, not an undeployed subsite. Each project has a separate GitHub Pages deployment and must have the correct publishing source: `main /docs` for eight projects; **Parallel-LLM-Inference uses the `legacy` default branch**, so check its Settings > Pages and deploy from the configured branch/folder. Pages configuration can also use GitHub Actions; match the actual publishing source. Confirm `docs/index.html` was committed in each relevant branch, and check Actions/Pages deployment logs for errors. Project slugs are case-sensitive; the correct renamed repository path is `Transformers-Training` (not `Tarnsformers-Training`). 

This package cannot deploy sites automatically because GitHub connection permissions are read-only. Repository existence and Pages enablement were confirmed; actual HTTP access from this environment was unavailable, so do not interpret links as verified HTTP 200.

## Copy of nine URLs

- Multi-Tenant Retrieval & RAG Service: https://su394611-del.github.io/RAG-service/
- Multi-Agent Workflows with LangGraph: https://su394611-del.github.io/Mutli-agents-using-LangGraph/
- LLM Fine-Tuning & Preference Optimization: https://su394611-del.github.io/Pre-training-and-Fine-tuning/
- Distributed LLM Training with PyTorch DDP: https://su394611-del.github.io/Distributed-Data-Parallel-Processing/
- Parallel LLM Batch Inference: https://su394611-del.github.io/Parallel-LLM-Inference/
- Transformer Encoder from Scratch: https://su394611-del.github.io/LLM-from-scratch/
- DistilBERT Full vs. Frozen Fine-Tuning: https://su394611-del.github.io/Full-Fine-Training-Pre-Training-Mid-Training/
- Transformer Training & Model Evaluation: https://su394611-del.github.io/Transformers-Training/
- MCP & LangGraph Market Workflow Simulation: https://su394611-del.github.io/Stock-market-trading-Application-using-MCP-langchain-langgraph/
