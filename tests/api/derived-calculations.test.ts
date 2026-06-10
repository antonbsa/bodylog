import { describe, expect, it } from "vitest"

import {
  calculateDerivedMeasurementValues,
  DEFAULT_USER_HEIGHT_M,
} from "../../apps/api/src/measurements/derived-calculations"

describe("calculateDerivedMeasurementValues", () => {
  it("calculates BMI from the configured height", () => {
    const derivedValues = calculateDerivedMeasurementValues(
      {
        weightKg: 72.9,
        bodyFatPercentage: null,
        musclePercentage: null,
      },
      {
        heightM: DEFAULT_USER_HEIGHT_M,
      },
    )

    expect(derivedValues.bmi).toBe(25.83)
  })

  it("calculates body fat mass and muscle mass when percentages are present", () => {
    const derivedValues = calculateDerivedMeasurementValues({
      weightKg: 72.9,
      bodyFatPercentage: 14.46,
      musclePercentage: 43.72,
    })

    expect(derivedValues).toEqual({
      bmi: 25.83,
      bodyFatKg: 10.54,
      muscleKg: 31.87,
    })
  })

  it("returns null derived masses when optional percentages are missing", () => {
    const derivedValues = calculateDerivedMeasurementValues({
      weightKg: 72.9,
      bodyFatPercentage: null,
      musclePercentage: null,
    })

    expect(derivedValues).toEqual({
      bmi: 25.83,
      bodyFatKg: null,
      muscleKg: null,
    })
  })
})
