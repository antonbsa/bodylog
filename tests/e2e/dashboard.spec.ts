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
  await expect(page.getByText("Baixa")).toHaveCount(2)

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
