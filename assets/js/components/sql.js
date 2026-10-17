// SQL playground over the sample card-transactions database (sql.js = SQLite
// compiled to WebAssembly, ~650 KB, loaded the first time it's needed).
//
// Config (```sql block, JSON):
// { "id": "...", "title": "...", "starter": "SELECT ...",
//   "challenges": [{ "id", "prompt", "solution", "ordered": false, "hint" }] }
import { h, announce, loadScript, vendorUrl } from "../core/dom.js";
import { renderMarkdown } from "../core/markdown.js";
import { createEditor } from "../core/editor.js";
import { contentUrl } from "../core/content.js";
import { getLab, updateLab, isChallengeDone, setChallengeDone } from "../core/storage.js";

let sqlPromise = null;
let schemaSql = null;
function loadSql() {
  if (!sqlPromise) {
    sqlPromise = (async () => {
      await loadScript(vendorUrl("sql-wasm.js"));
      const SQL = await window.initSqlJs({ locateFile: (file) => vendorUrl(file) });
      const res = await fetch(contentUrl("data/bank.sql"));
      if (!res.ok) throw new Error("Couldn't load the sample database");
      schemaSql = await res.text();
      return SQL;
    })();
    sqlPromise.catch(() => (sqlPromise = null));
  }
  return sqlPromise;
}

async function freshDb() {
  const SQL = await loadSql();
  const db = new SQL.Database();
  db.exec(schemaSql);
  return db;
}

const fmt = (v) => (v === null ? "NULL" : typeof v === "number" && !Number.isInteger(v) ? v.toFixed(2) : String(v));
const same = (a, b) => (typeof a === "number" && typeof b === "number" ? Math.abs(a - b) < 0.005 : String(a) === String(b));
const rowKey = (row) => row.map(fmt).join("\u0001");

function compare(got, want, ordered) {
  if (!got) return { ok: false, message: "Your query ran but didn't return a table. Did you start with SELECT?" };
  if (got.columns.length !== want.columns.length)
    return { ok: false, message: `Your result has ${got.columns.length} column${got.columns.length === 1 ? "" : "s"} (${got.columns.join(", ")}). We expected ${want.columns.length}: ${want.columns.join(", ")}.` };
  if (got.values.length !== want.values.length)
    return { ok: false, message: `Your query returned ${got.values.length} row${got.values.length === 1 ? "" : "s"}, we expected ${want.values.length}. Check your WHERE condition${want.values.length < got.values.length ? " (you have extra rows)" : " (some rows are missing)"}.` };
  const rowsEqual = (r1, r2) => r1.every((v, i) => same(v, r2[i]));
  if (ordered) {
    if (got.values.every((r, i) => rowsEqual(r, want.values[i]))) return { ok: true };
    const a = got.values.map(rowKey).sort().join("|");
    const b = want.values.map(rowKey).sort().join("|");
    if (a === b) return { ok: false, message: "All the right rows, but in a different order. Check your ORDER BY (and ASC or DESC)." };
    return { ok: false, message: "Right number of rows, but some values are different. Check which columns you chose and your conditions." };
  }
  const a = got.values.map(rowKey).sort();
  const b = want.values.map(rowKey).sort();
  if (a.every((k, i) => k === b[i])) return { ok: true };
  return { ok: false, message: "Right number of rows, but some values are different. Check which columns you chose (and their order) and your conditions." };
}

function resultTable(result) {
  if (!result) return h("p", { class: "muted" }, "Done. (That statement doesn't return rows.)");
  const table = h(
    "table",
    { class: "result-table" },
    h("thead", {}, h("tr", {}, ...result.columns.map((c) => h("th", { scope: "col" }, c)))),
    h("tbody", {}, ...result.values.slice(0, 200).map((row) => h("tr", {}, ...row.map((v) => h("td", {}, fmt(v)))))),
  );
  return h(
    "div",
    {},
    h("p", { class: "small muted" }, `${result.values.length} row${result.values.length === 1 ? "" : "s"}${result.values.length > 200 ? " (showing the first 200)" : ""}`),
    h("div", { class: "result-wrap", tabindex: "0", role: "region", "aria-label": "Query results" }, table),
  );
}

function schemaBrowser(db) {
  const tables = db.exec("SELECT name FROM sqlite_master WHERE type='table' ORDER BY rowid")[0].values.map((r) => r[0]);
  return h(
    "details",
    { class: "sql-schema" },
    h("summary", {}, "What's in the database? (tables and columns)"),
    h(
      "div",
      { class: "schema-tables" },
      ...tables.map((t) => {
        const cols = db.exec(`PRAGMA table_info(${t})`)[0].values.map((r) => `${r[1]} ${r[2].toLowerCase()}`);
        const count = db.exec(`SELECT COUNT(*) FROM ${t}`)[0].values[0][0];
        return h("div", { class: "schema-table" }, h("h4", {}, t), h("p", { class: "small muted" }, `${count} rows`), h("ul", {}, ...cols.map((c) => h("li", {}, c))));
      }),
    ),
  );
}

export async function mountSql(slot, config, ctx) {
  const id = config.id || `${ctx.lessonId}-sql`;
  const challenges = config.challenges || [];
  const status = h("p", { class: "py-status is-loading", role: "status", html: '<span class="spinner" aria-hidden="true"></span> Loading the sample database…' });
  const el = h(
    "section",
    { class: "card sql-card", "aria-labelledby": `${id}-title` },
    h("div", { class: "card-kicker" }, h("span", { class: "badge badge-teal" }, "SQL playground")),
    h("h3", { id: `${id}-title`, class: "card-title" }, config.title || "Try it on the bank database"),
    status,
  );
  slot.replaceWith(el);

  let db;
  try {
    db = await freshDb();
  } catch (err) {
    status.classList.remove("is-loading");
    status.textContent = `The database couldn't load (${err.message}). Check your connection and reload the page.`;
    return;
  }
  status.remove();

  const tabs = h("div", { class: "challenge-tabs", role: "group", "aria-label": "Challenges" });
  const prompt = h("div", { class: "goal-box prose" });
  const editorHost = h("div", { class: "editor-host" });
  const runBtn = h("button", { class: "btn btn-primary", type: "button" }, "▶ Run query");
  const checkBtn = h("button", { class: "btn btn-accent", type: "button", hidden: !challenges.length }, "✓ Check my answer");
  const hintBtn = h("button", { class: "btn btn-ghost btn-small", type: "button" }, "Hint");
  const solutionBtn = h("button", { class: "btn btn-ghost btn-small", type: "button" }, "Show a solution");
  const resetDbBtn = h("button", { class: "btn btn-ghost btn-small", type: "button" }, "↺ Reset database");
  const feedback = h("div", { class: "feedback", "aria-live": "polite" });
  const results = h("div", { class: "sql-results" });

  el.append(
    schemaBrowser(db),
    challenges.length > 1 ? tabs : null,
    challenges.length ? prompt : null,
    editorHost,
    h("div", { class: "toolbar" }, runBtn, checkBtn),
    feedback,
    results,
    h("div", { class: "toolbar" }, challenges.length ? hintBtn : null, challenges.length ? solutionBtn : null, resetDbBtn),
  );

  let current = 0;
  const codeKey = (i) => `${id}-${challenges[i]?.id || "free"}`;
  const editor = await createEditor(editorHost, {
    doc: getLab(codeKey(0)).code ?? config.starter ?? challenges[0]?.starter ?? "SELECT * FROM customers;",
    language: "sql",
    label: "SQL editor",
    minLines: 3,
    onChange: (code) => {
      clearTimeout(editor._t);
      editor._t = setTimeout(() => updateLab(codeKey(current), { code }), 400);
      ctx.setStuck({ activity: challenges[current]?.prompt || config.title, code, language: "sql" });
    },
  });

  function runQuery(sql) {
    const out = db.exec(sql);
    return out[out.length - 1] || null;
  }

  function showChallenge(i) {
    current = i;
    const c = challenges[i];
    if (!c) return;
    [...tabs.children].forEach((t, j) => {
      t.setAttribute("aria-pressed", String(j === i));
      t.classList.toggle("is-done", isChallengeDone(`${id}/${challenges[j].id}`));
    });
    prompt.innerHTML = `<p><strong>Challenge ${i + 1} of ${challenges.length}:</strong></p>${renderMarkdown(c.prompt)}`;
    editor.setValue(getLab(codeKey(i)).code ?? c.starter ?? config.starter ?? "SELECT ");
    feedback.className = "feedback";
    feedback.replaceChildren();
    results.replaceChildren();
  }
  challenges.forEach((c, i) => {
    const t = h("button", { type: "button", class: "challenge-tab", "aria-pressed": "false" }, `${i + 1}`);
    t.setAttribute("aria-label", `Challenge ${i + 1}`);
    t.addEventListener("click", () => showChallenge(i));
    tabs.append(t);
  });

  function execute(check) {
    const sql = editor.getValue();
    feedback.className = "feedback";
    feedback.replaceChildren();
    let result;
    try {
      result = runQuery(sql);
    } catch (err) {
      const msg = String(err.message || err);
      let explain = "SQLite couldn't run that. Check spelling, commas between column names and quote marks around text values.";
      if (/no such column/.test(msg)) explain = "That column name doesn't exist in this table. Open 'What's in the database?' above to check the spelling. Text values need 'single quotes'.";
      if (/no such table/.test(msg)) explain = "That table doesn't exist. The tables are customers, cards, transactions and disputes.";
      if (/syntax error/.test(msg)) explain = "Something's out of order or missing. A common one: a comma after the last column name, or a missing comma between two.";
      if (/ambiguous column/.test(msg)) explain = "Two tables have a column with this name. Say which one you mean, e.g. customers.id.";
      results.replaceChildren(h("div", { class: "error-box" }, h("p", { class: "error-title" }, "Query error"), h("p", {}, explain), h("p", { class: "error-raw" }, `SQLite said: ${msg}`)));
      ctx.setStuck({ activity: challenges[current]?.prompt || config.title, code: sql, error: msg, language: "sql" });
      return;
    }
    results.replaceChildren(resultTable(result));
    ctx.setStuck({ activity: challenges[current]?.prompt || config.title, code: sql, error: null, language: "sql" });
    if (!check) return;
    const c = challenges[current];
    const expected = runQuery(c.solution);
    const verdict = compare(result, expected, c.ordered);
    feedback.className = `feedback ${verdict.ok ? "is-right" : "is-wrong"}`;
    if (verdict.ok) {
      setChallengeDone(`${id}/${c.id}`);
      tabs.children[current]?.classList.add("is-done");
      const next = challenges.findIndex((_, j) => !isChallengeDone(`${id}/${challenges[j].id}`));
      const nextBtn = next >= 0 ? h("button", { class: "btn btn-primary btn-small", type: "button", onclick: () => showChallenge(next) }, "Next challenge →") : null;
      feedback.replaceChildren(h("p", { class: "feedback-title" }, "✓ Spot on. That's exactly the right data."), c.explain ? h("div", { class: "prose", html: renderMarkdown(c.explain) }) : null, nextBtn);
      announce("Correct query");
      ctx.refresh();
    } else {
      feedback.replaceChildren(h("p", { class: "feedback-title" }, "Not quite yet"), h("p", {}, verdict.message));
    }
  }

  runBtn.addEventListener("click", () => execute(false));
  checkBtn.addEventListener("click", () => execute(true));
  editorHost.addEventListener("keydown", (e) => {
    if ((e.ctrlKey || e.metaKey) && e.key === "Enter") {
      e.preventDefault();
      execute(false);
    }
  });
  hintBtn.addEventListener("click", () => {
    const c = challenges[current];
    feedback.className = "feedback";
    feedback.replaceChildren(h("div", { class: "callout callout-tip" }, h("p", { class: "callout-label" }, "Hint"), h("div", { class: "prose", html: renderMarkdown(c.hint || "Start with SELECT, then the columns, then FROM and the table.") })));
  });
  solutionBtn.addEventListener("click", () => {
    const c = challenges[current];
    const use = h("button", { class: "btn btn-ghost btn-small", type: "button" }, "Put this in the editor");
    use.addEventListener("click", () => editor.setValue(c.solution));
    feedback.className = "feedback";
    feedback.replaceChildren(h("p", {}, "One way to write it (there are often several):"), h("pre", { class: "code-block" }, h("code", {}, c.solution)), use);
  });
  resetDbBtn.addEventListener("click", async () => {
    db.close();
    db = await freshDb();
    feedback.className = "feedback";
    feedback.replaceChildren(h("p", {}, "The database is back to how it started."));
  });

  if (challenges.length) {
    showChallenge(Math.max(0, challenges.findIndex((c) => !isChallengeDone(`${id}/${c.id}`))));
    ctx.registerTask({
      id,
      label: `${config.title || "SQL challenges"} (${challenges.length})`,
      kind: "sql",
      isDone: () => challenges.every((c) => isChallengeDone(`${id}/${c.id}`)),
    });
  }
}
