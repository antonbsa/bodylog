import { expect, test, type Page, type Route } from "./fixtures"

type TrendPoint = {
  bmi: number | null
  bodyFatPercentage: number | null
  date: string
  disposition: number | null
  musclePercentage: number | null
  restingMetabolismKcal: number | null
  sleepHours: number | null
  waistCm: number | null
  weightKg: number | null
}

function point(date: string, overrides: Partial<TrendPoint> = {}): TrendPoint {
  return {
    bmi: null,
    bodyFatPercentage: null,
    date,
    disposition: null,
    musclePercentage: null,
    restingMetabolismKcal: null,
    sleepHours: null,
    waistCm: null,
    weightKg: null,
    ...overrides,
  }
}

// Today is Friday 2026-11-13 (fixed clock).
const points = [
  point("2026-08-03", { weightKg: 77 }),
  point("2026-10-27", { weightKg: 75 }),
  point("2026-10-28", { restingMetabolismKcal: 1650 }),
  point("2026-10-29", { weightKg: 74.6 }),
  point("2026-11-03", { weightKg: 74 }),
  point("2026-11-04", { restingMetabolismKcal: 1652 }),
  point("2026-11-05", { weightKg: 73.8 }),
  point("2026-11-09", { weightKg: 73 }),
  point("2026-11-10", { bodyFatPercentage: 18, waistCm: 84 }),
  point("2026-11-11", {
    bodyFatPercentage: 18.2,
    restingMetabolismKcal: 1700,
    waistCm: 83.5,
    weightKg: 72.4,
  }),
  point("2026-11-12", { bodyFatPercentage: 18.4 }),
  point("2026-11-13", { weightKg: 72.2 }),
]

function json(route: Route, body: unknown, status = 200) {
  return route.fulfill({
    body: JSON.stringify(body),
    contentType: "application/json",
    status,
  })
}

/** Mocks the API for Tendências; `statuses` can fail the first requests. */
async function mockTrends(
  page: Page,
  statuses: number[] = [],
  source: { points: TrendPoint[] } = { points },
) {
  const failures = [...statuses]
  let requests = 0

  await page.clock.setFixedTime(new Date(2026, 10, 13, 12))
  await page.route("**/api/auth/session", (route) =>
    json(route, { authenticated: true }),
  )
  await page.route("**/api/trends", (route) => {
    const status = failures.shift() ?? 200

    requests += 1

    return status === 200
      ? json(route, source)
      : json(route, { message: "Falha ao carregar." }, status)
  })

  return () => requests
}

const summary = (page: Page) => page.getByLabel("Resumo do período")
const period = (page: Page, name: string) =>
  page.getByRole("radio", { name, exact: true })

test("shows the weight average and first-vs-last-week chip for 30 days", async ({
  page,
}) => {
  await mockTrends(page)
  await page.goto("/tendencias")

  await expect(page.getByRole("heading", { name: "Tendências" })).toBeVisible()
  await expect(page.getByLabel("Métrica")).toHaveValue("weightKg")
  await expect(period(page, "30d")).toHaveAttribute("aria-checked", "true")
  await expect(summary(page)).toContainText("73,6kg")
  await expect(summary(page)).toContainText("Caiu 2,3 kg")
  await expect(page.getByTestId("trend-chart")).toHaveAttribute(
    "aria-label",
    "Gráfico de Peso, média 73,6 kg",
  )
  await expect(page.getByTestId("trend-readout")).toHaveText(
    "Toque no gráfico para ver os valores.",
  )
  await expect(page.getByText("Dia", { exact: true })).toBeVisible()
  await expect(page.getByText("Média semanal", { exact: true })).toBeVisible()
  await expect(page.getByText(/só tem registros desde/)).toHaveCount(0)
})

test("switching the period changes the data without another request", async ({
  page,
}) => {
  const requests = await mockTrends(page)

  await page.goto("/tendencias")
  await expect(summary(page)).toContainText("73,6kg")

  await period(page, "14d").click()
  await expect(summary(page)).toContainText("73,1kg")
  await expect(summary(page)).toContainText("Caiu 1,4 kg")

  await period(page, "1 ano").click()
  await expect(summary(page)).toContainText("74,0kg")
  await expect(
    page.getByText(/Peso só tem registros desde 03\/08/),
  ).toBeVisible()

  await period(page, "Tudo").click()
  await expect(summary(page)).toContainText("74,0kg")
  await expect(page.getByText(/só tem registros desde/)).toHaveCount(0)
  expect(requests()).toBe(1)
})

test("switching the metric updates the average and chip", async ({ page }) => {
  await mockTrends(page)
  await page.goto("/tendencias")

  await page.getByLabel("Métrica").selectOption("restingMetabolismKcal")
  await expect(summary(page)).toContainText("1.667kcal")
  await expect(summary(page)).toContainText("Subiu 50 kcal")

  await page.getByLabel("Métrica").selectOption("bodyFatPercentage")
  await expect(summary(page)).toContainText("18,2%")
  await expect(summary(page)).toContainText("Sem comparação")
})

test("notes a history shorter than the period", async ({ page }) => {
  await mockTrends(page)
  await page.goto("/tendencias")

  await page.getByLabel("Métrica").selectOption("bodyFatPercentage")
  await expect(
    page.getByText(
      "Gordura só tem registros desde 10/11; períodos maiores mostram o mesmo trecho.",
    ),
  ).toBeVisible()
})

test("explains when a period has too few points", async ({ page }) => {
  await mockTrends(page)
  await page.goto("/tendencias")

  await page.getByLabel("Métrica").selectOption("waistCm")
  await expect(
    page.getByText("Ainda não há dados suficientes para este período."),
  ).toBeVisible()
  await expect(
    page.getByText("Cintura tem registros desde 10/11."),
  ).toBeVisible()
  await expect(page.getByTestId("trend-chart")).toHaveCount(0)

  await page.getByLabel("Métrica").selectOption("sleepHours")
  await expect(
    page.getByText("Ainda não há dados suficientes para este período."),
  ).toBeVisible()
  await expect(page.getByText(/tem registros desde/)).toHaveCount(0)
})

test("the marker snaps to the nearest day and shows its value and week average", async ({
  page,
}) => {
  await mockTrends(page)
  await page.goto("/tendencias")

  const chart = page.getByTestId("trend-chart")
  const box = await chart.boundingBox()

  await expect(page.getByTestId("trend-marker")).toHaveCount(0)
  await chart.click({ position: { x: (box?.width ?? 300) - 12, y: 100 } })

  await expect(page.getByTestId("trend-readout")).toHaveText(
    "sex 13/11 · 72,2 kg · média da semana 72,5",
  )
  await expect(page.getByTestId("trend-marker")).toHaveCount(1)
})

test("lists the weekly averages in an accessible table, newest week first", async ({
  page,
}) => {
  await mockTrends(page)
  await page.goto("/tendencias")

  const details = page.locator("details.tbl")

  await expect(details).not.toHaveAttribute("open", "")
  await details.getByText("Ver médias semanais como tabela").click()

  await expect(
    page.getByRole("columnheader", { name: /Semana|Média|Dias/ }),
  ).toHaveText(["Semana", "Média", "Dias"])
  await expect(details.locator("tbody tr")).toHaveText([
    "9–15 nov72,5 kg3",
    "2–8 nov73,9 kg2",
    "26 out – 1 nov74,8 kg2",
  ])
})

test("keeps a retry button when loading fails", async ({ page }) => {
  await mockTrends(page, [500])
  await page.goto("/tendencias")

  await expect(page.getByRole("alert")).toBeVisible()
  await page.getByRole("button", { name: "Tentar de novo" }).click()
  await expect(summary(page)).toContainText("73,6kg")
})

test("the selection follows refetched data and clears when its day disappears", async ({
  page,
}) => {
  const source = { points }

  await mockTrends(page, [], source)
  await page.goto("/tendencias")

  const chart = page.getByTestId("trend-chart")
  const readout = page.getByTestId("trend-readout")
  const box = await chart.boundingBox()

  await chart.click({ position: { x: (box?.width ?? 300) - 12, y: 100 } })
  await expect(readout).toHaveText("sex 13/11 · 72,2 kg · média da semana 72,5")

  source.points = points.map((item) =>
    item.date === "2026-11-13" ? { ...item, weightKg: 71.8 } : item,
  )
  await page.evaluate(() => window.dispatchEvent(new Event("focus")))
  await expect(readout).toContainText("71,8 kg")
  await expect(page.getByTestId("trend-marker")).toHaveCount(1)

  source.points = points.filter((item) => item.date !== "2026-11-13")
  // The fixed clock never advances, so move it past the resume cooldown.
  await page.clock.setFixedTime(new Date(2026, 10, 13, 12, 0, 2))
  await page.evaluate(() => window.dispatchEvent(new Event("focus")))
  await expect(readout).toHaveText("Toque no gráfico para ver os valores.")
  await expect(page.getByTestId("trend-marker")).toHaveCount(0)
})
