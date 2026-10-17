// Idempotency lab. A customer taps Pay; the network is slow, so the phone
// sends the same request twice with the same Idempotency-Key. The learner's
// Python decides whether that becomes one charge or two.
import { h, announce, wait } from "../core/dom.js";
import { renderMarkdown } from "../core/markdown.js";
import { createEditor } from "../core/editor.js";
import { runPython, stopPython } from "../core/python.js";
import { getLab, updateLab, setChallengeDone } from "../core/storage.js";
import { pythonStatus } from "../components/python-status.js";
import { outputPanel, renderChecks } from "../components/run-output.js";
import { hintLadder } from "../components/hints.js";
import { simBadge } from "./api-sim.js";

const AMOUNT = 25;
const START_BALANCE = 100;
const pounds = (n) => `£${Number(n).toFixed(2)}`;

export async function mountIdempotency(slot, config, ctx) {
  const id = config.id || `${ctx.lessonId}-idem`;
  const saved = getLab(id);
  const starter = (config.starter || "") + "\n";
  let taps = []; // one idempotency key per order the customer places
  let editor;

  const editorHost = h("div", { class: "editor-host" });
  const output = outputPanel();
  const checks = h("ul", { class: "checks" });
  const success = h("div", { class: "success-banner", hidden: true, role: "status" });
  const payBtn = h("button", { class: "btn btn-accent btn-large", type: "button" }, `Pay ${pounds(AMOUNT)}`);
  const resetBtn = h("button", { class: "btn btn-ghost btn-small", type: "button" }, "↺ Clear the statement");
  const checkBtn = h("button", { class: "btn btn-primary", type: "button" }, "✓ Check my fix");
  const stopBtn = h("button", { class: "btn btn-danger", type: "button", hidden: true, onclick: () => stopPython() }, "■ Stop");
  const requestLog = h("ol", { class: "request-log", "aria-label": "Requests the server received" });
  const ledgerBody = h("tbody");
  const balance = h("p", { class: "h4", "aria-live": "polite" }, `Balance: ${pounds(START_BALANCE)}`);
  const verdict = h("div", { class: "feedback", "aria-live": "polite" });

  const el = h(
    "section",
    { class: "card idem-card", "aria-labelledby": `${id}-title` },
    h("div", { class: "card-kicker" }, h("span", { class: "badge badge-teal" }, "Idempotency lab"), simBadge(": the network and phone are pretend, your Python is real")),
    h("h3", { id: `${id}-title`, class: "card-title" }, config.title || "Stop the double charge"),
    config.task ? h("div", { class: "prose", html: renderMarkdown(config.task) }) : null,
    h(
      "div",
      { class: "pay-stage" },
      h("div", { class: "phone" }, h("p", { class: "small muted" }, "Coffee & cake"), h("p", { class: "phone-amount" }, pounds(AMOUNT)), payBtn, h("p", { class: "small muted" }, "Slow signal: the phone retries if it doesn't hear back.")),
      h(
        "div",
        {},
        balance,
        h("p", { class: "small muted" }, "What the server received:"),
        requestLog,
        h("table", { class: "ledger" }, h("caption", { class: "sr-only" }, "Ledger: every charge the bank recorded"), h("thead", {}, h("tr", {}, h("th", { scope: "col" }, "Charge #"), h("th", { scope: "col" }, "Amount"), h("th", { scope: "col" }, "Note"))), ledgerBody),
        verdict,
        h("div", { class: "toolbar" }, resetBtn),
      ),
    ),
    h("h4", {}, "The server code (yours to fix)"),
    editorHost,
    h("div", { class: "toolbar" }, checkBtn, stopBtn),
    pythonStatus(),
    output.el,
    checks,
    success,
    hintLadder({ id, hints: config.hints, solution: config.solution, onUseSolution: (code) => editor.setValue(code + "\n") }),
  );
  slot.replaceWith(el);

  editor = await createEditor(editorHost, {
    doc: saved.code ?? starter,
    label: "Payment server code",
    onChange: (code) => {
      clearTimeout(editor._t);
      editor._t = setTimeout(() => updateLab(id, { code }), 400);
      ctx.setStuck({ activity: config.title, code });
    },
  });

  async function replay(animate) {
    const keys = JSON.stringify(JSON.stringify(taps));
    const driver = `import json as _json
_calls = []
for _key in _json.loads(${keys}):
    _first = take_payment(_key, ${AMOUNT}.0)
    _second = take_payment(_key, ${AMOUNT}.0)   # the phone's automatic retry
    _calls.append({"key": _key, "first": _first, "second": _second})
_ccs_out = {"ledger": ledger, "calls": _calls}
`;
    stopBtn.hidden = false;
    output.clear();
    const result = await runPython({ code: editor.getValue(), driver, onStdout: (t) => output.write(t) });
    stopBtn.hidden = true;
    output.showResult(result);
    if (!result.ok || !result.out) {
      verdict.className = "feedback is-wrong";
      verdict.replaceChildren(h("p", {}, "The server code crashed, so the payment failed. See the error under the editor."));
      return;
    }
    const { ledger, calls } = JSON.parse(result.out);
    // Request log, with a little animation for the latest tap.
    requestLog.replaceChildren();
    for (const [i, call] of calls.entries()) {
      const latest = i === calls.length - 1;
      const id1 = call.first?.id;
      const id2 = call.second?.id;
      requestLog.append(h("li", {}, `POST /payments  Idempotency-Key: ${call.key}  → charge #${id1 ?? "?"}`));
      if (latest && animate) await wait(500);
      requestLog.append(h("li", {}, `POST /payments  Idempotency-Key: ${call.key}  (retry)  → `, id2 === id1 ? "same charge returned ✓" : h("strong", {}, `NEW charge #${id2 ?? "?"} ✗`)));
    }
    const dupIds = new Set(calls.filter((c) => c.second?.id !== c.first?.id).map((c) => c.second?.id));
    ledgerBody.replaceChildren(
      ...ledger.map((row, i) =>
        h(
          "tr",
          { class: `${dupIds.has(row.id) ? "is-dup" : ""} ${i >= ledger.length - 2 && animate ? "is-new" : ""}` },
          h("td", {}, String(row.id)),
          h("td", {}, pounds(row.amount)),
          h("td", {}, dupIds.has(row.id) ? "Duplicate! The customer paid twice" : "Order paid"),
        ),
      ),
    );
    const spent = ledger.reduce((sum, r) => sum + Number(r.amount || 0), 0);
    balance.textContent = `Balance: ${pounds(START_BALANCE - spent)}  (${taps.length} order${taps.length === 1 ? "" : "s"}, ${ledger.length} charge${ledger.length === 1 ? "" : "s"})`;
    if (ledger.length > taps.length) {
      verdict.className = "feedback is-wrong";
      verdict.replaceChildren(
        h("p", { class: "feedback-title" }, `Double charge: ${taps.length} order${taps.length === 1 ? "" : "s"}, ${ledger.length} charges.`),
        h("p", {}, "This is the ticket that lands in the complaints queue: \"I only paid once but I've been charged twice!\" Fix the server code so a retry with the same key returns the saved payment."),
      );
      announce("Double charge happened");
    } else if (taps.length) {
      verdict.className = "feedback is-right";
      verdict.replaceChildren(h("p", { class: "feedback-title" }, "One order, one charge. The retry was safely ignored."), h("p", {}, "Tap Pay again: a new order gets a new key, so it is charged, exactly once."));
      announce("No double charge");
      if (taps.length >= 2) {
        setChallengeDone(`${id}/demo`);
        ctx.refresh();
      }
    }
  }

  payBtn.addEventListener("click", async () => {
    payBtn.disabled = true;
    taps.push(`order-${Math.random().toString(16).slice(2, 6)}`);
    await replay(true);
    payBtn.disabled = false;
  });
  resetBtn.addEventListener("click", () => {
    taps = [];
    requestLog.replaceChildren();
    ledgerBody.replaceChildren();
    verdict.replaceChildren();
    verdict.className = "feedback";
    balance.textContent = `Balance: ${pounds(START_BALANCE)}`;
  });
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
      success.replaceChildren(h("strong", {}, "Fixed. "), config.success || "Retries are now harmless. This is exactly how Stripe, Adyen and most payment APIs protect customers.");
      updateLab(id, { passed: true, code: editor.getValue() });
      ctx.refresh();
    }
  });

  ctx.registerTask({ id, label: config.title || "Idempotency lab", kind: "lab", isDone: () => Boolean(getLab(id).passed) });
}
