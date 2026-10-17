// Loads and parses everything in content/. No lesson text lives in code.
//
// Lesson files are Markdown with front matter:
//
//   ---
//   title: Your first line of Python
//   minutes: 12
//   goals:
//     - Run code in the browser
//   ---
//   Markdown here. Interactive pieces are fenced blocks, e.g. ```lab ... ```
//
// See README.md ("Adding a lesson") for every block type.

const cache = new Map();

export function contentUrl(path) {
  // Relative to the page, so the site works at / and at /repo-name/.
  return new URL(`content/${path}`, document.baseURI).href;
}

async function fetchText(path) {
  if (cache.has(path)) return cache.get(path);
  const promise = fetch(contentUrl(path)).then((res) => {
    if (!res.ok) throw new Error(`Couldn't load ${path} (${res.status})`);
    return res.text();
  });
  cache.set(path, promise);
  promise.catch(() => cache.delete(path));
  return promise;
}

export async function fetchJSON(path) {
  const text = await fetchText(path);
  try {
    return JSON.parse(text);
  } catch (err) {
    throw new Error(`${path} has a JSON mistake: ${err.message}`);
  }
}

// ---------- course structure ----------
let coursePromise = null;

export function loadCourse() {
  if (!coursePromise) {
    coursePromise = fetchJSON("course.json").then((course) => {
      const lessons = [];
      course.phases.forEach((phase, pi) => {
        phase.units.forEach((unit) => {
          unit.lessons.forEach((lesson) => {
            lessons.push({ ...lesson, phaseId: phase.id, phaseTitle: phase.title, phaseIndex: pi, unitTitle: unit.title });
          });
        });
      });
      course.lessons = lessons;
      course.byId = Object.fromEntries(lessons.map((l) => [l.id, l]));
      return course;
    });
    coursePromise.catch(() => (coursePromise = null));
  }
  return coursePromise;
}

// ---------- front matter (a small, forgiving YAML subset) ----------
function parseScalar(raw) {
  const v = raw.trim();
  if (v === "") return "";
  if (v === "true") return true;
  if (v === "false") return false;
  if (/^-?\d+(\.\d+)?$/.test(v)) return Number(v);
  if (v.startsWith("[") && v.endsWith("]")) {
    return v
      .slice(1, -1)
      .split(",")
      .map((s) => parseScalar(s))
      .filter((s) => s !== "");
  }
  if ((v.startsWith('"') && v.endsWith('"')) || (v.startsWith("'") && v.endsWith("'"))) return v.slice(1, -1);
  return v;
}

export function parseFrontMatter(text) {
  const normalised = text.replace(/\r\n/g, "\n");
  if (!normalised.startsWith("---\n")) return { meta: {}, body: normalised };
  const end = normalised.indexOf("\n---", 4);
  if (end === -1) return { meta: {}, body: normalised };
  const head = normalised.slice(4, end);
  const body = normalised.slice(normalised.indexOf("\n", end + 1) + 1);
  const meta = {};
  let listKey = null;
  for (const line of head.split("\n")) {
    if (!line.trim() || line.trim().startsWith("#")) continue;
    const item = line.match(/^\s+-\s+(.*)$/);
    if (item && listKey) {
      meta[listKey].push(parseScalar(item[1]));
      continue;
    }
    const kv = line.match(/^([\w-]+):\s*(.*)$/);
    if (!kv) continue;
    const [, key, value] = kv;
    if (value.trim() === "") {
      meta[key] = [];
      listKey = key;
    } else {
      meta[key] = parseScalar(value);
      listKey = null;
    }
  }
  return { meta, body };
}

// ---------- section blocks (labs and code-based sims) ----------
// key: value lines, then "--- name" sections. Repeated sections (hint) become arrays.
const REPEATABLE = new Set(["hint"]);

export function parseSections(text) {
  const config = {};
  let current = null;
  let buffer = [];
  const flush = () => {
    if (!current) return;
    const value = buffer.join("\n").replace(/^\n+|\s+$/g, "");
    if (REPEATABLE.has(current)) (config[`${current}s`] = config[`${current}s`] || []).push(value);
    else config[current] = value;
  };
  for (const line of text.split("\n")) {
    const marker = line.match(/^---\s+([\w-]+)\s*$/);
    if (marker) {
      flush();
      current = marker[1];
      buffer = [];
      continue;
    }
    if (current) {
      buffer.push(line);
    } else {
      const kv = line.match(/^([\w-]+):\s*(.*)$/);
      if (kv) config[kv[1]] = parseScalar(kv[2]);
    }
  }
  flush();
  return config;
}

// ---------- lesson body ----------
// Fenced blocks whose language is one of these become interactive widgets.
export const WIDGETS = {
  lab: "sections",
  idempotency: "sections",
  ci: "sections",
  dispute: "sections",
  handler: "sections",
  sql: "json",
  api: "json",
  video: "json",
  quiz: "id",
  terminal: "id",
  download: "json",
  analogy: "markdown",
  tip: "markdown",
  note: "markdown",
  warning: "markdown",
  practice: "markdown",
};

/**
 * Splits lesson Markdown into plain Markdown plus a list of widget configs.
 * Each widget is replaced by an empty <div data-slot="n"> placeholder.
 */
export function extractWidgets(markdown, lessonId) {
  const lines = markdown.split("\n");
  const out = [];
  const widgets = [];
  for (let i = 0; i < lines.length; i++) {
    const open = lines[i].match(/^```([\w-]+)\s*(.*)$/);
    if (!open || !(open[1] in WIDGETS)) {
      out.push(lines[i]);
      continue;
    }
    const kind = open[1];
    const inner = [];
    i++;
    while (i < lines.length && !/^```\s*$/.test(lines[i])) {
      inner.push(lines[i]);
      i++;
    }
    const raw = inner.join("\n");
    const format = WIDGETS[kind];
    let config;
    try {
      if (format === "sections") config = parseSections(raw);
      else if (format === "json") config = JSON.parse(raw);
      else if (format === "id") config = { id: raw.trim() };
      else config = { markdown: raw, title: open[2] || "" };
    } catch (err) {
      config = { error: `This ${kind} block has a mistake: ${err.message}` };
    }
    const index = widgets.length;
    widgets.push({ kind, config, index, lessonId });
    out.push("", `<div class="widget-slot" data-slot="${index}"></div>`, "");
  }
  return { markdown: out.join("\n"), widgets };
}

export async function loadLesson(id) {
  const text = await fetchText(`lessons/${id}.md`);
  const { meta, body } = parseFrontMatter(text);
  return { id, meta, body };
}

// ---------- glossary ----------
let glossaryPromise = null;
export function loadGlossary() {
  if (!glossaryPromise) {
    glossaryPromise = fetchJSON("glossary.json").then((terms) => {
      const sorted = terms.slice().sort((a, b) => a.term.localeCompare(b.term));
      const bySlug = Object.fromEntries(sorted.map((t) => [t.slug, t]));
      return { terms: sorted, bySlug };
    });
    glossaryPromise.catch(() => (glossaryPromise = null));
  }
  return glossaryPromise;
}

export function loadQuiz(id) {
  return fetchJSON(`quizzes/${id}.json`);
}

export async function fetchPage(name) {
  return parseFrontMatter(await fetchText(`pages/${name}.md`));
}
