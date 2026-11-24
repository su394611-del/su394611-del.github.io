/* Model Playground engine: runs Sudhanshu Shukla's small models entirely in the browser.
 *
 * - ByteLevelBPE: GPT-2-style byte-level BPE tokenizer read from a Hugging Face tokenizer.json
 * - parseSafetensors: zero-copy reader for .safetensors (F32; F16/BF16 converted to F32)
 * - MixtralModel: port of mixtral_lab.MixtralLM (RMSNorm, RoPE, GQA attention, top-k SwiGLU MoE)
 * - GPT2Model: Hugging Face GPT2LMHeadModel (LayerNorm, Conv1D, gelu_new, tied embeddings)
 * Both models decode one token at a time with a KV cache.
 */
(function (root) {
  'use strict';

  // ------------------------------------------------------------------ tokenizer
  const BYTE_ENCODER = (() => {
    const bs = [];
    for (let i = 33; i <= 126; i++) bs.push(i);
    for (let i = 161; i <= 172; i++) bs.push(i);
    for (let i = 174; i <= 255; i++) bs.push(i);
    const cs = bs.slice();
    let n = 0;
    for (let b = 0; b < 256; b++) if (!bs.includes(b)) { bs.push(b); cs.push(256 + n); n++; }
    const map = new Array(256);
    bs.forEach((b, i) => { map[b] = String.fromCharCode(cs[i]); });
    return map;
  })();
  const BYTE_DECODER = new Map(BYTE_ENCODER.map((c, b) => [c, b]));
  // Same pattern as the Hugging Face ByteLevel pre-tokenizer (use_regex: true).
  const PRETOKEN_RE = /'s|'t|'re|'ve|'m|'ll|'d| ?\p{L}+| ?\p{N}+| ?[^\s\p{L}\p{N}]+|\s+(?!\S)|\s+/gu;
  const utf8 = new TextEncoder();
  const escapeRe = (s) => s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

  class ByteLevelBPE {
    constructor(json) {
      const model = json.model;
      if (!model || model.type !== 'BPE') throw new Error('Only BPE tokenizers are supported');
      this.vocab = new Map(Object.entries(model.vocab));
      this.idToToken = [];
      for (const [tok, id] of this.vocab) this.idToToken[id] = tok;
      this.added = new Map();
      this.special = new Set();
      for (const a of json.added_tokens || []) {
        this.added.set(a.content, a.id);
        this.idToToken[a.id] = a.content;
        if (a.special) this.special.add(a.id);
      }
      this.ranks = new Map();
      model.merges.forEach((m, i) => {
        const [a, b] = Array.isArray(m) ? m : m.split(' ');
        this.ranks.set(a + ' ' + b, i);
      });
      this.unkId = model.unk_token != null ? this.tokenToId(model.unk_token) : null;
      this.addedRe = this.added.size
        ? new RegExp('(' + [...this.added.keys()].sort((x, y) => y.length - x.length).map(escapeRe).join('|') + ')')
        : null;
      this.cache = new Map();
    }

    get size() { return this.idToToken.length; }

    tokenToId(tok) {
      if (this.added.has(tok)) return this.added.get(tok);
      return this.vocab.has(tok) ? this.vocab.get(tok) : null;
    }

    bpe(word) {
      const hit = this.cache.get(word);
      if (hit) return hit;
      let parts = Array.from(word);
      while (parts.length > 1) {
        let best = -1, bestRank = Infinity;
        for (let i = 0; i < parts.length - 1; i++) {
          const r = this.ranks.get(parts[i] + ' ' + parts[i + 1]);
          if (r !== undefined && r < bestRank) { bestRank = r; best = i; }
        }
        if (best < 0) break;
        const a = parts[best], b = parts[best + 1], merged = [];
        for (let i = 0; i < parts.length;) {
          if (i < parts.length - 1 && parts[i] === a && parts[i + 1] === b) { merged.push(a + b); i += 2; }
          else { merged.push(parts[i]); i += 1; }
        }
        parts = merged;
      }
      if (this.cache.size > 50000) this.cache.clear();
      this.cache.set(word, parts);
      return parts;
    }

    encode(text) {
      const ids = [];
      const segments = this.addedRe ? text.split(this.addedRe) : [text];
      for (const seg of segments) {
        if (!seg) continue;
        if (this.added.has(seg)) { ids.push(this.added.get(seg)); continue; }
        for (const m of seg.matchAll(PRETOKEN_RE)) {
          let mapped = '';
          for (const byte of utf8.encode(m[0])) mapped += BYTE_ENCODER[byte];
          for (const piece of this.bpe(mapped)) {
            const id = this.vocab.get(piece);
            if (id !== undefined) ids.push(id);
            else if (this.unkId != null) ids.push(this.unkId);
          }
        }
      }
      return ids;
    }

    decode(ids, skipSpecial = true) {
      const bytes = [];
      for (const id of ids) {
        if (skipSpecial && this.special.has(id)) continue;
        const tok = this.idToToken[id];
        if (tok === undefined) continue;
        if (this.added.has(tok)) { for (const b of utf8.encode(tok)) bytes.push(b); continue; }
        for (const ch of tok) {
          const b = BYTE_DECODER.get(ch);
          if (b !== undefined) bytes.push(b); else for (const x of utf8.encode(ch)) bytes.push(x);
        }
      }
      return new TextDecoder('utf-8').decode(new Uint8Array(bytes));
    }
  }

  // ------------------------------------------------------------------ safetensors
  function halfToFloat(h) {
    const s = (h & 0x8000) ? -1 : 1, e = (h >> 10) & 0x1f, f = h & 0x3ff;
    if (e === 0) return s * Math.pow(2, -14) * (f / 1024);
    if (e === 31) return f ? NaN : s * Infinity;
    return s * Math.pow(2, e - 15) * (1 + f / 1024);
  }

  function parseSafetensors(buffer) {
    const view = new DataView(buffer);
    const n = Number(view.getBigUint64(0, true));
    const header = JSON.parse(new TextDecoder().decode(new Uint8Array(buffer, 8, n)));
    const base = 8 + n;
    const tensors = {};
    for (const [name, info] of Object.entries(header)) {
      if (name === '__metadata__') continue;
      const [start, end] = info.data_offsets;
      const off = base + start, bytes = end - start;
      let data;
      if (info.dtype === 'F32') {
        data = off % 4 === 0 ? new Float32Array(buffer, off, bytes / 4) : new Float32Array(buffer.slice(off, off + bytes));
      } else if (info.dtype === 'F16' || info.dtype === 'BF16') {
        const src = new Uint16Array(buffer.slice(off, off + bytes));
        data = new Float32Array(src.length);
        if (info.dtype === 'F16') for (let i = 0; i < src.length; i++) data[i] = halfToFloat(src[i]);
        else { const u = new Uint32Array(data.buffer); for (let i = 0; i < src.length; i++) u[i] = src[i] << 16; }
      } else {
        throw new Error(`Unsupported dtype ${info.dtype} for ${name}`);
      }
      tensors[name] = { shape: info.shape, data };
    }
    return tensors;
  }

  // ------------------------------------------------------------------ math helpers
  // y = W x for a PyTorch Linear weight W with shape [out, in] (row-major).
  function linear(W, x, out, inp, y) {
    const n4 = inp - (inp % 4);
    for (let o = 0; o < out; o++) {
      const row = o * inp;
      let s0 = 0, s1 = 0, s2 = 0, s3 = 0, i = 0;
      for (; i < n4; i += 4) {
        s0 += W[row + i] * x[i];
        s1 += W[row + i + 1] * x[i + 1];
        s2 += W[row + i + 2] * x[i + 2];
        s3 += W[row + i + 3] * x[i + 3];
      }
      let s = (s0 + s1) + (s2 + s3);
      for (; i < inp; i++) s += W[row + i] * x[i];
      y[o] = s;
    }
    return y;
  }
  // y = x W + b for a GPT-2 Conv1D weight W with shape [in, out] (row-major).
  function conv1d(W, b, x, inp, out, y) {
    if (b) y.set(b); else y.fill(0);
    for (let i = 0; i < inp; i++) {
      const xi = x[i];
      if (xi === 0) continue;
      const row = i * out;
      for (let o = 0; o < out; o++) y[o] += xi * W[row + o];
    }
    return y;
  }
  function rmsnorm(x, w, eps, y) {
    let ss = 0;
    for (let i = 0; i < x.length; i++) ss += x[i] * x[i];
    const r = 1 / Math.sqrt(ss / x.length + eps);
    for (let i = 0; i < x.length; i++) y[i] = x[i] * r * w[i];
    return y;
  }
  function layernorm(x, w, b, eps, y) {
    let mean = 0;
    for (let i = 0; i < x.length; i++) mean += x[i];
    mean /= x.length;
    let v = 0;
    for (let i = 0; i < x.length; i++) { const d = x[i] - mean; v += d * d; }
    const r = 1 / Math.sqrt(v / x.length + eps);
    for (let i = 0; i < x.length; i++) y[i] = (x[i] - mean) * r * w[i] + b[i];
    return y;
  }
  function softmaxInPlace(a, n) {
    let m = -Infinity;
    for (let i = 0; i < n; i++) if (a[i] > m) m = a[i];
    let s = 0;
    for (let i = 0; i < n; i++) { a[i] = Math.exp(a[i] - m); s += a[i]; }
    for (let i = 0; i < n; i++) a[i] /= s;
    return a;
  }
  const silu = (z) => z / (1 + Math.exp(-z));
  const GELU_C = Math.sqrt(2 / Math.PI);
  const geluNew = (x) => 0.5 * x * (1 + Math.tanh(GELU_C * (x + 0.044715 * x * x * x)));

  function need(tensors, name) {
    const t = tensors[name];
    if (!t) throw new Error(`Missing tensor ${name}`);
    return t.data;
  }

  // ------------------------------------------------------------------ Mixtral (mixtral_lab.MixtralLM)
  class MixtralModel {
    constructor(cfg, tensors) {
      this.cfg = cfg;
      const H = cfg.hidden_size;
      this.H = H;
      this.nh = cfg.num_heads;
      this.nkv = cfg.num_kv_heads;
      this.hd = H / cfg.num_heads;
      this.kvDim = this.nkv * this.hd;
      this.V = cfg.vocab_size;
      this.I = cfg.intermediate_size;
      this.E = cfg.num_experts;
      this.topK = cfg.top_k;
      this.maxLen = cfg.max_seq_len;
      if (cfg.attention_mode && cfg.attention_mode !== 'global') throw new Error('Only global attention is supported');
      this.embed = need(tensors, 'embed.weight');
      this.lmHead = cfg.tie_embeddings ? this.embed : need(tensors, 'lm_head.weight');
      this.normW = need(tensors, 'norm.weight');
      this.layers = [];
      for (let l = 0; l < cfg.num_layers; l++) {
        const p = `layers.${l}.`;
        const experts = [];
        for (let e = 0; e < this.E; e++) {
          const q = `${p}moe.experts.${e}.`;
          experts.push({ w1: need(tensors, q + 'w1.weight'), w2: need(tensors, q + 'w2.weight'), w3: need(tensors, q + 'w3.weight') });
        }
        this.layers.push({
          attnNorm: need(tensors, p + 'attn_norm.weight'), ffnNorm: need(tensors, p + 'ffn_norm.weight'),
          q: need(tensors, p + 'attn.q_proj.weight'), k: need(tensors, p + 'attn.k_proj.weight'),
          v: need(tensors, p + 'attn.v_proj.weight'), o: need(tensors, p + 'attn.o_proj.weight'),
          gate: need(tensors, p + 'moe.gate.weight'), experts,
        });
      }
      // RoPE inverse frequencies, rounded like the float32 PyTorch reference.
      const f = Math.fround, half = this.hd / 2;
      this.inv = new Float64Array(half);
      for (let i = 0; i < half; i++) this.inv[i] = f(Math.pow(cfg.rope_theta, f(-(2 * i) / this.hd)));
      // scratch buffers
      this.x = new Float32Array(H); this.h = new Float32Array(H); this.tmp = new Float32Array(H);
      this.qv = new Float32Array(H); this.kv = new Float32Array(this.kvDim); this.vv = new Float32Array(this.kvDim);
      this.att = new Float32Array(H); this.moe = new Float32Array(H);
      this.a1 = new Float32Array(this.I); this.a3 = new Float32Array(this.I); this.eo = new Float32Array(H);
      this.scores = new Float32Array(this.maxLen); this.gl = new Float32Array(this.E);
      this.logits = new Float32Array(this.V);
      this.reset();
    }

    reset() {
      this.kCache = this.layers.map(() => new Float32Array(this.maxLen * this.kvDim));
      this.vCache = this.layers.map(() => new Float32Array(this.maxLen * this.kvDim));
      this.pos = 0;
    }

    rope(vec, nHeads, pos) {
      const hd = this.hd, f = Math.fround;
      for (let i = 0; i < hd / 2; i++) {
        const ph = f(f(pos) * this.inv[i]);
        const c = f(Math.cos(ph)), s = f(Math.sin(ph));
        for (let h = 0; h < nHeads; h++) {
          const b = h * hd + 2 * i, even = vec[b], odd = vec[b + 1];
          vec[b] = even * c - odd * s;
          vec[b + 1] = even * s + odd * c;
        }
      }
    }

    /** Feed one token; returns logits (Float32Array, reused) when wantLogits, else null. */
    step(tokenId, wantLogits = true) {
      const { H, hd, nh, kvDim } = this;
      const pos = this.pos;
      if (pos >= this.maxLen) throw new Error('Context length exceeded');
      const x = this.x;
      x.set(this.embed.subarray(tokenId * H, tokenId * H + H));
      const scale = 1 / Math.sqrt(hd), group = nh / this.nkv;
      for (let l = 0; l < this.layers.length; l++) {
        const L = this.layers[l];
        rmsnorm(x, L.attnNorm, this.cfg.norm_eps, this.h);
        linear(L.q, this.h, H, H, this.qv);
        linear(L.k, this.h, kvDim, H, this.kv);
        linear(L.v, this.h, kvDim, H, this.vv);
        this.rope(this.qv, nh, pos);
        this.rope(this.kv, this.nkv, pos);
        const K = this.kCache[l], Vc = this.vCache[l];
        K.set(this.kv, pos * kvDim);
        Vc.set(this.vv, pos * kvDim);
        const att = this.att, sc = this.scores;
        for (let h = 0; h < nh; h++) {
          const kvh = Math.floor(h / group), qo = h * hd, ko = kvh * hd;
          for (let t = 0; t <= pos; t++) {
            let s = 0;
            const base = t * kvDim + ko;
            for (let d = 0; d < hd; d++) s += this.qv[qo + d] * K[base + d];
            sc[t] = s * scale;
          }
          softmaxInPlace(sc, pos + 1);
          for (let d = 0; d < hd; d++) att[qo + d] = 0;
          for (let t = 0; t <= pos; t++) {
            const w = sc[t], base = t * kvDim + ko;
            for (let d = 0; d < hd; d++) att[qo + d] += w * Vc[base + d];
          }
        }
        linear(L.o, att, H, H, this.tmp);
        for (let i = 0; i < H; i++) x[i] += this.tmp[i];
        // sparse MoE feed-forward
        rmsnorm(x, L.ffnNorm, this.cfg.norm_eps, this.h);
        linear(L.gate, this.h, this.E, H, this.gl);
        softmaxInPlace(this.gl, this.E);
        const order = Array.from({ length: this.E }, (_, i) => i).sort((a, b) => this.gl[b] - this.gl[a] || a - b);
        const chosen = order.slice(0, this.topK);
        let wsum = 0;
        for (const e of chosen) wsum += this.gl[e];
        this.moe.fill(0);
        for (const e of chosen) {
          const ex = L.experts[e], w = this.gl[e] / wsum;
          linear(ex.w1, this.h, this.I, H, this.a1);
          linear(ex.w3, this.h, this.I, H, this.a3);
          for (let i = 0; i < this.I; i++) this.a1[i] = silu(this.a1[i]) * this.a3[i];
          linear(ex.w2, this.a1, H, this.I, this.eo);
          for (let i = 0; i < H; i++) this.moe[i] += w * this.eo[i];
        }
        for (let i = 0; i < H; i++) x[i] += this.moe[i];
      }
      this.pos = pos + 1;
      if (!wantLogits) return null;
      rmsnorm(x, this.normW, this.cfg.norm_eps, this.h);
      return linear(this.lmHead, this.h, this.V, H, this.logits);
    }
  }

  // ------------------------------------------------------------------ GPT-2 (transformers GPT2LMHeadModel)
  class GPT2Model {
    constructor(cfg, tensors) {
      this.cfg = cfg;
      const H = cfg.n_embd;
      this.H = H;
      this.nh = cfg.n_head;
      this.hd = H / cfg.n_head;
      this.V = cfg.vocab_size;
      this.maxLen = cfg.n_positions;
      this.inner = cfg.n_inner || 4 * H;
      this.eps = cfg.layer_norm_epsilon;
      const pre = tensors['transformer.wte.weight'] ? 'transformer.' : '';
      this.wte = need(tensors, pre + 'wte.weight');
      this.wpe = need(tensors, pre + 'wpe.weight');
      this.lnfW = need(tensors, pre + 'ln_f.weight'); this.lnfB = need(tensors, pre + 'ln_f.bias');
      this.lmHead = tensors['lm_head.weight'] && cfg.tie_word_embeddings === false ? tensors['lm_head.weight'].data : this.wte;
      this.layers = [];
      for (let l = 0; l < cfg.n_layer; l++) {
        const p = `${pre}h.${l}.`;
        const g = (n) => need(tensors, p + n);
        this.layers.push({
          ln1W: g('ln_1.weight'), ln1B: g('ln_1.bias'), ln2W: g('ln_2.weight'), ln2B: g('ln_2.bias'),
          attnW: g('attn.c_attn.weight'), attnB: g('attn.c_attn.bias'),
          projW: g('attn.c_proj.weight'), projB: g('attn.c_proj.bias'),
          fcW: g('mlp.c_fc.weight'), fcB: g('mlp.c_fc.bias'),
          mprojW: g('mlp.c_proj.weight'), mprojB: g('mlp.c_proj.bias'),
        });
      }
      this.x = new Float32Array(H); this.h = new Float32Array(H); this.qkv = new Float32Array(3 * H);
      this.att = new Float32Array(H); this.tmp = new Float32Array(H); this.f = new Float32Array(this.inner);
      this.scores = new Float32Array(this.maxLen); this.logits = new Float32Array(this.V);
      this.reset();
    }

    reset() {
      this.kCache = this.layers.map(() => new Float32Array(this.maxLen * this.H));
      this.vCache = this.layers.map(() => new Float32Array(this.maxLen * this.H));
      this.pos = 0;
    }

    step(tokenId, wantLogits = true) {
      const { H, hd, nh } = this;
      const pos = this.pos;
      if (pos >= this.maxLen) throw new Error('Context length exceeded');
      const x = this.x;
      for (let i = 0; i < H; i++) x[i] = this.wte[tokenId * H + i] + this.wpe[pos * H + i];
      const scale = 1 / Math.sqrt(hd);
      for (let l = 0; l < this.layers.length; l++) {
        const L = this.layers[l];
        layernorm(x, L.ln1W, L.ln1B, this.eps, this.h);
        conv1d(L.attnW, L.attnB, this.h, H, 3 * H, this.qkv);
        const K = this.kCache[l], Vc = this.vCache[l];
        K.set(this.qkv.subarray(H, 2 * H), pos * H);
        Vc.set(this.qkv.subarray(2 * H, 3 * H), pos * H);
        const sc = this.scores, att = this.att;
        for (let h = 0; h < nh; h++) {
          const o = h * hd;
          for (let t = 0; t <= pos; t++) {
            let s = 0;
            for (let d = 0; d < hd; d++) s += this.qkv[o + d] * K[t * H + o + d];
            sc[t] = s * scale;
          }
          softmaxInPlace(sc, pos + 1);
          for (let d = 0; d < hd; d++) att[o + d] = 0;
          for (let t = 0; t <= pos; t++) {
            const w = sc[t];
            for (let d = 0; d < hd; d++) att[o + d] += w * Vc[t * H + o + d];
          }
        }
        conv1d(L.projW, L.projB, att, H, H, this.tmp);
        for (let i = 0; i < H; i++) x[i] += this.tmp[i];
        layernorm(x, L.ln2W, L.ln2B, this.eps, this.h);
        conv1d(L.fcW, L.fcB, this.h, H, this.inner, this.f);
        for (let i = 0; i < this.inner; i++) this.f[i] = geluNew(this.f[i]);
        conv1d(L.mprojW, L.mprojB, this.f, this.inner, H, this.tmp);
        for (let i = 0; i < H; i++) x[i] += this.tmp[i];
      }
      this.pos = pos + 1;
      if (!wantLogits) return null;
      layernorm(x, this.lnfW, this.lnfB, this.eps, this.h);
      return linear(this.lmHead, this.h, this.V, H, this.logits);
    }
  }

  // ------------------------------------------------------------------ sampling
  /** temperature <= 0 means greedy. Matches scripts/generate.py: top-k on logits/temperature. */
  function sample(logits, temperature, topK, rand = Math.random) {
    const n = logits.length;
    if (!(temperature > 0)) {
      let best = 0;
      for (let i = 1; i < n; i++) if (logits[i] > logits[best]) best = i;
      return best;
    }
    const k = Math.max(1, Math.min(topK | 0, n));
    const idx = [], val = [];
    for (let i = 0; i < n; i++) {
      const v = logits[i] / temperature;
      if (idx.length < k) {
        let j = idx.length; idx.push(i); val.push(v);
        while (j > 0 && val[j - 1] < val[j]) { [val[j - 1], val[j]] = [val[j], val[j - 1]]; [idx[j - 1], idx[j]] = [idx[j], idx[j - 1]]; j--; }
      } else if (v > val[k - 1]) {
        let j = k - 1; idx[j] = i; val[j] = v;
        while (j > 0 && val[j - 1] < val[j]) { [val[j - 1], val[j]] = [val[j], val[j - 1]]; [idx[j - 1], idx[j]] = [idx[j], idx[j - 1]]; j--; }
      }
    }
    const m = val[0];
    let s = 0;
    const p = val.map((v) => { const e = Math.exp(v - m); s += e; return e; });
    let r = rand() * s;
    for (let j = 0; j < p.length; j++) { r -= p[j]; if (r <= 0) return idx[j]; }
    return idx[idx.length - 1];
  }

  const api = { ByteLevelBPE, parseSafetensors, MixtralModel, GPT2Model, sample };
  if (typeof module !== 'undefined' && module.exports) module.exports = api;
  else root.PlaygroundEngine = api;
})(typeof self !== 'undefined' ? self : this);
