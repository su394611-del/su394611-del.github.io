"""Copy the website's playground into the Python package.

The website (playground/ at the repository root) is the single source of truth.
This script copies engine.js and worker.js unchanged and adapts index.html so it
works when served from localhost by the `ailab-playground` command:

    python sync_static.py           # refresh src/ailab_playground/static/
    python sync_static.py --check   # exit 1 if the static copy is out of date (used by CI)
"""

from __future__ import annotations

import argparse
import pathlib
import sys

HERE = pathlib.Path(__file__).resolve().parent
REPO = HERE.parent.parent
SITE_PLAYGROUND = REPO / "playground"
SITE_FAVICON = REPO / "assets" / "favicon.svg"
STATIC = HERE / "src" / "ailab_playground" / "static"

# Site-only references that would break, or make no sense, on localhost.
# Each must appear exactly once, so a change on the website fails loudly here.
INDEX_EDITS = [
    ('<link href="/assets/favicon.svg" rel="icon" type="image/svg+xml"/>',
     '<link href="favicon.svg" rel="icon" type="image/svg+xml"/>'),
    ('<a class="home-pill" href="/">',
     '<a class="home-pill" href="https://su394611-del.github.io/">'),
    ('<script src="/assets/privacy.js" defer></script>\n', ''),
]


def build() -> dict[str, bytes]:
    """Return the static files the package should ship, keyed by file name."""
    html = (SITE_PLAYGROUND / "index.html").read_text(encoding="utf-8")
    for old, new in INDEX_EDITS:
        count = html.count(old)
        if count != 1:
            raise SystemExit(f"sync_static: expected 1 occurrence of {old!r} in playground/index.html, found {count}")
        html = html.replace(old, new)
    for absolute in ('href="/', 'src="/'):
        if absolute in html:
            raise SystemExit(f"sync_static: playground/index.html still has a site-absolute path ({absolute}...)")
    return {
        "index.html": html.encode("utf-8"),
        "engine.js": (SITE_PLAYGROUND / "engine.js").read_bytes(),
        "worker.js": (SITE_PLAYGROUND / "worker.js").read_bytes(),
        "favicon.svg": SITE_FAVICON.read_bytes(),
    }


def stale_files() -> list[str]:
    """Names of static files that differ from what build() would write."""
    wanted = build()
    return [name for name, data in wanted.items()
            if not (STATIC / name).exists() or (STATIC / name).read_bytes() != data]


def main(argv: list[str] | None = None) -> int:
    parser = argparse.ArgumentParser(description=__doc__.splitlines()[0])
    parser.add_argument("--check", action="store_true", help="only report whether the copy is up to date")
    args = parser.parse_args(argv)

    if args.check:
        stale = stale_files()
        if stale:
            print("Out of date: " + ", ".join(stale) + ". Run: python sync_static.py")
            return 1
        print("Static files match playground/.")
        return 0

    STATIC.mkdir(parents=True, exist_ok=True)
    for name, data in build().items():
        (STATIC / name).write_bytes(data)
        print(f"wrote static/{name} ({len(data):,} bytes)")
    return 0


if __name__ == "__main__":
    sys.exit(main())
