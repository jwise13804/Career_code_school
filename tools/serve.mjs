// Tiny static server that mimics GitHub Pages for a *project* site.
// The site is served under /career_code_school/ (not /), so any absolute
// path mistake shows up locally as a 404, exactly as it would on Pages.
//
//   npm run serve            -> http://localhost:4173/career_code_school/
//   PORT=8080 BASE=/x/ npm run serve
//
// For offline testing it can also serve the Pyodide npm package from
// node_modules at /__pyodide__/ (see tests/fixtures.js).
import { createServer } from "node:http";
import { readFile, stat } from "node:fs/promises";
import { extname, join, normalize, resolve } from "node:path";

const root = resolve(process.cwd());
const port = Number(process.env.PORT || 4173);
const base = process.env.BASE || "/career_code_school/";

const types = {
  ".html": "text/html; charset=utf-8",
  ".js": "text/javascript; charset=utf-8",
  ".mjs": "text/javascript; charset=utf-8",
  ".css": "text/css; charset=utf-8",
  ".json": "application/json; charset=utf-8",
  ".md": "text/markdown; charset=utf-8",
  ".sql": "text/plain; charset=utf-8",
  ".py": "text/plain; charset=utf-8",
  ".txt": "text/plain; charset=utf-8",
  ".svg": "image/svg+xml",
  ".png": "image/png",
  ".ico": "image/x-icon",
  ".wasm": "application/wasm",
  ".zip": "application/zip",
  ".webmanifest": "application/manifest+json",
};

// Only files GitHub Pages would actually publish (see .github/workflows/pages.yml).
const published = ["index.html", "404.html", "favicon.svg", "assets/", "content/"];

async function send(res, file) {
  try {
    const info = await stat(file);
    if (info.isDirectory()) return send(res, join(file, "index.html"));
    const body = await readFile(file);
    res.writeHead(200, { "content-type": types[extname(file)] || "application/octet-stream" });
    res.end(body);
  } catch {
    res.writeHead(404, { "content-type": "text/plain" });
    res.end("404 Not found");
  }
}

createServer((req, res) => {
  const url = new URL(req.url, "http://localhost");
  const path = decodeURIComponent(url.pathname);
  if (path.startsWith("/__pyodide__/")) {
    return send(res, join(root, "node_modules/pyodide", normalize(path.slice("/__pyodide__/".length))));
  }
  if (path === base.slice(0, -1)) {
    res.writeHead(301, { location: base });
    return res.end();
  }
  if (!path.startsWith(base)) {
    res.writeHead(404, { "content-type": "text/plain" });
    return res.end(`404: this server only serves ${base}`);
  }
  const rel = normalize(path.slice(base.length)) || "index.html";
  if (rel.startsWith("..")) {
    res.writeHead(400);
    return res.end();
  }
  const allowed = rel === "" || rel === "." || published.some((p) => (p.endsWith("/") ? rel.startsWith(p) : rel === p));
  if (!allowed) {
    res.writeHead(404, { "content-type": "text/plain" });
    return res.end("404 Not found (not published)");
  }
  return send(res, join(root, rel === "." ? "index.html" : rel));
}).listen(port, () => {
  console.log(`Serving ${root} at http://localhost:${port}${base}`);
});
