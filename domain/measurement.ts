import { roundToTwoDecimals } from "./numeric"

export type MeasurementLimit = {
  integer?: boolean
  max: number
  min: number
}

/** Hard limits that block saving a value (ADR 0032); weight is the only required field. */
export const MEASUREMENT_LIMITS = {
  weightKg: { max: 300, min: 20 },
  bodyFatPercentage: { max: 80, min: 1 },
  musclePercentage: { max: 80, min: 1 },
  restingMetabolismKcal: { max: 5000, min: 500 },
  waistCm: { max: 250, min: 30 },
  sleepHours: { max: 24, min: 0 },
  disposition: { integer: true, max: 5, min: 1 },
} as const satisfies Record<string, MeasurementLimit>

/** The user's height in Ajustes, limited like the measurement fields. */
export const HEIGHT_CM_LIMIT = {
  integer: true,
  max: 250,
  min: 50,
} as const satisfies MeasurementLimit

export function isWithinHeightLimit(heightCm: number): boolean {
  return isWithinLimit(HEIGHT_CM_LIMIT, heightCm)
}

export function isWithinMeasurementLimit(
  field: keyof typeof MEASUREMENT_LIMITS,
  value: number,
): boolean {
  return isWithinLimit(MEASUREMENT_LIMITS[field], value)
}

function isWithinLimit(limit: MeasurementLimit, value: number): boolean {
  return (
    value >= limit.min &&
    value <= limit.max &&
    (!limit.integer || Number.isInteger(value))
  )
}

/** Notes are trimmed; blank notes are stored as null. */
export function normalizeNotes(value: string): string | null {
  const trimmed = value.trim()

  return trimmed === "" ? null : trimmed
}

export type DerivedMeasurementValues = {
  /** Null while the user has no height set. */
  bmi: number | null
  bodyFatKg: number | null
  muscleKg: number | null
}

export type DerivedValuesInput = {
  bodyFatPercentage: number | null
  musclePercentage: number | null
  weightKg: number
}

/** Pure so the web form can recompute derived values live while typing. */
export function calculateDerivedValues(
  measurement: DerivedValuesInput,
  heightCm: number | null,
): DerivedMeasurementValues {
  return {
    bmi:
      heightCm === null ? null : calculateBmi(measurement.weightKg, heightCm),
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

function calculateBmi(weightKg: number, heightCm: number): number {
  const heightM = heightCm / 100

  return roundToTwoDecimals(weightKg / (heightM * heightM))
}
