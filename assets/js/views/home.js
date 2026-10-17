import { h } from "../core/dom.js";
import { loadCourse } from "../core/content.js";
import { illustration } from "../core/illustrations.js";
import { getState, isLessonDone, streakInfo, reviewItems } from "../core/storage.js";

function nextLesson(course) {
  const state = getState();
  const last = state.lastLesson && course.byId[state.lastLesson];
  if (last && !isLessonDone(last.id)) return { lesson: last, resume: true };
  const firstOpen = course.lessons.find((l) => !isLessonDone(l.id));
  return { lesson: firstOpen || course.lessons[course.lessons.length - 1], resume: false };
}

function gentleMessage(streak) {
  if (streak.studiedToday) return "You've already learned something today. Anything more is a bonus.";
  if (streak.total === 0) return "Welcome! Each lesson takes 10 to 15 minutes, and you can stop halfway and pick it up later.";
  if (streak.current > 0) return "Ready when you are. Even one small lesson counts.";
  return "Welcome back. Everything is saved exactly where you left it.";
}

function streakCard() {
  const s = streakInfo();
  return h(
    "section",
    { class: "card streak-card", "aria-labelledby": "streak-title" },
    h("h2", { id: "streak-title", class: "h4" }, "Your rhythm"),
    h(
      "div",
      { class: "streak-stats" },
      h("div", { class: "stat" }, h("span", { class: "stat-num" }, String(s.thisWeek)), h("span", { class: "stat-label" }, s.thisWeek === 1 ? "day this week" : "days this week")),
      h("div", { class: "stat" }, h("span", { class: "stat-num" }, String(s.total)), h("span", { class: "stat-label" }, s.total === 1 ? "study day in total" : "study days in total")),
      s.current > 1 ? h("div", { class: "stat" }, h("span", { class: "stat-num" }, String(s.current)), h("span", { class: "stat-label" }, "days in a row")) : null,
    ),
    h("p", { class: "muted" }, gentleMessage(s)),
  );
}

export function lessonStops(course, lessons) {
  return h(
    "ol",
    { class: "lesson-stops" },
    ...lessons.map((l) => {
      const done = isLessonDone(l.id);
      const n = course.lessons.findIndex((x) => x.id === l.id) + 1;
      return h(
        "li",
        { class: `lesson-stop${done ? " is-done" : ""}${l.status === "planned" ? " is-planned" : ""}` },
        h(
          "a",
          { href: `#/lesson/${l.id}` },
          h("span", { class: "stop-dot", "aria-hidden": "true" }, done ? "✓" : String(n)),
          h("span", { class: "stop-text" }, h("span", { class: "stop-title" }, l.title), h("span", { class: "stop-meta" }, `${l.minutes || 15} min${l.status === "planned" ? " · outline" : ""}`)),
          h("span", { class: "sr-only" }, done ? " (complete)" : ""),
        ),
      );
    }),
  );
}

export async function renderHome(main) {
  const course = await loadCourse();
  const { lesson, resume } = nextLesson(course);
  const due = reviewItems().length;
  const doneCount = course.lessons.filter((l) => isLessonDone(l.id)).length;
  const current = lesson?.phaseId;

  const road = h(
    "ol",
    { class: "road", "aria-label": "Your route from Support to Developer" },
    h("li", { class: "road-end road-start" }, h("div", { class: "road-ill", html: illustration("support") }), h("div", {}, h("h3", {}, "Support"), h("p", { class: "muted" }, "Where you are now: you already know cards, payments, disputes and what customers need."))),
    ...course.phases.map((phase, i) => {
      const lessons = phase.units.flatMap((u) => u.lessons);
      const done = lessons.filter((l) => isLessonDone(l.id)).length;
      const details = h(
        "details",
        { class: "phase-details", open: phase.id === current || undefined },
        h("summary", {}, `${done} of ${lessons.length} lessons`, h("span", { class: "sr-only" }, ` in ${phase.title}. Show lessons`)),
        ...phase.units.map((u) => h("div", { class: "unit" }, h("h4", { class: "unit-title" }, u.title), lessonStops(course, u.lessons))),
      );
      return h(
        "li",
        { class: `road-phase${done === lessons.length && lessons.length ? " is-complete" : ""}` },
        h("div", { class: "road-ill", html: illustration(phase.illustration) }),
        h(
          "div",
          { class: "road-phase-body" },
          h("p", { class: "phase-kicker" }, `Stop ${i + 1} · ${phase.months}`),
          h("h3", {}, h("a", { href: `#/phase/${phase.id}` }, phase.title)),
          h("p", {}, phase.summary),
          h("div", { class: "progress-bar", role: "progressbar", "aria-label": `${phase.title} progress`, "aria-valuemin": "0", "aria-valuemax": String(lessons.length), "aria-valuenow": String(done) }, h("span", { style: `width:${lessons.length ? (done / lessons.length) * 100 : 0}%` })),
          details,
        ),
      );
    }),
    h("li", { class: "road-end road-finish" }, h("div", { class: "road-ill", html: illustration("developer") }), h("div", {}, h("h3", {}, "Developer"), h("p", { class: "muted" }, "A junior backend developer with a card payments API on GitHub to show for it."))),
  );

  main.replaceChildren(
    h(
      "div",
      { class: "page home" },
      h(
        "section",
        { class: "hero", "aria-labelledby": "hero-title" },
        h(
          "div",
          { class: "hero-text" },
          h("p", { class: "eyebrow" }, "Career Code School"),
          h("h1", { id: "hero-title", tabindex: "-1" }, "From card support to backend developer"),
          h("p", { class: "lead" }, "You already understand payments better than most new developers. This course turns that into code: one short lesson at a time, on your phone or laptop, free."),
          lesson
            ? h(
                "div",
                { class: "toolbar" },
                h("a", { class: "btn btn-primary btn-large", href: `#/lesson/${lesson.id}` }, resume ? "Continue: " : doneCount ? "Next: " : "Start: ", lesson.title),
                due ? h("a", { class: "btn btn-accent", href: "#/review" }, `Review ${due} question${due === 1 ? "" : "s"}`) : null,
              )
            : null,
          h("p", { class: "muted small" }, `${doneCount} of ${course.lessons.length} lessons done. Progress is saved on this device. Use Progress to move it to another.`),
        ),
        h("div", { class: "hero-ill", html: illustration("phase1") }),
      ),
      streakCard(),
      h("h2", { class: "section-title" }, "Your route"),
      road,
    ),
  );
}

export async function renderPhase(main, phaseId) {
  const course = await loadCourse();
  const phase = course.phases.find((p) => p.id === phaseId);
  if (!phase) return renderHome(main);
  main.replaceChildren(
    h(
      "div",
      { class: "page" },
      h("nav", { class: "breadcrumbs", "aria-label": "Breadcrumb" }, h("a", { href: "#/" }, "Map"), h("span", { "aria-hidden": "true" }, " › "), h("span", {}, phase.title)),
      h(
        "section",
        { class: "hero hero-phase" },
        h("div", { class: "hero-text" }, h("p", { class: "eyebrow" }, phase.months), h("h1", { tabindex: "-1" }, phase.title), h("p", { class: "lead" }, phase.summary), phase.project ? h("p", {}, h("strong", {}, "You'll build: "), phase.project) : null),
        h("div", { class: "hero-ill", html: illustration(phase.illustration) }),
      ),
      ...phase.units.map((u) => h("section", { class: "unit" }, h("h2", { class: "section-title" }, u.title), u.summary ? h("p", { class: "muted" }, u.summary) : null, lessonStops(course, u.lessons))),
    ),
  );
}
