// Entry point: hash router + theme. Hash routes (#/lesson/x) keep everything
// working on GitHub Pages under any sub-path, with no server rewrites needed.
import { h } from "./core/dom.js";
import { getSetting, setSetting, reviewItems, onChange } from "./core/storage.js";
import { renderHome, renderPhase } from "./views/home.js";
import { renderLesson, renderPage } from "./views/lesson.js";
import { renderGlossary } from "./views/glossary.js";
import { renderReview } from "./views/review.js";
import { renderProgress } from "./views/progress.js";
import { stopPython } from "./core/python.js";

const main = document.getElementById("main");

// ---------- theme ----------
const themeBtn = document.getElementById("theme-toggle");
function applyTheme(theme) {
  if (theme === "light" || theme === "dark") document.documentElement.dataset.theme = theme;
  else delete document.documentElement.dataset.theme;
  const isDark = theme === "dark" || (!theme && window.matchMedia("(prefers-color-scheme: dark)").matches);
  themeBtn.setAttribute("aria-pressed", String(isDark));
  themeBtn.querySelector(".theme-label").textContent = isDark ? "Light mode" : "Dark mode";
}
themeBtn.addEventListener("click", () => {
  const isDark = themeBtn.getAttribute("aria-pressed") === "true";
  const theme = isDark ? "light" : "dark";
  setSetting("theme", theme);
  applyTheme(theme);
});
applyTheme(getSetting("theme", null));

// ---------- review badge in the nav ----------
const reviewBadge = document.getElementById("review-count");
function updateBadge() {
  const n = reviewItems().length;
  reviewBadge.textContent = n ? String(n) : "";
  reviewBadge.hidden = !n;
  reviewBadge.setAttribute("aria-label", `${n} due`);
}
onChange(updateBadge);
updateBadge();

// ---------- router ----------
const routes = [
  [/^\/?$/, () => renderHome(main), "Your map"],
  [/^\/phase\/([\w-]+)$/, (m) => renderPhase(main, m[1]), "Phase"],
  [/^\/lesson\/([\w-]+)$/, (m) => renderLesson(main, m[1]), "Lesson"],
  [/^\/glossary(?:\/([\w-]+))?$/, (m) => renderGlossary(main, m[1]), "Glossary"],
  [/^\/review$/, () => renderReview(main), "Review"],
  [/^\/progress$/, () => renderProgress(main), "Progress"],
  [/^\/practice$/, () => renderPage(main, "practice"), "Practice bench"],
];

function setActiveNav(path) {
  document.querySelectorAll(".site-nav a").forEach((a) => {
    const target = a.getAttribute("href").slice(1);
    const active = target === "/" ? path === "/" || path === "" || path.startsWith("/lesson") || path.startsWith("/phase") : path.startsWith(target);
    if (active) a.setAttribute("aria-current", "page");
    else a.removeAttribute("aria-current");
  });
}

let firstRender = true;
async function route() {
  const path = decodeURIComponent(location.hash.replace(/^#/, "")) || "/";
  stopPython(); // leaving a page stops any code still running
  setActiveNav(path);
  main.setAttribute("aria-busy", "true");
  try {
    for (const [pattern, render] of routes) {
      const m = path.match(pattern);
      if (m) {
        const handledFocus = await render(m);
        if (!handledFocus) {
          window.scrollTo(0, 0);
          // Move focus to the new page's heading so screen readers announce it,
          // but not on first load (that would skip the skip-link).
          if (!firstRender) main.querySelector("h1")?.focus();
        }
        const h1 = main.querySelector("h1");
        document.title = h1 ? `${h1.textContent} · Career Code School` : "Career Code School";
        break;
      }
      if (pattern === routes[routes.length - 1][0]) {
        await renderHome(main);
      }
    }
  } catch (err) {
    console.error(err);
    main.replaceChildren(
      h(
        "div",
        { class: "page narrow" },
        h("h1", { tabindex: "-1" }, "Something didn't load"),
        h("p", {}, "This is usually a wobbly internet connection. Your progress is safe."),
        h("pre", { class: "error-raw" }, err.message),
        h("button", { class: "btn btn-primary", type: "button", onclick: () => route() }, "Try again"),
      ),
    );
  } finally {
    main.removeAttribute("aria-busy");
    firstRender = false;
  }
}

window.addEventListener("hashchange", route);
route();
