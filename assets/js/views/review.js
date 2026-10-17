import { h } from "../core/dom.js";
import { loadQuiz } from "../core/content.js";
import { reviewItems } from "../core/storage.js";
import { renderQuestion } from "../components/quiz.js";

export async function renderReview(main) {
  const dueItems = reviewItems();
  const page = h("div", { class: "page narrow" }, h("h1", { tabindex: "-1" }, "Review"));
  main.replaceChildren(page);

  page.append(
    h(
      "p",
      { class: "lead" },
      "Questions you missed come back here after a day, then two, four and eight days. Each time you get one right it waits longer before coming back. After a few it's yours for good.",
    ),
  );

  const all = reviewItems({ dueOnly: false });
  if (dueItems.length === 0) {
    page.append(
      h(
        "div",
        { class: "card" },
        h("p", { class: "h4" }, all.length ? "Nothing due today 🌿" : "Your review pile is empty"),
        h("p", {}, all.length ? `${all.length} question${all.length === 1 ? " is" : "s are"} resting and will come back on ${all.map((i) => i.due).sort()[0]}.` : "When you miss a quiz question it lands here, so you can try it again later."),
        h("a", { class: "btn btn-primary", href: "#/" }, "Back to your map"),
      ),
    );
    return;
  }

  const quizzes = {};
  for (const item of dueItems) {
    if (!quizzes[item.quizId]) quizzes[item.quizId] = await loadQuiz(item.quizId).catch(() => null);
  }
  const questions = dueItems
    .map((item) => ({ item, quiz: quizzes[item.quizId], q: quizzes[item.quizId]?.questions.find((q) => q.id === item.questionId) }))
    .filter((x) => x.q);

  const stage = h("div", { class: "card quiz" });
  page.append(h("p", {}, `${questions.length} question${questions.length === 1 ? "" : "s"} ready.`), stage);
  let i = 0;
  let right = 0;
  const show = () => {
    if (i >= questions.length) {
      stage.replaceChildren(
        h("p", { class: "quiz-score", tabindex: "-1" }, `Review done: ${right} of ${questions.length} right`),
        h("p", {}, "The ones you got right will rest longer before they come back. That's how they move into long-term memory."),
        h("a", { class: "btn btn-primary", href: "#/" }, "Back to your map"),
      );
      stage.firstChild.focus();
      return;
    }
    const { q, quiz } = questions[i];
    const next = h("button", { class: "btn btn-primary", type: "button", hidden: true }, "Next");
    const view = renderQuestion(q, quiz.id, {
      fromReview: true,
      number: i + 1,
      total: questions.length,
      onAnswered: (correct) => {
        if (correct) right++;
        next.hidden = false;
        next.focus();
      },
    });
    view.el.prepend(h("p", { class: "muted small" }, `From: ${quiz.title}`));
    next.addEventListener("click", () => {
      i++;
      show();
    });
    view.el.append(h("div", { class: "toolbar" }, next));
    stage.replaceChildren(view.el);
  };
  show();
}
