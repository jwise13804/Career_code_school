// Rebuilds the files in assets/vendor/ from node_modules.
// Run once after `npm install` when you want to upgrade a library:
//   npm run vendor
// The site itself has no build step: the output is committed.
import { build } from "esbuild";
import { copyFileSync, mkdirSync } from "node:fs";

const out = "assets/vendor";
mkdirSync(out, { recursive: true });

await build({
  entryPoints: ["tools/cm-entry.js"],
  bundle: true,
  format: "esm",
  minify: true,
  outfile: `${out}/codemirror.js`,
  legalComments: "eof",
});

const copies = [
  ["node_modules/marked/lib/marked.esm.js", "marked.esm.js"],
  ["node_modules/jszip/dist/jszip.min.js", "jszip.min.js"],
  ["node_modules/sql.js/dist/sql-wasm.js", "sql-wasm.js"],
  ["node_modules/sql.js/dist/sql-wasm.wasm", "sql-wasm.wasm"],
];
for (const [from, to] of copies) copyFileSync(from, `${out}/${to}`);
console.log("Vendor files written to", out);
