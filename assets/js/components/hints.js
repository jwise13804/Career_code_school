// The 3-step hint ladder with a "show the solution" option at the end.
import { h } from "../core/dom.js";
import { renderMarkdown } from "../core/markdown.js";
import { getLab, updateLab } from "../core/storage.js";

export function hintLadder({ id, hints = [], solution, onUseSolution }) {
  if (!hints.length && !solution) return null;
  let shown = getLab(id).hints || 0;
  const list = h("ol", { class: "hint-list" });
  const hintBtn = h("button", { class: "btn btn-ghost btn-small", type: "button" });
  const solutionBox = h("div", { class: "solution", hidden: true });
  const solutionBtn = h("button", { class: "btn btn-ghost btn-small", type: "button", hidden: true }, "Show the solution");

  const render = () => {
    list.replaceChildren(...hints.slice(0, shown).map((text, i) => h("li", { class: "prose", html: renderMarkdown(text), "aria-label": `Hint ${i + 1}` })));
    hintBtn.hidden = shown >= hints.length;
    hintBtn.textContent = `Show hint ${shown + 1} of ${hints.length}`;
    solutionBtn.hidden = !solution || shown < hints.length || !solutionBox.hidden;
  };
  hintBtn.addEventListener("click", () => {
    shown = Math.min(hints.length, shown + 1);
    updateLab(id, { hints: shown });
    render();
    const last = list.lastElementChild;
    last?.setAttribute("tabindex", "-1");
    last?.focus();
  });
  solutionBtn.addEventListener("click", () => {
    solutionBox.hidden = false;
    solutionBtn.hidden = true;
    updateLab(id, { solutionShown: true });
    const use = h("button", { class: "btn btn-ghost btn-small", type: "button" }, "Put this in the editor");
    use.addEventListener("click", () => onUseSolution?.(solution));
    solutionBox.replaceChildren(
      h("p", {}, "Here's one way to do it. Read it line by line, then try typing it yourself rather than copying. That's how it sticks."),
      h("pre", { class: "code-block" }, h("code", {}, solution)),
      onUseSolution ? use : null,
    );
  });
  render();
  return h("div", { class: "hints" }, h("h4", { class: "hints-title" }, "Stuck? Hints, one step at a time"), list, h("div", { class: "toolbar" }, hintBtn, solutionBtn), solutionBox);
}
