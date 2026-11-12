import { roundToTwoDecimals } from "./numeric"

export type MeasurementFields = {
  id: string
  date: string
  weightKg: number
  bodyFatPercentage: number | null
  musclePercentage: number | null
  restingMetabolismKcal: number | null
  waistCm: number | null
  sleepHours: number | null
  disposition: number | null
  notes: string | null
  createdAt: string
  updatedAt: string
}

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

export function isWithinMeasurementLimit(
  field: keyof typeof MEASUREMENT_LIMITS,
  value: number,
): boolean {
  const limit: MeasurementLimit = MEASUREMENT_LIMITS[field]

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
  bmi: number
  bodyFatKg: number | null
  muscleKg: number | null
}

/**
 * Domain entity for a single date's body metrics. Height is configured
 * outside the measurement record, so derived values are computed on demand
 * from a height passed by the caller rather than stored on the instance.
 */
export class Measurement {
  readonly id: string
  readonly date: string
  readonly weightKg: number
  readonly bodyFatPercentage: number | null
  readonly musclePercentage: number | null
  readonly restingMetabolismKcal: number | null
  readonly waistCm: number | null
  readonly sleepHours: number | null
  readonly disposition: number | null
  readonly notes: string | null
  readonly createdAt: string
  readonly updatedAt: string

  constructor(fields: MeasurementFields) {
    this.id = fields.id
    this.date = fields.date
    this.weightKg = fields.weightKg
    this.bodyFatPercentage = fields.bodyFatPercentage
    this.musclePercentage = fields.musclePercentage
    this.restingMetabolismKcal = fields.restingMetabolismKcal
    this.waistCm = fields.waistCm
    this.sleepHours = fields.sleepHours
    this.disposition = fields.disposition
    this.notes = fields.notes
    this.createdAt = fields.createdAt
    this.updatedAt = fields.updatedAt
  }

  getDerivedValues(heightCm: number): DerivedMeasurementValues {
    const heightM = heightCm / 100

    return {
      bmi: roundToTwoDecimals(this.weightKg / (heightM * heightM)),
      bodyFatKg:
        this.bodyFatPercentage === null
          ? null
          : roundToTwoDecimals((this.weightKg * this.bodyFatPercentage) / 100),
      muscleKg:
        this.musclePercentage === null
          ? null
          : roundToTwoDecimals((this.weightKg * this.musclePercentage) / 100),
    }
  }

  toJSON(): MeasurementFields {
    return {
      id: this.id,
      date: this.date,
      weightKg: this.weightKg,
      bodyFatPercentage: this.bodyFatPercentage,
      musclePercentage: this.musclePercentage,
      restingMetabolismKcal: this.restingMetabolismKcal,
      waistCm: this.waistCm,
      sleepHours: this.sleepHours,
      disposition: this.disposition,
      notes: this.notes,
      createdAt: this.createdAt,
      updatedAt: this.updatedAt,
    }
  }
}
