import { expect } from "@playwright/test";

/** Replace everything in a CodeMirror editor with `code`. */
export async function setCode(page, scope, code) {
  const content = scope.locator(".cm-content").first();
  await content.click();
  await page.keyboard.press("ControlOrMeta+a");
  await page.keyboard.press("Delete");
  // insertText avoids auto-indent and auto-closing brackets, so code arrives as written.
  await page.keyboard.insertText(code);
  await expect(content).toContainText(code.split("\n")[0].trim());
}

/** Climb the hint ladder and load the official solution into the editor. */
export async function useSolution(scope) {
  for (let i = 1; i <= 3; i++) await scope.getByRole("button", { name: `Show hint ${i} of 3` }).click();
  await scope.getByRole("button", { name: "Show the solution" }).click();
  await scope.getByRole("button", { name: "Put this in the editor" }).click();
}
