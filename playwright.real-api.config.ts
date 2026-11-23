/// <reference types="node" />

import { defineConfig, devices } from "@playwright/test"

const port = 8788
const baseURL = `http://localhost:${port}`
const wrangler = "npx wrangler --config apps/api/wrangler.toml"
const stateDir = ".e2e-state"

/** The real-API tier: the built web app served by the `e2e` Worker over its own local D1, wiped and migrated on every run. */
export default defineConfig({
  testDir: "./tests/e2e-api",
  fullyParallel: true,
  retries: process.env.CI ? 1 : 0,
  workers: process.env.CI ? 2 : undefined,
  // Own output folders, so a mocked run started alongside doesn't wipe these traces.
  outputDir: "test-results/real-api",
  reporter: process.env.CI
    ? [
        ["list"],
        ["html", { open: "never", outputFolder: "playwright-report/real-api" }],
      ]
    : "list",
  webServer: {
    command: [
      `rm -rf ${stateDir}`,
      // Own build folder: the mocked tier's reused `vite preview` serves apps/web/dist, which a rebuild there would empty mid-run.
      `npm --workspace @bodylog/web exec -- vite build --outDir ../../${stateDir}/web`,
      `${wrangler} d1 migrations apply DB --env e2e --local --persist-to ${stateDir}`,
      `${wrangler} dev --env e2e --persist-to ${stateDir} --port ${port} --show-interactive-dev-session false`,
    ].join(" && "),
    // A reused server would keep another run's D1, so a busy port fails the run instead.
    reuseExistingServer: false,
    url: `${baseURL}/api/health`,
    timeout: 180_000,
  },
  use: {
    baseURL,
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
