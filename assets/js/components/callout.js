import { h } from "../core/dom.js";
import { renderMarkdown } from "../core/markdown.js";

const LABELS = {
  analogy: { label: "From the support desk", icon: "🎧" },
  tip: { label: "Tip", icon: "💡" },
  note: { label: "Good to know", icon: "📝" },
  warning: { label: "Watch out", icon: "⚠️" },
  practice: { label: "Practice this week (free)", icon: "🗓️" },
};

export function mountCallout(slot, config, ctx, kind) {
  const meta = LABELS[kind];
  const el = h(
    "aside",
    { class: `callout callout-${kind}`, "aria-label": config.title || meta.label },
    h("p", { class: "callout-label" }, h("span", { "aria-hidden": "true" }, `${meta.icon} `), config.title || meta.label),
    h("div", { class: "prose", html: renderMarkdown(config.markdown) }),
  );
  slot.replaceWith(el);
}
