// Code lab: editor, Run, Check (hidden tests), hint ladder, solution, reset.
import { h, announce } from "../core/dom.js";
import { renderMarkdown } from "../core/markdown.js";
import { createEditor } from "../core/editor.js";
import { runPython, stopPython } from "../core/python.js";
import { getLab, updateLab } from "../core/storage.js";
import { pythonStatus } from "./python-status.js";
import { outputPanel, renderChecks } from "./run-output.js";
import { hintLadder } from "./hints.js";

export async function mountLab(slot, config, ctx) {
  const id = config.id || `${ctx.lessonId}-lab`;
  const saved = getLab(id);
  const starter = (config.starter || "") + "\n";
  let lastError = null;

  const editorHost = h("div", { class: "editor-host" });
  const output = outputPanel();
  const checks = h("ul", { class: "checks", "aria-label": "Check results" });
  const success = h("div", { class: "success-banner", hidden: true, role: "status" });
  const runBtn = h("button", { class: "btn btn-primary", type: "button" }, h("span", { "aria-hidden": "true" }, "▶ "), "Run");
  const checkBtn = config.tests
    ? h("button", { class: "btn btn-accent", type: "button" }, h("span", { "aria-hidden": "true" }, "✓ "), "Check my answer")
    : null;
  const stopBtn = h("button", { class: "btn btn-danger", type: "button", hidden: true }, h("span", { "aria-hidden": "true" }, "■ "), "Stop");
  const resetBtn = h("button", { class: "btn btn-ghost", type: "button" }, h("span", { "aria-hidden": "true" }, "↺ "), "Reset code");

  let editor;
  const hints = hintLadder({
    id,
    hints: config.hints,
    solution: config.solution,
    onUseSolution: (code) => {
      editor.setValue(code + "\n");
      editor.focus();
    },
  });

  const el = h(
    "section",
    { class: "card lab", "aria-labelledby": `${id}-title` },
    h("div", { class: "card-kicker" }, h("span", { class: "badge badge-teal" }, "Code lab"), saved.passed ? h("span", { class: "badge badge-done" }, "✓ Passed") : null),
    h("h3", { id: `${id}-title`, class: "card-title" }, config.title || "Try it"),
    config.task ? h("div", { class: "prose task", html: renderMarkdown(config.task) }) : null,
    editorHost,
    h("div", { class: "toolbar" }, runBtn, checkBtn, stopBtn, resetBtn),
    pythonStatus(),
    output.el,
    checks,
    success,
    hints,
  );
  slot.replaceWith(el);

  editor = await createEditor(editorHost, {
    doc: saved.code ?? starter,
    label: `${config.title || "Code lab"} editor`,
    onChange: (code) => {
      clearTimeout(editor._t);
      editor._t = setTimeout(() => updateLab(id, { code }), 400);
      ctx.setStuck({ activity: config.title, code, error: lastError });
    },
  });

  async function execute(withTests) {
    output.clear();
    checks.replaceChildren();
    success.hidden = true;
    runBtn.disabled = true;
    if (checkBtn) checkBtn.disabled = true;
    stopBtn.hidden = false;
    const result = await runPython({
      code: editor.getValue(),
      tests: withTests ? config.tests : "",
      onStdout: (t) => output.write(t),
    });
    runBtn.disabled = false;
    if (checkBtn) checkBtn.disabled = false;
    stopBtn.hidden = true;
    output.showResult(result);
    lastError = result.error ? `${result.error.type}${result.error.line ? ` on line ${result.error.line}` : ""}: ${result.error.message}` : null;
    ctx.setStuck({ activity: config.title, code: editor.getValue(), error: lastError });
    if (withTests) {
      const passed = renderChecks(checks, result);
      if (passed) {
        success.hidden = false;
        success.replaceChildren(h("strong", {}, "All checks passed. "), config.success || "Lovely work. That's a real program you just wrote.");
        updateLab(id, { passed: true, code: editor.getValue() });
        announce("All checks passed.");
        ctx.refresh();
      } else {
        const failed = (result.tests || []).filter((t) => !t.ok).length;
        announce(`${failed} check${failed === 1 ? "" : "s"} not passing yet.`);
      }
    }
  }

  runBtn.addEventListener("click", () => execute(false));
  checkBtn?.addEventListener("click", () => execute(true));
  stopBtn.addEventListener("click", () => stopPython());
  resetBtn.addEventListener("click", () => {
    if (editor.getValue().trim() !== starter.trim() && !window.confirm("Reset to the starter code? Your changes in this lab will be lost.")) return;
    editor.setValue(starter);
    updateLab(id, { code: starter });
    output.clear("Press Run to see what your code prints.");
    checks.replaceChildren();
    success.hidden = true;
  });

  ctx.registerTask({ id, label: config.title || "Code lab", kind: "lab", isDone: () => Boolean(getLab(id).passed) });
  ctx.setStuck({ activity: config.title, code: editor.getValue(), error: null });
}
