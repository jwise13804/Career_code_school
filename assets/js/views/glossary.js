import { h } from "../core/dom.js";
import { loadGlossary } from "../core/content.js";
import { renderMarkdown } from "../core/markdown.js";

export async function renderGlossary(main, focusSlug) {
  const { terms } = await loadGlossary();
  const search = h("input", { type: "search", id: "glossary-search", class: "text-input", placeholder: "Search, e.g. API or refund", autocomplete: "off" });
  const count = h("p", { class: "muted small", "aria-live": "polite" });
  const list = h("dl", { class: "glossary-list" });

  const entries = terms.map((t) => {
    const dt = h("dt", { id: `term-${t.slug}`, tabindex: "-1" }, t.term);
    const dd = h(
      "dd",
      {},
      h("p", {}, t.short),
      t.everyday ? h("p", { class: "everyday" }, h("span", { class: "everyday-label" }, "In card-support terms: "), t.everyday) : null,
      t.more ? h("div", { class: "prose small", html: renderMarkdown(t.more) }) : null,
      t.lesson ? h("p", { class: "small" }, h("a", { href: `#/lesson/${t.lesson}` }, "Lesson where this comes up →")) : null,
    );
    const haystack = `${t.term} ${t.short} ${t.everyday || ""} ${(t.aka || []).join(" ")}`.toLowerCase();
    return { t, dt, dd, haystack };
  });
  entries.forEach((e) => list.append(h("div", { class: "glossary-entry" }, e.dt, e.dd)));

  const filter = () => {
    const q = search.value.trim().toLowerCase();
    let shown = 0;
    entries.forEach((e) => {
      const match = !q || e.haystack.includes(q);
      e.dt.parentElement.hidden = !match;
      if (match) shown++;
    });
    count.textContent = q ? `${shown} term${shown === 1 ? "" : "s"} found` : `${terms.length} terms`;
  };
  search.addEventListener("input", filter);
  filter();

  main.replaceChildren(
    h(
      "div",
      { class: "page narrow" },
      h("h1", { tabindex: "-1" }, "Glossary"),
      h("p", { class: "lead" }, "Every technical word in the course, explained twice: once plainly, once in terms you already know from the support desk."),
      h("label", { for: "glossary-search", class: "label" }, "Search the glossary"),
      search,
      count,
      list,
    ),
  );

  if (focusSlug) {
    const target = document.getElementById(`term-${focusSlug}`);
    if (target) {
      target.parentElement.classList.add("is-highlight");
      target.scrollIntoView({ block: "start" });
      target.focus({ preventScroll: true });
      return true;
    }
  }
  return false;
}
