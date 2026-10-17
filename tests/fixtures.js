// Shared test setup.
// Pyodide normally comes from the jsDelivr CDN. When OFFLINE_PYODIDE=1 (the
// default locally), requests to the CDN are answered from node_modules/pyodide
// instead, so tests don't depend on the network. In CI we hit the real CDN.
import { test as base, expect } from "@playwright/test";
import { readFile } from "node:fs/promises";
import { join } from "node:path";

const CDN = "https://cdn.jsdelivr.net/npm/pyodide@0.29.5/";
const types = { ".js": "text/javascript", ".mjs": "text/javascript", ".wasm": "application/wasm", ".json": "application/json", ".zip": "application/zip" };

export const test = base.extend({
  context: async ({ context }, use) => {
    if (process.env.OFFLINE_PYODIDE !== "0") {
      await context.route(`${CDN}**`, async (route) => {
        const file = new URL(route.request().url()).pathname.split("/").pop();
        try {
          const body = await readFile(join("node_modules/pyodide", file));
          const ext = file.slice(file.lastIndexOf("."));
          await route.fulfill({ status: 200, body, headers: { "content-type": types[ext] || "application/octet-stream", "access-control-allow-origin": "*" } });
        } catch {
          await route.fulfill({ status: 404, body: "not found" });
        }
      });
    }
    await use(context);
  },
});
export { expect };
