import type { Measurement } from "./types"

export const DEFAULT_USER_HEIGHT_M = 1.68

export type DerivedMeasurementValues = {
  bmi: number
  bodyFatKg: number | null
  muscleKg: number | null
}

export type DerivedCalculationConfig = {
  heightM?: number
}

export function calculateDerivedMeasurementValues(
  measurement: Pick<
    Measurement,
    "weightKg" | "bodyFatPercentage" | "musclePercentage"
  >,
  config: DerivedCalculationConfig = {},
): DerivedMeasurementValues {
  const heightM = config.heightM ?? DEFAULT_USER_HEIGHT_M

  return {
    bmi: roundToTwoDecimals(measurement.weightKg / (heightM * heightM)),
    bodyFatKg:
      measurement.bodyFatPercentage === null
        ? null
        : roundToTwoDecimals(
            (measurement.weightKg * measurement.bodyFatPercentage) / 100,
          ),
    muscleKg:
      measurement.musclePercentage === null
        ? null
        : roundToTwoDecimals(
            (measurement.weightKg * measurement.musclePercentage) / 100,
          ),
  }
}

export function roundToTwoDecimals(value: number): number {
  return Math.round((value + Number.EPSILON) * 100) / 100
}
