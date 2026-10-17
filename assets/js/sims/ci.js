// CI pipeline visual. "Push" runs a pretend GitHub Actions pipeline:
// Checkout -> Install -> Lint -> Tests -> Deploy. Lint and Tests are real
// (your Python really is compiled and tested in the browser); Checkout,
// Install and Deploy are simulated. Failing tests block the deploy.
import { h, announce, wait } from "../core/dom.js";
import { renderMarkdown } from "../core/markdown.js";
import { createEditor } from "../core/editor.js";
import { runPython } from "../core/python.js";
import { getLab, updateLab } from "../core/storage.js";
import { pythonStatus } from "../components/python-status.js";
import { renderChecks } from "../components/run-output.js";
import { hintLadder } from "../components/hints.js";
import { simBadge } from "./api-sim.js";

const STAGES = [
  { key: "checkout", name: "Checkout", real: false },
  { key: "install", name: "Install", real: false },
  { key: "lint", name: "Lint", real: true },
  { key: "test", name: "Tests", real: true },
  { key: "deploy", name: "Deploy", real: false },
];

export async function mountCi(slot, config, ctx) {
  const id = config.id || `${ctx.lessonId}-ci`;
  const saved = getLab(id);
  const starter = (config.starter || "") + "\n";
  let editor;
  let runs = 0;

  const editorHost = h("div", { class: "editor-host" });
  const pipeline = h("ol", { class: "pipeline", "aria-label": "Pipeline stages" });
  const stageEls = {};
  STAGES.forEach((s) => {
    const state = h("span", { class: "stage-state" }, "waiting");
    const li = h("li", { class: "stage" }, h("span", { class: "stage-name" }, s.name), state, h("span", { class: "sr-only" }, s.real ? " (really runs)" : " (simulated)"));
    stageEls[s.key] = { li, state };
    pipeline.append(li);
  });
  const logBox = h("pre", { class: "api-body", tabindex: "0", "aria-label": "Pipeline log", hidden: true });
  const checks = h("ul", { class: "checks" });
  const banner = h("div", { class: "feedback", "aria-live": "polite" });
  const pushBtn = h("button", { class: "btn btn-primary", type: "button" }, "⇪ git push (run the pipeline)");

  const el = h(
    "section",
    { class: "card ci-card", "aria-labelledby": `${id}-title` },
    h("div", { class: "card-kicker" }, h("span", { class: "badge badge-teal" }, "CI pipeline"), simBadge(": Lint and Tests really run your code")),
    h("h3", { id: `${id}-title`, class: "card-title" }, config.title || "Watch the pipeline"),
    config.task ? h("div", { class: "prose", html: renderMarkdown(config.task) }) : null,
    h("h4", {}, h("code", {}, config.filename || "app.py")),
    editorHost,
    h("div", { class: "toolbar" }, pushBtn),
    pythonStatus(),
    pipeline,
    banner,
    checks,
    logBox,
    hintLadder({ id, hints: config.hints, solution: config.solution, onUseSolution: (code) => editor.setValue(code + "\n") }),
  );
  slot.replaceWith(el);

  editor = await createEditor(editorHost, {
    doc: saved.code ?? starter,
    label: `${config.filename || "app.py"} editor`,
    onChange: (code) => {
      clearTimeout(editor._t);
      editor._t = setTimeout(() => updateLab(id, { code }), 400);
      ctx.setStuck({ activity: config.title, code });
    },
  });

  const set = (key, cls, text) => {
    const s = stageEls[key];
    s.li.className = `stage ${cls}`;
    s.state.textContent = text;
  };
  const log = (text) => {
    logBox.hidden = false;
    logBox.textContent += `${text}\n`;
  };

  pushBtn.addEventListener("click", async () => {
    runs += 1;
    pushBtn.disabled = true;
    banner.className = "feedback";
    banner.replaceChildren();
    checks.replaceChildren();
    logBox.textContent = "";
    STAGES.forEach((s) => set(s.key, "", "waiting"));
    const runPromise = runPython({ code: editor.getValue(), tests: config.tests });

    set("checkout", "running", "running");
    log(`Run #${runs} triggered by push to main`);
    log("$ git checkout (copying your code onto a fresh computer)");
    await wait(600);
    set("checkout", "passed", "passed ✓");
    set("install", "running", "running");
    log("$ pip install -r requirements.txt");
    await wait(800);
    log("Successfully installed pytest");
    set("install", "passed", "passed ✓");
    set("lint", "running", "running");
    log(`$ python -m py_compile ${config.filename || "app.py"}`);
    const result = await runPromise;
    await wait(400);
    const syntaxBroken = result.error && ["SyntaxError", "IndentationError", "TabError"].includes(result.error.type);
    if (syntaxBroken || result.stopped) {
      set("lint", "failed", "failed ✗");
      log(`${config.filename || "app.py"} line ${result.error.line ?? "?"}: ${result.error.type}: ${result.error.message}`);
      set("test", "blocked", "skipped");
      set("deploy", "blocked", "blocked");
      banner.className = "feedback is-wrong";
      banner.replaceChildren(h("p", { class: "feedback-title" }, "Lint failed, so nothing else ran."), h("p", {}, result.error.explain));
      pushBtn.disabled = false;
      return;
    }
    set("lint", "passed", "passed ✓");
    set("test", "running", "running");
    log("$ pytest");
    await wait(900);
    const allPassed = renderChecks(checks, result);
    const failed = (result.tests || []).filter((t) => !t.ok).length;
    const passed = (result.tests || []).length - failed;
    log(allPassed ? `${passed} passed` : `${failed} failed, ${passed} passed`);
    if (!allPassed) {
      set("test", "failed", "failed ✗");
      set("deploy", "blocked", "blocked 🔒");
      log("Deploy skipped: a required job failed.");
      banner.className = "feedback is-wrong";
      banner.replaceChildren(
        h("p", { class: "feedback-title" }, "Tests failed, so the deploy was blocked."),
        h("p", {}, "That's the pipeline doing its job: the bug never reached customers. Read the failing test below, fix the code, and push again."),
      );
      announce("Tests failed. Deploy blocked.");
    } else {
      set("test", "passed", "passed ✓");
      set("deploy", "running", "deploying");
      log("Deploying to production…");
      await wait(900);
      set("deploy", "passed", "live ✓");
      log("Deployed.");
      banner.className = "feedback is-right";
      banner.replaceChildren(h("p", { class: "feedback-title" }, "All green. Your change is live."), h("p", {}, config.success || "Every future push gets the same checks automatically."));
      updateLab(id, { passed: true, code: editor.getValue() });
      announce("Pipeline passed and deployed");
      ctx.refresh();
    }
    pushBtn.disabled = false;
  });

  ctx.registerTask({ id, label: config.title || "CI pipeline", kind: "lab", isDone: () => Boolean(getLab(id).passed) });
}
