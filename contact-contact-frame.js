(function () {
  'use strict';
  var form = document.getElementById('contact-form');
  var status = document.getElementById('cf-status');
  var button = form.querySelector('button[type="submit"]');
  var label = button.querySelector('.btn-label');
  var subject = form.querySelector('input[name="_subject"]');
  var baseSubject = subject.defaultValue;
  var embedded = window.self !== window.top;

  /* Project pages embed this form as /contact.html?from=<repo-name>; tag the message with it. */
  var source = '';
  try { source = new URLSearchParams(window.location.search).get('from') || ''; } catch (e) { source = ''; }
  source = source.replace(/[^A-Za-z0-9._-]/g, '').slice(0, 80);
  if (source) {
    form.querySelector('input[name="project"]').value = source;
    var back = document.getElementById('cf-back');
    if (back) { back.href = '/' + source + '/'; back.hidden = false; }
  }

  /* Tell index.html how tall the form is so the iframe never scrolls. */
  function postHeight() {
    if (!embedded) return;
    try {
      var height = Math.ceil(document.body.getBoundingClientRect().height);
      window.parent.postMessage({ type: 'contact-frame:height', height: height }, '/');
    } catch (e) { /* parent on another origin: keep the default iframe height */ }
  }

  function setStatus(message, state) {
    status.textContent = message;
    if (state) status.setAttribute('data-state', state); else status.removeAttribute('data-state');
    postHeight();
  }

  function setBusy(busy) {
    button.disabled = busy;
    label.textContent = busy ? 'Sending…' : 'Send message';
    if (busy) form.setAttribute('aria-busy', 'true'); else form.removeAttribute('aria-busy');
  }

  form.addEventListener('submit', function (event) {
    if (!window.fetch || !window.FormData) return; /* very old browser: plain POST to Formspree */
    event.preventDefault();

    /* Split so a find-and-replace of the placeholder in this file doesn't also rewrite this check. */
    if (form.action.indexOf('YOUR_' + 'FORM_ID') !== -1) {
      setStatus('This form isn’t connected yet. Add your Formspree form ID to contact.html.', 'error');
      return;
    }

    var nameField = form.elements.namedItem('name');
    var name = nameField ? nameField.value.trim() : '';
    subject.value = baseSubject + (source ? ' — ' + source : '') + (name ? ' — ' + name : '');

    setBusy(true);
    setStatus('', null);

    fetch(form.action, { method: 'POST', body: new FormData(form), headers: { Accept: 'application/json' } })
      .then(function (response) {
        if (response.ok) {
          form.reset();
          setStatus('Thanks, your message has been sent. I’ll get back to you by email.', 'success');
          return;
        }
        return response.json().catch(function () { return {}; }).then(function (data) {
          var detail = data && Array.isArray(data.errors)
            ? data.errors.map(function (e) {
                if (!e || !e.message) return '';
                var field = e.field ? e.field.charAt(0).toUpperCase() + e.field.slice(1) + ' ' : '';
                return field + e.message + '.';
              }).filter(Boolean).join(' ')
            : '';
          setStatus(detail || 'Sorry, your message couldn’t be sent. Please try again in a moment.', 'error');
        });
      })
      .catch(function () {
        setStatus('Network error. Please check your connection and try again.', 'error');
      })
      .then(function () { setBusy(false); });
  });

  if (embedded) {
    if ('ResizeObserver' in window) new ResizeObserver(postHeight).observe(document.body);
    window.addEventListener('load', postHeight);
    window.addEventListener('resize', postHeight);
    postHeight();
  }
})();
