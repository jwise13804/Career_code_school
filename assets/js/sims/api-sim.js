// A Postman-style request builder.
//  - mountApi: talks to the in-browser Mini Bank API (sims/minibank.js).
//  - mountHandlerLab: talks to a request handler the learner writes in Python.
import { h, announce, wait } from "../core/dom.js";
import { renderMarkdown } from "../core/markdown.js";
import { createEditor } from "../core/editor.js";
import { runPython, stopPython } from "../core/python.js";
import { getLab, updateLab, isChallengeDone, setChallengeDone } from "../core/storage.js";
import { handleRequest, resetBank, statusText, STATUS_EXPLAIN, API_KEY } from "./minibank.js";
import { pythonStatus } from "../components/python-status.js";
import { outputPanel, renderChecks } from "../components/run-output.js";
import { hintLadder } from "../components/hints.js";

const METHODS = ["GET", "POST", "PUT", "PATCH", "DELETE"];

export function simBadge(extra = "") {
  return h("span", { class: "badge badge-sim", title: "This runs entirely in your browser" }, `Simulation${extra}`);
}

function parseHeaders(text) {
  const out = {};
  text.split("\n").forEach((line) => {
    const i = line.indexOf(":");
    if (i > 0) out[line.slice(0, i).trim().toLowerCase()] = line.slice(i + 1).trim();
  });
  return out;
}

function statusClass(code) {
  if (code < 300) return "ok";
  if (code < 500) return "client";
  return "server";
}

function renderResponse(box, { status, headers = {}, body }, ms) {
  const headerText = Object.entries(headers)
    .map(([k, v]) => `${k}: ${v}`)
    .join("\n");
  box.hidden = false;
  box.replaceChildren(
    h(
      "div",
      { class: `api-status ${statusClass(status)}` },
      h("span", {}, `${status} ${statusText(status)}`),
      ms != null ? h("span", { class: "small" }, `${ms} ms`) : null,
      h("span", { class: "api-status-explain" }, STATUS_EXPLAIN[status] || ""),
    ),
    headerText ? h("details", { class: "small", style: "padding:0 0.9rem" }, h("summary", {}, "Response headers"), h("pre", { class: "api-body" }, headerText)) : null,
    h("pre", { class: "api-body", tabindex: "0", "aria-label": "Response body" }, body === undefined || body === null ? "(no body)" : JSON.stringify(body, null, 2)),
  );
}

/** The shared request form. onSend({method, path, headers, bodyText}) */
function requestBuilder({ id, presets = [], defaultHeaders = "", onSend }) {
  const method = h("select", { class: "select", id: `${id}-method`, "aria-label": "Method" }, ...METHODS.map((m) => h("option", { value: m }, m)));
  const path = h("input", { class: "text-input", id: `${id}-path`, value: "/customers", autocomplete: "off", autocapitalize: "off", spellcheck: "false", "aria-label": "Path" });
  const headers = h("textarea", { class: "text-input", id: `${id}-headers`, rows: "2", spellcheck: "false", placeholder: "Header-Name: value" });
  headers.value = defaultHeaders;
  const body = h("textarea", { class: "text-input", id: `${id}-body`, rows: "4", spellcheck: "false", placeholder: '{"name": "Grace Murphy", "city": "Belfast"}' });
  const send = h("button", { class: "btn btn-primary", type: "submit" }, "Send request");
  const syncBody = () => {
    const usesBody = !["GET", "DELETE"].includes(method.value);
    body.disabled = !usesBody;
    body.closest(".full")?.classList.toggle("muted", !usesBody);
  };
  method.addEventListener("change", syncBody);

  const form = h(
    "form",
    { class: "api-request", onsubmit: (e) => (e.preventDefault(), onSend({ method: method.value, path: path.value.trim(), headers: parseHeaders(headers.value), bodyText: body.disabled ? "" : body.value })) },
    h("div", {}, h("label", { class: "label", for: `${id}-method` }, "Method"), method),
    h("div", {}, h("label", { class: "label", for: `${id}-path` }, "Path"), path),
    h("div", { class: "full" }, h("label", { class: "label", for: `${id}-headers` }, "Headers ", h("span", { class: "muted small" }, "(one per line)")), headers),
    h("div", { class: "full" }, h("label", { class: "label", for: `${id}-body` }, "Body (JSON) ", h("span", { class: "muted small" }, "(for POST, PUT and PATCH)")), body),
    h("div", { class: "full toolbar" }, send),
  );
  const presetBox = presets.length
    ? h(
        "div",
        {},
        h("p", { class: "small muted", style: "margin-bottom:0.3rem" }, "Quick start: fill the form with an example"),
        h(
          "div",
          { class: "api-presets" },
          ...presets.map((p) =>
            h(
              "button",
              {
                type: "button",
                class: "btn btn-ghost btn-small",
                onclick: () => {
                  method.value = p.method;
                  path.value = p.path;
                  if (p.headers !== undefined) headers.value = Object.entries(p.headers).map(([k, v]) => `${k}: ${v}`).join("\n");
                  body.value = p.body ? (typeof p.body === "string" ? p.body : JSON.stringify(p.body, null, 2)) : "";
                  syncBody();
                  path.focus();
                },
              },
              p.label,
            ),
          ),
        ),
      )
    : null;
  syncBody();
  return { form, presetBox, send };
}

export function mountApi(slot, config, ctx) {
  const id = config.id || `${ctx.lessonId}-api`;
  const tasks = config.tasks || [];
  const response = h("div", { class: "api-response", hidden: true, "aria-live": "polite" });
  const history = h("ol", { class: "api-history", "aria-label": "Requests sent" });
  const taskList = h("ul", { class: "task-list" });
  const renderTasks = () =>
    taskList.replaceChildren(
      ...tasks.map((t) => {
        const done = isChallengeDone(`${id}/${t.id}`);
        return h("li", { class: done ? "done" : "" }, h("span", { "aria-hidden": "true" }, done ? "✓ " : "○ "), h("span", { html: renderMarkdown(t.text).replace(/^<p>|<\/p>\s*$/g, "") }), h("span", { class: "sr-only" }, done ? " (done)" : ""));
      }),
    );

  const builder = requestBuilder({
    id,
    presets: config.presets,
    defaultHeaders: config.headers ?? "",
    onSend: async (req) => {
      builder.send.disabled = true;
      const started = performance.now();
      await wait(250 + Math.random() * 300); // a pretend network trip
      const res = handleRequest(req);
      const ms = Math.round(performance.now() - started);
      builder.send.disabled = false;
      renderResponse(response, res, ms);
      history.prepend(h("li", {}, `${req.method} ${req.path} → ${res.status}`));
      announce(`Response ${res.status} ${statusText(res.status)}`);
      ctx.setStuck({ activity: config.title || "Mini Bank API", code: `${req.method} ${req.path}\n${Object.entries(req.headers).map(([k, v]) => `${k}: ${v}`).join("\n")}\n\n${req.bodyText}`, error: `${res.status} ${JSON.stringify(res.body)}`, language: "http" });
      tasks.forEach((t) => {
        const methodOk = !t.method || t.method === req.method;
        const pathOk = !t.path || new RegExp(t.path).test(req.path);
        const statusOk = !t.status || t.status === res.status;
        if (methodOk && pathOk && statusOk && !isChallengeDone(`${id}/${t.id}`)) {
          setChallengeDone(`${id}/${t.id}`);
          announce(`Task done: ${t.text.replace(/[`*]/g, "")}`);
          ctx.refresh();
        }
      });
      renderTasks();
    },
  });

  const resetBtn = h("button", { class: "btn btn-ghost btn-small", type: "button", onclick: () => (resetBank(), history.replaceChildren(), (response.hidden = true)) }, "↺ Reset the bank");
  const el = h(
    "section",
    { class: "card api-card", "aria-labelledby": `${id}-title` },
    h("div", { class: "card-kicker" }, h("span", { class: "badge badge-teal" }, "API playground"), simBadge()),
    h("h3", { id: `${id}-title`, class: "card-title" }, config.title || "Mini Bank API"),
    h(
      "p",
      { class: "sim-note" },
      "This is a pretend bank API that runs inside this page, so nothing is sent over the internet. It answers exactly like a real one would. Its API key is ",
      h("code", {}, API_KEY),
      ".",
    ),
    tasks.length ? h("div", { class: "goal-box" }, h("p", {}, h("strong", {}, "Try to:")), taskList) : null,
    builder.presetBox,
    builder.form,
    response,
    history,
    h("div", { class: "toolbar" }, resetBtn),
  );
  slot.replaceWith(el);
  renderTasks();
  if (tasks.length)
    ctx.registerTask({ id, label: config.title || "API tasks", kind: "api", isDone: () => tasks.every((t) => isChallengeDone(`${id}/${t.id}`)) });
}

/** Parse "POST /customers {json}" lines into presets. */
function parseRequestLines(text = "") {
  return text
    .split("\n")
    .map((l) => l.trim())
    .filter(Boolean)
    .map((line) => {
      const m = line.match(/^(\w+)\s+(\S+)\s*(.*)$/);
      return m ? { label: `${m[1]} ${m[2]}`, method: m[1].toUpperCase(), path: m[2], body: m[3] || "" } : null;
    })
    .filter(Boolean);
}

export async function mountHandlerLab(slot, config, ctx) {
  const id = config.id || `${ctx.lessonId}-handler`;
  const saved = getLab(id);
  let editor;
  const starter = (config.starter || "") + "\n";
  const editorHost = h("div", { class: "editor-host" });
  const output = outputPanel();
  const checks = h("ul", { class: "checks" });
  const success = h("div", { class: "success-banner", hidden: true, role: "status" });
  const response = h("div", { class: "api-response", hidden: true, "aria-live": "polite" });
  const checkBtn = h("button", { class: "btn btn-accent", type: "button" }, "✓ Check my handler");
  const stopBtn = h("button", { class: "btn btn-danger", type: "button", hidden: true, onclick: () => stopPython() }, "■ Stop");
  const builder = requestBuilder({ id, presets: parseRequestLines(config.requests), onSend: (req) => send(req) });

  const el = h(
    "section",
    { class: "card lab", "aria-labelledby": `${id}-title` },
    h("div", { class: "card-kicker" }, h("span", { class: "badge badge-teal" }, "Code lab"), simBadge(": your code is the server")),
    h("h3", { id: `${id}-title`, class: "card-title" }, config.title || "Write the handler"),
    config.task ? h("div", { class: "prose task", html: renderMarkdown(config.task) }) : null,
    editorHost,
    h("div", { class: "toolbar" }, checkBtn, stopBtn),
    pythonStatus(),
    output.el,
    checks,
    success,
    hintLadder({ id, hints: config.hints, solution: config.solution, onUseSolution: (code) => editor.setValue(code + "\n") }),
    h("h4", {}, "Send a request to your handler"),
    builder.presetBox,
    builder.form,
    response,
  );
  slot.replaceWith(el);
  editor = await createEditor(editorHost, {
    doc: saved.code ?? starter,
    label: "Handler code editor",
    onChange: (code) => {
      clearTimeout(editor._t);
      editor._t = setTimeout(() => updateLab(id, { code }), 400);
      ctx.setStuck({ activity: config.title, code });
    },
  });

  async function send(req) {
    builder.send.disabled = true;
    stopBtn.hidden = false;
    output.clear();
    let body = null;
    try {
      body = req.bodyText.trim() ? JSON.parse(req.bodyText) : null;
    } catch {
      builder.send.disabled = false;
      stopBtn.hidden = true;
      renderResponse(response, { status: 400, body: { error: "Body isn't valid JSON" } });
      return;
    }
    const payload = JSON.stringify(JSON.stringify({ method: req.method, path: req.path, body }));
    const driver = `import json as _json
_req = _json.loads(${payload})
_r = handle(_req["method"], _req["path"], _req["body"])
if not (isinstance(_r, tuple) and len(_r) == 2):
    raise TypeError("handle() should return two things: a status code and the data. For example: return 200, customers")
_ccs_out = {"status": _r[0], "body": _r[1]}
`;
    const result = await runPython({ code: editor.getValue(), driver, onStdout: (t) => output.write(t) });
    builder.send.disabled = false;
    stopBtn.hidden = true;
    output.showResult(result);
    if (result.ok && result.out) {
      const out = JSON.parse(result.out);
      renderResponse(response, { status: Number(out.status) || 500, headers: { "content-type": "application/json" }, body: out.body });
    } else {
      renderResponse(response, { status: 500, body: { error: "Your handler crashed. See the error above." } });
    }
    ctx.setStuck({ activity: config.title, code: editor.getValue(), error: result.error ? `${result.error.type}: ${result.error.message}` : null });
  }

  checkBtn.addEventListener("click", async () => {
    checkBtn.disabled = true;
    stopBtn.hidden = false;
    output.clear();
    const result = await runPython({ code: editor.getValue(), tests: config.tests, onStdout: (t) => output.write(t) });
    checkBtn.disabled = false;
    stopBtn.hidden = true;
    output.showResult(result);
    if (renderChecks(checks, result)) {
      success.hidden = false;
      success.replaceChildren(h("strong", {}, "All checks passed. "), config.success || "You just wrote the code a real API runs for every request.");
      updateLab(id, { passed: true, code: editor.getValue() });
      ctx.refresh();
    }
  });

  ctx.registerTask({ id, label: config.title || "Handler lab", kind: "lab", isDone: () => Boolean(getLab(id).passed) });
}
