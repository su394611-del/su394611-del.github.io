"""Smoke tests: the server starts, serves the playground and uses correct MIME types."""

import importlib.util
import pathlib
import threading
import urllib.request

import pytest

from ailab_playground.cli import main, make_server

PACKAGE_DIR = pathlib.Path(__file__).resolve().parent.parent


@pytest.fixture()
def base_url():
    server = make_server("127.0.0.1", 0)
    thread = threading.Thread(target=server.serve_forever, daemon=True)
    thread.start()
    yield f"http://127.0.0.1:{server.server_address[1]}"
    server.shutdown()
    server.server_close()


def fetch(url):
    with urllib.request.urlopen(url, timeout=5) as resp:
        return resp.status, resp.headers.get_content_type(), resp.read()


def test_playground_page_is_served(base_url):
    status, ctype, body = fetch(base_url + "/?model=tiny")
    assert status == 200
    assert ctype == "text/html"
    assert b"Model Playground" in body
    assert b"new Worker('worker.js')" in body
    assert b'src="/' not in body and b'href="/' not in body


@pytest.mark.parametrize("name", ["engine.js", "worker.js"])
def test_scripts_have_javascript_mime_type(base_url, name):
    status, ctype, _ = fetch(f"{base_url}/{name}")
    assert status == 200
    assert ctype == "text/javascript"


def test_version_flag(capsys):
    with pytest.raises(SystemExit) as exit_info:
        main(["--version"])
    assert exit_info.value.code == 0
    assert "ailab-playground" in capsys.readouterr().out


def test_static_copy_matches_website():
    """The packaged files must equal the website's playground (run sync_static.py to fix)."""
    script = PACKAGE_DIR / "sync_static.py"
    site_page = PACKAGE_DIR.parent.parent / "playground" / "index.html"
    if not (script.exists() and site_page.exists()):
        pytest.skip("not running inside the website repository")
    spec = importlib.util.spec_from_file_location("sync_static", script)
    sync_static = importlib.util.module_from_spec(spec)
    spec.loader.exec_module(sync_static)
    assert sync_static.stale_files() == []
