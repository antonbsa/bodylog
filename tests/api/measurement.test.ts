import { describe, expect, it } from "vitest"

import { Measurement } from "../../apps/api/src/domain/measurement"
import {
  isWithinMeasurementLimit,
  normalizeNotes,
} from "../../domain/measurement"

const HEIGHT_CM = 168

describe("Measurement", () => {
  it("computes BMI from the configured height in centimeters", () => {
    const measurement = createMeasurement({
      weightKg: 72.9,
      bodyFatPercentage: null,
      musclePercentage: null,
    })

    expect(measurement.getDerivedValues(HEIGHT_CM).bmi).toBe(25.83)
  })

  it("computes body fat mass and muscle mass when percentages are present", () => {
    const measurement = createMeasurement({
      weightKg: 72.9,
      bodyFatPercentage: 14.46,
      musclePercentage: 43.72,
    })

    expect(measurement.getDerivedValues(HEIGHT_CM)).toEqual({
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

    expect(measurement.getDerivedValues(HEIGHT_CM)).toEqual({
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
      waistCm: null,
      sleepHours: null,
      disposition: null,
      notes: null,
      createdAt: "2026-06-09T12:00:00.000Z",
      updatedAt: "2026-06-09T12:00:00.000Z",
    })
  })
})

describe("measurement limits", () => {
  it.each([
    ["waistCm", 30, 250],
    ["sleepHours", 0, 24],
    ["disposition", 1, 5],
  ] as const)(
    "%s accepts its boundaries and rejects values beyond",
    (field, min, max) => {
      expect(isWithinMeasurementLimit(field, min)).toBe(true)
      expect(isWithinMeasurementLimit(field, max)).toBe(true)
      expect(isWithinMeasurementLimit(field, min - 0.1)).toBe(false)
      expect(isWithinMeasurementLimit(field, max + 0.1)).toBe(false)
    },
  )

  it("requires an integer disposition", () => {
    expect(isWithinMeasurementLimit("disposition", 3)).toBe(true)
    expect(isWithinMeasurementLimit("disposition", 3.5)).toBe(false)
  })

  it("trims notes and turns blank notes into null", () => {
    expect(normalizeNotes("  hello  ")).toBe("hello")
    expect(normalizeNotes(" \n ")).toBeNull()
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
    waistCm: null,
    sleepHours: null,
    disposition: null,
    notes: null,
    createdAt: "2026-06-09T12:00:00.000Z",
    updatedAt: "2026-06-09T12:00:00.000Z",
  })
}
