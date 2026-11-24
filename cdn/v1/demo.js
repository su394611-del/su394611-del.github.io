import { assets, revision } from "./assets.js";
import { createCdnAssetList } from "./vue.js";

const { createApp, h, ref } = window.Vue;
const CdnAssetList = createCdnAssetList(h);
const files = Object.values(assets);

createApp({
  setup() {
    const busy = ref(false);
    const results = ref([]);

    async function checkAssets() {
      if (busy.value) return;
      busy.value = true;
      results.value = [];
      results.value = await Promise.all(files.map(async (url) => {
        const name = url.split("/").pop();
        try {
          const response = await fetch(url, {
            credentials: "omit",
            signal: AbortSignal.timeout(10000),
          });
          if (!response.ok) return name + " — HTTP " + response.status;
          const body = await response.arrayBuffer();
          return name + " — HTTP " + response.status + " · " + body.byteLength.toLocaleString() + " bytes";
        } catch {
          return name + " — request failed";
        }
      }));
      busy.value = false;
    }

    return () => h("div", [
      h("p", [h("img", { src: assets.favicon, width: 32, height: 32, alt: "" }), "Live icon loaded from jsDelivr"]),
      h("p", ["Asset revision ", h("code", revision.slice(0, 12))]),
      h(CdnAssetList),
      h("button", { type: "button", disabled: busy.value, onClick: checkAssets }, "Check CDN assets"),
      h("div", { "aria-live": "polite" },
        busy.value ? "Checking…" :
          results.value.length ? [h("ul", results.value.map((result) => h("li", { key: result }, result)))] : []
      ),
    ]);
  },
}).mount("#demo");
