import { expect, test, type Page } from "@playwright/test"

test("shows the authenticated weekly dashboard summary", async ({ page }) => {
  await mockAuthenticatedDashboard(page)

  await page.goto("/")

  await expect(
    page.getByRole("heading", { name: "Resumo da semana" }),
  ).toBeVisible()
  await expect(
    page.getByText(
      "Semana em andamento: comparação parcial contra a semana anterior completa.",
    ),
  ).toBeVisible()
  await expect(page.getByText("2/5")).toBeVisible()
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

async function mockAuthenticatedDashboard(page: Page) {
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
