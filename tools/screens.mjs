// Dev helper: screenshots of key pages (desktop + phone, light + dark).
// Usage: node tools/screens.mjs <outDir> [route ...]  (needs `npm run serve` running)
import { chromium, devices } from "playwright";
const out = process.argv[2] || "screens";
const routes = process.argv.slice(3).length ? process.argv.slice(3) : ["", "#/lesson/p1-01-hello"];
const browser = await chromium.launch();
for (const [name, opts] of [["desktop", { viewport: { width: 1280, height: 900 } }], ["phone", devices["Pixel 7"]]]) {
  for (const scheme of ["light", "dark"]) {
    const ctx = await browser.newContext({ ...opts, colorScheme: scheme });
    const page = await ctx.newPage();
    for (const r of routes) {
      await page.goto(`http://localhost:4173/career_code_school/${r}`);
      await page.waitForTimeout(1200);
      const slug = (r || "home").replace(/[^a-z0-9]+/gi, "_");
      await page.screenshot({ path: `${out}/${name}-${scheme}-${slug}.png`, fullPage: name === "phone" ? false : true });
    }
    await ctx.close();
  }
}
await browser.close();
