import { test as base } from "@playwright/test"

import type { SessionResponse } from "../../types/auth"

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

/** The `GET /api/auth/session` body for a signed-in user. */
export const signedInSession: SessionResponse = {
  user: { displayName: "Ana", email: "ana@example.com", id: "user-1" },
}
