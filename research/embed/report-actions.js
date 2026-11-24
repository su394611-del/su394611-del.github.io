(function () {
  const list = document.querySelector(".actions");
  if (!list || !window.Vue) return;
  const items = Array.from(list.querySelectorAll('a'), function (link) {
    return {
      label: link.textContent.trim(),
      attrs: Object.fromEntries(Array.from(link.attributes, attr => [attr.name, attr.value]))
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
