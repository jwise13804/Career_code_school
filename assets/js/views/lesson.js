import { h, copyText, announce } from "../core/dom.js";
import { loadCourse, loadLesson, extractWidgets, fetchPage } from "../core/content.js";
import { renderMarkdown } from "../core/markdown.js";
import { isLessonDone, setLessonDone, setLastLesson } from "../core/storage.js";
import { mountWidget } from "../components/index.js";

function buildStuckPrompt(lesson, stuck) {
  const lines = [
    "I'm teaching myself backend development. I'm a complete beginner coming from customer support at a card payments company.",
    "",
    `I'm on the lesson "${lesson.title}" (${lesson.phaseTitle}, ${lesson.unitTitle}).`,
  ];
  if (stuck.activity) lines.push(`The activity is: "${stuck.activity}".`);
  if (stuck.code) lines.push("", "Here is my code:", "```" + (stuck.language || "python"), stuck.code.trim(), "```");
  if (stuck.error) lines.push("", "This is the error or result I got:", "```", stuck.error, "```");
  else lines.push("", "I'm not getting an error, I'm just not sure what to do next.");
  lines.push(
    "",
    "Please don't give me the full answer straight away. Explain what's going on in plain English (card payment comparisons help me), give me one hint for the next step, then ask me a question to check I understand.",
  );
  return lines.join("\n");
}

function stuckDialog(prompt) {
  const area = h("textarea", { class: "text-input stuck-text", rows: "10", readonly: true, "aria-label": "Prompt to paste into Claude" });
  area.value = prompt;
  const close = h("button", { class: "btn btn-ghost", type: "button" }, "Close");
  const dialog = h(
    "dialog",
    { class: "dialog", "aria-labelledby": "stuck-title" },
    h("h2", { id: "stuck-title" }, "Copied. Paste it into Claude"),
    h("p", {}, "This prompt includes your lesson, your latest code and any error. It asks Claude to coach you rather than hand over the answer. If the copy didn't work, select the text below."),
    area,
    h(
      "div",
      { class: "toolbar" },
      h("a", { class: "btn btn-primary", href: "https://claude.ai/new", target: "_blank", rel: "noopener noreferrer" }, "Open Claude ↗"),
      close,
    ),
  );
  close.addEventListener("click", () => dialog.close());
  dialog.addEventListener("close", () => dialog.remove());
  document.body.append(dialog);
  dialog.showModal();
}

export async function renderLesson(main, id) {
  const course = await loadCourse();
  const info = course.byId[id];
  if (!info) {
    main.replaceChildren(h("div", { class: "page narrow" }, h("h1", {}, "We couldn't find that lesson"), h("p", {}, h("a", { href: "#/" }, "Back to your map"))));
    return;
  }
  const lesson = await loadLesson(id);
  const meta = { ...info, ...lesson.meta };
  setLastLesson(id);

  const index = course.lessons.findIndex((l) => l.id === id);
  const prev = course.lessons[index - 1];
  const next = course.lessons[index + 1];

  const tasks = [];
  const checklist = h("ul", { class: "task-list" });
  let stuck = { activity: null, code: null, error: null };
  const ctx = {
    lessonId: id,
    lesson: meta,
    registerTask(task) {
      tasks.push(task);
      ctx.refresh();
    },
    setStuck(info) {
      stuck = { ...stuck, ...info };
    },
    refresh() {
      checklist.replaceChildren(
        ...tasks.map((t) => h("li", { class: t.isDone() ? "done" : "" }, h("span", { "aria-hidden": "true" }, t.isDone() ? "✓ " : "○ "), t.label, h("span", { class: "sr-only" }, t.isDone() ? " (done)" : " (not done yet)"))),
      );
      checklistBox.hidden = tasks.length === 0;
    },
  };

  const { markdown, widgets } = extractWidgets(lesson.body, id);
  const body = h("div", { class: "prose lesson-body", html: renderMarkdown(markdown) });
  const checklistBox = h("div", { class: "lesson-tasks", hidden: true }, h("h2", { class: "h4" }, "In this lesson"), checklist);

  const doneBtn = h("button", { class: "btn btn-primary btn-large", type: "button" });
  const updateDone = () => {
    const done = isLessonDone(id);
    doneBtn.textContent = done ? "✓ Lesson complete" : "Mark this lesson complete";
    doneBtn.setAttribute("aria-pressed", String(done));
    doneBtn.classList.toggle("is-done", done);
  };
  doneBtn.addEventListener("click", () => {
    const done = !isLessonDone(id);
    setLessonDone(id, done);
    updateDone();
    announce(done ? "Lesson marked complete. Nice work." : "Lesson marked not complete.");
  });
  updateDone();

  const stuckBtn = h("button", { class: "btn btn-stuck", type: "button" }, h("span", { "aria-hidden": "true" }, "🤝 "), "Stuck? Ask Claude");
  stuckBtn.addEventListener("click", async () => {
    const prompt = buildStuckPrompt(meta, stuck);
    await copyText(prompt);
    stuckDialog(prompt);
  });

  const planned = meta.status === "planned";
  const page = h(
    "article",
    { class: "page lesson", "aria-labelledby": "lesson-title" },
    h(
      "nav",
      { class: "breadcrumbs", "aria-label": "Breadcrumb" },
      h("a", { href: "#/" }, "Map"),
      h("span", { "aria-hidden": "true" }, " › "),
      h("a", { href: `#/phase/${meta.phaseId}` }, meta.phaseTitle),
      h("span", { "aria-hidden": "true" }, " › "),
      h("span", {}, meta.unitTitle),
    ),
    h(
      "header",
      { class: "lesson-header" },
      h("p", { class: "lesson-kicker" }, `Lesson ${index + 1}`, meta.minutes ? ` · about ${meta.minutes} minutes` : "", planned ? " · outline" : ""),
      h("h1", { id: "lesson-title", tabindex: "-1" }, meta.title),
      meta.summary ? h("p", { class: "lead" }, meta.summary) : null,
      Array.isArray(meta.goals) && meta.goals.length
        ? h("div", { class: "goals" }, h("h2", { class: "h4" }, "By the end you'll be able to"), h("ul", {}, ...meta.goals.map((g) => h("li", {}, g))))
        : null,
      planned
        ? h("p", { class: "callout callout-note" }, "This lesson is an outline for now: it tells you what to learn and links to the best free material. Full interactive content is on the way.")
        : null,
    ),
    body,
    checklistBox,
    h(
      "footer",
      { class: "lesson-footer" },
      h("div", { class: "toolbar toolbar-center" }, doneBtn, stuckBtn),
      h(
        "nav",
        { class: "lesson-nav", "aria-label": "Lesson navigation" },
        prev ? h("a", { class: "btn btn-ghost", href: `#/lesson/${prev.id}`, rel: "prev" }, `← ${prev.title}`) : h("span"),
        next ? h("a", { class: "btn btn-ghost", href: `#/lesson/${next.id}`, rel: "next" }, `${next.title} →`) : h("a", { class: "btn btn-ghost", href: "#/" }, "Back to the map"),
      ),
    ),
  );
  main.replaceChildren(page);

  // Mount interactive blocks in order. Each one is independent: one failing
  // (for example no internet for Python) doesn't stop the rest.
  await Promise.all(
    widgets.map((widget) => {
      const slot = body.querySelector(`[data-slot="${widget.index}"]`);
      return slot ? mountWidget(slot, widget, ctx) : null;
    }),
  );
  ctx.refresh();
}

/** A content page outside the course order (e.g. content/pages/practice.md). */
export async function renderPage(main, name) {
  const { meta, body: md } = await fetchPage(name);
  const { markdown, widgets } = extractWidgets(md, `page-${name}`);
  const body = h("div", { class: "prose lesson-body", html: renderMarkdown(markdown) });
  main.replaceChildren(
    h(
      "article",
      { class: "page lesson" },
      h("header", { class: "lesson-header" }, h("h1", { tabindex: "-1" }, meta.title || name), meta.summary ? h("p", { class: "lead" }, meta.summary) : null),
      body,
    ),
  );
  const ctx = { lessonId: `page-${name}`, lesson: meta, registerTask() {}, setStuck() {}, refresh() {} };
  await Promise.all(widgets.map((w) => mountWidget(body.querySelector(`[data-slot="${w.index}"]`), w, ctx)));
}
