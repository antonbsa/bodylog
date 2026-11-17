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
  // CI uploads the HTML report as an artifact when E2E fails.
  reporter: process.env.CI ? [["list"], ["html", { open: "never" }]] : "list",
  webServer: {
    command: `BODYLOG_WEB_PORT=${webPort} npm --workspace @bodylog/web run dev`,
    reuseExistingServer: true,
    url: webBaseUrl,
  },
  use: {
    baseURL: webBaseUrl,
    trace: "retain-on-failure",
    screenshot: "on",
  },
  projects: [
    {
      name: "chromium",
      use: { ...devices["Desktop Chrome"] },
    },
  ],
})
