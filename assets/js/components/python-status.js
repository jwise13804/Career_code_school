import { h } from "../core/dom.js";
import { onStatus } from "../core/python.js";

/** A small friendly line that explains what Python is doing. */
export function pythonStatus() {
  const el = h("p", { class: "py-status", role: "status" });
  const off = onStatus((text) => {
    if (!el.isConnected && el.dataset.mounted) {
      off();
      return;
    }
    el.dataset.mounted = "1";
    el.classList.toggle("is-loading", text !== "ready" && text !== "idle" && text !== "failed");
    if (text === "ready") el.textContent = "Python is ready.";
    else if (text === "idle") el.textContent = "Python loads when you press Run (about 8 MB, once).";
    else if (text === "failed")
      el.textContent = "Python couldn't load. Check your internet connection, then press Run to try again.";
    else el.innerHTML = `<span class="spinner" aria-hidden="true"></span> ${text}`;
  });
  return el;
}
