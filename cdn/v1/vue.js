import { assets } from "./assets.js";

/**
 * Create a Vue 3 component with the h function from the consuming app.
 * Example: import { h } from "vue";
 *          const CdnAssetList = createCdnAssetList(h);
 */
export function createCdnAssetList(h) {
  const entries = [
    ["Navigation stylesheet", assets.navigationStyles],
    ["Navigation script", assets.navigationScript],
    ["Embed mode script", assets.embedModeScript],
    ["Favicon", assets.favicon],
  ];

  return {
    name: "CdnAssetList",
    render() {
      return h("ul", { "aria-label": "AI Lab CDN assets" }, entries.map(([label, url]) =>
        h("li", { key: url }, [h("a", { href: url }, label)])
      ));
    },
  };
}
