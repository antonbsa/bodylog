import {
  WeeklyDashboardRepository,
  getWeeklyDashboard,
} from "../../apps/api/src/dashboard/weekly-dashboard-service"
import { describe, expect, it } from "vitest"

import { Measurement } from "../../apps/api/src/domain/measurement"

const USER_HEIGHT_CM = 168

describe("getWeeklyDashboard", () => {
  it("compares the current partial week against the previous full week", async () => {
    const dashboard = await getWeeklyDashboard(
      repositoryFor([
        measurement({ date: "2026-06-01", weightKg: 71 }),
        measurement({ date: "2026-06-07", weightKg: 73 }),
        measurement({ date: "2026-06-08", weightKg: 74 }),
      ]),
      {
        currentDate: "2026-06-10",
        heightCm: USER_HEIGHT_CM,
      },
    )

    expect(dashboard.current.weekStartDate).toBe("2026-06-08")
    expect(dashboard.current.weekEndDate).toBe("2026-06-14")
    expect(dashboard.current.isCurrentWeek).toBe(true)
    expect(dashboard.current.isPartialWeek).toBe(true)
    expect(dashboard.previous.weekStartDate).toBe("2026-06-01")
    expect(dashboard.previous.weekEndDate).toBe("2026-06-07")
    expect(dashboard.previous.isCurrentWeek).toBe(false)
    expect(dashboard.previous.isPartialWeek).toBe(false)
    expect(dashboard.previous.averages.weightKg).toBe(72)
    expect(dashboard.display.mode).toBe("current-week")
    expect(dashboard.display.summary.weekStartDate).toBe("2026-06-08")
    expect(dashboard.display.summary.averages.weightKg).toBe(74)
    expect(dashboard.variation.weightKg).toEqual({
      absolute: 2,
      relativePercentage: 2.78,
      direction: "up",
    })
  })

  it("displays latest recorded week metrics when current week has no measurements", async () => {
    const dashboard = await getWeeklyDashboard(
      repositoryFor([
        measurement({ date: "2026-06-01", weightKg: 71 }),
        measurement({
          date: "2026-06-08",
          weightKg: 73,
          bodyFatPercentage: 15,
          musclePercentage: 43,
        }),
        measurement({
          date: "2026-06-14",
          weightKg: 75,
          bodyFatPercentage: 13,
          musclePercentage: 45,
        }),
      ]),
      {
        currentDate: "2026-06-15",
        heightCm: USER_HEIGHT_CM,
      },
    )

    expect(dashboard.current.weekStartDate).toBe("2026-06-15")
    expect(dashboard.current.measurementCount).toBe(0)
    expect(dashboard.current.averages.weightKg).toBeNull()
    expect(dashboard.display.mode).toBe("latest-recorded-week")
    expect(dashboard.display.summary.weekStartDate).toBe("2026-06-08")
    expect(dashboard.display.summary.weekEndDate).toBe("2026-06-14")
    expect(dashboard.display.summary.averages.weightKg).toBe(74)
    expect(dashboard.display.summary.averages.bodyFatPercentage).toBe(14)
    expect(dashboard.display.variation.weightKg).toEqual({
      absolute: 3,
      relativePercentage: 4.23,
      direction: "up",
    })
  })
})

function repositoryFor(measurements: Measurement[]): WeeklyDashboardRepository {
  return {
    list: async () => measurements,
  }
}

function measurement(input: {
  bodyFatPercentage?: number | null
  date: string
  musclePercentage?: number | null
  restingMetabolismKcal?: number | null
  waistCm?: number | null
  sleepHours?: number | null
  disposition?: number | null
  weightKg: number
}): Measurement {
  return new Measurement({
    id: `measurement-${input.date}`,
    date: input.date,
    weightKg: input.weightKg,
    bodyFatPercentage: input.bodyFatPercentage ?? null,
    musclePercentage: input.musclePercentage ?? null,
    restingMetabolismKcal: input.restingMetabolismKcal ?? null,
    waistCm: input.waistCm ?? null,
    sleepHours: input.sleepHours ?? null,
    disposition: input.disposition ?? null,
    notes: null,
    createdAt: "2026-06-10T12:00:00.000Z",
    updatedAt: "2026-06-10T12:00:00.000Z",
  })
}
