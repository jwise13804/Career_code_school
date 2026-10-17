import { test, expect } from "./fixtures.js";
import { readFile } from "node:fs/promises";
import JSZip from "jszip";

const KEY = "ccs-progress-v1";

test.describe("site-wide behaviour", () => {
  test("works from a project sub-path and never requests anything outside it", async ({ page, request, baseURL }) => {
    // The test server only serves /career_code_school/, like GitHub Pages for a project site.
    const root = await request.get(new URL("/", baseURL).href);
    expect(root.status()).toBe(404);

    const failures = [];
    page.on("response", (r) => {
      const url = new URL(r.url());
      if (url.hostname === "localhost" && r.status() >= 400) failures.push(`${r.status()} ${url.pathname}`);
    });
    for (const route of ["", "#/lesson/p1-11-sql-select", "#/glossary", "#/practice", "#/review", "#/progress", "#/phase/p4"]) {
      await page.goto(route);
      await expect(page.locator("main h1")).toBeVisible();
    }
    // Let lazy loads (sql.js, CodeMirror) finish.
    await page.goto("#/practice");
    await expect(page.locator(".sql-card .cm-content")).toBeVisible();
    expect(failures).toEqual([]);
  });

  test("progress map shows phases and continue button", async ({ page }) => {
    await page.goto("./");
    await expect(page.getByRole("heading", { level: 1 })).toHaveText("From card support to backend developer");
    await expect(page.locator(".road-phase")).toHaveCount(4);
    await expect(page.getByRole("link", { name: /Start: Your first line of Python/ })).toBeVisible();
    await expect(page.locator(".streak-card")).toContainText("days this week");
  });

  test("SQL challenge is checked against the expected result table", async ({ page }) => {
    await page.goto("#/lesson/p1-12-sql-where");
    const sql = page.locator(".sql-card");
    await sql.locator(".cm-content").click();
    await page.keyboard.press("ControlOrMeta+a");
    await page.keyboard.insertText("SELECT * FROM cards;");
    await sql.getByRole("button", { name: "✓ Check my answer" }).click();
    await expect(sql.locator(".feedback")).toContainText("returned 16 rows, we expected 3");
    await page.keyboard.press("ControlOrMeta+a");
    await sql.locator(".cm-content").click();
    await page.keyboard.press("ControlOrMeta+a");
    await page.keyboard.insertText("SELECT * FROM cards WHERE status = 'blocked';");
    await sql.getByRole("button", { name: "✓ Check my answer" }).click();
    await expect(sql.locator(".feedback")).toContainText("Spot on");
    await expect(sql.getByRole("button", { name: "Challenge 1" })).toHaveClass(/is-done/);
  });

  test("spaced review resurfaces a missed question", async ({ page }) => {
    await page.goto("./");
    await page.evaluate((key) => {
      const d = new Date();
      const today = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
      localStorage.setItem(key, JSON.stringify({ review: { "p1-01-hello/q1": { box: 1, due: today } }, lessons: {} }));
    }, KEY);
    await page.reload();
    await expect(page.locator("#review-count")).toHaveText("1");
    await page.goto("#/review");
    await page.getByLabel("Shows the text Card blocked on the screen").check();
    await page.getByRole("button", { name: "Check" }).click();
    await page.getByRole("button", { name: "Next" }).click();
    await expect(page.locator(".quiz-score")).toContainText("1 of 1 right");
    const saved = await page.evaluate((key) => JSON.parse(localStorage.getItem(key)), KEY);
    expect(saved.review["p1-01-hello/q1"].box).toBe(2); // waits longer before coming back
  });

  test("export and import progress between devices", async ({ page }, testInfo) => {
    page.on("dialog", (d) => d.accept());
    await page.goto("#/lesson/p1-02-variables");
    await page.getByRole("button", { name: "Mark this lesson complete" }).click();
    await page.goto("#/progress");
    const [download] = await Promise.all([page.waitForEvent("download"), page.getByRole("button", { name: "Export my progress" }).click()]);
    const file = testInfo.outputPath("progress.json");
    await download.saveAs(file);
    const exported = JSON.parse(await readFile(file, "utf8"));
    expect(exported.progress.lessons["p1-02-variables"].done).toBe(true);

    // "New device": wipe everything, then import.
    await page.getByRole("button", { name: "Start again from zero" }).click();
    expect(await page.evaluate((key) => JSON.parse(localStorage.getItem(key)).lessons, KEY)).toEqual({});
    await page.locator("#import-file").setInputFiles(file);
    await expect(page.locator(".status-msg")).toContainText("Progress imported");
    await page.goto("#/lesson/p1-02-variables");
    await expect(page.getByRole("button", { name: "✓ Lesson complete" })).toBeVisible();
  });

  test("download my project files builds a zip with the capstone and saved lab code", async ({ page }, testInfo) => {
    await page.goto("./");
    await page.evaluate((key) => localStorage.setItem(key, JSON.stringify({ lessons: {}, labs: { "p1-10-statement": { code: "print('mine')", passed: true } } })), KEY);
    await page.reload(); // progress is read from storage when the app starts
    await page.goto("#/lesson/p4-11-job-applications");
    const [download] = await Promise.all([page.waitForEvent("download"), page.getByRole("button", { name: /Download my project files/ }).click()]);
    const file = testInfo.outputPath("project.zip");
    await download.saveAs(file);
    const zip = await JSZip.loadAsync(await readFile(file));
    const names = Object.keys(zip.files);
    expect(names).toContain("card-payments-api/app/main.py");
    expect(names).toContain("card-payments-api/.github/workflows/ci.yml");
    expect(names).toContain("card-payments-api/.gitignore");
    expect(await zip.file("card-payments-api/my-course-code/p1-10-statement.py").async("string")).toBe("print('mine')");
  });

  test("Stuck? button builds a prompt with lesson, code and error", async ({ page, context }) => {
    await context.grantPermissions(["clipboard-read", "clipboard-write"]);
    await page.goto("#/lesson/p1-09-errors");
    const lab = page.locator(".lab").first();
    await lab.getByRole("button", { name: "Run" }).click();
    await expect(lab.locator(".error-box")).toContainText("SyntaxError", { timeout: 60_000 });
    await page.getByRole("button", { name: /Stuck\? Ask Claude/ }).click();
    const text = page.getByLabel("Prompt to paste into Claude");
    await expect(text).toHaveValue(/Reading error messages calmly/);
    await expect(text).toHaveValue(/for amount in transactions/);
    await expect(text).toHaveValue(/SyntaxError/);
    await expect(text).toHaveValue(/don't give me the full answer/);
  });

  test("glossary is searchable and linked from lessons", async ({ page }) => {
    await page.goto("#/lesson/p4-05-idempotency");
    await page.locator("a.term", { hasText: "idempotent" }).first().click();
    await expect(page.locator(".glossary-entry.is-highlight")).toContainText("taps Pay twice but is only charged once");
    await page.getByLabel("Search the glossary").fill("chargeback");
    await expect(page.locator(".glossary-entry:visible")).toHaveCount(1);
    await expect(page.locator(".glossary-entry:visible")).toContainText("Chargeback");
  });

  test("theme toggle switches and persists", async ({ page }) => {
    await page.emulateMedia({ colorScheme: "light" });
    await page.goto("./");
    await page.locator("#theme-toggle").click();
    await expect(page.locator("html")).toHaveAttribute("data-theme", "dark");
    await page.reload();
    await expect(page.locator("html")).toHaveAttribute("data-theme", "dark");
    const bg = await page.evaluate(() => getComputedStyle(document.body).backgroundColor);
    expect(bg).toBe("rgb(18, 32, 31)");
  });

  test("keyboard: skip link first, and order questions work without a mouse", async ({ page, isMobile }) => {
    test.skip(isMobile, "keyboard navigation is a desktop concern");
    await page.goto("#/lesson/p4-01-tap-to-settlement");
    await page.keyboard.press("Tab");
    await expect(page.locator(".skip-link")).toBeFocused();
    const quiz = page.locator(".quiz").first();
    const items = quiz.locator(".order-item");
    await expect(items).toHaveCount(7);
    // Move the first item down one place with the keyboard and check it moved.
    const firstText = await items.first().getAttribute("data-value");
    await items.first().getByRole("button", { name: /down/ }).focus();
    await page.keyboard.press("Enter");
    await expect(items.nth(1)).toHaveAttribute("data-value", firstText);
    // Focus stays on the moved item, so you can keep pressing.
    await expect(page.locator(":focus")).toHaveAttribute("aria-label", new RegExp(`Move "${firstText.slice(0, 10)}`));
  });

  test("phone layout: no sideways scrolling and the bottom nav is reachable", async ({ page, isMobile }) => {
    test.skip(!isMobile, "phone-only check");
    for (const route of ["", "#/lesson/p1-10-project-total", "#/lesson/p2-01-what-is-an-api", "#/practice", "#/glossary"]) {
      await page.goto(route);
      await expect(page.locator("main h1")).toBeVisible();
      await page.waitForTimeout(300);
      const overflow = await page.evaluate(() => document.documentElement.scrollWidth - window.innerWidth);
      expect(overflow, `horizontal overflow on "${route}"`).toBeLessThanOrEqual(0);
    }
    const nav = page.locator(".site-nav");
    const box = await nav.boundingBox();
    const viewport = page.viewportSize();
    expect(box.y + box.height).toBeGreaterThan(viewport.height - 5); // pinned to the bottom
    await nav.getByRole("link", { name: "Glossary" }).click();
    await expect(page.locator("main h1")).toHaveText("Glossary");
  });
});
