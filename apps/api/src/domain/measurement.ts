import {
  calculateDerivedValues,
  type DerivedMeasurementValues,
} from "../../../../domain/measurement"

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
    return calculateDerivedValues(this, heightCm)
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
