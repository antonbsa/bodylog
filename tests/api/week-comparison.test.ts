import { describe, expect, it } from "vitest"

import { Measurement } from "../../apps/api/src/domain/measurement"
import { WeekComparison } from "../../apps/api/src/domain/week-comparison"
import { getWeekRange } from "../../apps/api/src/domain/week-range"
import { WeekSummary } from "../../apps/api/src/domain/week-summary"

const USER_HEIGHT_CM = 168

describe("WeekComparison", () => {
  it("uses percentage points for percentage metric absolute differences", () => {
    const previous = summaryFor([
      measurement({
        date: "2026-06-01",
        weightKg: 72.9,
        bodyFatPercentage: 16.2,
      }),
    ])
    const current = summaryFor([
      measurement({
        date: "2026-06-08",
        weightKg: 72.9,
        bodyFatPercentage: 14.46,
      }),
    ])

    const variation = WeekComparison.compare(current, previous)

    expect(variation.bodyFatPercentage).toEqual({
      absolutePercentagePoints: -1.74,
      relativePercentage: -10.74,
      direction: "down",
    })
  })

  it("uses documented stable thresholds for weight, body fat mass, and muscle mass", () => {
    const previous = summaryFor([
      measurement({
        date: "2026-06-01",
        weightKg: 100,
        bodyFatPercentage: 20,
        musclePercentage: 40,
      }),
    ])
    const current = summaryFor([
      measurement({
        date: "2026-06-08",
        weightKg: 100.4,
        bodyFatPercentage: 19.5,
        musclePercentage: 40.1,
      }),
    ])

    const variation = WeekComparison.compare(current, previous)

    expect(variation.weightKg?.direction).toBe("stable")
    expect(variation.bodyFatKg?.direction).toBe("down")
    expect(variation.bodyFatPercentage?.direction).toBe("down")
    expect(variation.muscleKg?.direction).toBe("stable")
    expect(variation.musclePercentage?.direction).toBe("stable")
  })

  it("omits a metric when either week has no average for it", () => {
    const previous = summaryFor([
      measurement({ date: "2026-06-01", weightKg: 71 }),
    ])
    const current = summaryFor([
      measurement({ date: "2026-06-08", weightKg: 73, bodyFatPercentage: 14 }),
    ])

    const variation = WeekComparison.compare(current, previous)

    expect(variation.bodyFatPercentage).toBeUndefined()
    expect(variation.weightKg).toEqual({
      absolute: 2,
      relativePercentage: 2.82,
      direction: "up",
    })
  })
})

function summaryFor(measurements: Measurement[]): WeekSummary {
  const range = getWeekRange(measurements[0]?.date ?? "2026-06-01")

  return WeekSummary.forRange(measurements, range, {
    currentDate: measurements[0]?.date ?? "2026-06-01",
    heightCm: USER_HEIGHT_CM,
    isCurrentWeek: false,
  })
}

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
