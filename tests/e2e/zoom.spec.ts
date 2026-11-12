import { expect, test, type Page } from "@playwright/test"

async function mockApi(page: Page, authenticated = true) {
  await page.route("**/api/auth/session", async (route) => {
    await route.fulfill({
      body: JSON.stringify(
        authenticated
          ? { authenticated: true }
          : {
              action: "Entre novamente para continuar.",
              message: "Sessão inválida ou expirada.",
              name: "UnauthorizedError",
              statusCode: 401,
            },
      ),
      contentType: "application/json",
      status: authenticated ? 200 : 401,
    })
  })
  await page.route("**/api/measurements/by-date/*", async (route) => {
    await route.fulfill({
      body: JSON.stringify({
        action: "Informe outra data.",
        message: "Medida não encontrada.",
        name: "NotFoundError",
        statusCode: 404,
      }),
      contentType: "application/json",
      status: 404,
    })
  })
}

async function expectInputsAtLeast16px(page: Page) {
  const sizes = await page
    .locator("input, select, textarea")
    .evaluateAll((elements) =>
      elements.map((element) => parseFloat(getComputedStyle(element).fontSize)),
    )

  expect(sizes.length).toBeGreaterThan(0)
  for (const size of sizes) {
    expect(size).toBeGreaterThanOrEqual(16)
  }
}

test("viewport meta blocks scaling and html only allows panning", async ({
  page,
}) => {
  await mockApi(page)
  await page.goto("/")

  const content = await page
    .locator('meta[name="viewport"]')
    .getAttribute("content")

  expect(content).toContain("maximum-scale=1")
  expect(content).toContain("user-scalable=no")
  await expect(page.locator("html")).toHaveCSS("touch-action", "pan-x pan-y")
})

test("login inputs compute to at least 16px", async ({ page }) => {
  await mockApi(page, false)
  await page.goto("/")
  await expect(page.locator("input").first()).toBeVisible()
  await expectInputsAtLeast16px(page)
})

test("registration form inputs compute to at least 16px", async ({ page }) => {
  await mockApi(page)
  await page.goto("/registro?data=2026-06-10")
  await expect(page.locator("input").first()).toBeVisible()
  await expectInputsAtLeast16px(page)
})

test("settings inputs compute to at least 16px", async ({ page }) => {
  await mockApi(page)
  await page.goto("/ajustes")
  await expect(page.locator('input[type="file"]')).toBeAttached()
  await expectInputsAtLeast16px(page)
})
