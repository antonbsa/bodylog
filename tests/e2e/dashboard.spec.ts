import { expect, test, type Page, type Route } from "@playwright/test"

const TODAY = "2026-06-12"

type Averages = Partial<{
  bodyFatPercentage: number | null
  disposition: number | null
  musclePercentage: number | null
  sleepHours: number | null
  waistCm: number | null
  weightKg: number | null
}>

type Week = {
  averages: Averages
  recordedDates: string[]
  weekEndDate: string
  weekStartDate: string
}

const currentWeek = (
  recordedDates: string[],
  averages: Averages = {},
): Week => ({
  averages,
  recordedDates,
  weekEndDate: "2026-06-14",
  weekStartDate: "2026-06-08",
})

const previousWeek = (averages: Averages = {}): Week => ({
  averages,
  recordedDates: [
    "2026-06-01",
    "2026-06-02",
    "2026-06-03",
    "2026-06-04",
    "2026-06-05",
    "2026-06-06",
  ],
  weekEndDate: "2026-06-07",
  weekStartDate: "2026-06-01",
})

function createMeasurement(date: string, overrides: object = {}) {
  return {
    bodyFatPercentage: null,
    createdAt: `${date}T12:00:00.000Z`,
    derived: { bmi: 25, bodyFatKg: null, muscleKg: null },
    disposition: null,
    id: `measurement-${date}`,
    musclePercentage: null,
    notes: null,
    restingMetabolismKcal: null,
    sleepHours: null,
    updatedAt: `${date}T12:00:00.000Z`,
    waistCm: null,
    weightKg: 72.6,
    date,
    ...overrides,
  }
}

function json(route: Route, body: unknown, status = 200) {
  return route.fulfill({
    body: JSON.stringify(body),
    contentType: "application/json",
    status,
  })
}

function toWeek(week: Week, isCurrent: boolean) {
  return {
    averages: {
      bmi: null,
      bodyFatKg: null,
      bodyFatPercentage: null,
      muscleKg: null,
      musclePercentage: null,
      restingMetabolismKcal: null,
      waistCm: null,
      sleepHours: null,
      disposition: null,
      weightKg: null,
      ...week.averages,
    },
    isCurrentWeek: isCurrent,
    isPartialWeek: isCurrent,
    measurementCount: week.recordedDates.length,
    recordedDates: week.recordedDates,
    weekEndDate: week.weekEndDate,
    weekStartDate: week.weekStartDate,
  }
}

type HomeMocks = {
  current?: Week
  dashboardStatuses?: number[]
  measurements?: ReturnType<typeof createMeasurement>[]
  previous?: Week
}

/** Mocks the API for Início with the clock fixed on Friday 2026-06-12; returns request counters. */
async function mockHome(page: Page, mocks: HomeMocks = {}) {
  const current = mocks.current ?? currentWeek([])
  const previous = mocks.previous ?? previousWeek()
  const measurements = mocks.measurements ?? []
  const statuses = [...(mocks.dashboardStatuses ?? [])]
  const counters = { dashboard: 0 }

  await page.clock.setFixedTime(new Date(2026, 5, 12, 12))
  await page.route("**/api/auth/session", (route) =>
    json(route, { authenticated: true }),
  )
  await page.route("**/api/dashboard/weekly", (route) => {
    counters.dashboard += 1

    const status = statuses.shift() ?? 200

    if (status !== 200) {
      return json(route, { message: "Falha ao carregar." }, status)
    }

    return json(route, {
      current: toWeek(current, true),
      previous: toWeek(previous, false),
    })
  })
  await page.route("**/api/measurements?*", (route) => {
    const url = new URL(route.request().url())
    const to = url.searchParams.get("to")
    const items = measurements
      .filter((item) => !to || item.date <= to)
      .sort((a, b) => b.date.localeCompare(a.date))
      .slice(0, Number(url.searchParams.get("limit") ?? "30"))

    return json(route, { items })
  })
  await page.route("**/api/measurements/by-date/*", (route) => {
    const date = new URL(route.request().url()).pathname.split("/").pop()
    const item = measurements.find((measurement) => measurement.date === date)

    return item
      ? json(route, { heightCm: 180, item })
      : json(route, { message: "Medida não encontrada." }, 404)
  })

  return counters
}

const todayCard = (page: Page) => page.getByRole("region", { name: "Hoje" })
const weekCard = (page: Page) =>
  page.getByRole("region", { name: "Esta semana" })

test("without today's record the card shows the empty state and opens today's registration", async ({
  page,
}) => {
  await mockHome(page, {
    measurements: [createMeasurement("2026-06-10")],
  })

  await page.goto("/")

  await expect(page.getByRole("heading", { name: "Início" })).toBeVisible()
  await expect(todayCard(page)).toContainText("Hoje · sex, 12 jun")
  await expect(todayCard(page)).toContainText(
    "Sem medida hoje. Última: qua, 10 jun · 72,6 kg.",
  )
  await expect(
    todayCard(page).getByRole("button", { name: "Editar" }),
  ).toHaveCount(0)

  await todayCard(page).getByRole("button", { name: "Registrar hoje" }).click()

  await expect(page).toHaveURL(`/registro?data=${TODAY}`)
  await expect(page.getByText("Nova medida")).toBeVisible()
})

test("without any record the empty state omits the last record line", async ({
  page,
}) => {
  await mockHome(page)

  await page.goto("/")

  await expect(todayCard(page)).toContainText("Sem medida hoje.")
  await expect(todayCard(page)).not.toContainText("Última")
})

test("with today's record the card shows its values and Editar opens edit mode", async ({
  page,
}) => {
  await mockHome(page, {
    current: currentWeek([TODAY]),
    measurements: [
      createMeasurement(TODAY, {
        bodyFatPercentage: 18.6,
        disposition: 4,
        musclePercentage: 41.4,
        restingMetabolismKcal: 1652,
        sleepHours: null,
        waistCm: 82,
        weightKg: 72.4,
      }),
    ],
  })

  await page.goto("/")

  const card = todayCard(page)

  await expect(card).toContainText("Hoje · sex, 12 jun")
  await expect(card.locator(".big")).toHaveText("72,4")
  await expect(card.locator(".mini")).toHaveText([
    "Gordura18,6%",
    "Músculo41,4%",
    "Metabolismo1652kcal",
    "Cintura82,0cm",
    "Sono—",
    "Disposição4/5",
  ])
  await expect(
    card.getByRole("button", { name: "Registrar hoje" }),
  ).toHaveCount(0)

  await card.getByRole("button", { name: "Editar" }).click()

  await expect(page).toHaveURL(`/registro?data=${TODAY}`)
  await expect(page.getByText("Editando medida de 12/06")).toBeVisible()
})

test("week dots show recorded, missing and future days and mark today", async ({
  page,
}) => {
  await mockHome(page, {
    current: currentWeek(["2026-06-08", "2026-06-10", TODAY]),
  })

  await page.goto("/")

  const days = weekCard(page).locator(".day")

  await expect(days).toHaveText(["S", "T", "Q", "Q", "S", "S", "D"])
  expect(
    await days.evaluateAll((nodes) =>
      nodes.map((node) => node.getAttribute("data-status")),
    ),
  ).toEqual([
    "recorded",
    "missing",
    "recorded",
    "missing",
    "recorded",
    "future",
    "future",
  ])
  await expect(weekCard(page).locator(".day.is-today")).toHaveCount(1)
  await expect(weekCard(page).locator(".day.is-today")).toHaveText("S")
  await expect(weekCard(page).locator(".day.is-today")).toHaveAttribute(
    "data-status",
    "recorded",
  )
})

test("the week card shows the count and the previous week comparison line", async ({
  page,
}) => {
  await mockHome(page, {
    current: currentWeek(["2026-06-08", "2026-06-10", TODAY]),
  })

  await page.goto("/")

  await expect(weekCard(page).locator(".count")).toHaveText("3/7")
  await expect(weekCard(page).locator(".vs")).toHaveText("vs 1–7 jun · 6/7")
})

test("rows show weekly averages with neutral chips and Sem comparação", async ({
  page,
}) => {
  await mockHome(page, {
    current: currentWeek(["2026-06-08", TODAY], {
      bodyFatPercentage: 14.2,
      disposition: 4,
      musclePercentage: 44,
      sleepHours: null,
      waistCm: 81,
      weightKg: 73.4,
    }),
    previous: previousWeek({
      bodyFatPercentage: 14.5,
      disposition: 3,
      musclePercentage: 44.04,
      sleepHours: 7,
      waistCm: null,
      weightKg: 73,
    }),
  })

  await page.goto("/")

  const rows = weekCard(page).locator(".mrow")

  await expect(rows).toHaveText([
    "Peso73,4kgSubiu 0,4 kg",
    "Gordura14,2%Caiu 0,3 p.p.",
    "Músculo44,0%Estável",
    "Cintura81,0cmSem comparação",
    "Sono—Sem comparação",
    "Disposição4,0/5Subiu 1,0 pts",
  ])
})

test("a failed weekly request shows a text error with retry inside the card", async ({
  page,
}) => {
  await mockHome(page, {
    current: currentWeek([TODAY], { weightKg: 73.4 }),
    dashboardStatuses: [500],
  })

  await page.goto("/")

  const error = weekCard(page).getByRole("alert")

  await expect(error).toContainText(
    "Não foi possível carregar o resumo semanal.",
  )

  const before = await weekCard(page).boundingBox()

  await error.getByRole("button", { name: "Tentar de novo" }).click()

  await expect(weekCard(page).locator(".mrow").first()).toContainText("73,4")
  const after = await weekCard(page).boundingBox()

  expect(Math.abs((after?.height ?? 0) - (before?.height ?? 0))).toBeLessThan(2)
})

test("returning to the foreground refreshes Início and the history", async ({
  page,
}) => {
  let weightKg = 73
  let historyDate = "2026-06-10"
  let dashboardRequests = 0
  let historyRequests = 0

  await page.clock.setFixedTime(new Date(2026, 5, 12, 12))
  await page.route("**/api/auth/session", (route) =>
    json(route, { authenticated: true }),
  )
  await page.route("**/api/dashboard/weekly", (route) => {
    dashboardRequests += 1
    expect(route.request().headers()["cache-control"]).toBe("no-store")

    const week = toWeek(currentWeek([TODAY], { weightKg }), true)

    return json(route, {
      current: week,
      previous: toWeek(previousWeek({ weightKg: 72 }), false),
    })
  })
  await page.route("**/api/measurements/by-date/*", (route) =>
    json(route, { message: "Medida não encontrada." }, 404),
  )
  await page.route("**/api/measurements?*", (route) =>
    json(route, { items: [] }),
  )
  await page.route("**/api/history/weeks*", (route) => {
    historyRequests += 1
    expect(route.request().headers()["cache-control"]).toBe("no-store")

    return json(route, {
      nextBefore: null,
      weeks: [
        {
          measurements: [createMeasurement(historyDate, { weightKg })],
          summary: toWeek(currentWeek([historyDate], { weightKg }), true),
        },
      ],
    })
  })

  await page.goto("/")

  await expect(weekCard(page).locator(".mrow").first()).toContainText("73,0")

  weightKg = 74

  await page.waitForTimeout(600)
  await page.evaluate(() => {
    window.dispatchEvent(new Event("focus"))
  })

  await expect(weekCard(page).locator(".mrow").first()).toContainText("74,0")
  expect(dashboardRequests).toBeGreaterThanOrEqual(2)

  historyDate = "2026-06-11"

  await page.getByRole("link", { name: "Histórico" }).click()

  await expect(page.getByRole("button", { name: /qui 11\/06/ })).toBeVisible()
  expect(historyRequests).toBeGreaterThanOrEqual(1)

  const requestsBeforeResume = historyRequests
  historyDate = "2026-06-12"

  await page.waitForTimeout(600)
  await page.evaluate(() => {
    window.dispatchEvent(new Event("focus"))
  })

  await expect(page.getByRole("button", { name: /sex 12\/06/ })).toBeVisible()
  expect(historyRequests).toBeGreaterThan(requestsBeforeResume)
})

test("exports measurements CSV from the settings screen", async ({ page }) => {
  await mockHome(page)
  await page.route("**/api/export/csv", async (route) => {
    await route.fulfill({
      body: [
        "date,weight_kg,body_fat_percentage,muscle_percentage,resting_metabolism_kcal,created_at,updated_at",
        "2026-06-10,72.9,14.46,43.72,1700,2026-06-09T12:00:00.000Z,2026-06-09T12:00:00.000Z",
      ].join("\n"),
      contentType: "text/csv",
      status: 200,
    })
  })

  await page.goto("/ajustes")

  const exportResponsePromise = page.waitForResponse((response) =>
    response.url().includes("/api/export/csv"),
  )

  await page.getByRole("button", { name: "Exportar CSV" }).click()

  const exportResponse = await exportResponsePromise
  expect(exportResponse.status()).toBe(200)
})

test("imports measurements CSV from the settings screen", async ({ page }) => {
  let importRequestBody: string | null = null

  await mockHome(page)
  await page.route("**/api/import/csv", async (route) => {
    importRequestBody = route.request().postData()

    await route.fulfill({
      body: JSON.stringify({
        created: 1,
        errors: [],
        skipped: 0,
        updated: 0,
      }),
      contentType: "application/json",
      status: 200,
    })
  })

  await page.goto("/ajustes")

  await page.locator('input[type="file"]').setInputFiles({
    buffer: Buffer.from(
      [
        "date,weight_kg,body_fat_percentage,muscle_percentage,resting_metabolism_kcal",
        "2026-06-10,72.9,14.46,43.72,1700",
      ].join("\n"),
    ),
    mimeType: "text/csv",
    name: "measurements.csv",
  })

  await expect(
    page.getByText(
      "Importação concluída: 1 criados, 0 atualizados, 0 ignorados.",
    ),
  ).toBeVisible()
  expect(importRequestBody).toContain("measurements.csv")
})

test("shows a descriptive CSV import failure", async ({ page }) => {
  await mockHome(page)
  await page.route("**/api/import/csv", async (route) => {
    await route.fulfill({
      body: JSON.stringify({
        action: "Corrija a linha 1: Invalid CSV headers.",
        message: "Nenhum registro foi importado.",
        name: "ValidationError",
        statusCode: 400,
      }),
      contentType: "application/json",
      status: 400,
    })
  })

  await page.goto("/ajustes")

  await page.locator('input[type="file"]').setInputFiles({
    buffer: Buffer.from(["date,peso", "2026-06-10,72.9"].join("\n")),
    mimeType: "text/csv",
    name: "measurements.csv",
  })

  await expect(
    page.getByRole("alert").filter({
      hasText:
        "Nenhum registro foi importado. Corrija a linha 1: Invalid CSV headers.",
    }),
  ).toBeVisible()
})
