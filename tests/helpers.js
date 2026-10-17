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
