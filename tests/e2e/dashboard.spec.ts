import { expect, test, type Page } from "@playwright/test"

test("shows the authenticated weekly dashboard summary", async ({ page }) => {
  const currentWeek = getWeekRange(getTodayDateInputValue())
  const previousWeek = getPreviousWeekRange(currentWeek.weekStartDate)

  await mockAuthenticatedDashboard(page, {
    currentWeek,
    previousWeek,
  })

  await page.goto("/")

  await expect(
    page.getByRole("heading", { name: "Resumo da semana" }),
  ).toBeVisible()
  await expect(
    page.getByText(
      "Semana em andamento: comparação parcial contra a semana anterior completa.",
    ),
  ).toBeVisible()
  await expect(
    page.getByText(`2/${getAvailableDaysSoFar(currentWeek)}`),
  ).toBeVisible()
  await expect(page.getByText("Confiabilidade")).toHaveCount(0)

  const weightCard = page.locator(".metric-card").filter({
    hasText: "Peso médio",
  })
  await expect(weightCard).toContainText("73 kg")
  await expect(weightCard).toContainText("Subiu")
  await expect(weightCard).toContainText("+1 kg")
  await expect(weightCard).toContainText("+1,39%")
  await expect(weightCard).toContainText("IMC médio: 25,87")

  const bodyFatCard = page.locator(".metric-card").filter({
    hasText: "Gordura corporal",
  })
  await expect(bodyFatCard).toContainText("14%")
  await expect(bodyFatCard).toContainText("Caiu")
  await expect(bodyFatCard).toContainText("-2,2 p.p.")
  await expect(bodyFatCard).toContainText("-1,31 kg")

  const muscleCard = page.locator(".metric-card").filter({
    hasText: "Músculo",
  })
  await expect(muscleCard).toContainText("44%")
  await expect(muscleCard).toContainText("Subiu")
  await expect(muscleCard).toContainText("+1,25 p.p.")
  await expect(muscleCard).toContainText("+1,77 kg")
})

test("shows latest recorded metrics when the current week has no measurements", async ({
  page,
}) => {
  await mockAuthenticatedDashboardPayload(page, {
    current: {
      weekStartDate: "2026-06-15",
      weekEndDate: "2026-06-21",
      measurementCount: 0,
      isCurrentWeek: true,
      isPartialWeek: true,
      averages: emptyAverages(),
    },
    display: {
      mode: "latest-recorded-week",
      summary: {
        weekStartDate: "2026-06-08",
        weekEndDate: "2026-06-14",
        measurementCount: 2,
        isCurrentWeek: false,
        isPartialWeek: false,
        averages: {
          weightKg: 74,
          bmi: 26.22,
          bodyFatPercentage: 14,
          bodyFatKg: 10.36,
          musclePercentage: 44,
          muscleKg: 32.56,
          restingMetabolismKcal: 1700,
        },
      },
      variation: {},
    },
    previous: {
      weekStartDate: "2026-06-08",
      weekEndDate: "2026-06-14",
      measurementCount: 2,
      isCurrentWeek: false,
      isPartialWeek: false,
      averages: {
        weightKg: 74,
        bmi: 26.22,
        bodyFatPercentage: 14,
        bodyFatKg: 10.36,
        musclePercentage: 44,
        muscleKg: 32.56,
        restingMetabolismKcal: 1700,
      },
    },
    variation: {},
  })

  await page.goto("/")

  await expect(page.getByText("15/06/2026 a 21/06/2026")).toBeVisible()
  await expect(
    page.getByText(
      "Exibindo últimos dados registrados: 08/06/2026 a 14/06/2026.",
    ),
  ).toBeVisible()

  const weightCard = page.locator(".metric-card").filter({
    hasText: "Peso médio",
  })

  await expect(weightCard).toContainText("74 kg")
  await expect(weightCard).toContainText("IMC médio: 26,22")
})

test("refreshes the dashboard manually and the dashboard and history when returning to foreground", async ({
  page,
}) => {
  const currentWeek = getWeekRange(getTodayDateInputValue())
  const previousWeek = getPreviousWeekRange(currentWeek.weekStartDate)
  let dashboardWeightKg = 73
  let measurementDate = "2026-06-10"
  let dashboardRequestCount = 0
  let measurementRequestCount = 0

  await page.route("**/api/auth/session", async (route) => {
    await route.fulfill({
      body: JSON.stringify({
        authenticated: true,
      }),
      contentType: "application/json",
      status: 200,
    })
  })
  await page.route("**/api/dashboard/weekly", async (route) => {
    dashboardRequestCount += 1
    expect(route.request().headers()["cache-control"]).toBe("no-store")

    await route.fulfill({
      body: JSON.stringify(
        createWeeklyDashboardPayload({
          currentWeek,
          previousWeek,
          weightKg: dashboardWeightKg,
        }),
      ),
      contentType: "application/json",
      status: 200,
    })
  })
  await page.route("**/api/measurements?*", async (route) => {
    measurementRequestCount += 1
    expect(route.request().headers()["cache-control"]).toBe("no-store")

    await route.fulfill({
      body: JSON.stringify({
        items: [createListedMeasurement(measurementDate, dashboardWeightKg)],
      }),
      contentType: "application/json",
      status: 200,
    })
  })

  await page.goto("/")

  await expect(
    page.locator(".metric-card").filter({ hasText: "Peso médio" }),
  ).toContainText("73 kg")

  dashboardWeightKg = 74

  await page.getByRole("button", { name: "Atualizar dados" }).click()

  await expect(
    page.locator(".metric-card").filter({ hasText: "Peso médio" }),
  ).toContainText("74 kg")
  expect(dashboardRequestCount).toBeGreaterThanOrEqual(2)

  dashboardWeightKg = 75

  await page.waitForTimeout(600)
  await page.evaluate(() => {
    window.dispatchEvent(new Event("focus"))
  })

  await expect(
    page.locator(".metric-card").filter({ hasText: "Peso médio" }),
  ).toContainText("75 kg")
  expect(dashboardRequestCount).toBeGreaterThanOrEqual(3)

  measurementDate = "2026-06-11"

  await page.getByRole("link", { name: "Histórico" }).click()

  await expect(page.getByText("11/06/2026")).toBeVisible()
  expect(measurementRequestCount).toBeGreaterThanOrEqual(1)

  const requestsBeforeResume = measurementRequestCount
  measurementDate = "2026-06-12"

  await page.waitForTimeout(600)
  await page.evaluate(() => {
    window.dispatchEvent(new Event("focus"))
  })

  await expect(page.getByText("12/06/2026")).toBeVisible()
  expect(measurementRequestCount).toBeGreaterThan(requestsBeforeResume)
})

test("exports measurements CSV from the settings screen", async ({ page }) => {
  const currentWeek = getWeekRange(getTodayDateInputValue())
  const previousWeek = getPreviousWeekRange(currentWeek.weekStartDate)

  await mockAuthenticatedDashboard(page, {
    currentWeek,
    previousWeek,
  })
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
  const currentWeek = getWeekRange(getTodayDateInputValue())
  const previousWeek = getPreviousWeekRange(currentWeek.weekStartDate)
  let importRequestBody: string | null = null

  await mockAuthenticatedDashboard(page, {
    currentWeek,
    previousWeek,
  })
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
  const currentWeek = getWeekRange(getTodayDateInputValue())
  const previousWeek = getPreviousWeekRange(currentWeek.weekStartDate)

  await mockAuthenticatedDashboard(page, {
    currentWeek,
    previousWeek,
  })
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

type WeekRange = {
  weekEndDate: string
  weekStartDate: string
}

async function mockAuthenticatedDashboard(
  page: Page,
  weekRanges: {
    currentWeek: WeekRange
    previousWeek: WeekRange
  },
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
  await page.route("**/api/dashboard/weekly", async (route) => {
    await route.fulfill({
      body: JSON.stringify({
        current: {
          weekStartDate: weekRanges.currentWeek.weekStartDate,
          weekEndDate: weekRanges.currentWeek.weekEndDate,
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
            weekStartDate: weekRanges.currentWeek.weekStartDate,
            weekEndDate: weekRanges.currentWeek.weekEndDate,
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
          weekStartDate: weekRanges.previousWeek.weekStartDate,
          weekEndDate: weekRanges.previousWeek.weekEndDate,
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

async function mockAuthenticatedDashboardPayload(
  page: Page,
  dashboard: Record<string, unknown>,
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
  await page.route("**/api/dashboard/weekly", async (route) => {
    await route.fulfill({
      body: JSON.stringify(dashboard),
      contentType: "application/json",
      status: 200,
    })
  })
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

function emptyAverages() {
  return {
    weightKg: null,
    bmi: null,
    bodyFatPercentage: null,
    bodyFatKg: null,
    musclePercentage: null,
    muscleKg: null,
    restingMetabolismKcal: null,
  }
}

function createWeeklyDashboardPayload({
  currentWeek,
  previousWeek,
  weightKg,
}: {
  currentWeek: WeekRange
  previousWeek: WeekRange
  weightKg: number
}) {
  const currentAverages = {
    weightKg,
    bmi: 25.87,
    bodyFatPercentage: 14,
    bodyFatKg: 10.36,
    musclePercentage: 44,
    muscleKg: 32.56,
    restingMetabolismKcal: 1700,
  }

  return {
    current: {
      weekStartDate: currentWeek.weekStartDate,
      weekEndDate: currentWeek.weekEndDate,
      measurementCount: 2,
      isCurrentWeek: true,
      isPartialWeek: true,
      averages: currentAverages,
    },
    display: {
      mode: "current-week",
      summary: {
        weekStartDate: currentWeek.weekStartDate,
        weekEndDate: currentWeek.weekEndDate,
        measurementCount: 2,
        isCurrentWeek: true,
        isPartialWeek: true,
        averages: currentAverages,
      },
      variation: {
        weightKg: {
          absolute: 1,
          relativePercentage: 1.39,
          direction: "up",
        },
      },
    },
    previous: {
      weekStartDate: previousWeek.weekStartDate,
      weekEndDate: previousWeek.weekEndDate,
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
    },
  }
}

function createListedMeasurement(date: string, weightKg: number) {
  return {
    id: `measurement-${date}`,
    date,
    weightKg,
    bodyFatPercentage: 14,
    musclePercentage: 44,
    restingMetabolismKcal: 1700,
    derived: {
      bmi: 25.87,
      bodyFatKg: 10.36,
      muscleKg: 32.56,
    },
    createdAt: `${date}T12:00:00.000Z`,
    updatedAt: `${date}T12:00:00.000Z`,
  }
}

function getAvailableDaysSoFar(week: WeekRange): number {
  const today = getTodayDateInputValue()
  const latestAvailableDate =
    today > week.weekEndDate ? week.weekEndDate : today
  const availableDays =
    getDateOnlyDifferenceInDays(week.weekStartDate, latestAvailableDate) + 1

  return Math.max(1, Math.min(7, availableDays))
}

function getWeekRange(date: string): WeekRange {
  const parsedDate = parseDateOnly(date)
  const dayOfWeek = parsedDate.getUTCDay()
  const daysSinceMonday = (dayOfWeek + 6) % 7
  const weekStart = addDays(parsedDate, -daysSinceMonday)
  const weekEnd = addDays(weekStart, 6)

  return {
    weekStartDate: formatDateOnly(weekStart),
    weekEndDate: formatDateOnly(weekEnd),
  }
}

function getPreviousWeekRange(weekStartDate: string): WeekRange {
  const previousWeekStart = addDays(parseDateOnly(weekStartDate), -7)
  const previousWeekEnd = addDays(previousWeekStart, 6)

  return {
    weekStartDate: formatDateOnly(previousWeekStart),
    weekEndDate: formatDateOnly(previousWeekEnd),
  }
}

function getDateOnlyDifferenceInDays(
  startDate: string,
  endDate: string,
): number {
  const start = new Date(`${startDate}T00:00:00.000Z`)
  const end = new Date(`${endDate}T00:00:00.000Z`)
  const millisecondsPerDay = 24 * 60 * 60 * 1000

  return Math.round((end.getTime() - start.getTime()) / millisecondsPerDay)
}

function getTodayDateInputValue(): string {
  const today = new Date()
  const year = today.getFullYear()
  const month = String(today.getMonth() + 1).padStart(2, "0")
  const day = String(today.getDate()).padStart(2, "0")

  return `${year}-${month}-${day}`
}

function parseDateOnly(date: string): Date {
  return new Date(`${date}T00:00:00.000Z`)
}

function addDays(date: Date, days: number): Date {
  const nextDate = new Date(date)
  nextDate.setUTCDate(nextDate.getUTCDate() + days)

  return nextDate
}

function formatDateOnly(date: Date): string {
  return date.toISOString().slice(0, 10)
}
