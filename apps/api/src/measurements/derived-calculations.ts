import type { Measurement } from "./types"

export type DerivedMeasurementValues = {
  bmi: number
  bodyFatKg: number | null
  muscleKg: number | null
}

export type DerivedCalculationConfig = {
  heightCm: number
}

export function calculateDerivedMeasurementValues(
  measurement: Pick<
    Measurement,
    "weightKg" | "bodyFatPercentage" | "musclePercentage"
  >,
  config: DerivedCalculationConfig,
): DerivedMeasurementValues {
  const heightM = heightCmToM(config.heightCm)

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

export function heightCmToM(heightCm: number): number {
  return heightCm / 100
}

export function roundToTwoDecimals(value: number): number {
  return Math.round((value + Number.EPSILON) * 100) / 100
}
