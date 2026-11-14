# Index.html audit and corrections

Based on the pasted `index.html` and the repository directories/README openings available on November 14, 2026.

## Corrected HTML and SEO

- Fixed invalid Open Graph key `og: description` → `og:description`.
- Repaired an unmatched closing `</span>` on the MCP/LangGraph project card.
- Rewrote a lengthy, repetitive description and title as a concise, human-readable portfolio summary.
- Added canonical, Open Graph, X/Twitter preview metadata, responsive viewport, social preview, SVG favicon, and a valid `CollectionPage` + `ItemList` / `Person` / `WebSite` JSON-LD graph.
- Added `robots.txt` and `sitemap.xml` containing the site homepage. External `github.com` links belong in site content, not in the GitHub Pages sitemap.
- Kept every verified GitHub project anchor in the original HTML for more reliable crawler discovery; avoided a client-rendered empty app shell.

## Factual corrections in project summaries

- `LLM-from-scratch`: accurately described as an educational Transformer **encoder for classification** rather than a complete production-grade generative LLM.
- MCP stock-market workflow: labeled as a **simulation** with no real broker trading; removed unsupported "production-ready" assertion.
- PyTorch DDP: accurately named distributed *training* rather than implying that it is an inference-serving service.
- Parallel LLM inference: clarified that batch workers hold separate full model replicas; not the same as tensor parallelism.
- Transformer alignment draft: identified unfinished work without implying the draft has been validated end-to-end.
- Retrieval demo: described as RAG-oriented tenant-filtered retrieval rather than an independently verified production SaaS service.

## Functional design

- Rebuilt styles with a 3-column laptop grid, 2-column tablet grid, and 1-column phone grid, along with responsive header, category cards, search, clear filters, and reduced-motion support.
- Added Vue 3 progressive enhancement with a static no-JavaScript baseline.
- Retained GitHub public-repository discovery, with a 9-second timeout and graceful failure if API is inaccessible or rate-limited. Excludes profile and Pages repositories; excludes forks to avoid misrepresenting them as original projects.
- Never inserts remote GitHub text as HTML; Vue escapes interpolated values.

## Limitations

- This package was tested locally for static markup, SEO file integrity, and responsive CSS at 1440px, 768px, 390px and 320px. The external CDN version of Vue could not be downloaded in this isolated testing environment; GitHub Pages/browser deployment should be used for a final live interaction check.
- Google indexing/rankings cannot be validated until the changes are published and ownership is verified in Search Console.
- Only nine project repositories were verified in the current search; future projects added through the API are inherently less SEO reliable than static entries.
