import { expect, test, type Page, type Route } from "./fixtures"

const CSV_HEADER =
  "date,weight_kg,body_fat_percentage,muscle_percentage,resting_metabolism_kcal"

function json(route: Route, body: unknown, status = 200) {
  return route.fulfill({
    body: JSON.stringify(body),
    contentType: "application/json",
    status,
  })
}

async function mockApi(page: Page) {
  await page.route("**/api/auth/session", (route) =>
    json(route, { authenticated: true }),
  )
  await page.route("**/api/auth/logout", (route) => json(route, { ok: true }))
  await page.route("**/api/dashboard/weekly", (route) => {
    const week = {
      averages: {},
      isCurrentWeek: true,
      isPartialWeek: true,
      measurementCount: 0,
      weekEndDate: "2026-06-14",
      weekStartDate: "2026-06-08",
    }

    return json(route, {
      current: week,
      previous: { ...week, isCurrentWeek: false, isPartialWeek: false },
    })
  })
  await page.route("**/api/measurements?*", (route) =>
    json(route, { items: [] }),
  )
}

async function importCsv(page: Page) {
  await page.locator('input[type="file"]').setInputFiles({
    buffer: Buffer.from(
      [CSV_HEADER, "2026-06-10,72.9,14.46,43.72,1700"].join("\n"),
    ),
    mimeType: "text/csv",
    name: "measurements.csv",
  })
}

const toast = (page: Page) => page.getByRole("status")
const failure = (page: Page) => page.getByRole("alert")

test("the theme selector applies immediately, persists and Sistema follows the OS", async ({
  page,
}) => {
  await mockApi(page)
  await page.emulateMedia({ colorScheme: "light" })
  await page.goto("/ajustes")

  const html = page.locator("html")
  const option = (name: string) => page.getByRole("radio", { name })

  await expect(option("Sistema")).toHaveAttribute("aria-checked", "true")
  await expect(html).not.toHaveAttribute("data-theme", /.*/)

  await option("Escuro").click()
  await expect(html).toHaveAttribute("data-theme", "dark")
  await expect(option("Escuro")).toHaveAttribute("aria-checked", "true")
  await expect(page.locator("body")).toHaveCSS(
    "background-color",
    "rgb(17, 17, 17)",
  )

  await page.reload()
  await expect(html).toHaveAttribute("data-theme", "dark")
  await expect(option("Escuro")).toHaveAttribute("aria-checked", "true")

  await option("Claro").click()
  await expect(html).toHaveAttribute("data-theme", "light")

  await option("Sistema").click()
  await expect(html).not.toHaveAttribute("data-theme", /.*/)
  await expect(page.locator("body")).toHaveCSS(
    "background-color",
    "rgb(244, 244, 241)",
  )

  await page.emulateMedia({ colorScheme: "dark" })
  await expect(page.locator("body")).toHaveCSS(
    "background-color",
    "rgb(17, 17, 17)",
  )
})

test("the theme selector reflects the choice when storage is blocked", async ({
  page,
}) => {
  await mockApi(page)
  await page.addInitScript(() => {
    const blocked = () => {
      throw new Error("storage blocked")
    }

    Storage.prototype.getItem = blocked
    Storage.prototype.setItem = blocked
    Storage.prototype.removeItem = blocked
  })
  await page.goto("/ajustes")

  const option = (name: string) => page.getByRole("radio", { name })

  await expect(option("Sistema")).toHaveAttribute("aria-checked", "true")
  await option("Escuro").click()
  await expect(page.locator("html")).toHaveAttribute("data-theme", "dark")
  await expect(option("Escuro")).toHaveAttribute("aria-checked", "true")
  await expect(option("Sistema")).toHaveAttribute("aria-checked", "false")
})

test("the settings card has no Radix callouts or in-flow status", async ({
  page,
}) => {
  await mockApi(page)
  await page.goto("/ajustes")

  await expect(page.getByRole("heading", { name: "Ajustes" })).toBeVisible()
  await expect(page.locator(".rt-CalloutRoot")).toHaveCount(0)
  await expect(failure(page)).toHaveCount(0)
})

test("export downloads the CSV and shows a success toast that auto-dismisses", async ({
  page,
}) => {
  await mockApi(page)
  await page.route("**/api/export/csv", (route) =>
    route.fulfill({
      body: `${CSV_HEADER}\n2026-06-10,72.9,14.46,43.72,1700`,
      contentType: "text/csv",
      status: 200,
    }),
  )
  await page.goto("/ajustes")

  const downloadPromise = page.waitForEvent("download")

  await page.getByRole("button", { name: "Exportar CSV" }).click()

  expect((await downloadPromise).suggestedFilename()).toBe(
    "bodylog-measurements.csv",
  )
  await expect(toast(page)).toHaveText("CSV exportado")
  await expect(toast(page)).toHaveText("", { timeout: 5000 })
})

test("export shows progress text without moving the row", async ({ page }) => {
  await mockApi(page)

  let release: () => void = () => {}
  const gate = new Promise<void>((resolve) => {
    release = resolve
  })

  await page.route("**/api/export/csv", async (route) => {
    await gate
    await route.fulfill({ body: CSV_HEADER, contentType: "text/csv" })
  })
  await page.goto("/ajustes")

  const button = page.getByRole("button", { name: "Exportar CSV" })
  const before = await button.boundingBox()

  await button.click()

  const loading = page.getByRole("button", { name: "Exportando..." })

  await expect(loading).toBeDisabled()
  expect(await loading.boundingBox()).toEqual(before)
  release()
  await expect(toast(page)).toHaveText("CSV exportado")
})

test("an export failure stays until dismissed with the full text", async ({
  page,
}) => {
  await mockApi(page)
  await page.route("**/api/export/csv", (route) =>
    json(
      route,
      {
        action: "Tente novamente.",
        message: "Não foi possível exportar.",
        name: "InternalServerError",
        statusCode: 500,
      },
      500,
    ),
  )
  await page.goto("/ajustes")
  await page.getByRole("button", { name: "Exportar CSV" }).click()

  await expect(failure(page)).toContainText("Não foi possível exportar.")
  await expect(failure(page)).toContainText("Tente novamente.")
  await page.waitForTimeout(3500)
  await expect(failure(page)).toBeVisible()

  await failure(page).getByRole("button", { name: "Fechar" }).click()
  await expect(failure(page)).toHaveCount(0)
})

test("import shows the imported count", async ({ page }) => {
  await mockApi(page)
  await page.route("**/api/import/csv", (route) =>
    json(route, { created: 20, errors: [], skipped: 1, updated: 4 }),
  )
  await page.goto("/ajustes")
  await importCsv(page)

  await expect(toast(page)).toHaveText("24 medidas importadas")
})

test("import of a single measurement uses the singular", async ({ page }) => {
  await mockApi(page)
  await page.route("**/api/import/csv", (route) =>
    json(route, { created: 1, errors: [], skipped: 0, updated: 0 }),
  )
  await page.goto("/ajustes")
  await importCsv(page)

  await expect(toast(page)).toHaveText("1 medida importada")
})

test("import with row errors shows a persistent toast with the partial message", async ({
  page,
}) => {
  await mockApi(page)
  await page.route("**/api/import/csv", (route) =>
    json(route, {
      created: 2,
      errors: [{ message: "peso inválido", row: 3 }],
      skipped: 0,
      updated: 0,
    }),
  )
  await page.goto("/ajustes")
  await importCsv(page)

  await expect(failure(page)).toContainText(
    "Importação parcial: 2 criados, 0 atualizados, 0 ignorados, 1 erros. Primeiro erro: linha 3, peso inválido.",
  )
  await page.waitForTimeout(3500)
  await expect(failure(page)).toBeVisible()
  await failure(page).getByRole("button", { name: "Fechar" }).click()
  await expect(failure(page)).toHaveCount(0)
})

test("an import failure stays until dismissed", async ({ page }) => {
  await mockApi(page)
  await page.route("**/api/import/csv", (route) =>
    json(
      route,
      {
        action: "Corrija a linha 1: Invalid CSV headers.",
        message: "Nenhum registro foi importado.",
        name: "ValidationError",
        statusCode: 400,
      },
      400,
    ),
  )
  await page.goto("/ajustes")
  await importCsv(page)

  await expect(failure(page)).toContainText(
    "Nenhum registro foi importado. Corrija a linha 1: Invalid CSV headers.",
  )
  await page.waitForTimeout(3500)
  await expect(failure(page)).toBeVisible()
  await expect(page.getByRole("button", { name: "Importar CSV" })).toBeEnabled()
})

test("logout asks for confirmation and returns to the login screen", async ({
  page,
}) => {
  await mockApi(page)
  await page.goto("/ajustes")
  await page.getByRole("button", { name: "Sair" }).click()

  const dialog = page.getByRole("alertdialog", { name: "Sair do BodyLog" })

  await expect(dialog).toContainText("Deseja encerrar a sessão atual?")
  await dialog.getByRole("button", { name: "Sair", exact: true }).click()

  await expect(page.getByRole("heading", { name: "Entrar" })).toBeVisible()
})

test("a toast sits above the tab bar without shifting the layout", async ({
  page,
}) => {
  await mockApi(page)
  await page.route("**/api/export/csv", (route) =>
    route.fulfill({ body: CSV_HEADER, contentType: "text/csv" }),
  )
  await page.goto("/ajustes")

  const title = page.getByRole("heading", { name: "Ajustes" })
  const titleBox = await title.boundingBox()

  await page.getByRole("button", { name: "Exportar CSV" }).click()

  const pill = toast(page).locator(".toast")

  await expect(pill).toBeVisible()
  expect(await title.boundingBox()).toEqual(titleBox)

  const pillBox = await pill.boundingBox()
  const barBox = await page.locator(".tabbar").boundingBox()

  expect(pillBox && barBox && pillBox.y + pillBox.height <= barBox.y).toBe(true)
})
