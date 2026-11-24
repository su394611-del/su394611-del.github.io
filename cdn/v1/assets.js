/**
 * Version 1 of the AI Lab public asset catalog.
 * Import { assets } from this module and use the URL for the asset you need.
 * Each URL is pinned to a Git commit. Publish a new catalog version to update it.
 * The shared navigation assets still require their corresponding site markup.
 */

export const revision = "6503bd727db8db42636e1b166b55869cca3db366";

const cdn = `https://cdn.jsdelivr.net/gh/su394611-del/su394611-del.github.io@${revision}`;

export const assets = Object.freeze({
  navigationStyles: `${cdn}/assets/ailab-chrome.css`,
  navigationScript: `${cdn}/assets/ailab-chrome.js`,
  embedModeScript: `${cdn}/assets/embed-mode.js`,
  favicon: `${cdn}/assets/favicon.svg`,
});
