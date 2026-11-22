import {
  WeeklyDashboardRepository,
  getWeeklyDashboard,
} from "../../apps/api/src/features/dashboard/weekly-dashboard-service"
import { describe, expect, it } from "vitest"

import { Measurement } from "../../apps/api/src/domain/measurement"

const HEIGHT_CM = 168

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
        heightCm: HEIGHT_CM,
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
