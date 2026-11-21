/// <reference types="node" />

import { defineConfig, devices } from "@playwright/test"

// Use a dedicated E2E port so Playwright does not reuse a stale manual Vite server on 5173.
const webPort = 5174
const webBaseUrl = `http://localhost:${webPort}`

export default defineConfig({
  testDir: "./tests/e2e",
  fullyParallel: true,
  // One CI retry absorbs runner-speed flakes; the report still lists them as flaky.
  retries: process.env.CI ? 1 : 0,
  // Private-repo runners have 2 vCPU, where Playwright's default (half the cores) runs a single worker.
  workers: process.env.CI ? 2 : undefined,
  // CI uploads the HTML report as an artifact when E2E fails.
  reporter: process.env.CI ? [["list"], ["html", { open: "never" }]] : "list",
  webServer: {
    // Each test opens a cold browser context, which loads ~86 unbundled modules from `vite serve` but 3 files from the build.
    command: `npm --workspace @bodylog/web exec -- vite build && npm --workspace @bodylog/web exec -- vite preview --host localhost --port ${webPort} --strictPort`,
    reuseExistingServer: true,
    url: webBaseUrl,
  },
  use: {
    baseURL: webBaseUrl,
    trace: "retain-on-failure",
    screenshot: "only-on-failure",
  },
  projects: [
    {
      name: "chromium",
      use: { ...devices["Desktop Chrome"] },
    },
  ],
})
