import { readFile } from "node:fs/promises"

import { expect, test, type Page } from "@playwright/test"

async function mockSession(page: Page, authenticated: boolean) {
  await page.route("**/api/auth/session", async (route) => {
    await route.fulfill({
      body: JSON.stringify({
        authenticated,
      }),
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
        display: {
          mode: "current-week",
          summary: {
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
          variation: {
            weightKg: {
              absolute: 1,
              relativePercentage: 1.39,
              direction: "up",
            },
            bodyFatPercentage: {
              absolutePercentagePoints: -2.2,
              relativePercentage: -13.58,
              direction: "down",
            },
            bodyFatKg: {
              absolute: -1.31,
              relativePercentage: -11.23,
              direction: "down",
            },
            musclePercentage: {
              absolutePercentagePoints: 1.25,
              relativePercentage: 2.92,
              direction: "up",
            },
            muscleKg: {
              absolute: 1.77,
              relativePercentage: 5.75,
              direction: "up",
            },
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
        variation: {
          weightKg: {
            absolute: 1,
            relativePercentage: 1.39,
            direction: "up",
          },
          bodyFatPercentage: {
            absolutePercentagePoints: -2.2,
            relativePercentage: -13.58,
            direction: "down",
          },
          bodyFatKg: {
            absolute: -1.31,
            relativePercentage: -11.23,
            direction: "down",
          },
          musclePercentage: {
            absolutePercentagePoints: 1.25,
            relativePercentage: 2.92,
            direction: "up",
          },
          muscleKg: {
            absolute: 1.77,
            relativePercentage: 5.75,
            direction: "up",
          },
        },
      }),
      contentType: "application/json",
      status: 200,
    })
  })
}

async function mockMeasurementList(page: Page) {
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

test("login screen renders first", async ({ page }) => {
  await mockSession(page, false)
  await page.goto("/")

  await expect(page.getByRole("heading", { name: "Entrar" })).toBeVisible()
  await expect(page.getByLabel("Senha")).toBeVisible()
})

test("login form exposes password manager metadata", async ({ page }) => {
  await mockSession(page, false)
  await page.goto("/")

  const usernameInput = page.locator('input[name="username"]')
  const passwordInput = page.getByLabel("Senha")

  await expect(usernameInput).toHaveAttribute("autocomplete", "username")
  await expect(usernameInput).toHaveAttribute("type", "text")
  await expect(usernameInput).toHaveValue("bodylog")
  await expect(usernameInput).toHaveClass("password-manager-username")
  await expect(passwordInput).toHaveAttribute("id", "password")
  await expect(passwordInput).toHaveAttribute("name", "password")
  await expect(passwordInput).toHaveAttribute("autocomplete", "password")
  await expect(passwordInput).toHaveAttribute("autocapitalize", "none")
  await expect(passwordInput).toHaveAttribute("autocorrect", "off")
})

test("login screen shows invalid password errors", async ({ page }) => {
  await mockSession(page, false)
  await page.route("**/api/auth/login", async (route) => {
    await route.fulfill({
      body: JSON.stringify({
        error: "INVALID_PASSWORD",
        ok: false,
      }),
      contentType: "application/json",
      status: 401,
    })
  })

  await page.goto("/")
  await page.getByLabel("Senha").fill("senha-errada")
  await page.getByRole("button", { name: "Entrar" }).click()

  await expect(page.getByRole("alert")).toHaveText(
    "Senha inválida. Tente novamente.",
  )
})

test("login screen opens the app after a valid password", async ({ page }) => {
  await mockSession(page, false)
  await page.route("**/api/auth/login", async (route) => {
    expect(route.request().postDataJSON()).toEqual({
      password: "senha-correta",
    })

    await route.fulfill({
      body: JSON.stringify({
        ok: true,
      }),
      contentType: "application/json",
      headers: {
        "set-cookie": "bodylog_session=test-session; HttpOnly; SameSite=Lax",
      },
      status: 200,
    })
  })

  await page.goto("/")
  await page.getByLabel("Senha").fill("senha-correta")
  await page.getByRole("button", { name: "Entrar" }).click()

  await expect(
    page.getByRole("heading", { name: "Resumo da semana" }),
  ).toBeVisible()
  await expect(page.getByText("Peso médio")).toBeVisible()
})

test("authenticated session survives a page reload", async ({ page }) => {
  let isAuthenticated = false

  await page.route("**/api/auth/session", async (route) => {
    await route.fulfill({
      body: JSON.stringify({
        authenticated: isAuthenticated,
      }),
      contentType: "application/json",
      status: isAuthenticated ? 200 : 401,
    })
  })
  await page.route("**/api/auth/login", async (route) => {
    isAuthenticated = true

    await route.fulfill({
      body: JSON.stringify({
        ok: true,
      }),
      contentType: "application/json",
      headers: {
        "set-cookie": "bodylog_session=test-session; HttpOnly; SameSite=Lax",
      },
      status: 200,
    })
  })

  await page.goto("/")
  await page.getByLabel("Senha").fill("senha-correta")
  await page.getByRole("button", { name: "Entrar" }).click()
  await page.reload()

  await expect(
    page.getByRole("heading", { name: "Resumo da semana" }),
  ).toBeVisible()
  await expect(page.getByText("Peso médio")).toBeVisible()
})

test("logout returns to the login screen", async ({ page }) => {
  await mockSession(page, false)
  await page.route("**/api/auth/login", async (route) => {
    await route.fulfill({
      body: JSON.stringify({
        ok: true,
      }),
      contentType: "application/json",
      headers: {
        "set-cookie": "bodylog_session=test-session; HttpOnly; SameSite=Lax",
      },
      status: 200,
    })
  })
  await page.route("**/api/auth/logout", async (route) => {
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
  await page.getByLabel("Senha").fill("senha-correta")
  await page.getByRole("button", { name: "Entrar" }).click()
  await page.getByRole("button", { name: "Sair" }).click()

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
  expect(appleTouchIconPath).toBe("/icons/icon-192.png")

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
  expect(manifest.theme_color).toBe("#0d1117")

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

test("Cloudflare Pages headers revalidate the HTML entry", async () => {
  const headers = await readFile(
    new URL("../../apps/web/public/_headers", import.meta.url),
    "utf8",
  )

  expect(headers).toContain("/index.html\n  Cache-Control: no-cache")
  expect(headers).toContain("/\n  Cache-Control: no-cache")
})
