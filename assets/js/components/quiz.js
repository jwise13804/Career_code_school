// Quizzes: multiple choice, fill in the blank, drag to order, match, spot the bug.
// Questions live in content/quizzes/<id>.json. Missed questions go into the
// spaced-review pile automatically (core/storage.js).
import { h, announce } from "../core/dom.js";
import { renderInline, renderMarkdown } from "../core/markdown.js";
import { loadQuiz } from "../core/content.js";
import { recordAnswer, quizScore } from "../core/storage.js";

// Stable shuffle so the order doesn't jump around on re-render, but is never
// the already-correct order for ordering questions.
function shuffled(items, seedText) {
  let seed = [...seedText].reduce((a, c) => (a * 31 + c.charCodeAt(0)) >>> 0, 7);
  const rand = () => ((seed = (seed * 1664525 + 1013904223) >>> 0) / 2 ** 32);
  const copy = items.slice();
  for (let i = copy.length - 1; i > 0; i--) {
    const j = Math.floor(rand() * (i + 1));
    [copy[i], copy[j]] = [copy[j], copy[i]];
  }
  if (copy.length > 1 && copy.every((v, i) => v === items[i])) copy.push(copy.shift());
  return copy;
}

const normalise = (s, caseSensitive) => {
  const t = String(s).trim().replace(/\s+/g, " ");
  return caseSensitive ? t : t.toLowerCase();
};

/**
 * Render one question. Calls onAnswered(correct) once after the first check.
 * Returns {el, focus()}.
 */
export function renderQuestion(q, quizId, { onAnswered, fromReview = false, number, total } = {}) {
  const qid = `${quizId}-${q.id}`;
  const feedback = h("div", { class: "feedback", "aria-live": "polite" });
  const checkBtn = h("button", { class: "btn btn-primary", type: "button" }, "Check");
  let answered = false;
  let getAnswer; // returns {correct, detail}
  let lock = () => {};

  const body = h("div", { class: "question-body" });
  const legendId = `${qid}-prompt`;

  if (q.type === "mcq" || q.type === undefined) {
    const group = h("div", { class: "options", role: "radiogroup", "aria-labelledby": legendId });
    q.options.forEach((opt, i) => {
      const input = h("input", { type: "radio", name: qid, value: String(i), id: `${qid}-o${i}` });
      group.append(h("label", { class: "option", for: `${qid}-o${i}` }, input, h("span", { html: renderInline(opt) })));
    });
    body.append(group);
    getAnswer = () => {
      const picked = group.querySelector("input:checked");
      if (!picked) return null;
      const i = Number(picked.value);
      return { correct: i === q.answer, detail: q.why?.[i] };
    };
    lock = (correct) => {
      group.querySelectorAll("input").forEach((inp) => (inp.disabled = true));
      group.querySelectorAll(".option").forEach((label, i) => {
        if (i === q.answer) label.classList.add("is-right");
        else if (label.querySelector("input").checked && !correct) label.classList.add("is-wrong");
      });
    };
  } else if (q.type === "fill") {
    if (q.code) body.append(h("pre", { class: "code-block" }, h("code", {}, q.code)));
    const input = h("input", { type: "text", class: "text-input", id: `${qid}-input`, autocomplete: "off", autocapitalize: "off", spellcheck: "false", "aria-describedby": legendId });
    input.addEventListener("keydown", (e) => {
      if (e.key === "Enter") checkBtn.click();
    });
    body.append(h("label", { class: "sr-only", for: `${qid}-input` }, "Your answer"), input);
    const accepted = (Array.isArray(q.answer) ? q.answer : [q.answer]).map((a) => normalise(a, q.caseSensitive));
    getAnswer = () => {
      if (!input.value.trim()) return null;
      return { correct: accepted.includes(normalise(input.value, q.caseSensitive)) };
    };
    lock = (correct) => {
      input.readOnly = true;
      input.classList.add(correct ? "is-right" : "is-wrong");
    };
  } else if (q.type === "order") {
    const list = h("ol", { class: "order-list", "aria-labelledby": legendId });
    const render = (items) => {
      list.replaceChildren(
        ...items.map((text, i) => {
          const up = h("button", { class: "icon-btn", type: "button", "aria-label": `Move "${text}" up`, disabled: i === 0 }, "↑");
          const down = h("button", { class: "icon-btn", type: "button", "aria-label": `Move "${text}" down`, disabled: i === items.length - 1 }, "↓");
          const handle = h("span", { class: "drag-handle", "aria-hidden": "true", title: "Drag to reorder" }, "⠿");
          const li = h("li", { class: "order-item", dataset: { value: text } }, handle, h("span", { class: "order-text", html: renderInline(text) }), h("span", { class: "order-buttons" }, up, down));
          up.addEventListener("click", () => move(i, i - 1, `${text}`));
          down.addEventListener("click", () => move(i, i + 1, `${text}`));
          enableDrag(li, handle);
          return li;
        }),
      );
    };
    const current = () => [...list.children].map((li) => li.dataset.value);
    const move = (from, to, text) => {
      const items = current();
      const [it] = items.splice(from, 1);
      items.splice(to, 0, it);
      render(items);
      announce(`${text} moved to position ${to + 1} of ${items.length}`);
      // Keep focus on the moved item so keyboard users can keep pressing.
      const [upBtn, downBtn] = list.children[to].querySelectorAll("button");
      const preferred = to < from ? upBtn : downBtn;
      (preferred.disabled ? (preferred === upBtn ? downBtn : upBtn) : preferred).focus();
    };
    // Pointer drag (works with touch and mouse). Buttons remain for keyboard users.
    const enableDrag = (li, handle) => {
      handle.addEventListener("pointerdown", (e) => {
        if (answered) return;
        e.preventDefault();
        handle.setPointerCapture(e.pointerId);
        li.classList.add("is-dragging");
        const onMove = (ev) => {
          const siblings = [...list.children].filter((s) => s !== li);
          const after = siblings.find((s) => {
            const r = s.getBoundingClientRect();
            return ev.clientY < r.top + r.height / 2;
          });
          if (after) list.insertBefore(li, after);
          else list.append(li);
        };
        const onUp = () => {
          handle.removeEventListener("pointermove", onMove);
          handle.removeEventListener("pointerup", onUp);
          handle.removeEventListener("pointercancel", onUp);
          li.classList.remove("is-dragging");
          render(current());
        };
        handle.addEventListener("pointermove", onMove);
        handle.addEventListener("pointerup", onUp);
        handle.addEventListener("pointercancel", onUp);
      });
    };
    render(shuffled(q.items, qid));
    body.append(h("p", { class: "muted small" }, "Drag the ⠿ handle, or use the arrow buttons."), list);
    getAnswer = () => ({ correct: current().every((v, i) => v === q.items[i]) });
    lock = () => {
      list.querySelectorAll("button").forEach((b) => (b.disabled = true));
      [...list.children].forEach((li, i) => li.classList.add(li.dataset.value === q.items[i] ? "is-right" : "is-wrong"));
    };
  } else if (q.type === "match") {
    const meanings = shuffled(q.pairs.map((p) => p[1]), qid);
    const rows = q.pairs.map(([term], i) => {
      const select = h("select", { class: "select", id: `${qid}-m${i}` }, h("option", { value: "" }, "Choose a meaning…"), ...meanings.map((m) => h("option", { value: m }, m)));
      return { term, select, row: h("div", { class: "match-row" }, h("label", { for: `${qid}-m${i}`, class: "match-term", html: renderInline(term) }), select) };
    });
    body.append(h("div", { class: "match-grid", role: "group", "aria-labelledby": legendId }, ...rows.map((r) => r.row)));
    getAnswer = () => {
      if (rows.some((r) => !r.select.value)) return null;
      return { correct: rows.every((r, i) => r.select.value === q.pairs[i][1]) };
    };
    lock = () => {
      rows.forEach((r, i) => {
        r.select.disabled = true;
        const ok = r.select.value === q.pairs[i][1];
        r.row.classList.add(ok ? "is-right" : "is-wrong");
        if (!ok) r.row.append(h("p", { class: "small match-fix" }, `Correct: ${q.pairs[i][1]}`));
      });
    };
  } else if (q.type === "bug") {
    const lines = q.code.split("\n");
    let picked = null;
    const group = h("div", { class: "bug-code", role: "radiogroup", "aria-labelledby": legendId });
    lines.forEach((line, i) => {
      const btn = h(
        "button",
        { type: "button", class: "bug-line", role: "radio", "aria-checked": "false", "aria-label": `Line ${i + 1}: ${line.trim() || "blank line"}` },
        h("span", { class: "bug-num", "aria-hidden": "true" }, String(i + 1)),
        h("code", { "aria-hidden": "true" }, line || " "),
      );
      btn.addEventListener("click", () => {
        if (answered) return;
        group.querySelectorAll(".bug-line").forEach((b) => b.setAttribute("aria-checked", "false"));
        btn.setAttribute("aria-checked", "true");
        picked = i + 1;
      });
      group.append(btn);
    });
    body.append(h("p", { class: "muted small" }, "Tap the line with the bug."), group);
    getAnswer = () => (picked === null ? null : { correct: picked === q.answer });
    lock = () => {
      group.querySelectorAll(".bug-line").forEach((b, i) => {
        b.disabled = true;
        if (i + 1 === q.answer) b.classList.add("is-right");
        else if (i + 1 === picked) b.classList.add("is-wrong");
      });
    };
  }

  checkBtn.addEventListener("click", () => {
    if (answered) return;
    const result = getAnswer();
    if (!result) {
      feedback.replaceChildren(h("p", { class: "muted" }, "Pick or type an answer first."));
      return;
    }
    answered = true;
    checkBtn.hidden = true;
    lock(result.correct);
    recordAnswer(quizId, q.id, result.correct, { fromReview });
    feedback.className = `feedback ${result.correct ? "is-right" : "is-wrong"}`;
    feedback.replaceChildren(
      h("p", { class: "feedback-title" }, result.correct ? "✓ Yes, that's right." : "Not quite, and that's fine. Here's why:"),
      result.detail ? h("div", { class: "prose", html: renderMarkdown(result.detail) }) : null,
      q.explanation ? h("div", { class: "prose", html: renderMarkdown(q.explanation) }) : null,
      !result.correct && q.type === "fill" ? h("p", {}, "Answer: ", h("code", {}, Array.isArray(q.answer) ? q.answer[0] : q.answer)) : null,
      !result.correct && q.type === "order" ? h("ol", { class: "small" }, ...q.items.map((t) => h("li", { html: renderInline(t) }))) : null,
      !result.correct ? h("p", { class: "muted small" }, "We'll bring this one back in Review in a day or two.") : null,
    );
    onAnswered?.(result.correct);
  });

  const el = h(
    "div",
    { class: "question", dataset: { type: q.type || "mcq" } },
    number ? h("p", { class: "question-count" }, `Question ${number} of ${total}`) : null,
    h("div", { class: "question-prompt prose", id: legendId, html: renderMarkdown(q.prompt) }),
    body,
    h("div", { class: "toolbar" }, checkBtn),
    feedback,
  );
  return { el, focus: () => el.querySelector(".question-prompt")?.focus() };
}

export async function mountQuiz(slot, config, ctx) {
  const quiz = await loadQuiz(config.id);
  const stage = h("div", { class: "quiz-stage" });
  const el = h(
    "section",
    { class: "card quiz", "aria-labelledby": `${quiz.id}-title` },
    h("div", { class: "card-kicker" }, h("span", { class: "badge badge-orange" }, "Quick check")),
    h("h3", { id: `${quiz.id}-title`, class: "card-title" }, quiz.title || "Quick check"),
    stage,
  );
  slot.replaceWith(el);

  function run(questions) {
    let i = 0;
    const missed = [];
    const showNext = () => {
      if (i >= questions.length) return finish();
      const q = questions[i];
      const next = h("button", { class: "btn btn-primary", type: "button", hidden: true }, i === questions.length - 1 ? "See my score" : "Next question");
      const view = renderQuestion(q, quiz.id, {
        number: i + 1,
        total: questions.length,
        onAnswered: (correct) => {
          if (!correct) missed.push(q);
          next.hidden = false;
          ctx.refresh();
        },
      });
      next.addEventListener("click", () => {
        i += 1;
        showNext();
      });
      view.el.append(h("div", { class: "toolbar" }, next));
      stage.replaceChildren(view.el);
      const prompt = view.el.querySelector(".question-prompt");
      prompt.setAttribute("tabindex", "-1");
      if (i > 0) prompt.focus();
    };
    const finish = () => {
      const right = questions.length - missed.length;
      const retry = h("button", { class: "btn btn-accent", type: "button" }, `Retry the ${missed.length} I missed`);
      retry.addEventListener("click", () => run(missed.slice()));
      const again = h("button", { class: "btn btn-ghost", type: "button" }, "Start the quiz again");
      again.addEventListener("click", () => run(quiz.questions.slice()));
      const summary = h(
        "div",
        { class: "quiz-summary", tabindex: "-1" },
        h("p", { class: "quiz-score" }, `${right} of ${questions.length} right`),
        h("p", {}, missed.length === 0 ? "Every one. Brilliant." : "Getting things wrong is how memory works: the ones you missed will come back in Review so they stick."),
        h("div", { class: "toolbar" }, missed.length ? retry : null, again),
      );
      stage.replaceChildren(summary);
      summary.focus();
      announce(`${right} of ${questions.length} right`);
    };
    showNext();
  }
  run(quiz.questions.slice());

  ctx.registerTask({
    id: quiz.id,
    label: quiz.title || "Quick check",
    kind: "quiz",
    isDone: () => quizScore(quiz.id).answered >= quiz.questions.length,
  });
}
