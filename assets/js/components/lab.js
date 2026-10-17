// Code lab: editor, Run, Check (hidden tests), hint ladder, solution, reset.
import { h, announce } from "../core/dom.js";
import { renderMarkdown } from "../core/markdown.js";
import { createEditor } from "../core/editor.js";
import { runPython, stopPython } from "../core/python.js";
import { getLab, updateLab } from "../core/storage.js";
import { pythonStatus } from "./python-status.js";
import { outputPanel, renderChecks } from "./run-output.js";

export async function mountLab(slot, config, ctx) {
  const id = config.id || `${ctx.lessonId}-lab`;
  const saved = getLab(id);
  const starter = (config.starter || "") + "\n";
  const hints = config.hints || [];
  let hintsShown = saved.hints || 0;
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

  const hintList = h("ol", { class: "hint-list" });
  const hintBtn = h("button", { class: "btn btn-ghost btn-small", type: "button" });
  const solutionBox = h("div", { class: "solution", hidden: true });
  const solutionBtn = h("button", { class: "btn btn-ghost btn-small", type: "button", hidden: true }, "Show the solution");

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
    hints.length
      ? h("div", { class: "hints" }, h("h4", { class: "hints-title" }, "Stuck? Hints, one step at a time"), hintList, h("div", { class: "toolbar" }, hintBtn, solutionBtn), solutionBox)
      : null,
  );
  slot.replaceWith(el);

  const editor = await createEditor(editorHost, {
    doc: saved.code ?? starter,
    label: `${config.title || "Code lab"} editor`,
    onChange: (code) => {
      clearTimeout(editor._t);
      editor._t = setTimeout(() => updateLab(id, { code }), 400);
      ctx.setStuck({ activity: config.title, code, error: lastError });
    },
  });

  function renderHints() {
    hintList.replaceChildren(...hints.slice(0, hintsShown).map((text, i) => h("li", { class: "prose", html: renderMarkdown(text), "aria-label": `Hint ${i + 1}` })));
    if (hintsShown < hints.length) {
      hintBtn.hidden = false;
      hintBtn.textContent = `Show hint ${hintsShown + 1} of ${hints.length}`;
    } else hintBtn.hidden = true;
    solutionBtn.hidden = !config.solution || hintsShown < hints.length || !solutionBox.hidden;
  }
  hintBtn.addEventListener("click", () => {
    hintsShown = Math.min(hints.length, hintsShown + 1);
    updateLab(id, { hints: hintsShown });
    renderHints();
    hintList.lastElementChild?.setAttribute("tabindex", "-1");
    hintList.lastElementChild?.focus();
  });
  solutionBtn.addEventListener("click", () => {
    solutionBox.hidden = false;
    solutionBtn.hidden = true;
    updateLab(id, { solutionShown: true });
    const useBtn = h("button", { class: "btn btn-ghost btn-small", type: "button" }, "Put this in the editor");
    useBtn.addEventListener("click", () => {
      editor.setValue(config.solution + "\n");
      editor.focus();
    });
    solutionBox.replaceChildren(
      h("p", {}, "Here's one way to do it. Read it line by line, then try typing it yourself rather than copying: that's how it sticks."),
      h("pre", { class: "code-block" }, h("code", {}, config.solution)),
      useBtn,
    );
  });
  renderHints();

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
