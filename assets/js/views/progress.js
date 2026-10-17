import { h, downloadFile, announce } from "../core/dom.js";
import { loadCourse } from "../core/content.js";
import { exportProgress, importProgress, resetProgress, isLessonDone, streakInfo, reviewItems, canSave, today } from "../core/storage.js";

export async function renderProgress(main) {
  const course = await loadCourse();
  const done = course.lessons.filter((l) => isLessonDone(l.id)).length;
  const s = streakInfo();
  const status = h("p", { class: "status-msg", role: "status" });

  const exportBtn = h("button", { class: "btn btn-primary", type: "button" }, "Export my progress");
  exportBtn.addEventListener("click", () => {
    downloadFile(`career-code-school-progress-${today()}.json`, exportProgress());
    status.textContent = "Downloaded. Open this site on your other device, go to Progress, and choose Import.";
  });

  const fileInput = h("input", { type: "file", accept: "application/json,.json", id: "import-file", class: "sr-only" });
  const importLabel = h("label", { for: "import-file", class: "btn btn-ghost", tabindex: "0", role: "button" }, "Import progress from a file");
  importLabel.addEventListener("keydown", (e) => {
    if (e.key === "Enter" || e.key === " ") {
      e.preventDefault();
      fileInput.click();
    }
  });
  fileInput.addEventListener("change", async () => {
    const file = fileInput.files?.[0];
    if (!file) return;
    if (!window.confirm("Importing replaces the progress saved in this browser with the file's progress. Continue?")) return;
    try {
      importProgress(await file.text());
      status.textContent = "Progress imported. Welcome back!";
      announce("Progress imported");
      setTimeout(() => renderProgress(main), 600);
    } catch (err) {
      status.textContent = err.message;
    }
    fileInput.value = "";
  });

  const resetBtn = h("button", { class: "btn btn-danger-ghost", type: "button" }, "Start again from zero");
  resetBtn.addEventListener("click", () => {
    if (!window.confirm("This deletes all progress saved in this browser (lessons, code, quiz answers). Export first if you might want it back. Delete everything?")) return;
    resetProgress();
    renderProgress(main);
  });

  main.replaceChildren(
    h(
      "div",
      { class: "page narrow" },
      h("h1", { tabindex: "-1" }, "Your progress"),
      h(
        "div",
        { class: "card streak-card" },
        h(
          "div",
          { class: "streak-stats" },
          h("div", { class: "stat" }, h("span", { class: "stat-num" }, `${done}`), h("span", { class: "stat-label" }, `of ${course.lessons.length} lessons`)),
          h("div", { class: "stat" }, h("span", { class: "stat-num" }, `${s.total}`), h("span", { class: "stat-label" }, "study days")),
          h("div", { class: "stat" }, h("span", { class: "stat-num" }, `${reviewItems({ dueOnly: false }).length}`), h("span", { class: "stat-label" }, "in review")),
        ),
      ),
      h("h2", {}, "Move to another device"),
      h(
        "p",
        {},
        "Your progress is stored only in this browser. Nothing is sent anywhere: there are no accounts. To carry on from your phone or laptop, export a small file here and import it there. Sending it to yourself by email or a chat app works fine.",
      ),
      canSave() ? null : h("p", { class: "callout callout-warning" }, "This browser is blocking storage (private mode, perhaps), so progress will be lost when you close the tab. Export before you go."),
      h("div", { class: "toolbar" }, exportBtn, importLabel, fileInput),
      status,
      h("h2", {}, "Start over"),
      h("p", {}, "Handy if someone else wants to use the course on this device."),
      resetBtn,
    ),
  );
}
