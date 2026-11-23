"""Command-line entry point: serve the browser inference engine on localhost.

The engine itself is JavaScript and runs in the browser. Python only serves the
static files, so the package has no dependencies beyond the standard library.
"""

from __future__ import annotations

import argparse
import functools
import http.server
import sys
import threading
import webbrowser
from importlib import resources
from urllib.parse import urlencode

from . import __version__

# Windows can map .js to text/plain in the registry, which breaks workers and
# module scripts. Pin every type the engine needs.
MIME_TYPES = {
    ".js": "text/javascript",
    ".mjs": "text/javascript",
    ".json": "application/json",
    ".wasm": "application/wasm",
    ".html": "text/html",
    ".css": "text/css",
    ".safetensors": "application/octet-stream",
}


def static_dir() -> str:
    """Folder holding index.html and engine.js inside the installed package."""
    return str(resources.files("ailab_playground") / "static")


class Handler(http.server.SimpleHTTPRequestHandler):
    extensions_map = {**http.server.SimpleHTTPRequestHandler.extensions_map, **MIME_TYPES}

    def end_headers(self) -> None:
        # Always serve the latest engine after an upgrade; model weights are
        # cached by the browser's Cache API, not by this header.
        self.send_header("Cache-Control", "no-cache")
        super().end_headers()

    def log_message(self, fmt: str, *args) -> None:
        if getattr(self.server, "verbose", False):
            super().log_message(fmt, *args)


def make_server(host: str = "127.0.0.1", port: int = 8765, verbose: bool = False):
    """Bind to the requested port, or to any free port if it is taken."""
    handler = functools.partial(Handler, directory=static_dir())
    try:
        server = http.server.ThreadingHTTPServer((host, port), handler)
    except OSError:
        server = http.server.ThreadingHTTPServer((host, 0), handler)
    server.verbose = verbose
    return server


def main(argv: list[str] | None = None) -> int:
    parser = argparse.ArgumentParser(
        prog="ailab-playground",
        description=(
            "Run small language models in your browser. Weights download from "
            "Hugging Face once and stay cached; prompts never leave your machine."
        ),
    )
    parser.add_argument("--model", default="sft",
                        help="model key the playground understands: sft, pretrained or tiny (default: sft)")
    parser.add_argument("--port", type=int, default=8765, help="port to serve on (default: 8765)")
    parser.add_argument("--host", default="127.0.0.1",
                        help="keep 127.0.0.1: browsers treat localhost as a secure context")
    parser.add_argument("--no-browser", action="store_true", help="do not open a browser tab")
    parser.add_argument("--verbose", action="store_true", help="log every request")
    parser.add_argument("--version", action="version", version=f"%(prog)s {__version__}")
    args = parser.parse_args(argv)

    server = make_server(args.host, args.port, args.verbose)
    port = server.server_address[1]
    shown_host = "localhost" if args.host in ("127.0.0.1", "localhost") else args.host
    url = f"http://{shown_host}:{port}/?{urlencode({'model': args.model})}"

    print(f"AI Lab playground running at {url}")
    print("Press Ctrl+C to stop.")
    if not args.no_browser:
        threading.Timer(0.5, webbrowser.open, args=(url,)).start()
    try:
        server.serve_forever()
    except KeyboardInterrupt:
        print("\nStopped.")
    finally:
        server.server_close()
    return 0


if __name__ == "__main__":
    sys.exit(main())
