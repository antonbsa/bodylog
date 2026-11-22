import { afterEach, beforeEach, describe, expect, it, vi } from "vitest"

import { app } from "../../apps/api/src/app"
import { createSignedInEnv, SIGNED_IN_COOKIE } from "./test-env"
import { getCurrentDateOnly } from "../../apps/api/src/features/dashboard/weekly-dashboard-service"
import type { WeeklyDashboard } from "../../types/dashboard"

type MeasurementRow = {
  id: string
  date: string
  weight_kg: number
  body_fat_percentage: number | null
  muscle_percentage: number | null
  resting_metabolism_kcal: number | null
  waist_cm: number | null
  sleep_hours: number | null
  disposition: number | null
  notes: string | null
  created_at: string
  updated_at: string
}

describe("weekly dashboard api", () => {
  beforeEach(() => {
    vi.useFakeTimers()
    vi.setSystemTime(new Date("2026-06-10T12:00:00.000Z"))
  })

  afterEach(() => {
    vi.useRealTimers()
  })

  it("returns the current week, previous week, counts, and partial-week metadata", async () => {
    const env = createEnv()
    const response = await app.request(
      "/api/dashboard/weekly",
      {
        headers: {
          cookie: SIGNED_IN_COOKIE,
        },
      },
      env,
    )

    expect(response.status).toBe(200)
    expect(await response.json()).toEqual({
      current: {
        weekStartDate: "2026-06-08",
        weekEndDate: "2026-06-14",
        measurementCount: 2,
        recordedDates: ["2026-06-08", "2026-06-10"],
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
          waistCm: 88.5,
          sleepHours: 7.5,
          disposition: null,
        },
      },
      previous: {
        weekStartDate: "2026-06-01",
        weekEndDate: "2026-06-07",
        measurementCount: 2,
        recordedDates: ["2026-06-01", "2026-06-07"],
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
          waistCm: 91,
          sleepHours: null,
          disposition: null,
        },
      },
    })
  })

  it("derives the current date in America/Sao_Paulo for a user with no stored zone", async () => {
    vi.setSystemTime(new Date("2026-06-15T01:30:00.000Z"))

    expect(getCurrentDateOnly("America/Sao_Paulo")).toBe("2026-06-14")

    const env = createEnv()
    const response = await app.request(
      "/api/dashboard/weekly",
      {
        headers: {
          cookie: SIGNED_IN_COOKIE,
        },
      },
      env,
    )
    const body = (await response.json()) as WeeklyDashboard

    expect(response.status).toBe(200)
    expect(body.current.weekStartDate).toBe("2026-06-08")
    expect(body.current.weekEndDate).toBe("2026-06-14")
  })
})

function createEnv() {
  return createSignedInEnv([
    measurementRow({
      id: "previous-1",
      date: "2026-06-01",
      weightKg: 71,
      bodyFatPercentage: 16,
      musclePercentage: 42,
      restingMetabolismKcal: 1680,
      waistCm: 90,
    }),
    measurementRow({
      id: "previous-2",
      date: "2026-06-07",
      weightKg: 73,
      bodyFatPercentage: 16.4,
      musclePercentage: 43.5,
      restingMetabolismKcal: 1700,
      waistCm: 92,
    }),
    measurementRow({
      id: "current-1",
      date: "2026-06-08",
      weightKg: 74,
      bodyFatPercentage: 14,
      musclePercentage: 44,
      restingMetabolismKcal: 1710,
      waistCm: 88.5,
      sleepHours: 7,
    }),
    measurementRow({
      id: "current-2",
      date: "2026-06-10",
      weightKg: 72,
      bodyFatPercentage: null,
      musclePercentage: null,
      restingMetabolismKcal: 1690,
      sleepHours: 8,
    }),
  ]).env
}

function measurementRow(input: {
  id: string
  date: string
  weightKg: number
  bodyFatPercentage?: number | null
  musclePercentage?: number | null
  restingMetabolismKcal?: number | null
  waistCm?: number | null
  sleepHours?: number | null
}): MeasurementRow {
  return {
    id: input.id,
    date: input.date,
    weight_kg: input.weightKg,
    body_fat_percentage: input.bodyFatPercentage ?? null,
    muscle_percentage: input.musclePercentage ?? null,
    resting_metabolism_kcal: input.restingMetabolismKcal ?? null,
    waist_cm: input.waistCm ?? null,
    sleep_hours: input.sleepHours ?? null,
    disposition: null,
    notes: null,
    created_at: "2026-06-10T12:00:00.000Z",
    updated_at: "2026-06-10T12:00:00.000Z",
  }
}
