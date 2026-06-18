import { roundToTwoDecimals } from "./numeric"

export type MeasurementFields = {
  id: string
  date: string
  weightKg: number
  bodyFatPercentage: number | null
  musclePercentage: number | null
  restingMetabolismKcal: number | null
  createdAt: string
  updatedAt: string
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
  readonly createdAt: string
  readonly updatedAt: string

  constructor(fields: MeasurementFields) {
    this.id = fields.id
    this.date = fields.date
    this.weightKg = fields.weightKg
    this.bodyFatPercentage = fields.bodyFatPercentage
    this.musclePercentage = fields.musclePercentage
    this.restingMetabolismKcal = fields.restingMetabolismKcal
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
      createdAt: this.createdAt,
      updatedAt: this.updatedAt,
    }
  }
}
