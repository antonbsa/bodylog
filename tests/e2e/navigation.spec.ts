import { expect, test, type Page } from "@playwright/test"

const THEME_STORAGE_KEY = "bodylog-theme"

const MAIN_ROUTES = [
  { heading: "Resumo da semana", path: "/", tab: "Início" },
  { heading: "Histórico", path: "/historico", tab: "Histórico" },
  { heading: "Tendências", path: "/tendencias", tab: "Tendências" },
  { heading: "Ajustes", path: "/ajustes", tab: "Ajustes" },
] as const

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
  await page.route("**/api/dashboard/weekly", async (route) => {
    const emptyWeek = {
      weekStartDate: "2026-06-08",
      weekEndDate: "2026-06-14",
      measurementCount: 0,
      isCurrentWeek: true,
      isPartialWeek: true,
      averages: {
        weightKg: null,
        bmi: null,
        bodyFatPercentage: null,
        bodyFatKg: null,
        musclePercentage: null,
        muscleKg: null,
        restingMetabolismKcal: null,
      },
    }

    await route.fulfill({
      body: JSON.stringify({
        current: emptyWeek,
        previous: { ...emptyWeek, isCurrentWeek: false, isPartialWeek: false },
        display: { mode: "current-week", summary: emptyWeek, variation: {} },
        variation: {},
      }),
      contentType: "application/json",
      status: 200,
    })
  })
  await page.route("**/api/measurements?*", async (route) => {
    await route.fulfill({
      body: JSON.stringify({ items: [] }),
      contentType: "application/json",
      status: 200,
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

function getToday() {
  const today = new Date()

  return [
    today.getFullYear(),
    String(today.getMonth() + 1).padStart(2, "0"),
    String(today.getDate()).padStart(2, "0"),
  ].join("-")
}

const mainNav = (page: Page) =>
  page.getByRole("navigation", { name: "Navegação principal" })

test("bottom bar shows five items in order with the central register button", async ({
  page,
}) => {
  await mockApi(page)
  await page.goto("/")

  const items = mainNav(page).getByRole("link")

  await expect(items).toHaveCount(5)
  await expect(items.nth(0)).toHaveText("Início")
  await expect(items.nth(1)).toHaveText("Histórico")
  await expect(items.nth(2)).toHaveAttribute("aria-label", "Registrar medida")
  await expect(items.nth(2)).toHaveText("")
  await expect(items.nth(3)).toHaveText("Tendências")
  await expect(items.nth(4)).toHaveText("Ajustes")
  await expect(items.nth(2)).toHaveAttribute(
    "href",
    `/registro?data=${getToday()}`,
  )

  const position = await mainNav(page).evaluate(
    (element) =>
      getComputedStyle(element.parentElement as HTMLElement).position,
  )

  expect(position).not.toBe("fixed")
})

for (const route of MAIN_ROUTES) {
  test(`deep link ${route.path} works after reload and marks its tab`, async ({
    page,
  }) => {
    await mockApi(page)
    await page.goto(route.path)

    for (const phase of ["load", "reload"]) {
      if (phase === "reload") {
        await page.reload()
      }

      await expect(
        page.getByRole("heading", { level: 1, name: route.heading }),
      ).toBeVisible()
      await expect(mainNav(page).locator('[aria-current="page"]')).toHaveText(
        route.tab,
      )
      await expect(mainNav(page).locator('[aria-current="page"]')).toHaveCount(
        1,
      )
    }
  })
}

test("navigates between tabs and focuses the new page title", async ({
  page,
}) => {
  await mockApi(page)
  await page.goto("/")

  for (const route of [...MAIN_ROUTES].reverse()) {
    await mainNav(page).getByRole("link", { name: route.tab }).click()

    await expect(page).toHaveURL(route.path)
    await expect(
      page.getByRole("heading", { level: 1, name: route.heading }),
    ).toBeFocused()
    await expect(mainNav(page).locator('[aria-current="page"]')).toHaveText(
      route.tab,
    )
  }
})

test("central button opens the registration route without the bar", async ({
  page,
}) => {
  await mockApi(page)
  await page.goto("/")
  await page.getByRole("link", { name: "Registrar medida" }).click()

  await expect(page).toHaveURL(`/registro?data=${getToday()}`)
  await expect(page.getByLabel("Peso")).toBeVisible()
  await expect(mainNav(page)).toHaveCount(0)

  await page.reload()
  await expect(page.getByLabel("Peso")).toBeVisible()
  await expect(mainNav(page)).toHaveCount(0)
})

test("registration cancel returns to the previous screen", async ({ page }) => {
  await mockApi(page)
  await page.goto("/historico")
  await page.getByRole("link", { name: "Registrar medida" }).click()
  await page.getByRole("button", { name: "Cancelar" }).click()

  await expect(page).toHaveURL("/historico")
})

test("hides the bar on the login screen", async ({ page }) => {
  await mockApi(page, false)
  await page.goto("/historico")

  await expect(page.getByLabel("Senha")).toBeVisible()
  await expect(mainNav(page)).toHaveCount(0)
})

test("unknown paths show the not-found screen without the bar", async ({
  page,
}) => {
  await mockApi(page)
  await page.goto("/rota-inexistente")

  await expect(
    page.getByRole("heading", { name: "404 Not Found" }),
  ).toBeVisible()
  await expect(mainNav(page)).toHaveCount(0)
})

test("a stored theme preference is applied before React mounts", async ({
  page,
}) => {
  await mockApi(page)
  await page.goto("/")
  await page.evaluate(
    (key) => localStorage.setItem(key, "dark"),
    THEME_STORAGE_KEY,
  )

  // Abort the app bundle so only the inline script in index.html can set the attribute.
  await page.route("**/src/main.tsx*", (route) => route.abort())
  await page.reload()

  await expect(page.locator("html")).toHaveAttribute("data-theme", "dark")
  await expect(page.locator("#root")).toBeEmpty()
})

test("a stored theme preference persists across reloads and drives Radix", async ({
  page,
}) => {
  await mockApi(page)
  await page.emulateMedia({ colorScheme: "dark" })
  await page.goto("/")
  await page.evaluate(
    (key) => localStorage.setItem(key, "light"),
    THEME_STORAGE_KEY,
  )
  await page.reload()

  await expect(page.locator("html")).toHaveAttribute("data-theme", "light")
  await expect(page.locator(".radix-themes").first()).toHaveClass(/\blight\b/)
  await expect(page.locator("body")).toHaveCSS(
    "background-color",
    "rgb(244, 244, 241)",
  )

  await page.reload()
  await expect(page.locator("html")).toHaveAttribute("data-theme", "light")
})

test("system mode follows the OS theme live", async ({ page }) => {
  await mockApi(page)
  await page.emulateMedia({ colorScheme: "light" })
  await page.goto("/")

  await expect(page.locator("html")).not.toHaveAttribute("data-theme", /.*/)
  await expect(page.locator(".radix-themes").first()).toHaveClass(/\blight\b/)
  await expect(page.locator("body")).toHaveCSS(
    "background-color",
    "rgb(244, 244, 241)",
  )

  await page.emulateMedia({ colorScheme: "dark" })

  await expect(page.locator(".radix-themes").first()).toHaveClass(/\bdark\b/)
  await expect(page.locator("body")).toHaveCSS(
    "background-color",
    "rgb(17, 17, 17)",
  )

  await page.emulateMedia({ colorScheme: "light" })

  await expect(page.locator(".radix-themes").first()).toHaveClass(/\blight\b/)
})
