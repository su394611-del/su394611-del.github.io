/* Resize the contact iframe to fit its content. Kept outside #app so Vue does not strip it. */
(function () {
  window.addEventListener('message', function (event) {
    if (event.origin !== window.location.origin) return;
    var data = event.data;
    if (!data || data.type !== 'contact-frame:height') return;
    var frame = document.getElementById('contact-frame');
    if (!frame || event.source !== frame.contentWindow) return;
    var height = Math.ceil(Number(data.height));
    if (height > 0 && height < 4000) frame.style.height = height + 'px';
  });
})();
