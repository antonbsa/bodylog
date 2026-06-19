import { describe, expect, it } from "vitest"

import { Measurement } from "../../apps/api/src/domain/measurement"
import { getWeekRange } from "../../apps/api/src/domain/week-range"
import { WeekSummary } from "../../apps/api/src/domain/week-summary"

const USER_HEIGHT_CM = 168

describe("WeekSummary", () => {
  it("ignores missing days and missing values per metric when averaging", () => {
    const measurements = [
      measurement({
        date: "2026-06-08",
        weightKg: 70,
        bodyFatPercentage: 10,
        musclePercentage: 40,
      }),
      measurement({
        date: "2026-06-10",
        weightKg: 74,
        bodyFatPercentage: null,
        musclePercentage: null,
      }),
    ]
    const range = getWeekRange("2026-06-10")

    const summary = WeekSummary.forRange(measurements, range, {
      currentDate: "2026-06-10",
      heightCm: USER_HEIGHT_CM,
      isCurrentWeek: true,
    })

    expect(summary.measurementCount).toBe(2)
    expect(summary.isPartialWeek).toBe(true)
    expect(summary.averages).toMatchObject({
      weightKg: 72,
      bmi: 25.51,
      bodyFatPercentage: 10,
      bodyFatKg: 7,
      musclePercentage: 40,
      muscleKg: 28,
      restingMetabolismKcal: null,
    })
  })

  it("returns null averages when the week has no measurements", () => {
    const range = getWeekRange("2026-06-15")

    const summary = WeekSummary.forRange([], range, {
      currentDate: "2026-06-15",
      heightCm: USER_HEIGHT_CM,
      isCurrentWeek: true,
    })

    expect(summary.measurementCount).toBe(0)
    expect(summary.averages.weightKg).toBeNull()
  })
})

function measurement(input: {
  bodyFatPercentage?: number | null
  date: string
  musclePercentage?: number | null
  restingMetabolismKcal?: number | null
  weightKg: number
}): Measurement {
  return new Measurement({
    id: `measurement-${input.date}`,
    date: input.date,
    weightKg: input.weightKg,
    bodyFatPercentage: input.bodyFatPercentage ?? null,
    musclePercentage: input.musclePercentage ?? null,
    restingMetabolismKcal: input.restingMetabolismKcal ?? null,
    createdAt: "2026-06-10T12:00:00.000Z",
    updatedAt: "2026-06-10T12:00:00.000Z",
  })
}
