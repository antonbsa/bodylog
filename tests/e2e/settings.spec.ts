import {
  expect,
  type Page,
  type Route,
  signedInSession,
  test,
} from "./fixtures"

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
    json(route, signedInSession),
  )
  await page.route("**/api/auth/logout", (route) => json(route, { ok: true }))
  await page.route("**/api/tokens", (route) => json(route, { items: [] }))
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

// Scoped to the toast region: other sections have their own status text.
const toast = (page: Page) => page.locator(".toast-region").getByRole("status")
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

const PREVIEW = {
  counts: { created: 2, invalid: 1, noMeasurement: 1, updated: 1 },
  ignoredColumns: ["IMC"],
  invalidRows: [
    { column: "Sono", message: "Número inválido.", row: 5, value: "6-7" },
  ],
  period: { from: "2026-06-25", to: "2026-06-28" },
  updatedDates: ["2026-06-28"],
}

async function mockPreview(page: Page, preview: unknown = PREVIEW) {
  await page.route("**/api/import/csv/preview", (route) => json(route, preview))
}

const dialog = (page: Page) =>
  page.getByRole("dialog", { name: "Importar CSV" })

test("the info button beside Importar CSV explains the file format", async ({
  page,
}) => {
  await mockApi(page)
  await page.goto("/ajustes")

  const help = page.getByRole("dialog", { name: "Formato do CSV" })

  await expect(page.getByText("Colunas obrigatórias")).toBeHidden()
  await page.getByRole("button", { name: "Formato do CSV" }).click()
  await expect(help).toContainText(
    "Colunas obrigatórias: Data e Peso. Datas em DD/MM/AAAA ou AAAA-MM-DD.",
  )
  await expect(help).toContainText("Colunas desconhecidas, como IMC")
  await help.getByRole("button", { name: "Fechar" }).click()
  await expect(help).toHaveCount(0)
  await expect(
    page.getByRole("button", { name: "Formato do CSV" }),
  ).toBeFocused()
})

test("choosing a file shows the preview and writes nothing until confirmed", async ({
  page,
}) => {
  await mockApi(page)
  await mockPreview(page)

  let imports = 0

  await page.route("**/api/import/csv", (route) => {
    imports += 1

    return json(route, { created: 2, skippedInvalid: 1, updated: 1 })
  })
  await page.goto("/ajustes")
  await importCsv(page)

  await expect(dialog(page)).toContainText("Período: 25/06/2026 a 28/06/2026")
  await expect(dialog(page)).toContainText("Colunas ignoradas: IMC")
  await expect(
    dialog(page).getByRole("button", { name: "Sono: número inválido 1 linha" }),
  ).toBeVisible()
  await expect(
    dialog(page).getByRole("button", {
      name: "Datas que serão atualizadas 1 data",
    }),
  ).toBeVisible()
  expect(imports).toBe(0)

  await dialog(page)
    .getByRole("button", { name: "Pular inválidas e importar" })
    .click()

  await expect(toast(page)).toHaveText(
    "3 medidas importadas (2 novas, 1 atualizada) · 1 inválida pulada",
  )
  await expect(dialog(page)).toHaveCount(0)
  expect(imports).toBe(1)
})

test("each preview group opens its full list in a sheet", async ({ page }) => {
  await mockApi(page)
  await mockPreview(page, {
    ...PREVIEW,
    counts: { created: 2, invalid: 40, noMeasurement: 0, updated: 0 },
    invalidRows: Array.from({ length: 40 }, (_, index) => ({
      column: "Data",
      message: "Data inválida. Use DD/MM/AAAA ou AAAA-MM-DD.",
      row: index + 2,
      value: `${index + 1}/05`,
    })),
    updatedDates: [],
  })
  await page.goto("/ajustes")
  await importCsv(page)

  const group = dialog(page).getByRole("button", {
    name: /^Data .* 40 linhas$/,
  })

  await expect(dialog(page).getByText("Linha 2", { exact: true })).toHaveCount(
    0,
  )
  await group.click()

  const sheet = page.getByRole("dialog", { name: "Data inválida" })

  await expect(sheet).toContainText("Use DD/MM/AAAA ou AAAA-MM-DD.")
  await expect(sheet.getByRole("listitem")).toHaveCount(40)
  await expect(sheet.getByRole("listitem").last()).toHaveText("Linha 4140/05")
  await sheet.getByRole("button", { name: "Fechar" }).click()
  await expect(sheet).toHaveCount(0)
  await expect(dialog(page)).toBeVisible()
  await expect(group).toBeFocused()
})

test("cancelling the preview leaves the data unchanged", async ({ page }) => {
  await mockApi(page)
  await mockPreview(page)

  let imports = 0

  await page.route("**/api/import/csv", (route) => {
    imports += 1

    return json(route, { created: 0, skippedInvalid: 0, updated: 0 })
  })
  await page.goto("/ajustes")
  await importCsv(page)
  await dialog(page).getByRole("button", { name: "Cancelar" }).click()

  await expect(dialog(page)).toHaveCount(0)
  expect(imports).toBe(0)
})

test("a file without invalid rows offers Confirmar", async ({ page }) => {
  await mockApi(page)
  await mockPreview(page, {
    ...PREVIEW,
    counts: { created: 1, invalid: 0, noMeasurement: 0, updated: 0 },
    invalidRows: [],
    updatedDates: [],
  })
  await page.goto("/ajustes")
  await importCsv(page)

  await expect(
    dialog(page).getByRole("button", { name: "Confirmar" }),
  ).toBeVisible()
})

test("the write action is hidden when no row would be written", async ({
  page,
}) => {
  await mockApi(page)
  await mockPreview(page, {
    ...PREVIEW,
    counts: { created: 0, invalid: 1, noMeasurement: 0, updated: 0 },
    period: null,
    updatedDates: [],
  })
  await page.goto("/ajustes")
  await importCsv(page)

  await expect(
    dialog(page).getByRole("button", { name: "Cancelar" }),
  ).toBeVisible()
  await expect(
    dialog(page).getByRole("button", { name: /importar|Confirmar/ }),
  ).toHaveCount(0)
})

test("a file-level error shows a persistent toast and no dialog", async ({
  page,
}) => {
  await mockApi(page)
  await page.route("**/api/import/csv/preview", (route) =>
    json(
      route,
      {
        action:
          'Inclua uma coluna chamada "Peso" (ou "weight_kg") e tente novamente.',
        message: 'A coluna obrigatória "Peso" não foi encontrada.',
        name: "ValidationError",
        statusCode: 400,
      },
      400,
    ),
  )
  await page.goto("/ajustes")
  await importCsv(page)

  await expect(failure(page)).toContainText(
    'A coluna obrigatória "Peso" não foi encontrada.',
  )
  await expect(dialog(page)).toHaveCount(0)
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

async function mockProfile(
  page: Page,
  user: Partial<typeof signedInSession.user>,
) {
  const sessionUser = { ...signedInSession.user, ...user }
  const updates: unknown[] = []

  await page.route("**/api/auth/session", (route) =>
    json(route, { user: sessionUser }),
  )
  await page.route("**/api/me", (route) => {
    const update = route.request().postDataJSON() as Record<string, unknown>

    updates.push(update)
    Object.assign(sessionUser, update)

    return json(route, { user: sessionUser })
  })

  return updates
}

const heightRow = (page: Page) => page.getByRole("button", { name: /^Altura/ })
const heightDialog = (page: Page) =>
  page.getByRole("dialog", { name: "Altura" })

test("a missing height is flagged, and saving one updates the row", async ({
  page,
}) => {
  await mockApi(page)
  const updates = await mockProfile(page, { heightCm: null })

  await page.goto("/ajustes")
  await expect(heightRow(page)).toContainText("Não informada")
  await expect(heightRow(page)).toContainText(
    "Informe sua altura para calcular o IMC.",
  )

  await heightRow(page).click()
  await heightDialog(page).getByLabel("Altura").pressSequentially("172")
  await heightDialog(page).getByRole("button", { name: "Salvar" }).click()

  await expect(heightDialog(page)).toBeHidden()
  await expect(toast(page)).toHaveText("Altura salva")
  await expect(heightRow(page)).toContainText("172 cm")
  await expect(heightRow(page)).not.toContainText("Informe sua altura")
  expect(updates).toEqual([{ heightCm: 172 }])
})

test("an out-of-range height shows the limits and sends nothing", async ({
  page,
}) => {
  await mockApi(page)
  const updates = await mockProfile(page, { heightCm: 180 })

  await page.goto("/ajustes")
  await expect(heightRow(page)).toContainText("180 cm")
  await heightRow(page).click()

  const field = heightDialog(page).getByLabel("Altura")

  await expect(field).toHaveValue("180")
  await field.press("Backspace")
  await field.press("Backspace")
  await heightDialog(page).getByRole("button", { name: "Salvar" }).click()

  await expect(heightDialog(page)).toContainText(
    "Use um valor entre 50 e 250 cm.",
  )
  await heightDialog(page).getByRole("button", { name: "Cancelar" }).click()
  await expect(heightRow(page)).toContainText("180 cm")
  expect(updates).toEqual([])
})

test("app start sends the device zone when it differs from the stored one", async ({
  page,
}) => {
  await mockApi(page)
  const updates = await mockProfile(page, { timeZone: "Pacific/Kiritimati" })
  const deviceZone = Intl.DateTimeFormat().resolvedOptions().timeZone

  await page.goto("/ajustes")

  // The app renders a screen only after the sync settles.
  await expect(heightRow(page)).toBeVisible()
  expect(updates).toEqual([{ timeZone: deviceZone }])
})

test("Copiar instruções para agente copies the prompt with the origin's format page URL", async ({
  context,
  page,
}) => {
  await context.grantPermissions(["clipboard-read", "clipboard-write"])
  await mockApi(page)
  await page.goto("/ajustes")

  await page
    .getByRole("button", { name: /^Copiar instruções para agente/ })
    .click()

  await expect(toast(page)).toHaveText("Instruções copiadas")
  expect(await page.evaluate(() => navigator.clipboard.readText())).toBe(
    "Quero importar meu histórico de medidas no BodyLog. Siga as instruções em http://localhost:5174/import-format.md para converter a planilha que vou te enviar em um arquivo CSV. Extraia só os dados do formato e não invente valores. Não pergunte nada durante a conversão: o que não se encaixar fica de fora. Me devolva o arquivo para eu importar em Ajustes, junto com a lista do que foi ignorado.",
  )
})

test("a failed copy of the agent instructions shows an error toast", async ({
  page,
}) => {
  await page.addInitScript(() => {
    Object.defineProperty(navigator, "clipboard", {
      value: { writeText: () => Promise.reject(new Error("denied")) },
    })
  })
  await mockApi(page)
  await page.goto("/ajustes")

  await page
    .getByRole("button", { name: /^Copiar instruções para agente/ })
    .click()

  await expect(failure(page)).toHaveText(
    "Não foi possível copiar as instruções",
  )
})

const aiAgentsSection = (page: Page) =>
  page.getByRole("region", { name: "Agentes de IA" })

test("Ajustes groups the actions into Dados and Agentes de IA", async ({
  page,
}) => {
  await mockApi(page)
  await page.goto("/ajustes")

  const data = page.getByRole("region", { name: "Dados" })

  await expect(data.getByRole("button", { name: "Exportar CSV" })).toBeVisible()
  await expect(data.getByRole("button", { name: "Importar CSV" })).toBeVisible()
  await expect(
    data.getByRole("button", { name: /^Copiar instruções para agente/ }),
  ).toBeVisible()
  await expect(
    aiAgentsSection(page).getByRole("button", { name: "Criar token" }),
  ).toBeVisible()
  await expect(
    aiAgentsSection(page).getByRole("button", { name: "Como conectar" }),
  ).toBeVisible()
  // The setup steps stay in the guide, not on the screen.
  await expect(page.getByText("Team e Enterprise")).toHaveCount(0)
})

test("Agentes de IA shows the MCP URL and copies it", async ({
  context,
  page,
}) => {
  await context.grantPermissions(["clipboard-read", "clipboard-write"])
  await mockApi(page)
  await page.goto("/ajustes")

  const section = aiAgentsSection(page)

  await expect(section.getByLabel("URL do servidor MCP")).toHaveValue(
    "http://localhost:5174/mcp",
  )

  await section.getByRole("button", { name: "Copiar URL" }).click()

  await expect(section.getByRole("status")).toHaveText("URL copiada.")
  expect(await page.evaluate(() => navigator.clipboard.readText())).toBe(
    "http://localhost:5174/mcp",
  )
  // The confirmation fades after a few seconds.
  await expect(section.getByRole("status")).toBeEmpty()
})

test("a failed copy of the MCP URL shows the failure next to it", async ({
  page,
}) => {
  await page.addInitScript(() => {
    Object.defineProperty(navigator, "clipboard", {
      value: { writeText: () => Promise.reject(new Error("denied")) },
    })
  })
  await mockApi(page)
  await page.goto("/ajustes")

  const section = aiAgentsSection(page)

  await section.getByRole("button", { name: "Copiar URL" }).click()

  await expect(section.getByRole("status")).toHaveText(
    "Não foi possível copiar. Selecione a URL e copie.",
  )
})

test("Como conectar shows the steps per client and copies the Claude Code command", async ({
  context,
  page,
}) => {
  await context.grantPermissions(["clipboard-read", "clipboard-write"])
  await mockApi(page)
  await page.goto("/ajustes")
  await aiAgentsSection(page)
    .getByRole("button", { name: "Como conectar" })
    .click()

  const guide = page.getByRole("dialog", { name: "Como conectar" })
  const command =
    'claude mcp add --transport http bodylog http://localhost:5174/mcp --header "Authorization: Bearer <token>"'

  await expect(guide.getByRole("radio", { name: "Claude.ai" })).toHaveAttribute(
    "aria-checked",
    "true",
  )
  await expect(guide).toContainText("Em URL, use http://localhost:5174/mcp.")
  await expect(guide).toContainText("Team e Enterprise")

  await guide.getByRole("radio", { name: "Claude Code" }).click()
  await expect(guide).toContainText(command)
  await guide.getByRole("button", { name: "Copiar comando" }).click()
  await expect(guide.getByRole("status")).toHaveText("Comando copiado.")
  expect(await page.evaluate(() => navigator.clipboard.readText())).toBe(
    command,
  )

  await guide.getByRole("button", { name: "Fechar" }).click()
  await expect(guide).toHaveCount(0)
  await expect(
    aiAgentsSection(page).getByRole("button", { name: "Como conectar" }),
  ).toBeFocused()
})

test("switching clients in Como conectar clears a failed command copy", async ({
  page,
}) => {
  await page.addInitScript(() => {
    Object.defineProperty(navigator, "clipboard", {
      value: { writeText: () => Promise.reject(new Error("denied")) },
    })
  })
  await mockApi(page)
  await page.goto("/ajustes")
  await aiAgentsSection(page)
    .getByRole("button", { name: "Como conectar" })
    .click()

  const guide = page.getByRole("dialog", { name: "Como conectar" })

  await guide.getByRole("radio", { name: "Claude Code" }).click()
  await guide.getByRole("button", { name: "Copiar comando" }).click()
  await expect(guide.getByRole("status")).toHaveText(
    "Não foi possível copiar. Selecione o comando e copie.",
  )

  await guide.getByRole("radio", { name: "Claude.ai" }).click()
  await guide.getByRole("radio", { name: "Claude Code" }).click()
  await expect(guide.getByRole("status")).toBeEmpty()
})
