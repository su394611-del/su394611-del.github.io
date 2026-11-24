(function () {
  const list = document.querySelector(".actions");
  if (!list || !window.Vue) return;
  const items = Array.from(list.querySelectorAll('a')).filter(link =>
    ['http:', 'https:'].includes(link.protocol)
  ).map(function (link) {
    return {
      label: link.textContent.trim(),
      attrs: { href: link.href, target: link.target, rel: link.rel, class: link.className }
    };
  });
  Vue.createApp({
    render() {
      return items.map(item => {
        const link = Vue.h('a', { ...item.attrs, key: item.attrs.href }, item.label);
        return link;
      });
    }
  }).mount(list);
})();
