import { marked } from "../../vendor/marked.esm.js";
import { escapeHtml } from "./dom.js";

marked.setOptions({ gfm: true, breaks: false });

// [[idempotency]] or [[idempotency|idempotency key]] -> link to the glossary.
function glossaryLinks(md) {
  return md.replace(/\[\[([a-z0-9-]+)(?:\|([^\]]+))?\]\]/g, (_, slug, text) => {
    const label = text || slug.replace(/-/g, " ");
    return `<a class="term" href="#/glossary/${slug}" data-term="${slug}">${escapeHtml(label)}</a>`;
  });
}

export function renderMarkdown(md) {
  const html = marked.parse(glossaryLinks(md));
  // Open outside links in a new tab, safely.
  return html.replace(/<a href="(https?:[^"]+)"/g, '<a href="$1" target="_blank" rel="noopener noreferrer"');
}

export function renderInline(md) {
  return marked.parseInline(glossaryLinks(md));
}
