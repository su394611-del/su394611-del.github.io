/* Loaded by playground/index.html as a classic Web Worker. */
importScripts('engine.js');

/* Playground worker: downloads models from Hugging Face, caches them, and generates text. */
const E = self.PlaygroundEngine;
const CACHE_NAME = 'ss-model-playground-v1';
const SFT_SYSTEM = 'Provide accurate educational medical information, and acknowledge uncertainty.';
const models = new Map();
let stopFlag = false;
const post = (m) => self.postMessage(m);
const tick = () => new Promise((r) => setTimeout(r, 0));
const decodeText = (buf) => new TextDecoder().decode(buf);

async function resolveRevision(repo) {
  // Pin to the current commit so a new release on the Hub invalidates the browser cache.
  try {
    const r = await fetch(`https://huggingface.co/api/models/${repo}`);
    if (r.ok) { const j = await r.json(); if (j.sha) return j.sha; }
  } catch (e) { /* offline or blocked: fall back to main */ }
  return 'main';
}

async function fetchCached(url, onProgress, cacheable) {
  let cache = null;
  if (cacheable) {
    try {
      cache = await caches.open(CACHE_NAME);
      const hit = await cache.match(url);
      if (hit) { const b = await hit.arrayBuffer(); if (onProgress) onProgress(b.byteLength, b.byteLength, true); return b; }
    } catch (e) { cache = null; }
  }
  const res = await fetch(url);
  if (!res.ok) throw new Error(`Download failed (HTTP ${res.status}) for ${url.split('/').pop()}`);
  const total = Number(res.headers.get('content-length')) || 0;
  let buf;
  if (res.body && onProgress) {
    const reader = res.body.getReader();
    const chunks = [];
    let got = 0, last = 0;
    for (;;) {
      const { done, value } = await reader.read();
      if (done) break;
      chunks.push(value);
      got += value.length;
      if (got - last > 2 * 1024 * 1024) { last = got; onProgress(got, total || got, false); }
    }
    const out = new Uint8Array(got);
    let off = 0;
    for (const c of chunks) { out.set(c, off); off += c.length; }
    buf = out.buffer;
  } else {
    buf = await res.arrayBuffer();
  }
  if (onProgress) onProgress(buf.byteLength, buf.byteLength, false);
  if (cache) { try { await cache.put(url, new Response(buf)); } catch (e) { /* quota: just don't cache */ } }
  return buf;
}

async function load({ key, repo, kind }) {
  if (models.has(key)) { const m = models.get(key); post({ type: 'ready', key, ctx: m.model.maxLen, cached: true }); return; }
  if (kind === 'mixtral') {
    // Keep at most one 155 MB Mixtral model in memory.
    for (const [k, m] of models) if (m.kind === 'mixtral') { models.delete(k); post({ type: 'unloaded', key: k }); }
  }
  const rev = await resolveRevision(repo);
  const cacheable = rev !== 'main';
  const base = `https://huggingface.co/${repo}/resolve/${rev}/`;
  const [cfgBuf, tokBuf] = await Promise.all([
    fetchCached(base + 'config.json', null, cacheable),
    fetchCached(base + 'tokenizer.json', null, cacheable),
  ]);
  const cfg = JSON.parse(decodeText(cfgBuf));
  const tok = new E.ByteLevelBPE(JSON.parse(decodeText(tokBuf)));
  let fromCache = false;
  const weights = await fetchCached(base + 'model.safetensors', (got, total, cached) => {
    fromCache = fromCache || cached;
    post({ type: 'progress', key, got, total, cached });
  }, cacheable);
  post({ type: 'progress', key, got: weights.byteLength, total: weights.byteLength, cached: fromCache, preparing: true });
  const tensors = E.parseSafetensors(weights);
  const model = kind === 'mixtral' ? new E.MixtralModel(cfg, tensors) : new E.GPT2Model(cfg, tensors);
  if (tok.size !== model.V) throw new Error(`Tokenizer has ${tok.size} tokens but the model expects ${model.V}`);
  models.set(key, { kind, model, tok, cfg, rev });
  post({ type: 'ready', key, ctx: model.maxLen, cached: fromCache, rev });
}

function penalize(logits, generated, penalty) {
  if (!(penalty > 1) || !generated.length) return logits;
  const l = Float32Array.from(logits);
  for (const g of new Set(generated)) l[g] = l[g] > 0 ? l[g] / penalty : l[g] * penalty;
  return l;
}

async function generate(msg) {
  const entry = models.get(msg.key);
  if (!entry) { post({ type: 'error', reqId: msg.reqId, message: 'Load the model first.' }); return; }
  stopFlag = false;
  const { model, tok, kind } = entry;
  let text = String(msg.text || '').replace(/\t/g, ' ');
  if (msg.mode === 'sft') text = `### System:\n${SFT_SYSTEM}\n\n### User:\n${text}\n\n### Assistant:\n`;
  const bos = kind === 'mixtral' ? tok.tokenToId('<bos>') : null;  // same as the published load_model.py
  let ids = (bos != null ? [bos] : []).concat(tok.encode(text));
  if (!ids.length) { post({ type: 'error', reqId: msg.reqId, message: 'Type something first.' }); return; }
  const maxNew = Math.max(1, Math.min(msg.maxNew | 0, model.maxLen - 1));
  let truncated = false;
  if (ids.length + maxNew > model.maxLen) { ids = ids.slice(ids.length - (model.maxLen - maxNew)); truncated = true; }
  const eos = tok.tokenToId('<eos>');
  model.reset();
  post({ type: 'start', reqId: msg.reqId, promptTokens: ids.length, truncated });
  let logits = null;
  for (let i = 0; i < ids.length; i++) {
    logits = model.step(ids[i], i === ids.length - 1);
    if (i % 8 === 7) { await tick(); if (stopFlag) { post({ type: 'done', reqId: msg.reqId, tokens: 0, ms: 0, stopped: true }); return; } }
  }
  const gen = [];
  const t0 = performance.now();
  for (let i = 0; i < maxNew; i++) {
    if (stopFlag) break;
    const next = E.sample(penalize(logits, gen, msg.penalty), msg.temperature, msg.topK);
    if (next === eos) break;
    gen.push(next);
    post({ type: 'token', reqId: msg.reqId, text: tok.decode(gen) });
    if (i === maxNew - 1 || model.pos >= model.maxLen) break;
    logits = model.step(next, true);
    await tick();
  }
  post({ type: 'done', reqId: msg.reqId, tokens: gen.length, ms: performance.now() - t0, stopped: stopFlag });
}

self.onmessage = (event) => {
  const msg = event.data || {};
  if (msg.type === 'stop') { stopFlag = true; return; }
  if (msg.type === 'load') load(msg).catch((err) => post({ type: 'error', key: msg.key, message: String((err && err.message) || err) }));
  if (msg.type === 'generate') generate(msg).catch((err) => post({ type: 'error', reqId: msg.reqId, message: String((err && err.message) || err) }));
};
