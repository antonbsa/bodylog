import type { WeekSummary } from "./dashboard"
import type { Measurement, MeasurementDerivedValues } from "./measurements"

export type HistoryMeasurement = Measurement & {
  derived: MeasurementDerivedValues
}

export type HistoryWeek = {
  summary: WeekSummary
  /** Newest first. */
  measurements: HistoryMeasurement[]
}

/** Response of `GET /api/history/weeks`; `nextBefore` is the `before` of the next older page, or null on the last page. */
export type HistoryWeeksPage = {
  weeks: HistoryWeek[]
  nextBefore: string | null
}
