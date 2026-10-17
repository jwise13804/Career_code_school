import { test, expect } from "./fixtures.js";
import { setCode } from "./helpers.js";

test.describe("vertical slice: Phase 1 lesson 1", () => {
  test("code lab, friendly failures, hints, quiz and progress that survives a reload", async ({ page }) => {
    await page.goto("#/lesson/p1-01-hello");
    const lab = page.locator(".lab").first();

    // 1. Wrong answer gives friendly failure messages.
    await lab.getByRole("button", { name: "Check my answer" }).click();
    await expect(lab.locator(".check.fail").first()).toBeVisible({ timeout: 60_000 });
    await expect(lab.locator(".checks")).toContainText("We expected to see: Hello, Sam!");

    // 2. A syntax error is explained in plain English with the line number.
    await setCode(page, lab, 'print("Hello, Sam!)');
    await lab.getByRole("button", { name: "Run" }).click();
    await expect(lab.locator(".error-box")).toContainText("SyntaxError on line 1");
    await expect(lab.locator(".error-box")).toContainText("quote mark");

    // 3. Hint ladder: three hints, then the solution unlocks.
    for (let i = 1; i <= 3; i++) await lab.getByRole("button", { name: `Show hint ${i} of 3` }).click();
    await expect(lab.locator(".hint-list li")).toHaveCount(3);
    await lab.getByRole("button", { name: "Show the solution" }).click();
    await expect(lab.locator(".solution pre")).toContainText('print("Hello, Sam!")');

    // 4. Correct answer passes all checks.
    await setCode(page, lab, 'print("Hello, Sam!")\nprint("Your new card is on its way.")');
    await lab.getByRole("button", { name: "Check my answer" }).click();
    await expect(lab.locator(".success-banner")).toBeVisible();
    await expect(lab.locator(".check.pass")).toHaveCount(3);

    // 5. Quiz: answer the first question wrong, see the explanation, then finish.
    const quiz = page.locator(".quiz").first();
    await quiz.getByLabel("Blocks the card").check();
    await quiz.getByRole("button", { name: "Check" }).click();
    await expect(quiz.locator(".feedback")).toContainText("Not quite");
    await expect(quiz.locator(".feedback")).toContainText("only does exactly what the words say");
    await quiz.getByRole("button", { name: "Next question" }).click();
    await quiz.getByLabel("To tell Python it's text to use exactly as written").check();
    await quiz.getByRole("button", { name: "Check" }).click();
    await expect(quiz.locator(".feedback")).toContainText("Yes, that's right");
    await quiz.getByRole("button", { name: "Next question" }).click();
    await quiz.getByRole("radio", { name: /Line 3/ }).click();
    await quiz.getByRole("button", { name: "Check" }).click();
    await quiz.getByRole("button", { name: "Next question" }).click();
    await quiz.getByLabel("Your answer").fill("print");
    await quiz.getByRole("button", { name: "Check" }).click();
    await quiz.getByRole("button", { name: "Next question" }).click();
    await quiz.getByLabel("Python ignores it. It's a note for humans").check();
    await quiz.getByRole("button", { name: "Check" }).click();
    await quiz.getByRole("button", { name: "See my score" }).click();
    await expect(quiz.locator(".quiz-score")).toHaveText("4 of 5 right");
    await quiz.getByRole("button", { name: "Retry the 1 I missed" }).click();
    await expect(quiz.locator(".question-count")).toHaveText("Question 1 of 1");

    // 6. Mark complete and reload: everything is still there.
    await page.getByRole("button", { name: "Mark this lesson complete" }).click();
    await page.reload();
    await expect(page.getByRole("button", { name: "✓ Lesson complete" })).toBeVisible();
    await expect(page.locator(".lab .cm-content").first()).toContainText("Your new card is on its way.");
    await expect(page.locator(".lab .badge-done").first()).toBeVisible();

    // 7. The missed question is waiting in Review (due tomorrow, so not yet due).
    const saved = await page.evaluate(() => JSON.parse(localStorage.getItem("ccs-progress-v1")));
    expect(saved.review["p1-01-hello/q1"].box).toBe(1);
    expect(saved.lessons["p1-01-hello"].done).toBe(true);

    // 8. The map shows the tick.
    await page.goto("./");
    await expect(page.locator(".lesson-stop.is-done").first()).toContainText("Your first line of Python");
  });

  test("an infinite loop can be stopped", async ({ page }) => {
    await page.goto("#/lesson/p1-01-hello");
    const lab = page.locator(".lab").first();
    await setCode(page, lab, "while True:\n    pass");
    await lab.getByRole("button", { name: "Run" }).click();
    await expect(lab.getByRole("button", { name: "Stop" })).toBeVisible();
    await page.waitForTimeout(1500);
    await lab.getByRole("button", { name: "Stop" }).click();
    await expect(lab.locator(".error-box")).toContainText("You stopped the code");
    // Python restarts cleanly afterwards.
    await setCode(page, lab, 'print("back again")');
    await lab.getByRole("button", { name: "Run" }).click();
    await expect(lab.locator(".output-text")).toHaveText("back again", { timeout: 60_000 });
  });
});
