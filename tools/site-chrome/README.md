# Shared AI Lab header and footer

Every page on su394611-del.github.io and its project sites uses the same header, section bar and footer.

- **Styles and behaviour** are shared from this repository: `/assets/ailab-chrome.css` and `/assets/ailab-chrome.js`.
  Project sites load them from the same origin, so a change here reaches every site.
- **Markup** is static HTML stamped into each page between marker comments, so it works without
  JavaScript and stays crawlable:

  ```html
  <!-- ailab:head:start --> … <!-- ailab:head:end -->
  <!-- ailab:header:start --> … <!-- ailab:header:end -->
  <!-- ailab:footer:start --> … <!-- ailab:footer:end -->
  ```

## Changing a link, project or section

1. Edit `site.json`: projects (name, blurb, group, URL), header links, footer links, footer notes,
   and each page's section-bar links (`pages[].nav`).
2. Put a clone of every repository listed in `site.json` side by side in one folder, then run:

   ```sh
   python su394611-del.github.io/tools/site-chrome/build.py --root .
   python su394611-del.github.io/tools/site-chrome/build.py --root . --check   # exit 1 if any page is stale
   ```

3. Commit and push this repository first (it holds the CSS/JS), then the project repositories.

Page kinds: `home` (sticky header), `project` (header plus a sticky section bar with that page's
sections), `page` (sticky header). `embeddable` pages hide the chrome when shown inside an iframe;
`simple` pages move their body padding onto `<main>` so the header and footer run edge to edge.
Bump `version` in `site.json` when the CSS or JS changes, so browsers fetch the new files.
