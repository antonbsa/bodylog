import {
  expect,
  type Page,
  type Route,
  signedInSession,
  test,
} from "./fixtures"

type Averages = Partial<{
  bodyFatPercentage: number | null
  musclePercentage: number | null
  weightKg: number | null
}>

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

type Measurement = ReturnType<typeof createMeasurement>

function createWeek(
  weekStartDate: string,
  weekEndDate: string,
  measurements: Measurement[],
  averages: Averages = {},
) {
  return {
    measurements,
    summary: {
      averages: {
        bmi: null,
        bodyFatKg: null,
        bodyFatPercentage: null,
        disposition: null,
        muscleKg: null,
        musclePercentage: null,
        restingMetabolismKcal: null,
        sleepHours: null,
        waistCm: null,
        weightKg: null,
        ...averages,
      },
      isCurrentWeek: false,
      isPartialWeek: false,
      measurementCount: measurements.length,
      recordedDates: measurements.map((item) => item.date).reverse(),
      weekEndDate,
      weekStartDate,
    },
  }
}

const newestWeek = createWeek(
  "2026-11-09",
  "2026-11-15",
  [
    createMeasurement("2026-11-11", {
      bodyFatPercentage: 18.6,
      musclePercentage: 41.4,
      notes: "Dormi mal",
      weightKg: 72.4,
    }),
    createMeasurement("2026-11-09", { weightKg: 73 }),
  ],
  { bodyFatPercentage: 18.6, musclePercentage: 41.4, weightKg: 72.7 },
)
const olderWeek = createWeek(
  "2026-11-02",
  "2026-11-08",
  [createMeasurement("2026-11-04", { weightKg: 74.2 })],
  { weightKg: 74.2 },
)
const oldestWeek = createWeek(
  "2026-10-26",
  "2026-11-01",
  [createMeasurement("2026-10-27", { weightKg: 75 })],
  { weightKg: 75 },
)

function json(route: Route, body: unknown, status = 200) {
  return route.fulfill({
    body: JSON.stringify(body),
    contentType: "application/json",
    status,
  })
}

type HistoryPagePayload = { nextBefore: string | null; weeks: unknown[] }

/** Mocks the API for Histórico; `pages` are served in order, and `statuses` can fail the first requests. */
async function mockHistory(
  page: Page,
  pages: HistoryPagePayload[],
  statuses: number[] = [],
) {
  const requested: Array<string | null> = []
  const failures = [...statuses]

  await page.clock.setFixedTime(new Date(2026, 10, 13, 12))
  await page.route("**/api/auth/session", (route) =>
    json(route, signedInSession),
  )
  await page.route("**/api/history/weeks*", (route) => {
    const before = new URL(route.request().url()).searchParams.get("before")
    const status = failures.shift() ?? 200

    requested.push(before)

    if (status !== 200) {
      return json(route, { message: "Falha ao carregar." }, status)
    }

    return json(route, pages[requested.length - 1] ?? pages[pages.length - 1])
  })
  await page.route("**/api/measurements?*", (route) =>
    json(route, { items: [] }),
  )
  await page.route("**/api/measurements/by-date/*", (route) => {
    const date = new URL(route.request().url()).pathname.split("/").pop()
    const item = [newestWeek, olderWeek]
      .flatMap((week) => week.measurements)
      .find((measurement) => measurement.date === date)

    return item
      ? json(route, { heightCm: 180, item })
      : json(route, { message: "Medida não encontrada." }, 404)
  })

  return requested
}

const weekCards = (page: Page) => page.locator("section[aria-labelledby]")

test("lists weeks newest first with averages, counts and rows", async ({
  page,
}) => {
  await mockHistory(page, [
    { nextBefore: null, weeks: [newestWeek, olderWeek] },
  ])

  await page.goto("/historico")

  await expect(page.getByRole("heading", { name: "Histórico" })).toBeVisible()
  await expect(page.locator(".hcols")).toHaveText([
    "PesoGorduraMúsculo",
    "PesoGorduraMúsculo",
  ])
  await expect(page.getByRole("heading", { level: 2 })).toHaveText([
    "9–15 nov",
    "2–8 nov",
  ])
  await expect(page.locator(".week-title .num")).toHaveText(["2/7", "1/7"])

  const first = weekCards(page).first()

  await expect(first.locator(".havg-values")).toHaveText(
    "Média72,7kg18,6%41,4%",
  )
  await expect(first.locator(".hrow")).toHaveText([
    "qua 11/1172,4kg18,6%41,4%Com anotação",
    "seg 09/1173,0kg——",
  ])
  await expect(weekCards(page).nth(1).locator(".havg-values")).toHaveText(
    "Média74,2kg——",
  )
})

test("only rows with notes carry the note label", async ({ page }) => {
  await mockHistory(page, [
    { nextBefore: null, weeks: [newestWeek, olderWeek] },
  ])

  await page.goto("/historico")

  await expect(page.getByText("Com anotação")).toHaveCount(1)
  await expect(
    page.locator(".hrow", { hasText: "qua 11/11" }).getByText("Com anotação"),
  ).toHaveCount(1)
})

test("rows are at least 44px tall buttons that open edit mode", async ({
  page,
}) => {
  await mockHistory(page, [{ nextBefore: null, weeks: [newestWeek] }])

  await page.goto("/historico")

  const row = page.getByRole("button", { name: /qua 11\/11/ })
  const box = await row.boundingBox()

  expect(box?.height).toBeGreaterThanOrEqual(44)

  await row.click()

  await expect(page).toHaveURL("/registro?data=2026-11-11")
  await expect(page.getByText("Editando medida de 11/11")).toBeVisible()

  await page.getByRole("button", { name: "Cancelar" }).click()
  await expect(page).toHaveURL("/historico")
})

test("Carregar mais appends older weeks and disappears on the last page", async ({
  page,
}) => {
  const requested = await mockHistory(page, [
    { nextBefore: "2026-11-02", weeks: [newestWeek] },
    { nextBefore: "2026-10-26", weeks: [olderWeek] },
    { nextBefore: null, weeks: [oldestWeek] },
  ])

  await page.goto("/historico")

  const loadMore = page.getByRole("button", { name: "Carregar mais" })

  await expect(weekCards(page)).toHaveCount(1)
  await loadMore.click()
  await expect(weekCards(page)).toHaveCount(2)
  await expect(weekCards(page).nth(1).locator("h2")).toHaveText("2–8 nov")

  await loadMore.click()
  await expect(weekCards(page)).toHaveCount(3)
  await expect(page.getByRole("heading", { level: 2 })).toHaveText([
    "9–15 nov",
    "2–8 nov",
    "26 out – 1 nov",
  ])
  await expect(loadMore).toHaveCount(0)
  expect(requested).toEqual([null, "2026-11-02", "2026-10-26"])
})

test("empty history offers Registrar hoje", async ({ page }) => {
  await mockHistory(page, [{ nextBefore: null, weeks: [] }])

  await page.goto("/historico")

  await expect(page.getByText("Nenhuma medida ainda.")).toBeVisible()
  await expect(page.getByRole("button", { name: "Carregar mais" })).toHaveCount(
    0,
  )

  await page.getByRole("button", { name: "Registrar hoje" }).click()

  await expect(page).toHaveURL("/registro?data=2026-11-13")
  await expect(page.getByText("Nova medida")).toBeVisible()
})

test("a failed load shows the error with retry and keeps the height", async ({
  page,
}) => {
  await mockHistory(page, [{ nextBefore: null, weeks: [newestWeek] }], [500])

  await page.goto("/historico")

  const alert = page.getByRole("alert")

  await expect(alert).toContainText("Não foi possível carregar o histórico.")

  const reserved = await page.locator(".hlist-reserved").boundingBox()

  expect(reserved?.height).toBeGreaterThanOrEqual(320)

  await alert.getByRole("button", { name: "Tentar de novo" }).click()

  await expect(page.getByRole("heading", { level: 2 })).toHaveText("9–15 nov")
  await expect(page.getByRole("alert")).toHaveCount(0)
})
