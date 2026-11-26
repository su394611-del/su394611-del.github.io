(function () {
  'use strict';
  var MODELS = {
    miriad: {
      tab: 'MIRIAD SFT', sub: '38.8M params · new', repo: 'sudhanshu42844/medsparse-healthcare-miriad-sft', kind: 'mixtral', mode: 'sft', size: '155 MB',
      title: 'MedSparse Healthcare LLM · MIRIAD SFT',
      desc: 'The medical SFT model after full-parameter fine-tuning on MIRIAD, 5.8M Q&A pairs drawn from medical research papers. It answers on topic and fluently, but in a 15-question held-out test only about 3 answers were correct or mostly correct and 7 were wrong, so check everything. The five example questions are real MIRIAD questions from papers held out of training.',
      label: 'Question', placeholder: 'What are the risk factors associated with coronary heart disease (CHD)?',
      examples: ['What are the risk factors associated with coronary heart disease (CHD)?', 'How does neuropsychiatric SLE present in patients?', 'How does the sympathetic nervous system influence the renal-body fluid system?', 'What are the short-term and long-term outcomes for older patients who experience a hip fracture?', 'What are some oral infections that can be caused by Staphylococcus aureus?'],
      defaults: { maxNew: 120, temperature: 0, topK: 40, penalty: 1.2 }
    },
    sft: {
      tab: 'Medical SFT', sub: 'MedSparse · 38.8M params', repo: 'sudhanshu42844/medsparse-healthcare-medical-sft', kind: 'mixtral', mode: 'sft', size: '155 MB',
      title: 'MedSparse Healthcare LLM · Medical SFT',
      desc: 'A 38.8M-parameter Mixtral-inspired sparse Mixture-of-Experts model (4 experts, top-2 routing), pretrained on biomedical text and then fully fine-tuned on medical Q&A. Ask an educational question.',
      label: 'Question', placeholder: 'What does randomized controlled trial mean?',
      examples: ['What does randomized controlled trial mean?', 'What is the difference between a virus and a bacterium?', 'Why is hand hygiene important in hospitals?'],
      defaults: { maxNew: 120, temperature: 0.7, topK: 40, penalty: 1.2 }
    },
    pretrained: {
      tab: 'Pretrained', sub: 'MedSparse · 38.8M params', repo: 'sudhanshu42844/medsparse-healthcare-pretrained-from-scratch', kind: 'mixtral', mode: 'raw', size: '155 MB',
      title: 'MedSparse Healthcare LLM · Pretrained',
      desc: 'The same architecture after biomedical pretraining only, before medical fine-tuning. It continues text in the style of research papers.',
      label: 'Start of a passage', placeholder: 'Clinical research explores',
      examples: ['Clinical research explores', 'The patients were randomly assigned to', 'Hypertension is associated with'],
      defaults: { maxNew: 80, temperature: 0.7, topK: 40, penalty: 1.2 }
    },
    tiny: {
      tab: 'Tiny GPT', sub: 'GPT-2 style · 1.06M params', repo: 'sudhanshu42844/my-tiny-llm', kind: 'gpt2', mode: 'raw', size: '4 MB',
      title: 'Tiny GPT-Style Language Model',
      desc: 'A 1.06M-parameter GPT-2-style model trained from random weights on a small TinyStories subset. Expect very simple, often broken stories: it shows the full train-to-inference pipeline at a tiny scale.',
      label: 'Start of a story', placeholder: 'Once upon a time',
      examples: ['Once upon a time', 'The little dog', 'Lily wanted to'],
      defaults: { maxNew: 60, temperature: 0.8, topK: 40, penalty: 1.2 }, maxNewLimit: 100
    }
  };
  var ORDER = ['miriad', 'sft', 'pretrained', 'tiny'];
  var $ = function (id) { return document.getElementById(id); };
  var state = {};
  ORDER.forEach(function (k) { state[k] = { status: 'idle', prompt: '', settings: Object.assign({}, MODELS[k].defaults), output: null }; });
  var current = null, busy = false, reqId = 0, embedded = window.self !== window.top;

  // ---------------------------------------------------------------- worker
  var worker = null;
  function getWorker() {
    if (worker) return worker;
    var instance = new Worker('worker-src.js');
    worker = instance;
    instance.onmessage = function (e) { if (worker === instance) onWorkerMessage(e); };
    instance.onerror = function (e) { if (worker === instance) recoverWorker(e.message); };
    return instance;
  }

  function recoverWorker(detail) {
    var message = 'The model worker stopped. ' + (detail ? detail + ' ' : '') + 'Try loading the model again.';
    var wasBusy = busy;
    if (worker) worker.terminate();
    worker = null;
    busy = false;
    reqId += 1;
    ORDER.forEach(function (key) {
      var s = state[key];
      if (s.status === 'loading' || (wasBusy && key === current)) {
        s.status = 'error';
        s.message = message;
      } else if (s.status === 'ready') {
        s.status = 'idle';
        s.message = 'Load the model again from your browser cache.';
      }
    });
    renderLoader();
    renderRun();
    if (wasBusy) {
      $('speed').textContent = message;
      renderOutput(state[current].output, false);
    }
  }

  function sendToWorker(message) {
    try { getWorker().postMessage(message); }
    catch (error) { recoverWorker(error.message); }
  }

  function mb(n) { return (n / 1e6).toFixed(0); }

  function onWorkerMessage(e) {
    var m = e.data;
    if (m.type === 'progress') {
      var s = state[m.key];
      s.status = 'loading';
      s.progress = m.total ? m.got / m.total : 0;
      s.message = m.preparing ? 'Preparing the model…' : m.cached ? 'Loading from your browser cache…' : 'Downloading ' + mb(m.got) + ' of ' + mb(m.total) + ' MB…';
      if (m.key === current) renderLoader();
    } else if (m.type === 'ready') {
      state[m.key].status = 'ready';
      state[m.key].message = 'Ready · runs locally in your browser';
      if (m.key === current) { renderLoader(); renderRun(); }
    } else if (m.type === 'unloaded') {
      state[m.key].status = 'idle';
      state[m.key].message = 'Unloaded to save memory · loads again from your browser cache';
      if (m.key === current) { renderLoader(); renderRun(); }
    } else if (m.type === 'start') {
      if (m.reqId !== reqId) return;
      if (m.truncated) $('speed').textContent = 'Prompt shortened to fit the model’s context.';
    } else if (m.type === 'token') {
      if (m.reqId !== reqId) return;
      state[current].output = m.text;
      renderOutput(m.text, true);
    } else if (m.type === 'done') {
      if (m.reqId !== reqId) return;
      busy = false;
      var secs = m.ms / 1000;
      $('speed').textContent = m.tokens ? m.tokens + ' tokens · ' + (m.tokens / Math.max(secs, 0.001)).toFixed(1) + ' tokens/s' + (m.stopped ? ' · stopped' : '') : (m.stopped ? 'Stopped' : 'The model ended its answer immediately. Try again or raise the temperature.');
      if (!m.tokens && !m.stopped) renderOutput('', false);
      renderRun();
    } else if (m.type === 'error') {
      if (m.key) { state[m.key].status = 'error'; state[m.key].message = m.message; if (m.key === current) renderLoader(); }
      if (m.reqId === reqId && busy) { busy = false; $('speed').textContent = m.message; renderRun(); }
      if (!m.key && !m.reqId) setStatus(current, m.message, 'err');
    }
  }

  // ---------------------------------------------------------------- rendering
  function setStatus(key, text, cls) { if (key !== current) return; var el = $('load-status'); el.textContent = text || ''; el.className = 'status' + (cls ? ' ' + cls : ''); }

  function renderLoader() {
    var s = state[current], m = MODELS[current], btn = $('load-btn');
    btn.hidden = s.status === 'ready' || s.status === 'loading';
    btn.textContent = s.status === 'error' ? 'Try again' : 'Load model · ' + m.size;
    $('progress').hidden = s.status !== 'loading';
    $('progress-bar').style.width = Math.round((s.progress || 0) * 100) + '%';
    setStatus(current, s.message || (s.status === 'idle' ? 'Downloads ' + m.size + ' once, then runs entirely in your browser.' : ''), s.status === 'ready' ? 'ok' : s.status === 'error' ? 'err' : '');
  }

  function renderRun() {
    var s = state[current];
    $('run').disabled = busy || s.status !== 'ready';
    $('run').textContent = s.status === 'ready' ? 'Generate' : 'Load the model to generate';
    $('stop').hidden = !busy;
    document.querySelectorAll('.tab').forEach(function (t) { t.disabled = busy && t.dataset.key !== current; });
  }

  function renderOutput(text, generating) {
    var out = $('output'), m = MODELS[current];
    out.textContent = '';
    if (text === null || (text === '' && !generating)) {
      var ph = document.createElement('span'); ph.className = 'placeholder';
      ph.textContent = text === '' ? '(no output)' : 'Output appears here.';
      out.appendChild(ph); return;
    }
    if (m.mode === 'raw') {
      var p = document.createElement('span'); p.className = 'prompt'; p.textContent = state[current].lastPrompt || '';
      out.appendChild(p);
    }
    out.appendChild(document.createTextNode(m.mode === 'sft' ? text.replace(/^\s+/, '') : text));
  }

  function bindSlider(id, key, fmt) {
    var input = $(id), out = $(id + '-out');
    input.addEventListener('input', function () { state[current].settings[key] = Number(input.value); out.textContent = fmt(Number(input.value)); });
  }
  function renderSettings() {
    var s = state[current].settings, m = MODELS[current];
    $('max-new').max = String(m.maxNewLimit || 200);
    [['max-new', 'maxNew', String], ['temperature', 'temperature', function (v) { return v.toFixed(2); }], ['top-k', 'topK', String], ['penalty', 'penalty', function (v) { return v.toFixed(2); }]].forEach(function (x) {
      $(x[0]).value = String(s[x[1]]); $(x[0] + '-out').textContent = x[2](s[x[1]]);
    });
  }

  var examples = Vue.createApp({
    data: function () { return { prompts: [] }; },
    methods: { choose: function (text) { $('prompt').value = text; $('prompt').focus(); } },
    render: function () {
      return this.prompts.map(text => Vue.h('button', {
        key: text, type: 'button', class: 'chip', onClick: () => this.choose(text)
      }, text));
    }
  }).mount($('examples'));

  function select(key, focus) {
    if (busy) return;
    if (current) state[current].prompt = $('prompt').value;
    current = key;
    var m = MODELS[key], s = state[key];
    document.querySelectorAll('.tab').forEach(function (t) {
      var on = t.dataset.key === key;
      t.setAttribute('aria-selected', String(on)); t.tabIndex = on ? 0 : -1;
      if (on && focus) t.focus();
    });
    $('panel').setAttribute('aria-labelledby', 'tab-' + key);
    $('model-title').textContent = m.title;
    $('model-desc').textContent = m.desc;
    $('model-card').href = 'https://huggingface.co/' + m.repo;
    $('prompt-label').textContent = m.label;
    $('prompt').placeholder = m.placeholder;
    $('prompt').value = s.prompt;
    examples.prompts = m.examples;
    renderSettings(); renderLoader(); renderRun();
    $('speed').textContent = '';
    renderOutput(s.output, false);
    if (!embedded) { try { var u = new URL(location.href); u.searchParams.set('model', key); history.replaceState(null, '', u); } catch (e) {} }
    if (m.kind === 'gpt2' && s.status === 'idle') load();  // 4 MB: load straight away
  }

  function load() {
    var s = state[current], m = MODELS[current];
    s.status = 'loading'; s.progress = 0; s.message = 'Starting download…';
    renderLoader(); renderRun();
    sendToWorker({ type: 'load', key: current, repo: m.repo, kind: m.kind });
  }

  function run() {
    var m = MODELS[current], s = state[current];
    var text = $('prompt').value.trim() || m.placeholder;
    if (!$('prompt').value.trim()) $('prompt').value = text;
    busy = true; reqId += 1;
    s.lastPrompt = text; s.output = '';
    renderOutput('', true); renderRun();
    $('speed').textContent = 'Reading the prompt…';
    sendToWorker({ type: 'generate', reqId: reqId, key: current, mode: m.mode, text: text,
      maxNew: s.settings.maxNew, temperature: s.settings.temperature, topK: s.settings.topK, penalty: s.settings.penalty });
  }

  // ---------------------------------------------------------------- setup
  var tabs = $('tabs');
  ORDER.forEach(function (key) {
    var b = document.createElement('button');
    b.type = 'button'; b.className = 'tab'; b.id = 'tab-' + key; b.dataset.key = key;
    b.setAttribute('role', 'tab'); b.setAttribute('aria-controls', 'panel');
    b.innerHTML = '<span></span><small></small>';
    b.firstChild.textContent = MODELS[key].tab;
    // Each part of the subtitle gets its own span so narrow tabs can stack the parts
    // instead of leaving a dangling " · " at the end of a line.
    MODELS[key].sub.split(' · ').forEach(function (part, i) {
      if (i) { var sep = document.createElement('span'); sep.className = 'sep'; sep.textContent = ' · '; b.lastChild.appendChild(sep); }
      var s = document.createElement('span'); s.textContent = part; b.lastChild.appendChild(s);
    });
    b.addEventListener('click', function () { select(key); });
    tabs.appendChild(b);
  });
  tabs.addEventListener('keydown', function (e) {
    var i = ORDER.indexOf(current);
    if (e.key === 'ArrowRight') { e.preventDefault(); select(ORDER[(i + 1) % ORDER.length], true); }
    if (e.key === 'ArrowLeft') { e.preventDefault(); select(ORDER[(i + ORDER.length - 1) % ORDER.length], true); }
  });
  bindSlider('max-new', 'maxNew', String);
  bindSlider('temperature', 'temperature', function (v) { return v.toFixed(2); });
  bindSlider('top-k', 'topK', String);
  bindSlider('penalty', 'penalty', function (v) { return v.toFixed(2); });
  $('load-btn').addEventListener('click', load);
  $('run').addEventListener('click', run);
  $('stop').addEventListener('click', function () { if (worker) sendToWorker({ type: 'stop' }); });
  $('prompt').addEventListener('keydown', function (e) { if (e.key === 'Enter' && (e.ctrlKey || e.metaKey) && !$('run').disabled) run(); });

  var initial = 'miriad';
  try { var q = new URLSearchParams(location.search).get('model'); if (Object.hasOwn(MODELS, q)) initial = q; } catch (e) {}
  select(initial);

  // Tell an embedding page how tall we are, so its iframe can fit the content.
  if (embedded) {
    var postHeight = function () {
      try { window.parent.postMessage({ type: 'playground-frame:height', height: Math.ceil(document.body.getBoundingClientRect().height) }, '/'); } catch (e) {}
    };
    if ('ResizeObserver' in window) new ResizeObserver(postHeight).observe(document.body);
    window.addEventListener('load', postHeight);
    postHeight();
  }
})();
