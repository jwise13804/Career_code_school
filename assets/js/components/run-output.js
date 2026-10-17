import { h } from "../core/dom.js";

/** Output panel: printed text plus a friendly error box. */
export function outputPanel() {
  const pre = h("pre", { class: "output-text", tabindex: "0", "aria-label": "Output" });
  const error = h("div", { class: "error-box", hidden: true });
  const panel = h("div", { class: "output", "aria-live": "polite" }, h("div", { class: "output-label" }, "Output"), pre, error);
  let empty = true;
  const api = {
    el: panel,
    clear(placeholder = "") {
      pre.textContent = placeholder;
      pre.classList.toggle("is-placeholder", Boolean(placeholder));
      empty = true;
      error.hidden = true;
      error.replaceChildren();
    },
    write(text) {
      if (empty) {
        pre.textContent = "";
        pre.classList.remove("is-placeholder");
        empty = false;
      }
      pre.textContent += text;
    },
    showResult(result) {
      if (empty && result.ok) api.clear("(Your code ran. It didn't print anything.)");
      if (result.error) {
        const e = result.error;
        error.hidden = false;
        error.replaceChildren(
          h("p", { class: "error-title" }, e.line ? `${e.type} on line ${e.line}` : e.type),
          e.source ? h("pre", { class: "error-source" }, e.source) : null,
          h("p", {}, e.explain),
          e.message ? h("p", { class: "error-raw" }, h("span", { class: "muted" }, "Python said: "), e.message) : null,
        );
      }
    },
  };
  api.clear("Press Run to see what your code prints.");
  return api;
}

/** Test results list. Returns true when every check passed. */
export function renderChecks(list, result) {
  list.replaceChildren();
  const tests = result.tests || [];
  tests.forEach((t) => {
    list.append(
      h(
        "li",
        { class: t.ok ? "check pass" : "check fail" },
        h("span", { class: "check-icon", "aria-hidden": "true" }, t.ok ? "✓" : "✗"),
        h("span", { class: "sr-only" }, t.ok ? "Passed: " : "Not yet: "),
        h("span", {}, t.message, t.tip ? h("span", { class: "check-tip" }, ` Tip: ${t.tip}`) : null),
      ),
    );
  });
  return tests.length > 0 && tests.every((t) => t.ok);
}
