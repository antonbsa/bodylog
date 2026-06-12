/// <reference types="node" />

import { defineConfig, devices } from "@playwright/test"

// Use a dedicated E2E port so Playwright does not reuse a stale manual Vite server on 5173.
const webPort = 5174
const webBaseUrl = `http://localhost:${webPort}`

export default defineConfig({
  testDir: "./tests/e2e",
  fullyParallel: true,
  reporter: "list",
  webServer: {
    command: `BODYLOG_WEB_PORT=${webPort} npm --workspace @bodylog/web run dev`,
    reuseExistingServer: true,
    url: webBaseUrl,
  },
  use: {
    baseURL: webBaseUrl,
    trace: "on-first-retry",
  },
  projects: [
    {
      name: "chromium",
      use: { ...devices["Desktop Chrome"] },
    },
  ],
})
