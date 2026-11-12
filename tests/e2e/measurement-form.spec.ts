import { expect, test, type Page, type Route } from "@playwright/test"

type MeasurementPayload = {
  id: string
  date: string
  weightKg: number
  bodyFatPercentage: number | null
  musclePercentage: number | null
  restingMetabolismKcal: number | null
  createdAt: string
  updatedAt: string
}

async function mockAuthenticatedSession(page: Page) {
  await page.route("**/api/auth/session", async (route) => {
    await route.fulfill({
      body: JSON.stringify({
        authenticated: true,
      }),
      contentType: "application/json",
      status: 200,
    })
  })
  await mockWeeklyDashboard(page)
  await mockMeasurementList(page)
}

async function mockWeeklyDashboard(page: Page) {
  await page.route("**/api/dashboard/weekly", async (route) => {
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

async function mockMeasurementList(page: Page) {
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

test("creates a measurement from the dashboard form", async ({ page }) => {
  const today = getTodayDateInputValue()
  const todayDisplay = formatDisplayDate(today)

  await mockAuthenticatedSession(page)
  await page.route("**/api/measurements/by-date/*", async (route) => {
    const request = route.request()

    if (request.method() === "GET") {
      await fulfillMeasurementLookup(route, null, 404)
      return
    }

    expect(request.method()).toBe("PUT")
    expect(extractDateFromRoute(route)).toBe(today)
    expect(request.postDataJSON()).toEqual({
      bodyFatPercentage: 14.8,
      musclePercentage: null,
      restingMetabolismKcal: 1700,
      waistCm: null,
      sleepHours: null,
      disposition: null,
      notes: null,
      weightKg: 72.5,
    })

    await fulfillMeasurementLookup(route, {
      id: "created-measurement",
      date: today,
      weightKg: 72.5,
      bodyFatPercentage: 14.8,
      musclePercentage: null,
      restingMetabolismKcal: 1700,
      createdAt: "2026-06-12T12:00:00.000Z",
      updatedAt: "2026-06-12T12:00:00.000Z",
    })
  })

  await page.goto("/")
  await page.getByRole("link", { name: "Registrar medida" }).click()

  const dialog = page.getByRole("dialog", { name: "Medida corporal" })

  await expect(dialog).toBeVisible()
  await expect(dialog.getByText("Criando")).toBeVisible()
  await expect(page.getByLabel("Fechar formulário")).toHaveCount(0)
  await expect(dialog.locator(".modal-loading-status")).toBeAttached()
  await expect(page.getByLabel("Data")).toHaveValue(todayDisplay)
  await expect(page.getByLabel("Peso (kg)")).toHaveValue("")
  await expect(page.getByLabel("Peso (kg)")).not.toHaveAttribute("placeholder")
  await expect(page.getByLabel("Gordura corporal (%)")).not.toHaveAttribute(
    "placeholder",
  )
  await expect(page.getByLabel("Músculo (%)")).not.toHaveAttribute(
    "placeholder",
  )
  await expect(
    page.getByLabel("Metabolismo de repouso (kcal)"),
  ).not.toHaveAttribute("placeholder")

  await page.getByLabel("Peso (kg)").fill("72,5")
  await page.getByLabel("Gordura corporal (%)").fill("14,8")
  await page.getByLabel("Metabolismo de repouso (kcal)").fill("1700")
  await page.getByRole("button", { name: "Salvar medida" }).click()

  await expect(dialog).toBeHidden()
  await expect(page.getByRole("status")).toHaveText(
    `Medida de ${formatDisplayDate(today)} salva.`,
  )
})

test("loads an existing date into the form before saving", async ({ page }) => {
  const existingDate = "2026-06-10"
  const existingDisplayDate = "10/06/2026"
  const emptyDate = "11/06/2026"
  let existingDateLookupCount = 0

  await mockAuthenticatedSession(page)
  await page.route("**/api/measurements/by-date/*", async (route) => {
    const request = route.request()
    const date = extractDateFromRoute(route)

    if (request.method() === "GET") {
      if (date === existingDate) {
        existingDateLookupCount += 1
        await fulfillMeasurementLookup(route, {
          id: "existing-measurement",
          date: existingDate,
          weightKg: 72.9,
          bodyFatPercentage: 14.46,
          musclePercentage: null,
          restingMetabolismKcal: 1700,
          createdAt: "2026-06-09T12:00:00.000Z",
          updatedAt: "2026-06-09T12:00:00.000Z",
        })
        return
      }

      if (date === "2026-06-11") {
        await fulfillMeasurementLookup(route, null, 404)
        return
      }

      await fulfillMeasurementLookup(route, null, 404)
      return
    }

    expect(request.method()).toBe("PUT")
    expect(date).toBe(existingDate)
    expect(request.postDataJSON()).toEqual({
      bodyFatPercentage: 14.46,
      musclePercentage: null,
      restingMetabolismKcal: 1700,
      waistCm: null,
      sleepHours: null,
      disposition: null,
      notes: null,
      weightKg: 73.1,
    })

    await fulfillMeasurementLookup(route, {
      id: "existing-measurement",
      date: existingDate,
      weightKg: 73.1,
      bodyFatPercentage: 14.46,
      musclePercentage: null,
      restingMetabolismKcal: 1700,
      createdAt: "2026-06-09T12:00:00.000Z",
      updatedAt: "2026-06-10T12:00:00.000Z",
    })
  })

  await page.goto("/")
  await page.getByRole("link", { name: "Registrar medida" }).click()
  await page.getByLabel("Data").fill(existingDisplayDate)

  await expect(page.getByRole("dialog").getByText("Editando")).toBeVisible()
  await expect(page.getByLabel("Fechar formulário")).toHaveCount(0)
  await expect(page.getByLabel("Peso (kg)")).toHaveValue("72,9")
  await expect(page.getByLabel("Gordura corporal (%)")).toHaveValue("14,46")
  await expect(page.getByLabel("Músculo (%)")).toHaveValue("")

  await page.getByLabel("Data").fill(emptyDate)
  await expect(page.getByRole("dialog").getByText("Criando")).toBeVisible()
  await expect(page.getByLabel("Peso (kg)")).toHaveValue("")

  await page.getByLabel("Data").fill(existingDisplayDate)
  await expect(page.getByRole("dialog").getByText("Editando")).toBeVisible()
  await expect(page.getByLabel("Peso (kg)")).toHaveValue("72,9")
  expect(existingDateLookupCount).toBe(1)

  await page.getByLabel("Peso (kg)").fill("73,1")
  await page.getByRole("button", { name: "Salvar medida" }).click()

  await expect(
    page.getByRole("dialog", { name: "Medida corporal" }),
  ).toBeHidden()
  await expect(page.getByRole("status")).toHaveText(
    "Medida de 10/06/2026 salva.",
  )
})

async function fulfillMeasurementLookup(
  route: Route,
  item: MeasurementPayload | null,
  status = 200,
) {
  await route.fulfill({
    body: JSON.stringify({
      item,
    }),
    contentType: "application/json",
    status,
  })
}

function extractDateFromRoute(route: Route): string {
  const url = new URL(route.request().url())
  const pathParts = url.pathname.split("/")

  return pathParts[pathParts.length - 1] ?? ""
}

function getTodayDateInputValue(): string {
  const today = new Date()
  const year = today.getFullYear()
  const month = String(today.getMonth() + 1).padStart(2, "0")
  const day = String(today.getDate()).padStart(2, "0")

  return `${year}-${month}-${day}`
}

function formatDisplayDate(value: string): string {
  const [year, month, day] = value.split("-")

  return `${day}/${month}/${year}`
}
