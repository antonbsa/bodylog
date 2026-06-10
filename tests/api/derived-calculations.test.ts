import { describe, expect, it } from "vitest"

import {
  calculateDerivedMeasurementValues,
  heightCmToM,
} from "../../apps/api/src/measurements/derived-calculations"

const USER_HEIGHT_CM = 168

describe("calculateDerivedMeasurementValues", () => {
  it("calculates BMI from the configured height in centimeters", () => {
    const derivedValues = calculateDerivedMeasurementValues(
      {
        weightKg: 72.9,
        bodyFatPercentage: null,
        musclePercentage: null,
      },
      {
        heightCm: USER_HEIGHT_CM,
      },
    )

    expect(derivedValues.bmi).toBe(25.83)
  })

  it("calculates body fat mass and muscle mass when percentages are present", () => {
    const derivedValues = calculateDerivedMeasurementValues(
      {
        weightKg: 72.9,
        bodyFatPercentage: 14.46,
        musclePercentage: 43.72,
      },
      {
        heightCm: USER_HEIGHT_CM,
      },
    )

    expect(derivedValues).toEqual({
      bmi: 25.83,
      bodyFatKg: 10.54,
      muscleKg: 31.87,
    })
  })

  it("returns null derived masses when optional percentages are missing", () => {
    const derivedValues = calculateDerivedMeasurementValues(
      {
        weightKg: 72.9,
        bodyFatPercentage: null,
        musclePercentage: null,
      },
      {
        heightCm: USER_HEIGHT_CM,
      },
    )

    expect(derivedValues).toEqual({
      bmi: 25.83,
      bodyFatKg: null,
      muscleKg: null,
    })
  })
})

describe("heightCmToM", () => {
  it("converts configured centimeters to meters for BMI calculation", () => {
    expect(heightCmToM(168)).toBe(1.68)
  })
})
