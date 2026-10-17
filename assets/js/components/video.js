// Video cards. A YouTube embed is only used when the content file marks the
// video ID as verified ("verified": true). Otherwise we show a "Watch" card
// that links to the official course or playlist page. See TODO.md.
import { h } from "../core/dom.js";

export function mountVideo(slot, config) {
  const { title, provider, url, youtube, verified, minutes, why } = config;
  const meta = h("p", { class: "video-meta" }, [provider, minutes ? `${minutes} min` : null, "Free"].filter(Boolean).join(" · "));
  let media;
  if (youtube && verified) {
    const play = h(
      "button",
      { class: "video-facade", type: "button", "aria-label": `Play video: ${title}` },
      h("span", { class: "video-play", "aria-hidden": "true" }, "▶"),
      h("span", { class: "video-facade-text" }, "Play here (loads YouTube, privacy-enhanced mode)"),
    );
    play.addEventListener("click", () => {
      const iframe = h("iframe", {
        src: `https://www.youtube-nocookie.com/embed/${encodeURIComponent(youtube)}?autoplay=1&rel=0`,
        title,
        allow: "accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture",
        allowfullscreen: true,
        loading: "lazy",
        referrerpolicy: "strict-origin-when-cross-origin",
      });
      play.replaceWith(h("div", { class: "video-frame" }, iframe));
      iframe.focus();
    });
    media = play;
  }
  const el = h(
    "section",
    { class: "card video-card" },
    h("div", { class: "card-kicker" }, h("span", { class: "badge badge-sand" }, "Watch")),
    h("h3", { class: "card-title" }, title),
    meta,
    why ? h("p", {}, why) : null,
    media,
    h("a", { class: "btn btn-ghost", href: url, target: "_blank", rel: "noopener noreferrer" }, media ? "Open on the course site" : "Watch on the course site", h("span", { class: "sr-only" }, " (opens in a new tab)"), " ↗"),
  );
  slot.replaceWith(el);
}
