# ailab-playground

Run small language models **entirely in your browser**, served from your own machine.

- **MedSparse Healthcare**: a from-scratch, Mixtral-inspired sparse Mixture-of-Experts model (pretrained and medical SFT releases)
- **Tiny GPT**: a 1.06M-parameter GPT-style model trained on TinyStories

The engine is plain JavaScript: a byte-level BPE tokenizer, a zero-copy `.safetensors` reader, and RMSNorm, RoPE, grouped-query attention and top-k SwiGLU experts, decoding with a KV cache in a Web Worker. Python only serves the files, so installing pulls in no dependencies.

> Research models only. Never use them for medical advice, diagnosis or treatment.

## Install

```bash
pip install ailab-playground
```

Before the first PyPI release you can install straight from GitHub:

```bash
pip install "git+https://github.com/su394611-del/su394611-del.github.io.git#subdirectory=packages/ailab-playground"
```

## Run

```bash
ailab-playground                  # MedSparse medical SFT
ailab-playground --model tiny     # Tiny GPT
ailab-playground --model pretrained --port 9000 --no-browser
python -m ailab_playground --help
```

The first run downloads the weights from Hugging Face once; your browser caches them. What you type stays in your browser.

## How it fits the website

The website's `playground/` folder is the single source of truth. This package ships a copy of it:

| File | Source |
| --- | --- |
| `static/engine.js` | `playground/engine.js`, unchanged: tokenizer, safetensors parser, both model architectures |
| `static/worker.js` | `playground/worker.js`, unchanged: download, cache and generation loop |
| `static/index.html` | `playground/index.html`, with site-only paths made local by `sync_static.py` |
| `static/favicon.svg` | `assets/favicon.svg` |

After changing the website's playground, refresh the copy and run the tests:

```bash
cd packages/ailab-playground
python sync_static.py
pip install -e . pytest && pytest -q
```

CI runs `python sync_static.py --check`, so a stale copy fails the build.

## Releasing to PyPI

1. On pypi.org, add a trusted publisher: owner `su394611-del`, repository `su394611-del.github.io`, workflow `ailab-playground.yml`, environment `pypi`.
2. Bump `version` in `pyproject.toml` and `src/ailab_playground/__init__.py`.
3. Push a tag such as `ailab-playground-v0.1.0`. The workflow tests on Windows, macOS and Linux, builds, and publishes.

## Links

- Live playground: https://su394611-del.github.io/playground/
- Technical report: https://su394611-del.github.io/research/medsparse-healthcare-2026/
- Models: https://huggingface.co/sudhanshu42844

## License

Apache-2.0
