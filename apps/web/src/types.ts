import type {
  Measurement,
  MeasurementDerivedValues,
} from "../../../types/measurements"

export type ListedMeasurement = Measurement & {
  derived: MeasurementDerivedValues
}
