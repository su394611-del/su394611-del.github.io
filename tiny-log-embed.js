// Size the embedded training-log and research iframes to their content (same-origin messages from the framed pages).
  window.addEventListener('message', function (e) {
    if (e.origin !== location.origin || !e.data || (e.data.type !== 'tiny-gpt-log-height' && e.data.type !== 'research-embed-height')) return;
    document.querySelectorAll('iframe.me-iframe').forEach(function (f) {
      if (f.contentWindow === e.source) f.style.height = Math.ceil(e.data.height) + 'px';
    });
  });
