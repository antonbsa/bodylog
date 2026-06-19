import { expect, test, type Page, type Route } from "@playwright/test"

type ListedMeasurementPayload = {
  id: string
  date: string
  weightKg: number
  bodyFatPercentage: number | null
  musclePercentage: number | null
  restingMetabolismKcal: number | null
  derived: {
    bmi: number
    bodyFatKg: number | null
    muscleKg: number | null
  }
  createdAt: string
  updatedAt: string
}

test("renders recent measurements, loads more, and opens an item for editing", async ({
  page,
}) => {
  const measurements = createMeasurements(32)
  const deletedMeasurementIds: string[] = []
  let dashboardRequestCount = 0
  let requestedListLimits: number[] = []

  await mockAuthenticatedSession(page, () => {
    dashboardRequestCount += 1
  })
  await page.route("**/api/measurements?*", async (route) => {
    const url = new URL(route.request().url())
    const limit = Number(url.searchParams.get("limit") ?? "30")

    requestedListLimits = [...requestedListLimits, limit]

    await route.fulfill({
      body: JSON.stringify({
        items: measurements
          .filter(
            (measurement) => !deletedMeasurementIds.includes(measurement.id),
          )
          .slice(0, limit),
      }),
      contentType: "application/json",
      status: 200,
    })
  })
  await page.route("**/api/measurements/by-date/*", async (route) => {
    const date = extractDateFromRoute(route)
    const measurement = measurements.find((item) => item.date === date) ?? null

    await route.fulfill({
      body: JSON.stringify({
        item: measurement
          ? {
              id: measurement.id,
              date: measurement.date,
              weightKg: measurement.weightKg,
              bodyFatPercentage: measurement.bodyFatPercentage,
              musclePercentage: measurement.musclePercentage,
              restingMetabolismKcal: measurement.restingMetabolismKcal,
              createdAt: measurement.createdAt,
              updatedAt: measurement.updatedAt,
            }
          : null,
      }),
      contentType: "application/json",
      status: measurement ? 200 : 404,
    })
  })
  await page.route("**/api/measurements/*", async (route) => {
    if (route.request().method() !== "DELETE") {
      await route.fallback()
      return
    }

    const id = extractDateFromRoute(route)
    deletedMeasurementIds.push(id)

    await route.fulfill({
      body: JSON.stringify({
        ok: true,
      }),
      contentType: "application/json",
      status: 200,
    })
  })

  await page.goto("/")

  await expect(page.getByText("Medidas recentes")).toHaveCount(0)

  const table = page.getByRole("table", { name: "Histórico de medidas" })

  await expect(table).toBeVisible()
  await expect(table.getByRole("columnheader").first()).toHaveText("Data")
  await expect(table.getByRole("columnheader").last()).toHaveText("Ações")
  await expect(table.locator("tbody tr")).toHaveCount(30)
  await expectHorizontalScrollbarToBeVisible(page)
  await expectHorizontalScrollbarToClearLastRow(page)
  await expectNoTrailingTableScrollSpace(page)

  const newestItem = table.getByRole("row").filter({
    hasText: "14/06/2026",
  })

  await expect(newestItem).toContainText("72,9 kg")
  await expect(newestItem).toContainText("25,83")
  await expect(newestItem).toContainText("14,46%")
  await expect(newestItem).toContainText("10,54 kg")
  await expect(newestItem).toContainText("43,72%")
  await expect(newestItem).toContainText("31,87 kg")
  await expect(newestItem).toContainText("1.700 kcal")
  await expect(newestItem.getByRole("button", { name: "Editar" })).toBeVisible()
  await expect(
    newestItem.getByRole("button", { name: "Excluir medida de 14/06/2026" }),
  ).toBeVisible()

  const deletableItem = table.getByRole("row").filter({
    hasText: "12/06/2026",
  })

  await deletableItem
    .getByRole("button", { name: "Excluir medida de 12/06/2026" })
    .click()

  const deleteDialog = page.getByRole("alertdialog", {
    name: "Excluir medida",
  })

  await expect(deleteDialog).toBeVisible()
  await expect(
    deleteDialog.getByText(
      "Excluir a medida de 12/06/2026? Esta ação não pode ser desfeita.",
    ),
  ).toBeVisible()
  await deleteDialog.getByRole("button", { name: "Cancelar" }).click()
  await expect(deleteDialog).toBeHidden()
  await expect(table.locator("tbody tr")).toHaveCount(30)
  expect(deletedMeasurementIds).toEqual([])

  await deletableItem
    .getByRole("button", { name: "Excluir medida de 12/06/2026" })
    .click()
  await expect(deleteDialog).toBeVisible()
  await deleteDialog
    .getByRole("button", { name: "Excluir medida", exact: true })
    .click()

  await expect(page.getByText("Medida de 12/06/2026 excluída.")).toBeVisible()
  await expect(deleteDialog).toBeHidden()
  await expect(
    table.getByRole("row").filter({
      hasText: "12/06/2026",
    }),
  ).toHaveCount(0)
  expect(deletedMeasurementIds).toEqual(["measurement-3"])
  expect(dashboardRequestCount).toBeGreaterThanOrEqual(2)

  const missingOptionalItem = table.getByRole("row").filter({
    hasText: "13/06/2026",
  })

  await expect(
    missingOptionalItem.getByRole("cell", { name: "-" }),
  ).toHaveCount(5)

  await page.getByRole("button", { name: "Carregar mais" }).click()

  await expect(table.locator("tbody tr")).toHaveCount(31)
  await expect(page.getByRole("button", { name: "Carregar mais" })).toHaveCount(
    0,
  )
  expect(requestedListLimits).toContain(31)
  expect(requestedListLimits[requestedListLimits.length - 1]).toBe(61)

  await newestItem.getByRole("button", { name: "Editar" }).click()

  const dialog = page.getByRole("dialog", { name: "Medida corporal" })

  await expect(dialog).toBeVisible()
  await expect(dialog.getByText("Editando")).toBeVisible()
  await expect(page.getByLabel("Data")).toHaveValue("14/06/2026")
  await expect(page.getByLabel("Peso (kg)")).toHaveValue("72,9")
})

test("renders an empty measurement history state", async ({ page }) => {
  await mockAuthenticatedSession(page)
  await mockMeasurementList(page, [])

  await page.goto("/")

  await expect(page.getByText("Nenhum registro ainda.")).toBeVisible()
  await expect(page.getByRole("button", { name: "Carregar mais" })).toHaveCount(
    0,
  )
})

test("renders a measurement history error state", async ({ page }) => {
  await mockAuthenticatedSession(page)
  await page.route("**/api/measurements?*", async (route) => {
    await route.fulfill({
      body: JSON.stringify({
        error: "SERVER_ERROR",
        ok: false,
      }),
      contentType: "application/json",
      status: 500,
    })
  })

  await page.goto("/")

  await expect(
    page.getByRole("alert").filter({
      hasText: "Não foi possível carregar o histórico.",
    }),
  ).toBeVisible()
})

async function mockAuthenticatedSession(
  page: Page,
  onDashboardRequest?: () => void,
) {
  await page.route("**/api/auth/session", async (route) => {
    await route.fulfill({
      body: JSON.stringify({
        authenticated: true,
      }),
      contentType: "application/json",
      status: 200,
    })
  })
  await mockWeeklyDashboard(page, onDashboardRequest)
}

async function mockWeeklyDashboard(
  page: Page,
  onDashboardRequest?: () => void,
) {
  await page.route("**/api/dashboard/weekly", async (route) => {
    onDashboardRequest?.()

    await route.fulfill({
      body: JSON.stringify({
        current: {
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
        },
        display: {
          mode: "current-week",
          summary: {
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
          },
          variation: {},
        },
        previous: {
          weekStartDate: "2026-06-01",
          weekEndDate: "2026-06-07",
          measurementCount: 0,
          isCurrentWeek: false,
          isPartialWeek: false,
          averages: {
            weightKg: null,
            bmi: null,
            bodyFatPercentage: null,
            bodyFatKg: null,
            musclePercentage: null,
            muscleKg: null,
            restingMetabolismKcal: null,
          },
        },
        variation: {},
      }),
      contentType: "application/json",
      status: 200,
    })
  })
}

async function mockMeasurementList(
  page: Page,
  items: ListedMeasurementPayload[],
) {
  await page.route("**/api/measurements?*", async (route) => {
    await route.fulfill({
      body: JSON.stringify({
        items,
      }),
      contentType: "application/json",
      status: 200,
    })
  })
}

function createMeasurements(count: number): ListedMeasurementPayload[] {
  const measurements: ListedMeasurementPayload[] = []

  for (let index = 0; index < count; index += 1) {
    const date = formatDateOnly(
      addDays(new Date("2026-06-14T00:00:00.000Z"), -index),
    )
    const hasOptionalValues = index !== 1

    measurements.push({
      id: `measurement-${index + 1}`,
      date,
      weightKg: index === 0 ? 72.9 : 72.9 - index / 10,
      bodyFatPercentage: hasOptionalValues ? 14.46 : null,
      musclePercentage: hasOptionalValues ? 43.72 : null,
      restingMetabolismKcal: hasOptionalValues ? 1700 : null,
      derived: {
        bmi: index === 0 ? 25.83 : 25.8 - index / 10,
        bodyFatKg: hasOptionalValues ? 10.54 : null,
        muscleKg: hasOptionalValues ? 31.87 : null,
      },
      createdAt: "2026-06-30T12:00:00.000Z",
      updatedAt: "2026-06-30T12:00:00.000Z",
    })
  }

  return measurements
}

function addDays(date: Date, days: number): Date {
  const nextDate = new Date(date)
  nextDate.setUTCDate(nextDate.getUTCDate() + days)

  return nextDate
}

function formatDateOnly(date: Date): string {
  return date.toISOString().slice(0, 10)
}

async function expectNoTrailingTableScrollSpace(page: Page) {
  const geometry = await page
    .locator(".history-table-scroll")
    .evaluate((root) => {
      const viewport = root.querySelector(".rt-ScrollAreaViewport")
      const table = root.querySelector(".history-table")

      return {
        scrollWidth: viewport?.scrollWidth ?? 0,
        tableWidth: Math.ceil(table?.getBoundingClientRect().width ?? 0),
      }
    })

  expect(
    Math.abs(geometry.scrollWidth - geometry.tableWidth),
  ).toBeLessThanOrEqual(1)
}

async function expectHorizontalScrollbarToBeVisible(page: Page) {
  const scrollbar = page.locator(
    '.history-table-scroll .rt-ScrollAreaScrollbar[data-orientation="horizontal"]',
  )

  await expect(scrollbar).toBeVisible()

  const geometry = await scrollbar.evaluate((element) => {
    const rect = element.getBoundingClientRect()

    return {
      height: rect.height,
      width: rect.width,
    }
  })

  expect(geometry.height).toBeGreaterThan(0)
  expect(geometry.width).toBeGreaterThan(0)
}

async function expectHorizontalScrollbarToClearLastRow(page: Page) {
  const geometry = await page
    .locator(".history-table-scroll")
    .evaluate((root) => {
      const lastRow = root.querySelector(".history-table tbody tr:last-child")
      const scrollbar = root.querySelector(
        '.rt-ScrollAreaScrollbar[data-orientation="horizontal"]',
      )

      return {
        gap:
          (scrollbar?.getBoundingClientRect().top ?? 0) -
          (lastRow?.getBoundingClientRect().bottom ?? 0),
      }
    })

  expect(geometry.gap).toBeGreaterThanOrEqual(8)
}

function extractDateFromRoute(route: Route): string {
  const url = new URL(route.request().url())
  const pathParts = url.pathname.split("/")

  return pathParts[pathParts.length - 1] ?? ""
}
