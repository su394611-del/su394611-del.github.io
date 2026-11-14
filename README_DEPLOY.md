# Sudhanshu Shukla — AI & GenAI Portfolio

**Website:** https://su394611-del.github.io/

This is a **Vue 3-enhanced static website** for GitHub Pages. It does **not require Node.js, npm, a build step, or GitHub Actions**. All nine verified projects are written directly into `index.html` so they remain readable to search engines and visible when JavaScript is unavailable. Vue powers searching, category filters, result counts, and discovery of new public project repositories.

## Upload / publish

1. Open the repository `https://github.com/su394611-del/su394611-del.github.io`.
2. Clone it to your computer, **make a backup of the existing files**, and copy the contents of this package into the repository **root**, preserving the `assets/` folder and subfiles.
3. Commit and push the new `index.html`, `assets/styles.css`, `assets/app.js`, `assets/social-preview.png`, `assets/favicon.svg`, `robots.txt`, `sitemap.xml`, `.nojekyll`, and optionally this README.
4. Open **Settings → Pages** and select **Deploy from a branch → `main` → `/(root)`**. If already configured, no change is needed.
5. Visit `https://su394611-del.github.io/`. Test it on desktop and mobile.

PowerShell example (if Git is installed and authenticated):

```powershell
git clone https://github.com/su394611-del/su394611-del.github.io.git
cd .\su394611-del.github.io
# Copy the package files into this folder; preserve /assets.
git add -A
git commit -m "Upgrade portfolio UI with Vue 3 and SEO metadata"
git push origin main
```

If using **GitHub's web interface**, replace `index.html`, then create/update the files in the `assets` folder and the root metadata files separately. Uploading only `index.html` will not be sufficient because its stylesheet, JavaScript, favicon, and social image are separate files.

## File layout

```text
index.html                    # All 9 static project cards, SEO, structured data
assets/styles.css             # Responsive styles: laptop, tablet, phone
assets/app.js                 # Vue 3 filters, search and GitHub public API sync
assets/favicon.svg            # Portfolio icon
assets/social-preview.png     # Social sharing image (1200 x 630)
robots.txt                    # Crawl directives and sitemap reference
sitemap.xml                   # Only the website URL; NOT external GitHub repository URLs
.nojekyll                     # Prevent GitHub Pages from running Jekyll
README_DEPLOY.md              # These instructions
AUDIT_NOTES.md                # Summary of repairs and limitations
```

## Search Console / Google indexing

1. Open https://search.google.com/search-console and add a **URL-prefix property**: `https://su394611-del.github.io/`.
2. Verify ownership (Google's HTML file verification is convenient; upload their file unchanged to your repository root).
3. In **Sitemaps**, submit `https://su394611-del.github.io/sitemap.xml`.
4. Inspect `https://su394611-del.github.io/` under **URL Inspection** and request indexing if appropriate.
5. Check actual index status in Search Console. **No sitemap, meta tag, or framework guarantees a ranking or inclusion in Google's index.**

`ItemList` JSON-LD describes real repositories; it is not a promise of special rich results. Don't add fake reviews, awards, employer affiliations, or performance metrics.

## Editing the portfolio

Existing project descriptions are curated and intentionally cautious. To add a new project **for reliable crawlability**, add a complete static card in `index.html` **and** add it to the `curated` list in `assets/app.js` and the structured-data `ItemList` in `index.html`. Future public repositories may also appear automatically in users' browsers through the GitHub API, but **dynamic-only cards are not guaranteed to be indexed**.

Vue 3 loads as a version-pinned global production script from jsDelivr. This can be replaced with a locally hosted vetted copy if you later prefer fully self-hosted dependencies. Vue is not required for the static links to remain available.

**Licensing:** Each linked repository may have a different license and third-party obligations. Do not assume this website's copyright footer or any license file automatically licenses those separate repositories.
