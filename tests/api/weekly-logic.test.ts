import { describe, expect, it } from "vitest"

import {
  createWeeklyComparison,
  getWeekRange,
} from "../../apps/api/src/measurements/weekly-logic"
import type { Measurement } from "../../apps/api/src/measurements/types"

const USER_HEIGHT_CM = 168

describe("weekly logic", () => {
  it("uses Monday-to-Sunday week boundaries", () => {
    expect(getWeekRange("2026-06-10")).toEqual({
      weekStartDate: "2026-06-08",
      weekEndDate: "2026-06-14",
    })
    expect(getWeekRange("2026-06-14")).toEqual({
      weekStartDate: "2026-06-08",
      weekEndDate: "2026-06-14",
    })
    expect(getWeekRange("2026-06-15")).toEqual({
      weekStartDate: "2026-06-15",
      weekEndDate: "2026-06-21",
    })
  })

  it("ignores missing days and missing values per metric when averaging", () => {
    const comparison = createWeeklyComparison(
      [
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
      ],
      {
        currentDate: "2026-06-10",
        heightCm: USER_HEIGHT_CM,
      },
    )

    expect(comparison.current.measurementCount).toBe(2)
    expect(comparison.current.isPartialWeek).toBe(true)
    expect(comparison.current.averages).toMatchObject({
      weightKg: 72,
      bmi: 25.51,
      bodyFatPercentage: 10,
      bodyFatKg: 7,
      musclePercentage: 40,
      muscleKg: 28,
      restingMetabolismKcal: null,
    })
  })

  it("compares the current partial week against the previous full week", () => {
    const comparison = createWeeklyComparison(
      [
        measurement({
          date: "2026-06-01",
          weightKg: 71,
        }),
        measurement({
          date: "2026-06-07",
          weightKg: 73,
        }),
        measurement({
          date: "2026-06-08",
          weightKg: 74,
        }),
      ],
      {
        currentDate: "2026-06-10",
        heightCm: USER_HEIGHT_CM,
      },
    )

    expect(comparison.current.weekStartDate).toBe("2026-06-08")
    expect(comparison.current.weekEndDate).toBe("2026-06-14")
    expect(comparison.current.isCurrentWeek).toBe(true)
    expect(comparison.current.isPartialWeek).toBe(true)
    expect(comparison.previous.weekStartDate).toBe("2026-06-01")
    expect(comparison.previous.weekEndDate).toBe("2026-06-07")
    expect(comparison.previous.isCurrentWeek).toBe(false)
    expect(comparison.previous.isPartialWeek).toBe(false)
    expect(comparison.previous.averages.weightKg).toBe(72)
    expect(comparison.variation.weightKg).toEqual({
      absolute: 2,
      relativePercentage: 2.78,
      direction: "up",
    })
  })

  it("uses percentage points for percentage metric absolute differences", () => {
    const comparison = createWeeklyComparison(
      [
        measurement({
          date: "2026-06-01",
          weightKg: 72.9,
          bodyFatPercentage: 16.2,
        }),
        measurement({
          date: "2026-06-08",
          weightKg: 72.9,
          bodyFatPercentage: 14.46,
        }),
      ],
      {
        currentDate: "2026-06-10",
        heightCm: USER_HEIGHT_CM,
      },
    )

    expect(comparison.variation.bodyFatPercentage).toEqual({
      absolutePercentagePoints: -1.74,
      relativePercentage: -10.74,
      direction: "down",
    })
  })

  it("uses documented stable thresholds for weight, body fat mass, and muscle mass", () => {
    const comparison = createWeeklyComparison(
      [
        measurement({
          date: "2026-06-01",
          weightKg: 100,
          bodyFatPercentage: 20,
          musclePercentage: 40,
        }),
        measurement({
          date: "2026-06-08",
          weightKg: 100.4,
          bodyFatPercentage: 19.5,
          musclePercentage: 40.1,
        }),
      ],
      {
        currentDate: "2026-06-10",
        heightCm: USER_HEIGHT_CM,
      },
    )

    expect(comparison.variation.weightKg?.direction).toBe("stable")
    expect(comparison.variation.bodyFatKg?.direction).toBe("down")
    expect(comparison.variation.bodyFatPercentage?.direction).toBe("down")
    expect(comparison.variation.muscleKg?.direction).toBe("stable")
    expect(comparison.variation.musclePercentage?.direction).toBe("stable")
  })
})

function measurement(
  input: Pick<Measurement, "date" | "weightKg"> &
    Partial<
      Pick<
        Measurement,
        | "bodyFatPercentage"
        | "musclePercentage"
        | "restingMetabolismKcal"
        | "id"
        | "createdAt"
        | "updatedAt"
      >
    >,
): Measurement {
  return {
    id: input.id ?? `measurement-${input.date}`,
    date: input.date,
    weightKg: input.weightKg,
    bodyFatPercentage: input.bodyFatPercentage ?? null,
    musclePercentage: input.musclePercentage ?? null,
    restingMetabolismKcal: input.restingMetabolismKcal ?? null,
    createdAt: input.createdAt ?? "2026-06-10T12:00:00.000Z",
    updatedAt: input.updatedAt ?? "2026-06-10T12:00:00.000Z",
  }
}
