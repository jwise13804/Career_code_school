// Playwright runs the real site from a sub-path (/career_code_school/),
// exactly like a GitHub Pages project site.
import { defineConfig, devices } from "@playwright/test";

const port = 4173;
export default defineConfig({
  testDir: "tests",
  timeout: 90_000,
  expect: { timeout: 30_000 },
  retries: process.env.CI ? 1 : 0,
  reporter: process.env.CI ? "github" : "list",
  use: {
    baseURL: `http://localhost:${port}/career_code_school/`,
    trace: "retain-on-failure",
  },
  projects: [
    { name: "desktop", use: { ...devices["Desktop Chrome"] } },
    { name: "phone", use: { ...devices["Pixel 7"] } },
  ],
  webServer: {
    command: `node tools/serve.mjs`,
    url: `http://localhost:${port}/career_code_school/`,
    reuseExistingServer: !process.env.CI,
    env: { PORT: String(port) },
  },
});
