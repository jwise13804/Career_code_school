import { test, expect } from "./fixtures.js";
import { useSolution } from "./helpers.js";

test.describe("simulations and playgrounds", () => {
  test("SQL playground runs queries against the bank database", async ({ page }) => {
    await page.goto("#/practice");
    const sql = page.locator(".sql-card");
    await sql.getByRole("button", { name: "▶ Run query" }).click();
    await expect(sql.locator(".result-table")).toContainText("Netflix");
    await sql.getByText("What's in the database?").click();
    await expect(sql.locator(".schema-tables")).toContainText("disputes");
  });

  test("API simulator: tasks tick off from real status codes", async ({ page }) => {
    await page.goto("#/lesson/p2-01-what-is-an-api");
    const api = page.locator(".api-card");
    await api.getByRole("button", { name: "GET /customers" }).click();
    await api.getByRole("button", { name: "Send request" }).click();
    await expect(api.locator(".api-status")).toContainText("200 OK");
    await api.getByLabel("Path").fill("/customers/99");
    await api.getByRole("button", { name: "Send request" }).click();
    await expect(api.locator(".api-status")).toContainText("404 Not Found");
    await api.getByRole("button", { name: "POST /payments (no key)" }).click();
    await api.getByRole("button", { name: "Send request" }).click();
    await expect(api.locator(".api-status")).toContainText("401");
    await expect(api.locator(".task-list li.done")).toHaveCount(3);
  });

  test("handler lab: learner's Python answers requests", async ({ page }) => {
    await page.goto("#/lesson/p2-04-write-a-handler");
    const lab = page.locator(".lab").first();
    await lab.getByRole("button", { name: "GET /customers/2" }).click();
    await lab.getByRole("button", { name: "Send request" }).click();
    await expect(lab.locator(".api-status")).toContainText("404", { timeout: 60_000 });
    await useSolution(lab);
    await lab.getByRole("button", { name: "Send request" }).click();
    await expect(lab.locator(".api-status")).toContainText("200 OK");
    await expect(lab.locator(".api-body").last()).toContainText("Tom Walsh");
    await lab.getByRole("button", { name: "✓ Check my handler" }).click();
    await expect(lab.locator(".success-banner")).toBeVisible();
  });

  test("terminal simulator accepts variants and explains mistakes", async ({ page }) => {
    await page.goto("#/lesson/p3-01-docker-concepts");
    const term = page.locator(".terminal-card");
    const input = term.getByLabel("Type a command");
    await input.fill("Docker --version");
    await input.press("Enter");
    await expect(term.locator(".terminal-explain").last()).toContainText("case-sensitive");
    await input.fill("docker version");
    await input.press("Enter");
    await input.fill("docker build -t mini-bank");
    await input.press("Enter");
    await expect(term.locator(".terminal-explain").last()).toContainText("missing the `.`".replace(/`/g, ""));
    await input.fill("docker build -t mini-bank .");
    await input.press("Enter");
    await input.fill("docker image ls");
    await input.press("Enter");
    await input.fill("docker run -p 8000:8000 mini-bank");
    await input.press("Enter");
    await input.fill("docker ps");
    await input.press("Enter");
    await expect(term.locator(".goal-box")).toContainText("All done!");
  });

  test("idempotency lab: double charge until fixed", async ({ page }) => {
    await page.goto("#/lesson/p4-05-idempotency");
    const lab = page.locator(".idem-card");
    await lab.getByRole("button", { name: "Pay £25.00" }).click();
    await expect(lab.locator(".ledger tbody tr")).toHaveCount(2, { timeout: 60_000 });
    await expect(lab.locator(".ledger tr.is-dup")).toHaveCount(1);
    await useSolution(lab);
    await lab.getByRole("button", { name: "↺ Clear the statement" }).click();
    await lab.getByRole("button", { name: "Pay £25.00" }).click();
    await expect(lab.locator(".feedback.is-right")).toContainText("One order, one charge");
    await lab.getByRole("button", { name: "Pay £25.00" }).click();
    await expect(lab.locator(".ledger tbody tr")).toHaveCount(2);
    await expect(lab.locator(".ledger tr.is-dup")).toHaveCount(0);
    await lab.getByRole("button", { name: "✓ Check my fix" }).click();
    await expect(lab.locator(".success-banner")).toBeVisible();
  });

  test("CI pipeline: failing tests block the deploy", async ({ page }) => {
    await page.goto("#/lesson/p3-04-github-actions");
    const ci = page.locator(".ci-card");
    await ci.getByRole("button", { name: /git push/ }).click();
    await expect(ci.locator(".stage").nth(3)).toHaveClass(/failed/, { timeout: 60_000 });
    await expect(ci.locator(".stage").nth(4)).toHaveClass(/blocked/);
    await expect(ci.locator(".feedback")).toContainText("deploy was blocked");
    await useSolution(ci);
    await ci.getByRole("button", { name: /git push/ }).click();
    await expect(ci.locator(".stage").nth(4)).toHaveClass(/passed/);
  });

  test("dispute builder draws the workflow and checks the rules", async ({ page }) => {
    await page.goto("#/lesson/p4-07-dispute-workflow");
    const lab = page.locator(".lab").first();
    await lab.getByRole("button", { name: "▶ Run and draw my workflow" }).click();
    await expect(lab.locator(".sd-edge.missing").first()).toBeVisible({ timeout: 60_000 });
    await expect(lab.locator("ul.checks li.fail").first()).toBeVisible();
    await useSolution(lab);
    await lab.getByRole("button", { name: "▶ Run and draw my workflow" }).click();
    await expect(lab.locator(".sd-edge.missing")).toHaveCount(0);
    await expect(lab.locator(".sd-edge.wrong")).toHaveCount(0);
    await lab.getByRole("button", { name: "✓ Check my answer" }).click();
    await expect(lab.locator(".success-banner")).toBeVisible();
  });

  test("pytest lab: planted bugs are caught by good tests", async ({ page }) => {
    await page.goto("#/lesson/p2-10-pytest-basics");
    const lab = page.locator(".lab").first();
    await lab.getByRole("button", { name: "Check my answer" }).click();
    await expect(lab.locator(".checks")).toContainText("NOT caught", { timeout: 60_000 });
    await useSolution(lab);
    await lab.getByRole("button", { name: "Check my answer" }).click();
    await expect(lab.locator(".success-banner")).toBeVisible();
  });
});
