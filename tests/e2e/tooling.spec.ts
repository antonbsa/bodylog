import { readFile } from "node:fs/promises"

import { expect, type Page, signedInSession, test } from "./fixtures"

async function mockSession(page: Page, authenticated: boolean) {
  await page.route("**/api/auth/session", async (route) => {
    await route.fulfill({
      body: JSON.stringify(
        authenticated
          ? signedInSession
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
  await mockWeeklyDashboard(page)
  await mockMeasurementList(page)
}

async function mockWeeklyDashboard(page: Page) {
  await page.route("**/api/dashboard/weekly", async (route) => {
    await route.fulfill({
      body: JSON.stringify({
        current: {
          weekStartDate: "2026-06-08",
          weekEndDate: "2026-06-14",
          measurementCount: 2,
          isCurrentWeek: true,
          isPartialWeek: true,
          averages: {
            weightKg: 73,
            bmi: 25.87,
            bodyFatPercentage: 14,
            bodyFatKg: 10.36,
            musclePercentage: 44,
            muscleKg: 32.56,
            restingMetabolismKcal: 1700,
          },
        },
        previous: {
          weekStartDate: "2026-06-01",
          weekEndDate: "2026-06-07",
          measurementCount: 2,
          isCurrentWeek: false,
          isPartialWeek: false,
          averages: {
            weightKg: 72,
            bmi: 25.51,
            bodyFatPercentage: 16.2,
            bodyFatKg: 11.67,
            musclePercentage: 42.75,
            muscleKg: 30.79,
            restingMetabolismKcal: 1690,
          },
        },
      }),
      contentType: "application/json",
      status: 200,
    })
  })
}

async function mockMeasurementList(page: Page) {
  await page.route("**/api/history/weeks*", (route) =>
    route.fulfill({
      body: JSON.stringify({ nextBefore: null, weeks: [] }),
      contentType: "application/json",
      status: 200,
    }),
  )
  await page.route("**/api/measurements?*", async (route) => {
    await route.fulfill({
      body: JSON.stringify({
        items: [],
      }),
      contentType: "application/json",
      status: 200,
    })
  })
}

test("login screen renders first with the GitHub and Google sign-ins", async ({
  page,
}) => {
  await mockSession(page, false)
  await page.goto("/")

  await expect(page.getByRole("heading", { name: "Entrar" })).toBeVisible()
  await expect(
    page.getByRole("link", { name: "Entrar com GitHub" }),
  ).toHaveAttribute("href", "/api/auth/github")
  await expect(
    page.getByRole("link", { name: "Entrar com Google" }),
  ).toHaveAttribute("href", "/api/auth/google")
})

test("unknown routes show the not-found screen", async ({ page }) => {
  await mockSession(page, false)
  await page.goto("/rota-inexistente")

  await expect(
    page.getByRole("heading", { name: "404 Not Found" }),
  ).toBeVisible()

  await page.getByRole("button", { name: "Voltar ao início" }).click()
  await expect(page).toHaveURL("/")
  await expect(page.getByRole("heading", { name: "Entrar" })).toBeVisible()
})

for (const [code, message] of [
  ["declined", "Você cancelou o login. Tente de novo quando quiser."],
  [
    "state",
    "O login expirou ou foi aberto em outra janela. Tente entrar de novo.",
  ],
  ["failed", "Não foi possível entrar. Tente novamente em instantes."],
]) {
  test(`login screen explains a ${code} sign-in and clears it from the address`, async ({
    page,
  }) => {
    await mockSession(page, false)
    await page.goto(`/?error=${code}`)

    await expect(page.getByRole("alert")).toHaveText(message)
    await expect(page).toHaveURL("/")

    await page.reload()
    await expect(page.getByRole("heading", { name: "Entrar" })).toBeVisible()
    await expect(page.getByRole("alert")).toHaveCount(0)
  })
}

test("the built login screen leaves out the dev-only Entrar como dev button", async ({
  page,
}) => {
  await mockSession(page, false)
  await page.goto("/")

  await expect(
    page.getByRole("link", { name: "Entrar com GitHub" }),
  ).toBeVisible()
  await expect(
    page.getByRole("button", { name: "Entrar como dev" }),
  ).toHaveCount(0)
})

test("a signed-in session opens Início and survives a page reload", async ({
  page,
}) => {
  await mockSession(page, true)

  await page.goto("/")
  await expect(page.getByRole("heading", { name: "Início" })).toBeVisible()

  await page.reload()
  await expect(page.getByRole("heading", { name: "Início" })).toBeVisible()
  await expect(page.getByText("Esta semana")).toBeVisible()
})

test("logout returns to the login screen", async ({ page }) => {
  let isAuthenticated = true
  let logoutRequestCount = 0

  await mockWeeklyDashboard(page)
  await mockMeasurementList(page)
  await page.route("**/api/auth/session", (route) =>
    route.fulfill({
      body: JSON.stringify(
        isAuthenticated ? signedInSession : { statusCode: 401 },
      ),
      contentType: "application/json",
      status: isAuthenticated ? 200 : 401,
    }),
  )
  await page.route("**/api/auth/logout", async (route) => {
    logoutRequestCount += 1
    isAuthenticated = false

    await route.fulfill({
      body: JSON.stringify({
        ok: true,
      }),
      contentType: "application/json",
      headers: {
        "set-cookie":
          "bodylog_session=; Max-Age=0; Path=/; HttpOnly; SameSite=Lax",
      },
      status: 200,
    })
  })

  await page.goto("/")
  await page.getByRole("link", { name: "Ajustes" }).click()
  await page.getByRole("button", { name: "Sair" }).click()

  const logoutDialog = page.getByRole("alertdialog", {
    name: "Sair do BodyLog",
  })

  await expect(logoutDialog).toBeVisible()
  await expect(
    logoutDialog.getByText("Deseja encerrar a sessão atual?"),
  ).toBeVisible()
  expect(logoutRequestCount).toBe(0)

  await logoutDialog.getByRole("button", { name: "Cancelar" }).click()
  await expect(logoutDialog).toBeHidden()
  await expect(page.getByRole("heading", { name: "Ajustes" })).toBeVisible()
  expect(logoutRequestCount).toBe(0)

  await page.getByRole("button", { name: "Sair" }).click()
  await expect(logoutDialog).toBeVisible()
  await logoutDialog.getByRole("button", { name: "Sair", exact: true }).click()

  await expect(page.getByRole("heading", { name: "Entrar" })).toBeVisible()
  expect(logoutRequestCount).toBe(1)

  await page.reload()
  await expect(page.getByRole("heading", { name: "Entrar" })).toBeVisible()
})

test("basic PWA manifest and icons are reachable", async ({
  page,
  request,
}) => {
  await mockSession(page, false)
  await page.goto("/")

  const manifestPath = await page
    .locator('link[rel="manifest"]')
    .getAttribute("href")
  const appleTouchIconPath = await page
    .locator('link[rel="apple-touch-icon"]')
    .getAttribute("href")

  expect(manifestPath).toBe("/manifest.webmanifest")
  expect(appleTouchIconPath).toBe("/icons/apple-touch-icon.png")

  if (!manifestPath) {
    throw new Error("Manifest link is missing")
  }

  if (!appleTouchIconPath) {
    throw new Error("Apple touch icon link is missing")
  }

  const manifestResponse = await request.get(manifestPath)
  expect(manifestResponse.ok()).toBe(true)

  const manifest = (await manifestResponse.json()) as {
    display?: string
    id?: string
    icons?: Array<{ sizes?: string; src?: string; type?: string }>
    name?: string
    start_url?: string
    theme_color?: string
  }

  expect(manifest.name).toBe("BodyLog")
  expect(manifest.id).toBe("/")
  expect(manifest.start_url).toBe("/")
  expect(manifest.display).toBe("standalone")
  expect(manifest.theme_color).toBe("#111111")

  const icons = manifest.icons ?? []
  expect(icons).toEqual(
    expect.arrayContaining([
      expect.objectContaining({
        sizes: "192x192",
        src: "/icons/icon-192.png",
        type: "image/png",
      }),
      expect.objectContaining({
        sizes: "512x512",
        src: "/icons/icon-512.png",
        type: "image/png",
      }),
      expect.objectContaining({
        purpose: "maskable",
        sizes: "512x512",
        src: "/icons/icon-maskable-512.png",
        type: "image/png",
      }),
    ]),
  )

  for (const icon of icons) {
    expect(icon.src).toBeTruthy()

    if (!icon.src) {
      throw new Error("Manifest icon src is missing")
    }

    const iconResponse = await request.get(icon.src)
    expect(iconResponse.ok()).toBe(true)
    expect(iconResponse.headers()["content-type"]).toContain("image/png")
  }

  const appleTouchIconResponse = await request.get(appleTouchIconPath)
  expect(appleTouchIconResponse.ok()).toBe(true)
  expect(appleTouchIconResponse.headers()["content-type"]).toContain(
    "image/png",
  )

  const session = await page.context().newCDPSession(page)
  const installability = (await session.send(
    "Page.getInstallabilityErrors",
  )) as {
    installabilityErrors: unknown[]
  }

  expect(installability.installabilityErrors).toEqual([])
})

test("static asset headers revalidate the HTML entry", async () => {
  const headers = await readFile(
    new URL("../../apps/web/public/_headers", import.meta.url),
    "utf8",
  )

  expect(headers).toContain("/index.html\n  Cache-Control: no-cache")
  expect(headers).toContain("/\n  Cache-Control: no-cache")
})
