// Dispute workflow builder: the learner completes a small state machine in
// Python (TRANSITIONS + move()). We draw her transitions as a diagram and
// replay a few dispute journeys through her move() function.
import { h, announce } from "../core/dom.js";
import { renderMarkdown } from "../core/markdown.js";
import { createEditor } from "../core/editor.js";
import { runPython, stopPython } from "../core/python.js";
import { getLab, updateLab } from "../core/storage.js";
import { pythonStatus } from "../components/python-status.js";
import { outputPanel, renderChecks } from "../components/run-output.js";
import { hintLadder } from "../components/hints.js";
import { simBadge } from "./api-sim.js";

const LAYOUT = {
  opened: [90, 60],
  under_review: [300, 60],
  awaiting_customer: [300, 200],
  resolved_won: [520, 20],
  resolved_lost: [520, 120],
};
const W = 150;
const H = 44;

function nodeCentre(name, i) {
  const [x, y] = LAYOUT[name] || [90 + (i % 3) * 210, 220 + Math.floor(i / 3) * 80];
  return { x, y, cx: x, cy: y + H / 2 };
}

function edgePath(a, b) {
  // Connect box edges, with a gentle curve so two-way arrows don't overlap.
  const dx = b.cx - a.cx;
  const dy = b.cy - a.cy;
  const sx = a.cx + Math.sign(dx) * (Math.abs(dx) > 10 ? W / 2 : 0);
  const sy = a.cy + (Math.abs(dx) > 10 ? 0 : Math.sign(dy) * (H / 2));
  const ex = b.cx - Math.sign(dx) * (Math.abs(dx) > 10 ? W / 2 : 0);
  const ey = b.cy - (Math.abs(dx) > 10 ? 0 : Math.sign(dy) * (H / 2));
  const mx = (sx + ex) / 2 + (Math.abs(dx) > 10 ? 0 : 28);
  const my = (sy + ey) / 2 + (Math.abs(dx) > 10 ? -14 : 0);
  return `M${sx},${sy} Q${mx},${my} ${ex},${ey}`;
}

function diagram(expected, actual, current) {
  const states = [...new Set([...Object.keys(expected), ...Object.keys(actual || {})])];
  const pos = Object.fromEntries(states.map((s, i) => [s, nodeCentre(s, i)]));
  const edges = [];
  for (const [from, tos] of Object.entries(expected)) for (const to of tos) edges.push({ from, to, cls: (actual?.[from] || []).includes(to) ? "ok" : "missing" });
  for (const [from, tos] of Object.entries(actual || {}))
    for (const to of tos || []) if (!(expected[from] || []).includes(to) && pos[to]) edges.push({ from, to, cls: "wrong" });
  const ns = "http://www.w3.org/2000/svg";
  const svg = document.createElementNS(ns, "svg");
  svg.setAttribute("viewBox", "0 0 620 270");
  svg.setAttribute("class", "state-diagram");
  svg.setAttribute("role", "img");
  const okCount = edges.filter((e) => e.cls === "ok").length;
  svg.setAttribute("aria-label", `Dispute states diagram. ${okCount} of ${edges.filter((e) => e.cls !== "wrong").length} expected moves are in your code. ${edges.filter((e) => e.cls === "wrong").length} moves that shouldn't be allowed.`);
  const marker = (name, colorVar) =>
    `<marker id="arrow-${name}" viewBox="0 0 10 10" refX="9" refY="5" markerWidth="7" markerHeight="7" orient="auto-start-reverse"><path d="M0,0 L10,5 L0,10 z" style="fill:var(${colorVar})"/></marker>`;
  svg.innerHTML =
    `<defs>${marker("ok", "--success")}${marker("missing", "--muted")}${marker("wrong", "--danger")}</defs>` +
    edges.map((e) => `<path class="sd-edge ${e.cls}" d="${edgePath(pos[e.from], pos[e.to])}" marker-end="url(#arrow-${e.cls})"/>`).join("") +
    states
      .map((s) => {
        const p = pos[s];
        return `<g class="sd-node${s === current ? " is-current" : ""}"><rect x="${p.x - W / 2}" y="${p.y}" width="${W}" height="${H}" rx="12"/><text x="${p.x}" y="${p.y + H / 2 + 5}" text-anchor="middle">${s.replace(/_/g, " ")}</text></g>`;
      })
      .join("");
  return svg;
}

export async function mountDispute(slot, config, ctx) {
  const id = config.id || `${ctx.lessonId}-dispute`;
  const saved = getLab(id);
  const starter = (config.starter || "") + "\n";
  const expected = JSON.parse(config.expected || "{}");
  const journeys = JSON.parse(config.journeys || "[]");
  let editor;

  const editorHost = h("div", { class: "editor-host" });
  const diagramBox = h("div", { "aria-live": "polite" });
  const journeyList = h("ul", { class: "checks", "aria-label": "Dispute journeys" });
  const output = outputPanel();
  const checks = h("ul", { class: "checks" });
  const success = h("div", { class: "success-banner", hidden: true, role: "status" });
  const drawBtn = h("button", { class: "btn btn-primary", type: "button" }, "▶ Run and draw my workflow");
  const checkBtn = h("button", { class: "btn btn-accent", type: "button" }, "✓ Check my answer");
  const stopBtn = h("button", { class: "btn btn-danger", type: "button", hidden: true, onclick: () => stopPython() }, "■ Stop");

  const el = h(
    "section",
    { class: "card lab", "aria-labelledby": `${id}-title` },
    h("div", { class: "card-kicker" }, h("span", { class: "badge badge-teal" }, "Workflow builder"), simBadge(": your Python is real")),
    h("h3", { id: `${id}-title`, class: "card-title" }, config.title || "Build the dispute workflow"),
    config.task ? h("div", { class: "prose", html: renderMarkdown(config.task) }) : null,
    diagramBox,
    h("p", { class: "sd-legend" }, h("span", { class: "l-ok" }, "in your code"), h("span", { class: "l-missing" }, "still missing"), h("span", { class: "l-wrong" }, "shouldn't be allowed")),
    editorHost,
    h("div", { class: "toolbar" }, drawBtn, checkBtn, stopBtn),
    pythonStatus(),
    journeyList,
    output.el,
    checks,
    success,
    hintLadder({ id, hints: config.hints, solution: config.solution, onUseSolution: (code) => editor.setValue(code + "\n") }),
  );
  slot.replaceWith(el);
  diagramBox.replaceChildren(diagram(expected, {}, "opened"));

  editor = await createEditor(editorHost, {
    doc: saved.code ?? starter,
    label: "Dispute workflow code",
    onChange: (code) => {
      clearTimeout(editor._t);
      editor._t = setTimeout(() => updateLab(id, { code }), 400);
      ctx.setStuck({ activity: config.title, code });
    },
  });

  drawBtn.addEventListener("click", async () => {
    const payload = JSON.stringify(JSON.stringify(journeys));
    const driver = `import json as _json
_results = []
for _j in _json.loads(${payload}):
    _d = {"id": 1, "status": _j["start"]}
    try:
        move(_d, _j["to"])
        _results.append({"allowed": _d["status"] == _j["to"], "error": None})
    except Exception as _e:
        _results.append({"allowed": False, "error": type(_e).__name__ + ": " + str(_e)})
_ccs_out = {"transitions": {k: list(v) for k, v in TRANSITIONS.items()}, "results": _results}
`;
    stopBtn.hidden = false;
    output.clear();
    const result = await runPython({ code: editor.getValue(), driver, onStdout: (t) => output.write(t) });
    stopBtn.hidden = true;
    output.showResult(result);
    if (!result.ok || !result.out) return;
    const { transitions, results } = JSON.parse(result.out);
    diagramBox.replaceChildren(diagram(expected, transitions));
    journeyList.replaceChildren(
      ...journeys.map((j, i) => {
        const r = results[i];
        const good = r.allowed === j.allowed;
        const what = r.allowed ? "your code allowed it" : `your code refused it${r.error ? ` (${r.error})` : ""}`;
        return h(
          "li",
          { class: `check ${good ? "pass" : "fail"}` },
          h("span", { class: "check-icon", "aria-hidden": "true" }, good ? "✓" : "✗"),
          h("span", {}, `${j.label}: ${what}. `, h("span", { class: "check-tip" }, j.allowed ? "This move should be allowed." : "This move should be refused.")),
        );
      }),
    );
    announce("Workflow drawn");
  });

  checkBtn.addEventListener("click", async () => {
    stopBtn.hidden = false;
    output.clear();
    const result = await runPython({ code: editor.getValue(), tests: config.tests, onStdout: (t) => output.write(t) });
    stopBtn.hidden = true;
    output.showResult(result);
    if (renderChecks(checks, result)) {
      success.hidden = false;
      success.replaceChildren(h("strong", {}, "Workflow complete. "), config.success || "Disputes can now only move in ways the rules allow.");
      updateLab(id, { passed: true, code: editor.getValue() });
      ctx.refresh();
    }
  });

  ctx.registerTask({ id, label: config.title || "Dispute workflow", kind: "lab", isDone: () => Boolean(getLab(id).passed) });
}
