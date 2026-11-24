#!/usr/bin/env python3
"""Stamp the shared AI Lab header, section bar and footer into every site page.

The markup lives between marker comments in each page:

    <!-- ailab:head:start --> ... <!-- ailab:head:end -->        (before </head>)
    <!-- ailab:header:start --> ... <!-- ailab:header:end -->    (top of <body>)
    <!-- ailab:footer:start --> ... <!-- ailab:footer:end -->    (end of the page)

Edit site.json (projects, links, notes, per-page section links), then run from a folder
that holds a clone of every repository listed in site.json:

    python su394611-del.github.io/tools/site-chrome/build.py --root .
    python su394611-del.github.io/tools/site-chrome/build.py --root . --check   # exit 1 if any page is stale

Styles and behaviour are shared from https://su394611-del.github.io/assets/ailab-chrome.{css,js}.
"""
import argparse
import html
import json
import os
import re
import sys

HERE = os.path.dirname(os.path.abspath(__file__))
BLOCKS = ("head", "header", "footer")

GH_ICON = ('<svg class="ailab-ico" aria-hidden="true" width="17" height="17" viewBox="0 0 24 24" fill="currentColor"><path d="M12 .9C5.86.9.9 5.88.9 '
           '12.03c0 4.92 3.19 9.1 7.62 10.57.56.1.76-.24.76-.54v-2.11c-3.1.67-3.76-1.32-3.76-1.32-.5-1.28-1.24-1.62-1.24-1.62-1.02-.7.08-.68.08-.68 '
           '1.13.08 1.73 1.16 1.73 1.16 1.01 1.73 2.65 1.23 3.3.94.1-.73.39-1.23.72-1.52-2.47-.28-5.07-1.24-5.07-5.5 0-1.21.44-2.19 1.15-2.96-.12-.28-.5-1.4.11-2.91 '
           '0 0 .94-.3 3.06 1.13a10.67 10.67 0 0 1 5.58 0c2.12-1.44 3.05-1.13 3.05-1.13.61 1.51.23 2.63.11 2.91.72.77 1.15 1.75 1.15 2.97 0 4.26-2.6 5.21-5.08 '
           '5.49.4.35.75 1.04.75 2.1v3.12c0 .3.2.65.77.54 4.42-1.48 7.6-5.65 7.6-10.56C23.1 5.88 18.14.9 12 .9Z"/></svg>')
CHEVRON = ('<svg class="ailab-chev" aria-hidden="true" viewBox="0 0 12 12" fill="none" stroke="currentColor" stroke-width="1.8" '
           'stroke-linecap="round" stroke-linejoin="round"><path d="M2.5 4.5 6 8l3.5-3.5"/></svg>')
MENU_ICON = ('<svg class="ailab-menu-icon" aria-hidden="true" viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="1.8" '
             'stroke-linecap="round"><path class="ailab-burger" d="M2 4h12M2 8h12M2 12h12"/><path class="ailab-x" d="M3.5 3.5l9 9M12.5 3.5l-9 9"/></svg>')
EXT = ' target="_blank" rel="noopener noreferrer"'


def esc(s):
    return html.escape(s, quote=True)


def is_external(href):
    return href.startswith("http://") or href.startswith("https://")


def link_attrs(href):
    return f'href="{esc(href)}"' + (EXT if is_external(href) else "")


def arrow(href):
    return ' <span aria-hidden="true">↗</span>' if is_external(href) else ""


def project_link(p, current, cls="ailab-proj", blurb=True):
    cur = ' aria-current="page"' if current == p["key"] else ""
    ext = '<span class="ailab-ext" aria-hidden="true"> ↗</span>' if p.get("external") else ""
    small = f'<small>{esc(p["blurb"])}</small>' if blurb else ""
    klass = f'class="{cls}" ' if cls else ""
    return f'<a {klass}{link_attrs(p["href"])}{cur}>{esc(p["name"])}{ext}{small}</a>'


def render_head(site, page):
    v = site["version"]
    parts = ['<script defer src="/assets/vue-3.5.13.global.prod.js"></script>',
             f'<link rel="stylesheet" href="/assets/ailab-chrome.css?v={v}">',
             f'<script src="/assets/ailab-chrome.js?v={v}" defer></script>']
    parts.append('<script defer src="/assets/privacy.js?v=20261124-consent2"></script>')
    if page.get("embeddable"):
        parts.insert(0, '<script src="/assets/embed-mode.js"></script>')
    return "".join(parts)


def render_dropdown(site, current):
    groups = {g: [] for g in site["groups"]}
    for p in site["projects"]:
        groups[p["group"]].append(p)
    first, rest = site["groups"][0], site["groups"][1:]

    def group(g):
        items = "".join(f"<li>{project_link(p, current)}</li>" for p in groups[g])
        return f'<div class="ailab-dd-group"><p class="ailab-group-label">{esc(g)}</p><ul>{items}</ul></div>'

    col2 = "".join(group(g) for g in rest)
    count = len(site["projects"])
    return ('<details class="ailab-dd"><summary class="ailab-link">Projects' + CHEVRON + '</summary>'
            '<div class="ailab-dd-panel"><div class="ailab-dd-grid">'
            f'<div>{group(first)}</div><div>{col2}</div></div>'
            f'<a class="ailab-dd-all" href="/#projects">Browse all {count} projects <span aria-hidden="true">→</span></a>'
            '</div></details>')


def render_header(site, page):
    current = page.get("project") if page["kind"] == "project" else page.get("current")
    top_id = page.get("top_id", "ailab-top")
    sticky = page["kind"] != "project"
    skip = ""
    if page.get("skip_to"):
        skip = f'<a class="ailab-skip" href="#{esc(page["skip_to"])}">Skip to content</a>'

    nav_links = "".join(
        f'<a class="ailab-link" href="{esc(l["href"])}"' + (' aria-current="page"' if current == l["key"] else "") + f'>{esc(l["label"])}</a>'
        for l in site["header_links"])
    gh = f'<a class="ailab-gh" {link_attrs(site["github"])}>{GH_ICON}<span>GitHub</span><span aria-hidden="true">↗</span></a>'

    menu_lab = "".join(
        f'<a class="ailab-link" href="{esc(l["href"])}"' + (' aria-current="page"' if current == l["key"] else "") + f'>{esc(l["label"])}</a>'
        for l in ([{"key": "home", "label": "AI Lab home", "href": "/"},
                   {"key": "projects", "label": "All projects", "href": "/#projects"}] + site["header_links"]))
    menu_lab += f'<a class="ailab-link" {link_attrs(site["github"])}>GitHub{arrow(site["github"])}</a>'
    menu_projects = "".join(f"<li>{project_link(p, current)}</li>" for p in site["projects"])

    header = (
        f'{skip}<header class="ailab-header{" ailab-sticky" if sticky else ""}" id="{esc(top_id)}">'
        '<div class="ailab-wrap ailab-bar">'
        f'<a class="ailab-brand" href="/" aria-label="{esc(site["owner"])}\'s AI Lab home">'
        '<span class="ailab-mark" aria-hidden="true">SS</span>'
        f'<span class="ailab-brand-text"><strong>{esc(site["owner"])}</strong><small>{esc(site["tagline"])}</small></span></a>'
        f'<nav class="ailab-nav" aria-label="AI Lab">{render_dropdown(site, current)}{nav_links}{gh}</nav>'
        f'<details class="ailab-menu"><summary>{MENU_ICON}<span>Menu</span></summary>'
        '<nav class="ailab-menu-panel" aria-label="AI Lab menu">'
        f'<p class="ailab-group-label">AI Lab</p><div class="ailab-menu-links">{menu_lab}</div>'
        f'<p class="ailab-group-label">Projects</p><ul>{menu_projects}</ul>'
        '</nav></details>'
        '</div></header>')

    if page["kind"] == "project":
        proj = project_by_key(site, page["project"])
        gh_small = GH_ICON.replace('width="17" height="17"', 'width="15" height="15"')
        items = []
        for entry in page["nav"]:
            label, href = entry[0], entry[1]
            extra = "".join(f' {esc(k)}' + (f'="{esc(v)}"' if v else "") for k, v in (entry[2] if len(entry) > 2 else {}).items())
            items.append(f'<a href="{esc(href)}"{extra}>{esc(label)}</a>')
        header += (
            f'<nav class="ailab-subnav" aria-label="{esc(proj["name"])} sections">'
            '<div class="ailab-wrap ailab-subnav-inner">'
            '<a class="ailab-subnav-home" href="/" aria-label="AI Lab home"><span class="ailab-mark" aria-hidden="true">SS</span></a>'
            f'<a class="ailab-subnav-title" href="#{esc(top_id)}">{esc(proj["name"])}</a>'
            f'<div class="ailab-subnav-links">{"".join(items)}</div>'
            f'<a class="ailab-subnav-cta" {link_attrs(proj["repo"])}><span class="ailab-cta-word">Source</span>{gh_small}'
            '<span aria-hidden="true">↗</span><span class="ailab-sr"> on GitHub</span></a>'
            '</div></nav>')
    return header


def render_footer(site, page):
    current_proj = page.get("project") if page["kind"] == "project" else None
    current = page.get("current")
    top_id = page.get("top_id", "ailab-top")

    def li(label, href, cur=False, badge=None):
        b = f'<span class="ailab-badge">{esc(badge)}</span>' if badge else ""
        c = ' aria-current="page"' if cur else ""
        return f'<li><a {link_attrs(href)}{c}>{esc(label)}{arrow(href)}</a>{b}</li>'

    projects = "".join(f"<li>{project_link(p, current_proj, cls='', blurb=False)}</li>" for p in site["projects"])
    cols = [f'<nav class="ailab-footer-col ailab-col-projects" aria-label="Projects"><p class="ailab-group-label">Projects</p><ul>{projects}</ul></nav>']

    pkey = page.get("project")
    if pkey:
        proj = project_by_key(site, pkey)
        own = [li("Source code", proj["repo"]), li("Wiki", proj["repo"] + "/wiki")]
        own += [li(x["label"], x["href"]) for x in site.get("project_extras", {}).get(pkey, [])]
        cols.append(f'<nav class="ailab-footer-col" aria-label="This project"><p class="ailab-group-label">This project</p><ul>{"".join(own)}</ul></nav>')

    lab = "".join(li(l["label"], l["href"], cur=(current == l["key"]), badge=l.get("badge")) for l in site["lab_links"])
    cols.append(f'<nav class="ailab-footer-col ailab-col-lab" aria-label="AI Lab"><p class="ailab-group-label">AI Lab</p><ul>{lab}</ul></nav>')
    other = "".join(li(l["label"], l["href"]) for l in site["elsewhere_links"])
    cols.append(f'<nav class="ailab-footer-col" aria-label="Elsewhere"><p class="ailab-group-label">Elsewhere</p><ul>{other}</ul></nav>')

    note = site.get("notes", {}).get(pkey or "", "")
    note_html = f'<p class="ailab-footer-note">{note}</p>' if note else ""
    small_cols = len(cols) - 1  # columns after "Projects"
    inv = site.get("invite")
    invite_html = ""
    if inv:
        ctas = "".join(f'<a class="ailab-invite-cta{" is-primary" if i == 0 else ""}" {link_attrs(l["href"])}>{esc(l["label"])} <span aria-hidden="true">→</span></a>'
                       for i, l in enumerate(inv["links"]))
        invite_html = (
            '<section class="ailab-wrap ailab-invite" aria-labelledby="ailab-invite-title">'
            '<div class="ailab-invite-copy">'
            f'<p class="ailab-group-label">{esc(inv["label"])}</p>'
            f'<h2 class="ailab-invite-title" id="ailab-invite-title">{esc(inv["title"])}</h2>'
            f'<p class="ailab-invite-text">{esc(inv["text"])}</p>'
            f'<p class="ailab-invite-text">{esc(inv["recruit"])}</p></div>'
            f'<div class="ailab-invite-actions">{ctas}</div></section>')
    return (
        '<footer class="ailab-footer">'
        f'{invite_html}'
        f'<div class="ailab-wrap ailab-footer-grid" data-columns="{small_cols}">'
        '<div class="ailab-footer-brand">'
        '<a class="ailab-wordmark" href="/" aria-label="AI Lab home">SS <span aria-hidden="true">✳</span></a>'
        f'<p class="ailab-footer-about">{esc(site["about"])}</p>{note_html}</div>'
        f'{"".join(cols)}</div>'
        f'<div class="ailab-wrap ailab-footer-bottom"><p>{esc(site["copyright"])}</p>'
        '<div class="ailab-footer-actions"><span class="ailab-privacy-slot" data-privacy-settings></span>'
        f'<a class="ailab-top-link" href="#{esc(top_id)}">Back to top <span aria-hidden="true">↑</span></a></div></div>'
        '</footer>')


def project_by_key(site, key):
    for p in site["projects"]:
        if p["key"] == key:
            return p
    raise KeyError(f"unknown project key: {key}")


def find_repo(root, name):
    want = name.lower()
    for entry in os.listdir(root):
        if entry.lower() == want and os.path.isdir(os.path.join(root, entry)):
            return os.path.join(root, entry)
    return None


def stamp(text, name, content):
    pattern = re.compile(r"(<!-- ailab:%s:start -->)(.*?)(<!-- ailab:%s:end -->)" % (name, name), re.S)
    if not pattern.search(text):
        raise ValueError(f"missing <!-- ailab:{name}:start/end --> markers")
    return pattern.sub(lambda m: m.group(1) + content + m.group(3), text, count=1)


def main():
    ap = argparse.ArgumentParser(description=__doc__, formatter_class=argparse.RawDescriptionHelpFormatter)
    ap.add_argument("--root", default=os.path.join(HERE, "..", "..", ".."), help="folder that holds the repository clones")
    ap.add_argument("--config", default=os.path.join(HERE, "site.json"))
    ap.add_argument("--check", action="store_true", help="report stale pages without writing; exit 1 if any")
    ap.add_argument("--only", help="only process pages in this repository")
    args = ap.parse_args()

    with open(args.config, encoding="utf-8") as fh:
        site = json.load(fh)

    stale, missing = [], []
    for page in site["pages"]:
        if args.only and page["repo"].lower() != args.only.lower():
            continue
        repo_dir = find_repo(args.root, page["repo"])
        if not repo_dir:
            missing.append(page["repo"])
            continue
        path = os.path.join(repo_dir, page["file"])
        with open(path, encoding="utf-8", newline="") as fh:
            original = fh.read()
        text = original
        text = text.replace('<script src="/assets/privacy.js" defer></script>', '')
        text = stamp(text, "head", render_head(site, page))
        text = stamp(text, "header", render_header(site, page))
        text = stamp(text, "footer", render_footer(site, page))
        rel = f'{page["repo"]}/{page["file"]}'
        if text != original:
            stale.append(rel)
            if not args.check:
                with open(path, "w", encoding="utf-8", newline="") as fh:
                    fh.write(text)
        print(("stale   " if args.check else "updated ") + rel if text != original else "ok      " + rel)

    if missing:
        print("not found under --root (skipped): " + ", ".join(sorted(set(missing))), file=sys.stderr)
    if args.check and stale:
        sys.exit(1)


if __name__ == "__main__":
    main()
