// Small DOM helpers so components stay readable without a framework.

/**
 * h("button", {class: "btn", onclick: fn}, "Run")
 * Attributes starting with "on" become event listeners; `html` sets innerHTML.
 */
export function h(tag, attrs = {}, ...children) {
  const el = document.createElement(tag);
  for (const [key, value] of Object.entries(attrs || {})) {
    if (value === undefined || value === null || value === false) continue;
    if (key.startsWith("on") && typeof value === "function") el.addEventListener(key.slice(2), value);
    else if (key === "html") el.innerHTML = value;
    else if (key === "class") el.className = value;
    else if (key === "dataset") Object.assign(el.dataset, value);
    else if (value === true) el.setAttribute(key, "");
    else el.setAttribute(key, value);
  }
  for (const child of children.flat()) {
    if (child === null || child === undefined || child === false) continue;
    el.append(child instanceof Node ? child : document.createTextNode(String(child)));
  }
  return el;
}

export function escapeHtml(text) {
  return String(text)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

/** Read a message to screen-reader users without moving focus. */
export function announce(message) {
  const region = document.getElementById("live-region");
  if (!region) return;
  region.textContent = "";
  setTimeout(() => (region.textContent = message), 30);
}

export async function copyText(text) {
  try {
    await navigator.clipboard.writeText(text);
    return true;
  } catch {
    // Fallback for older phones / non-secure contexts.
    const area = h("textarea", { style: "position:fixed;opacity:0", "aria-hidden": "true" });
    area.value = text;
    document.body.append(area);
    area.select();
    let ok = false;
    try {
      ok = document.execCommand("copy");
    } catch {
      ok = false;
    }
    area.remove();
    return ok;
  }
}

export function downloadFile(name, content, type = "application/json") {
  const blob = content instanceof Blob ? content : new Blob([content], { type });
  const url = URL.createObjectURL(blob);
  const a = h("a", { href: url, download: name });
  document.body.append(a);
  a.click();
  a.remove();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}

export function prefersReducedMotion() {
  return window.matchMedia?.("(prefers-reduced-motion: reduce)").matches ?? false;
}

export const wait = (ms) => new Promise((r) => setTimeout(r, prefersReducedMotion() ? Math.min(ms, 60) : ms));

let scriptPromises = new Map();
/** Load a classic (non-module) script once, e.g. sql.js or JSZip. */
export function loadScript(src) {
  if (!scriptPromises.has(src)) {
    scriptPromises.set(
      src,
      new Promise((resolve, reject) => {
        const s = h("script", { src });
        s.onload = resolve;
        s.onerror = () => {
          scriptPromises.delete(src);
          reject(new Error(`Couldn't load ${src}`));
        };
        document.head.append(s);
      }),
    );
  }
  return scriptPromises.get(src);
}

export function vendorUrl(file) {
  return new URL(`../../vendor/${file}`, import.meta.url).href;
}
