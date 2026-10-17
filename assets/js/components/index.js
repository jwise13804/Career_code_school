// Maps a fenced block type (```lab, ```quiz, ...) to the code that draws it.
// Heavy components are imported only when a lesson uses them.
import { h } from "../core/dom.js";
import { mountCallout } from "./callout.js";
import { mountVideo } from "./video.js";

const loaders = {
  lab: () => import("./lab.js").then((m) => m.mountLab),
  quiz: () => import("./quiz.js").then((m) => m.mountQuiz),
  sql: () => import("./sql.js").then((m) => m.mountSql),
  api: () => import("../sims/api-sim.js").then((m) => m.mountApi),
  handler: () => import("../sims/api-sim.js").then((m) => m.mountHandlerLab),
  terminal: () => import("../sims/terminal.js").then((m) => m.mountTerminal),
  idempotency: () => import("../sims/idempotency.js").then((m) => m.mountIdempotency),
  ci: () => import("../sims/ci.js").then((m) => m.mountCi),
  dispute: () => import("../sims/dispute.js").then((m) => m.mountDispute),
  download: () => import("./download.js").then((m) => m.mountDownload),
};

export async function mountWidget(slot, widget, ctx) {
  const { kind, config } = widget;
  try {
    if (config.error) throw new Error(config.error);
    if (["analogy", "tip", "note", "warning", "practice"].includes(kind)) return mountCallout(slot, config, ctx, kind);
    if (kind === "video") return mountVideo(slot, config, ctx);
    const mount = await loaders[kind]();
    await mount(slot, config, ctx);
  } catch (err) {
    console.error(err);
    slot.replaceWith(h("div", { class: "card widget-error", role: "alert" }, h("strong", {}, "This activity couldn't load. "), err.message));
  }
}
