import { test as base } from "@playwright/test"

export { expect, type Page, type Route } from "@playwright/test"

export const test = base.extend<{ unmockedApi: void }>({
  // Registered before each spec's own routes, so those take precedence. 500 is what the
  // Vite proxy returns when no API server runs, minus its ECONNREFUSED log noise.
  unmockedApi: [
    async ({ page }, use) => {
      await page.route(
        (url) => url.pathname.startsWith("/api/"),
        (route) => route.fulfill({ status: 500 }),
      )
      await use()
    },
    { auto: true },
  ],
})
