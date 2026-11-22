import { describe, expect, it } from "vitest"

import { Measurement } from "../../apps/api/src/domain/measurement"
import { getWeekRange } from "../../apps/api/src/domain/week-range"
import { WeekSummary } from "../../apps/api/src/domain/week-summary"

const HEIGHT_CM = 168

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
      heightCm: HEIGHT_CM,
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

  it("averages waist, sleep and disposition ignoring missing values", () => {
    const summary = WeekSummary.forRange(
      [
        measurement({
          date: "2026-06-08",
          weightKg: 70,
          waistCm: 80,
          sleepHours: 7,
          disposition: 4,
        }),
        measurement({
          date: "2026-06-09",
          weightKg: 70,
          waistCm: 81,
          sleepHours: 8,
          disposition: 3,
        }),
        measurement({ date: "2026-06-10", weightKg: 70 }),
      ],
      getWeekRange("2026-06-10"),
      {
        currentDate: "2026-06-10",
        heightCm: HEIGHT_CM,
        isCurrentWeek: true,
      },
    )

    expect(summary.averages).toMatchObject({
      waistCm: 80.5,
      sleepHours: 7.5,
      disposition: 3.5,
    })
  })

  it("returns null for new metrics nobody recorded, never zero", () => {
    const summary = WeekSummary.forRange(
      [measurement({ date: "2026-06-08", weightKg: 70 })],
      getWeekRange("2026-06-08"),
      {
        currentDate: "2026-06-10",
        heightCm: HEIGHT_CM,
        isCurrentWeek: true,
      },
    )

    expect(summary.averages.waistCm).toBeNull()
    expect(summary.averages.sleepHours).toBeNull()
    expect(summary.averages.disposition).toBeNull()
  })

  it("returns the recorded dates in order and the count for the week", () => {
    const summary = WeekSummary.forRange(
      [
        measurement({ date: "2026-06-10", weightKg: 70 }),
        measurement({ date: "2026-06-07", weightKg: 70 }),
        measurement({ date: "2026-06-08", weightKg: 70 }),
      ],
      getWeekRange("2026-06-10"),
      {
        currentDate: "2026-06-10",
        heightCm: HEIGHT_CM,
        isCurrentWeek: true,
      },
    )

    expect(summary.recordedDates).toEqual(["2026-06-08", "2026-06-10"])
    expect(summary.measurementCount).toBe(2)
  })

  it("returns null averages when the week has no measurements", () => {
    const range = getWeekRange("2026-06-15")

    const summary = WeekSummary.forRange([], range, {
      currentDate: "2026-06-15",
      heightCm: HEIGHT_CM,
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
