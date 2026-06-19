import type {
  Measurement,
  MeasurementDerivedValues,
} from "../../../types/measurements"
import type { MetricVariation } from "../../../types/dashboard"

export type DashboardCardModel = {
  directionMetric: "bodyFat" | "muscle" | "weight"
  label: string
  secondaryLabel: string
  secondaryValue: number | null
  type: "percentage" | "weight"
  value: number | null
  variation: MetricVariation | undefined
  variationSecondary: MetricVariation | undefined
  variationSecondaryType: "absoluteKg" | "relativePercentage"
}

export type ListedMeasurement = Measurement & {
  derived: MeasurementDerivedValues
}

export type OutcomeClass =
  | "metric-card-negative"
  | "metric-card-positive"
  | "metric-card-stable"
  | "metric-card-unavailable"

export type SaveMeasurementInput = {
  bodyFatPercentage: number | null
  musclePercentage: number | null
  restingMetabolismKcal: number | null
  weightKg: number
}
