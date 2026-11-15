import type { MeasurementRepository } from "../measurements/measurement-repository"
import type { Measurement } from "../domain/measurement"
import type { HistoryWeeksPage } from "../../../../types/history"
import { getWeekRange } from "../domain/week-range"
import { WeekSummary } from "../domain/week-summary"

export const HISTORY_PAGE_WEEKS = 8

type HistoryWeeksConfig = {
  /** Only measurements strictly before this date are listed. */
  before?: string
  currentDate: string
  heightCm: number
}

export type HistoryRepository = Pick<MeasurementRepository, "list">

/** One page of weeks that have records, newest first, so each week's summary is never split across pages. */
export async function getHistoryWeeks(
  repository: HistoryRepository,
  config: HistoryWeeksConfig,
): Promise<HistoryWeeksPage> {
  const { before } = config
  const measurements = await repository.list({ before })
  const byWeekStart = new Map<string, Measurement[]>()

  for (const measurement of measurements) {
    const { weekStartDate } = getWeekRange(measurement.date)

    const weekMeasurements = byWeekStart.get(weekStartDate) ?? []

    weekMeasurements.push(measurement)
    byWeekStart.set(weekStartDate, weekMeasurements)
  }

  const weekStarts = [...byWeekStart.keys()].sort().reverse()
  const currentWeekStart = getWeekRange(config.currentDate).weekStartDate
  const weeks = weekStarts.slice(0, HISTORY_PAGE_WEEKS).map((weekStartDate) => {
    const weekMeasurements = (byWeekStart.get(weekStartDate) ?? []).sort(
      (left, right) => right.date.localeCompare(left.date),
    )

    return {
      measurements: weekMeasurements.map((measurement) => ({
        ...measurement.toJSON(),
        derived: measurement.getDerivedValues(config.heightCm),
      })),
      summary: WeekSummary.forRange(
        weekMeasurements,
        getWeekRange(weekStartDate),
        {
          currentDate: config.currentDate,
          heightCm: config.heightCm,
          isCurrentWeek: weekStartDate === currentWeekStart,
        },
      ),
    }
  })

  return {
    nextBefore:
      weekStarts.length > HISTORY_PAGE_WEEKS
        ? (weeks[weeks.length - 1]?.summary.weekStartDate ?? null)
        : null,
    weeks,
  }
}
