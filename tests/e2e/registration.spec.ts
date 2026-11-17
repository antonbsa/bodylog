import { expect, test, type Page, type Route } from "./fixtures"

type StoredMeasurement = {
  id: string
  date: string
  weightKg: number
  bodyFatPercentage: number | null
  musclePercentage: number | null
  restingMetabolismKcal: number | null
  waistCm: number | null
  sleepHours: number | null
  disposition: number | null
  notes: string | null
  createdAt: string
  updatedAt: string
}

type ApiState = {
  deletedIds: string[]
  listQueries: string[]
  puts: Array<{ body: unknown; date: string }>
}

const EXISTING_DATE = "2026-06-10"
const PREVIOUS_DATE = "2026-06-09"

function createMeasurement(
  overrides: Partial<StoredMeasurement> & { date: string },
): StoredMeasurement {
  return {
    bodyFatPercentage: null,
    createdAt: "2026-06-09T12:00:00.000Z",
    disposition: null,
    id: `measurement-${overrides.date}`,
    musclePercentage: null,
    notes: null,
    restingMetabolismKcal: null,
    sleepHours: null,
    updatedAt: "2026-06-09T12:00:00.000Z",
    waistCm: null,
    weightKg: 72.9,
    ...overrides,
  }
}

const existingMeasurement = createMeasurement({
  bodyFatPercentage: 20,
  date: EXISTING_DATE,
  disposition: 4,
  musclePercentage: 40,
  notes: "Em jejum",
  restingMetabolismKcal: 1700,
  sleepHours: 7.5,
  waistCm: 80.5,
  weightKg: 72,
})

const previousMeasurement = createMeasurement({
  bodyFatPercentage: 20.4,
  date: PREVIOUS_DATE,
  disposition: 3,
  sleepHours: 6.5,
  waistCm: 81,
  weightKg: 72.6,
})

async function mockApi(
  page: Page,
  options: {
    failPut?: boolean
    lookupDelayMs?: number
    records?: StoredMeasurement[]
  } = {},
): Promise<ApiState> {
  const state: ApiState = { deletedIds: [], listQueries: [], puts: [] }
  const records = options.records ?? []

  await page.route("**/api/auth/session", (route) =>
    json(route, { authenticated: true }),
  )
  await page.route("**/api/dashboard/weekly", (route) => {
    const emptyWeek = {
      averages: {
        bmi: null,
        bodyFatKg: null,
        bodyFatPercentage: null,
        muscleKg: null,
        musclePercentage: null,
        restingMetabolismKcal: null,
        weightKg: null,
      },
      isCurrentWeek: true,
      isPartialWeek: true,
      measurementCount: 0,
      weekEndDate: "2026-06-14",
      weekStartDate: "2026-06-08",
    }

    return json(route, {
      current: emptyWeek,
      previous: { ...emptyWeek, isCurrentWeek: false, isPartialWeek: false },
    })
  })
  await page.route("**/api/history/weeks*", (route) =>
    route.fulfill({
      body: JSON.stringify({ nextBefore: null, weeks: [] }),
      contentType: "application/json",
      status: 200,
    }),
  )
  await page.route("**/api/measurements?*", (route) => {
    const url = new URL(route.request().url())

    state.listQueries.push(url.search)

    const from = url.searchParams.get("from")
    const to = url.searchParams.get("to")
    const limit = Number(url.searchParams.get("limit") ?? "30")
    const items = records
      .filter((record) => !from || record.date >= from)
      .filter((record) => !to || record.date <= to)
      .sort((a, b) => b.date.localeCompare(a.date))
      .slice(0, limit)
      .map((record) => ({
        ...record,
        derived: { bmi: 25, bodyFatKg: null, muscleKg: null },
      }))

    return json(route, { items })
  })
  await page.route("**/api/measurements/by-date/*", async (route) => {
    const request = route.request()
    const date = new URL(request.url()).pathname.split("/").pop() ?? ""

    if (request.method() === "GET") {
      if (options.lookupDelayMs) {
        await new Promise((resolve) =>
          setTimeout(resolve, options.lookupDelayMs),
        )
      }

      const record = records.find((item) => item.date === date)

      if (!record) {
        return json(route, { message: "Medida não encontrada." }, 404)
      }

      return json(route, { heightCm: 180, item: record })
    }

    state.puts.push({ body: request.postDataJSON(), date })

    if (options.failPut) {
      return json(route, { message: "Falha ao salvar." }, 500)
    }

    const saved = createMeasurement({ date, ...request.postDataJSON() })

    const index = records.findIndex((item) => item.date === date)

    if (index === -1) {
      records.push(saved)
    } else {
      records[index] = saved
    }

    return json(route, { item: saved })
  })
  await page.route("**/api/measurements/*", (route) => {
    const request = route.request()

    if (request.method() === "DELETE") {
      state.deletedIds.push(request.url().split("/").pop() ?? "")

      return json(route, { ok: true })
    }

    return route.fallback()
  })

  return state
}

function json(route: Route, body: unknown, status = 200) {
  return route.fulfill({
    body: JSON.stringify(body),
    contentType: "application/json",
    status,
  })
}

function getToday(): string {
  const today = new Date()

  return [
    today.getFullYear(),
    String(today.getMonth() + 1).padStart(2, "0"),
    String(today.getDate()).padStart(2, "0"),
  ].join("-")
}

function formatDayMonth(isoDate: string): string {
  const [, month, day] = isoDate.split("-")

  return `${day}/${month}`
}

const field = (page: Page, label: string) =>
  page.getByLabel(label, { exact: true })

/**
 * Empties a masked field one Backspace per digit. Select-all is avoided because
 * the field's deferred focus handler can collapse the selection before the delete.
 */
async function clearField(page: Page, label: string) {
  const input = field(page, label)
  const digitCount = (await input.inputValue()).replace(/\D/g, "").length

  for (let i = 0; i < digitCount; i++) {
    await input.press("Backspace")
  }

  await expect(input).toHaveValue("")
}

async function paste(page: Page, label: string, text: string) {
  await field(page, label).evaluate((input, value) => {
    const data = new DataTransfer()

    data.setData("text", value)
    input.dispatchEvent(
      new ClipboardEvent("paste", {
        bubbles: true,
        cancelable: true,
        clipboardData: data,
      }),
    )
  }, text)
}

test("creates a measurement for today and returns to Início", async ({
  page,
}) => {
  const state = await mockApi(page, { records: [previousMeasurement] })

  await page.goto("/")
  await page.getByRole("link", { name: "Registrar medida" }).click()

  await expect(page).toHaveURL(`/registro?data=${getToday()}`)
  await expect(page.getByText("Nova medida")).toBeVisible()
  await expect(page.getByText("Calculados")).toHaveCount(0)
  await expect(
    page.getByRole("button", { name: "Excluir medida" }),
  ).toHaveCount(0)
  await expect(
    page.getByRole("link", { name: "Registrar medida" }),
  ).toHaveCount(0)
  await expect(field(page, "Peso")).toHaveValue("")
  await expect(field(page, "Sono")).toHaveValue("")

  await field(page, "Peso").pressSequentially("724")
  await expect(field(page, "Peso")).toHaveValue("72,4")
  await field(page, "Gordura").pressSequentially("148")
  await field(page, "Metabolismo").pressSequentially("1700")
  await field(page, "Cintura").pressSequentially("805")
  await page.getByRole("radio", { name: "5" }).click()
  await page.getByLabel("Notas").fill("  Sem café  ")
  await page.getByRole("button", { name: "Salvar" }).click()

  await expect(page).toHaveURL("/")
  await expect(page.locator(".toast-region").getByRole("status")).toHaveText(
    `Medida de ${formatDayMonth(getToday())} salva`,
  )
  expect(state.puts).toEqual([
    {
      body: {
        bodyFatPercentage: 14.8,
        disposition: 5,
        musclePercentage: null,
        notes: "Sem café",
        restingMetabolismKcal: 1700,
        sleepHours: null,
        waistCm: 80.5,
        weightKg: 72.4,
      },
      date: getToday(),
    },
  ])
})

test("Início shows the saved record right after saving, without the empty state", async ({
  page,
}) => {
  await mockApi(page, { lookupDelayMs: 400, records: [previousMeasurement] })

  await page.goto("/")
  await expect(page.getByText("Sem medida hoje.")).toBeVisible()
  await page.getByRole("link", { name: "Registrar medida" }).click()
  await field(page, "Peso").pressSequentially("724")
  await page.getByRole("button", { name: "Salvar" }).click()

  await expect(page).toHaveURL("/")
  // A one-shot read: web-first assertions would retry until the refetch lands and hide the stale frame.
  const todayCard = await page.getByLabel("Hoje").innerText()

  expect(todayCard).toContain("72,4")
  expect(todayCard).not.toContain("Sem medida hoje")
})

test("the footer button reads Salvar when creating", async ({ page }) => {
  await mockApi(page)
  await page.goto("/registro?data=2026-06-10")

  await expect(page.getByRole("button", { name: "Salvar" })).toBeVisible()
  await expect(page.getByRole("button", { name: "Atualizar" })).toHaveCount(0)
})

test("masks typing, deleting and pasting in numeric fields", async ({
  page,
}) => {
  await mockApi(page)
  await page.goto("/registro?data=2026-06-10")

  const weight = field(page, "Peso")

  await weight.pressSequentially("00724")
  await expect(weight).toHaveValue("72,4")
  await weight.press("Backspace")
  await expect(weight).toHaveValue("7,2")
  await weight.pressSequentially("99999")
  await expect(weight).toHaveValue("729,9")

  await weight.press("Control+a")
  await weight.press("Backspace")
  await expect(weight).toHaveValue("")

  await paste(page, "Peso", "72.4")
  await expect(weight).toHaveValue("72,4")
  await paste(page, "Peso", "73,1")
  await expect(weight).toHaveValue("73,1")

  const metabolism = field(page, "Metabolismo")

  await metabolism.pressSequentially("17005")
  await expect(metabolism).toHaveValue("1700")

  const sleep = field(page, "Sono")

  await sleep.pressSequentially("2405")
  await expect(sleep).toHaveValue("24,0")
})

test("loads a past date for editing with calculated values and previous hints", async ({
  page,
}) => {
  const state = await mockApi(page, {
    records: [existingMeasurement, previousMeasurement],
  })

  await page.goto(`/registro?data=${EXISTING_DATE}`)

  await expect(page.getByText("Editando medida de 10/06")).toBeVisible()
  await expect(page.getByRole("button", { name: "Atualizar" })).toBeVisible()
  await expect(page.getByRole("button", { name: "Salvar" })).toHaveCount(0)
  await expect(field(page, "Peso")).toHaveValue("72,0")
  await expect(field(page, "Gordura")).toHaveValue("20,0")
  await expect(field(page, "Músculo")).toHaveValue("40,0")
  await expect(field(page, "Metabolismo")).toHaveValue("1700")
  await expect(field(page, "Cintura")).toHaveValue("80,5")
  await expect(field(page, "Sono")).toHaveValue("7,5")
  await expect(page.getByRole("radio", { name: "4" })).toHaveAttribute(
    "aria-checked",
    "true",
  )
  await expect(page.getByLabel("Notas")).toHaveValue("Em jejum")

  const calculated = page.getByRole("group", {
    name: "Valores calculados, somente leitura",
  })

  await expect(calculated).toContainText("22,2")
  await expect(calculated).toContainText("14,4kg")
  await expect(calculated).toContainText("28,8kg")

  await expect(page.getByText("anterior: 72,6")).toBeVisible()
  await expect(page.getByText("anterior: 81,0")).toBeVisible()
  await expect(page.getByText("anterior: 3")).toBeVisible()
  expect(
    state.listQueries.some((query) => query.includes("to=2026-06-09")),
  ).toBe(true)

  // Calculated values follow the typed weight and blank out when it is invalid.
  await clearField(page, "Peso")
  await field(page, "Peso").pressSequentially("75")
  await expect(field(page, "Peso")).toHaveValue("7,5")
  await expect(calculated).not.toContainText("22,2")
  await expect(calculated).toContainText("—")
})

test("saving an edit clears emptied fields with null", async ({ page }) => {
  const state = await mockApi(page, { records: [existingMeasurement] })

  await page.goto(`/registro?data=${EXISTING_DATE}`)
  await expect(field(page, "Peso")).toHaveValue("72,0")

  await clearField(page, "Peso")
  await field(page, "Peso").pressSequentially("731")
  await clearField(page, "Cintura")
  await clearField(page, "Sono")
  await page.getByRole("radio", { name: "4" }).click()
  await page.getByLabel("Notas").fill("   ")
  await page.getByRole("button", { name: "Atualizar" }).click()

  await expect(page).toHaveURL("/")
  expect(state.puts).toEqual([
    {
      body: {
        bodyFatPercentage: 20,
        disposition: null,
        musclePercentage: 40,
        notes: null,
        restingMetabolismKcal: 1700,
        sleepHours: null,
        waistCm: null,
        weightKg: 73.1,
      },
      date: EXISTING_DATE,
    },
  ])
})

test("sleep stepper starts from the previous value and steps by half an hour", async ({
  page,
}) => {
  await mockApi(page, { records: [previousMeasurement] })
  await page.goto("/registro?data=2026-06-10")

  const sleep = field(page, "Sono")

  await expect(sleep).toHaveValue("")
  await page.getByRole("button", { name: "Aumentar 0,5 hora" }).click()
  await expect(sleep).toHaveValue("6,5")
  await page.getByRole("button", { name: "Aumentar 0,5 hora" }).click()
  await expect(sleep).toHaveValue("7,0")
  await page.getByRole("button", { name: "Diminuir 0,5 hora" }).click()
  await page.getByRole("button", { name: "Diminuir 0,5 hora" }).click()
  await expect(sleep).toHaveValue("6,0")
})

test("sleep stepper buttons keep focus on the sleep input", async ({
  page,
}) => {
  await mockApi(page, { records: [previousMeasurement] })
  await page.goto("/registro?data=2026-06-10")

  const sleep = field(page, "Sono")

  await sleep.focus()
  await page.getByRole("button", { name: "Aumentar 0,5 hora" }).click()
  await expect(sleep).toHaveValue("6,5")
  await expect(sleep).toBeFocused()
})

test("sleep stepper starts at 7 h without a previous record and disposition clears on a second tap", async ({
  page,
}) => {
  await mockApi(page)
  await page.goto("/registro?data=2026-06-10")

  await page.getByRole("button", { name: "Diminuir 0,5 hora" }).click()
  await expect(field(page, "Sono")).toHaveValue("7,0")

  const three = page.getByRole("radio", { name: "3" })

  await three.click()
  await expect(three).toHaveAttribute("aria-checked", "true")
  await three.click()
  await expect(three).toHaveAttribute("aria-checked", "false")
})

test("validation shows reserved-slot errors and focuses the first invalid field", async ({
  page,
}) => {
  const state = await mockApi(page)

  await page.goto("/registro?data=2026-06-10")

  const waist = field(page, "Cintura")
  const form = page.locator("#registration-form")
  const before = await form.boundingBox()

  // Missing weight and an out-of-range waist and body fat.
  await field(page, "Gordura").pressSequentially("900")
  await waist.pressSequentially("2999")
  await page.getByRole("button", { name: "Salvar" }).click()

  await expect(page.getByText("Informe o peso.")).toBeVisible()
  await expect(page.getByText("Use um valor entre 1 e 80 %.")).toBeVisible()
  await expect(page.getByText("Use um valor entre 30 e 250 cm.")).toBeVisible()
  await expect(field(page, "Peso")).toBeFocused()
  await expect(field(page, "Peso")).toHaveAttribute("aria-invalid", "true")
  await expect(field(page, "Músculo")).not.toHaveAttribute("aria-invalid")

  // The error slots are reserved, so showing errors does not resize the form.
  const after = await form.boundingBox()

  expect(after?.height).toBe(before?.height)

  await field(page, "Peso").pressSequentially("3500")
  await expect(field(page, "Peso")).toHaveValue("350,0")
  await expect(page.getByText("Use um valor entre 20 e 300 kg.")).toBeVisible()
  await field(page, "Peso").press("Backspace")
  await expect(page.getByText("Use um valor entre 20 e 300 kg.")).toHaveCount(0)
  await clearField(page, "Gordura")
  await clearField(page, "Cintura")
  await page.getByRole("button", { name: "Salvar" }).click()

  await expect(page).toHaveURL("/")
  expect(state.puts).toHaveLength(1)
})

test("shows a field error only after changing the field and leaving it", async ({
  page,
}) => {
  await mockApi(page)
  await page.goto("/registro?data=2026-06-10")

  const rangeError = page.getByText("Use um valor entre 20 e 300 kg.")

  await field(page, "Peso").focus()
  await field(page, "Sono").focus()
  await expect(page.getByText("Informe o peso.")).toHaveCount(0)
  await expect(field(page, "Peso")).not.toHaveAttribute("aria-invalid")

  await field(page, "Peso").pressSequentially("3500")
  await expect(rangeError).toHaveCount(0)
  await field(page, "Sono").focus()
  await expect(rangeError).toBeVisible()
})

test("a failed save keeps the values and shows a persistent failure toast", async ({
  page,
}) => {
  await mockApi(page, { failPut: true })
  await page.goto("/registro?data=2026-06-10")

  await field(page, "Peso").pressSequentially("725")
  await page.getByRole("button", { name: "Salvar" }).click()

  const toast = page.getByRole("alert")

  await expect(toast).toContainText("Não foi possível salvar a medida.")
  await expect(page).toHaveURL(/\/registro/)
  await expect(field(page, "Peso")).toHaveValue("72,5")
  await expect(page.getByRole("button", { name: "Salvar" })).toBeEnabled()

  const toastBox = await toast.boundingBox()
  const footBox = await page.locator(".reg-foot").boundingBox()

  expect(toastBox && footBox && toastBox.y + toastBox.height <= footBox.y).toBe(
    true,
  )
  await page.waitForTimeout(3500)
  await expect(toast).toBeVisible()
  await toast.getByRole("button", { name: "Fechar" }).click()
  await expect(toast).toHaveCount(0)
})

test("cancel without changes leaves immediately", async ({ page }) => {
  await mockApi(page)
  await page.goto("/historico")
  await page.getByRole("link", { name: "Registrar medida" }).click()
  await page.getByRole("button", { name: "Cancelar" }).click()

  await expect(page.getByRole("alertdialog")).toHaveCount(0)
  await expect(page).toHaveURL("/historico")
})

test("cancel on a deep link goes to Início", async ({ page }) => {
  await mockApi(page)
  await page.goto("/registro?data=2026-06-10")
  await page.getByRole("button", { name: "Cancelar" }).click()

  await expect(page).toHaveURL("/")
})

test("cancel with changes asks before discarding", async ({ page }) => {
  await mockApi(page)
  await page.goto("/historico")
  await page.getByRole("link", { name: "Registrar medida" }).click()
  await field(page, "Peso").pressSequentially("725")

  const cancel = page.getByRole("button", { name: "Cancelar" })

  await cancel.click()

  const dialog = page.getByRole("alertdialog", {
    name: "Descartar alterações?",
  })

  await expect(dialog).toBeVisible()
  await expect(dialog).toContainText(
    "Os valores digitados nesta medida serão perdidos.",
  )
  await expect(
    dialog.getByRole("button", { name: "Continuar editando" }),
  ).toBeFocused()

  await page.keyboard.press("Escape")
  await expect(dialog).toBeHidden()
  await expect(page).toHaveURL(/\/registro/)
  await expect(field(page, "Peso")).toHaveValue("72,5")
  await expect(cancel).toBeFocused()

  await cancel.click()
  await dialog.getByRole("button", { name: "Descartar" }).click()
  await expect(page).toHaveURL("/historico")
})

test("changing the date with changes asks first, without changes loads the date", async ({
  page,
}) => {
  // June 2026 is the current month, so the sheet shows the dates under test.
  await page.clock.setFixedTime(new Date(2026, 5, 12, 12))
  await mockApi(page, { records: [existingMeasurement] })
  await page.goto(`/registro?data=${EXISTING_DATE}`)
  await expect(page.getByText("Editando medida de 10/06")).toBeVisible()

  // Without changes the previous day loads immediately.
  await page.getByRole("button", { name: "Dia anterior" }).click()
  await expect(page).toHaveURL(`/registro?data=${PREVIOUS_DATE}`)
  await expect(page.getByText("Nova medida")).toBeVisible()
  await expect(field(page, "Peso")).toHaveValue("")

  // With changes the dialog asks, and keeping the edit leaves the date alone.
  await field(page, "Peso").pressSequentially("725")
  await page.getByRole("button", { name: "Próximo dia" }).click()

  const dialog = page.getByRole("alertdialog", {
    name: "Descartar alterações?",
  })

  await expect(dialog).toBeVisible()
  await dialog.getByRole("button", { name: "Continuar editando" }).click()
  await expect(page).toHaveURL(`/registro?data=${PREVIOUS_DATE}`)
  await expect(field(page, "Peso")).toHaveValue("72,5")

  await page.getByRole("button", { name: "Próximo dia" }).click()
  await dialog.getByRole("button", { name: "Descartar" }).click()
  await expect(page).toHaveURL(`/registro?data=${EXISTING_DATE}`)
  await expect(page.getByText("Editando medida de 10/06")).toBeVisible()
  await expect(field(page, "Peso")).toHaveValue("72,0")

  // The date picker goes through the same check.
  await openDateSheet(page)
  await page.getByRole("button", { name: /, 9 de junho de 2026/ }).click()
  await expect(page).toHaveURL(`/registro?data=${PREVIOUS_DATE}`)
})

/** Makes every by-date lookup from now on take long, so only cached data can render quickly. */
async function slowDownLookups(page: Page) {
  await page.route("**/api/measurements/by-date/*", async (route) => {
    await new Promise((resolve) => setTimeout(resolve, 3000))
    await route.fallback()
  })
}

test("moving to the previous day shows its prefetched values without loading", async ({
  page,
}) => {
  await mockApi(page, { records: [existingMeasurement, previousMeasurement] })

  const prefetched = Promise.all([
    page.waitForResponse((response) =>
      response.url().endsWith(`/by-date/${PREVIOUS_DATE}`),
    ),
    page.waitForResponse((response) =>
      response.url().includes("to=2026-06-08"),
    ),
  ])

  await page.goto(`/registro?data=${EXISTING_DATE}`)
  await expect(page.getByText("Editando medida de 10/06")).toBeVisible()
  await prefetched
  await slowDownLookups(page)

  await page.getByRole("button", { name: "Dia anterior" }).click()
  await expect(page).toHaveURL(`/registro?data=${PREVIOUS_DATE}`)
  await expect(page.getByText("Editando medida de 09/06")).toBeVisible({
    timeout: 500,
  })
  await expect(field(page, "Peso")).toHaveValue("72,6")
  await expect(page.getByText("Carregando…")).toHaveCount(0)
})

test("returning to a visited day shows its values immediately", async ({
  page,
}) => {
  await mockApi(page, { records: [existingMeasurement] })
  await page.goto(`/registro?data=${EXISTING_DATE}`)
  await expect(page.getByText("Editando medida de 10/06")).toBeVisible()

  await page.getByRole("button", { name: "Dia anterior" }).click()
  await page.getByRole("button", { name: "Dia anterior" }).click()
  await expect(page).toHaveURL("/registro?data=2026-06-08")
  await expect(page.getByText("Nova medida")).toBeVisible()
  await slowDownLookups(page)

  await page.getByRole("button", { name: "Próximo dia" }).click()
  await page.getByRole("button", { name: "Próximo dia" }).click()
  await expect(page).toHaveURL(`/registro?data=${EXISTING_DATE}`)
  await expect(page.getByText("Editando medida de 10/06")).toBeVisible({
    timeout: 500,
  })
  await expect(field(page, "Peso")).toHaveValue("72,0")
  await expect(page.getByText("Carregando…")).toHaveCount(0)
})

test("the next-day arrow is disabled today and future dates fall back to today", async ({
  page,
}) => {
  await mockApi(page)
  await page.goto("/registro?data=2999-01-01")

  await expect(page.getByRole("button", { name: "Próximo dia" })).toBeDisabled()
  await expect(
    page.getByRole("button", { name: /^Data da medida/ }),
  ).toBeVisible()
  await expect(page.getByText("Nova medida")).toBeVisible()

  await page.getByRole("button", { name: "Dia anterior" }).click()
  await expect(page.getByRole("button", { name: "Próximo dia" })).toBeEnabled()
})

test("deletes an existing measurement after confirming", async ({ page }) => {
  const state = await mockApi(page, { records: [existingMeasurement] })

  await page.goto(`/registro?data=${EXISTING_DATE}`)

  const open = page.getByRole("button", { name: "Excluir medida" })

  await open.click()

  const dialog = page.getByRole("alertdialog")

  await expect(dialog).toContainText("Excluir medida de 10/06?")
  await expect(dialog.locator("strong")).toHaveText("10/06")
  await expect(dialog).toContainText("Esta medida será removida do histórico.")
  await expect(dialog.getByRole("button", { name: "Cancelar" })).toBeFocused()

  await page.keyboard.press("Escape")
  await expect(dialog).toBeHidden()
  await expect(open).toBeFocused()
  expect(state.deletedIds).toEqual([])

  await open.click()
  await dialog.getByRole("button", { name: "Excluir" }).click()

  await expect(page).toHaveURL("/")
  await expect(page.locator(".toast-region").getByRole("status")).toHaveText(
    "Medida de 10/06 excluída",
  )
  expect(state.deletedIds).toEqual([`measurement-${EXISTING_DATE}`])
})

test("the document scrolls, the header stays pinned and Excluir medida clears the footer", async ({
  page,
}) => {
  await page.setViewportSize({ width: 390, height: 844 })
  await mockApi(page, { records: [existingMeasurement] })
  await page.goto(`/registro?data=${EXISTING_DATE}`)
  await expect(page.getByLabel("Peso")).toHaveValue("72,0")

  const canScroll = await page.evaluate(
    () => (document.scrollingElement?.scrollHeight ?? 0) > window.innerHeight,
  )

  expect(canScroll).toBe(true)

  await page.evaluate(() =>
    window.scrollTo(0, document.scrollingElement?.scrollHeight ?? 0),
  )

  const scrollY = await page.evaluate(() => window.scrollY)

  expect(scrollY).toBeGreaterThan(0)

  const header = await page.locator(".reg-head").boundingBox()
  const footer = await page.locator(".reg-foot").boundingBox()
  const remove = await page
    .getByRole("button", { name: "Excluir medida" })
    .boundingBox()

  expect(header?.y).toBe(0)
  expect(footer).not.toBeNull()
  expect(remove).not.toBeNull()
  expect((remove?.y ?? 0) + (remove?.height ?? 0)).toBeLessThanOrEqual(
    footer?.y ?? 0,
  )
})

async function openDateSheet(page: Page) {
  await page.getByRole("button", { name: /^Data da medida/ }).click()
  await expect(
    page.getByRole("dialog", { name: "Escolher data" }),
  ).toBeVisible()
}

test("the date sheet marks recorded days and disables future ones", async ({
  page,
}) => {
  await page.clock.setFixedTime(new Date(2026, 5, 12, 12))
  await mockApi(page, { records: [existingMeasurement, previousMeasurement] })
  await page.goto(`/registro?data=${EXISTING_DATE}`)
  await openDateSheet(page)

  await expect(
    page.getByRole("button", { name: /, 10 de junho de 2026.*, com medida$/ }),
  ).toBeVisible()
  await expect(
    page.getByRole("button", { name: /, 9 de junho de 2026.*, com medida$/ }),
  ).toBeVisible()
  await expect(
    page.getByRole("button", { name: /, 11 de junho de 2026/ }),
  ).not.toHaveAccessibleName(/com medida/)
  await expect(
    page.getByRole("button", { name: /, 13 de junho de 2026/ }),
  ).toBeDisabled()
  await expect(
    page.getByRole("button", { name: "Ir para o próximo mês" }),
  ).toHaveAttribute("aria-disabled", "true")
})

test("choosing a day in the date sheet closes it and loads that date", async ({
  page,
}) => {
  await page.clock.setFixedTime(new Date(2026, 5, 12, 12))
  await mockApi(page, { records: [existingMeasurement, previousMeasurement] })
  await page.goto(`/registro?data=${EXISTING_DATE}`)
  await openDateSheet(page)
  await page.getByRole("button", { name: /, 9 de junho de 2026/ }).click()

  await expect(page.getByRole("dialog", { name: "Escolher data" })).toHaveCount(
    0,
  )
  await expect(page).toHaveURL(`/registro?data=${PREVIOUS_DATE}`)
  await expect(page.getByText("Editando medida de 09/06")).toBeVisible()
})

test("choosing a day in the date sheet with unsaved changes asks to discard", async ({
  page,
}) => {
  await page.clock.setFixedTime(new Date(2026, 5, 12, 12))
  await mockApi(page, { records: [existingMeasurement, previousMeasurement] })
  await page.goto(`/registro?data=${EXISTING_DATE}`)
  await expect(field(page, "Peso")).toHaveValue("72,0")
  await paste(page, "Peso", "72,5")
  await openDateSheet(page)
  await page.getByRole("button", { name: /, 9 de junho de 2026/ }).click()

  const dialog = page.getByRole("alertdialog", {
    name: "Descartar alterações?",
  })

  await expect(dialog).toBeVisible()
  await expect(page).toHaveURL(`/registro?data=${EXISTING_DATE}`)
  await dialog.getByRole("button", { name: "Descartar" }).click()
  await expect(page).toHaveURL(`/registro?data=${PREVIOUS_DATE}`)
})
