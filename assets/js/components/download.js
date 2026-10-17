// "Download my project files": builds a .zip in the browser with JSZip.
// It contains the capstone starter project (content/project/...) plus every
// piece of code she has written in the labs, so she can put it on GitHub.
//
// Config (```download block, JSON):
// { "title": "...", "folder": "card-payments-api",
//   "files": ["README.md", {"from": "gitignore.txt", "to": ".gitignore"}, ...] }
import { h, loadScript, vendorUrl, downloadFile } from "../core/dom.js";
import { contentUrl } from "../core/content.js";
import { getState, today } from "../core/storage.js";

export function mountDownload(slot, config, ctx) {
  const status = h("p", { class: "status-msg", role: "status" });
  const btn = h("button", { class: "btn btn-primary btn-large", type: "button" }, "⬇ Download my project files (.zip)");
  const labs = Object.entries(getState().labs).filter(([, v]) => v.code && v.code.trim());
  const el = h(
    "section",
    { class: "card" },
    h("div", { class: "card-kicker" }, h("span", { class: "badge badge-orange" }, "Your files")),
    h("h3", { class: "card-title" }, config.title || "Download my project files"),
    h(
      "p",
      {},
      `You get the capstone project (${(config.files || []).length} files: code, tests, Dockerfile, CI workflow and README), plus a folder with the ${labs.length} piece${labs.length === 1 ? "" : "s"} of code you've written in this course. It's all made in your browser, and nothing is uploaded.`,
    ),
    btn,
    status,
  );
  slot.replaceWith(el);

  btn.addEventListener("click", async () => {
    btn.disabled = true;
    status.textContent = "Packing your files…";
    try {
      await loadScript(vendorUrl("jszip.min.js"));
      const zip = new window.JSZip();
      const root = zip.folder(config.folder || "my-project");
      // Entries are "path" or {"from": "path on the site", "to": "path in the zip"}.
      // Dotfiles (.gitignore, .github/) are stored without the dot on the site,
      // because GitHub Pages doesn't publish hidden files.
      for (const entry of config.files || []) {
        const { from, to } = typeof entry === "string" ? { from: entry, to: entry } : entry;
        const res = await fetch(contentUrl(`project/${from}`));
        if (!res.ok) throw new Error(`Couldn't fetch ${from}`);
        root.file(to, await res.text());
      }
      const mine = root.folder("my-course-code");
      const current = getState().labs;
      const entries = Object.entries(current).filter(([, v]) => v.code && v.code.trim());
      for (const [labId, v] of entries) mine.file(`${labId}${/sql/.test(labId) ? ".sql" : ".py"}`, v.code);
      mine.file(
        "README.md",
        `# Code I wrote while learning\n\nEvery exercise from Career Code School, saved on ${today()}.\nFile names match the lesson they came from (p1 = Phase 1, and so on).\n\n${entries.map(([k, v]) => `- \`${k}\`${v.passed ? " (all checks passed)" : ""}`).join("\n")}\n`,
      );
      const blob = await zip.generateAsync({ type: "blob" });
      downloadFile(`${config.folder || "my-project"}.zip`, blob);
      status.textContent = "Downloaded. Unzip it, then follow the steps below to put it on GitHub.";
    } catch (err) {
      status.textContent = `Something went wrong: ${err.message}. Check your connection and try again.`;
    }
    btn.disabled = false;
  });
}
