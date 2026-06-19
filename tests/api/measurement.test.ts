import { describe, expect, it } from "vitest"

import { Measurement } from "../../apps/api/src/domain/measurement"

const USER_HEIGHT_CM = 168

describe("Measurement", () => {
  it("computes BMI from the configured height in centimeters", () => {
    const measurement = createMeasurement({
      weightKg: 72.9,
      bodyFatPercentage: null,
      musclePercentage: null,
    })

    expect(measurement.getDerivedValues(USER_HEIGHT_CM).bmi).toBe(25.83)
  })

  it("computes body fat mass and muscle mass when percentages are present", () => {
    const measurement = createMeasurement({
      weightKg: 72.9,
      bodyFatPercentage: 14.46,
      musclePercentage: 43.72,
    })

    expect(measurement.getDerivedValues(USER_HEIGHT_CM)).toEqual({
      bmi: 25.83,
      bodyFatKg: 10.54,
      muscleKg: 31.87,
    })
  })

  it("returns null derived masses when optional percentages are missing", () => {
    const measurement = createMeasurement({
      weightKg: 72.9,
      bodyFatPercentage: null,
      musclePercentage: null,
    })

    expect(measurement.getDerivedValues(USER_HEIGHT_CM)).toEqual({
      bmi: 25.83,
      bodyFatKg: null,
      muscleKg: null,
    })
  })

  it("serializes to plain measurement fields without derived values", () => {
    const measurement = createMeasurement({
      weightKg: 72.9,
      bodyFatPercentage: 14.46,
      musclePercentage: 43.72,
    })

    expect(JSON.parse(JSON.stringify(measurement))).toEqual({
      id: "measurement-1",
      date: "2026-06-09",
      weightKg: 72.9,
      bodyFatPercentage: 14.46,
      musclePercentage: 43.72,
      restingMetabolismKcal: null,
      createdAt: "2026-06-09T12:00:00.000Z",
      updatedAt: "2026-06-09T12:00:00.000Z",
    })
  })
})

function createMeasurement(input: {
  bodyFatPercentage: number | null
  musclePercentage: number | null
  weightKg: number
}): Measurement {
  return new Measurement({
    id: "measurement-1",
    date: "2026-06-09",
    weightKg: input.weightKg,
    bodyFatPercentage: input.bodyFatPercentage,
    musclePercentage: input.musclePercentage,
    restingMetabolismKcal: null,
    createdAt: "2026-06-09T12:00:00.000Z",
    updatedAt: "2026-06-09T12:00:00.000Z",
  })
}
