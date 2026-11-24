// When embedded, tell the parent page how tall this content is (same origin).
  (function () {
    if (window.self === window.top) return;
    function send() { try { parent.postMessage({ type: 'tiny-gpt-log-height', height: document.documentElement.scrollHeight }, location.origin); } catch (e) {} }
    window.addEventListener('load', send);
    window.addEventListener('resize', send);
    if (window.ResizeObserver) new ResizeObserver(send).observe(document.body);
  })();
