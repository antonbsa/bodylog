import type { Measurement } from "../domain/measurement"
import {
  WeekComparison,
  type MetricVariationMap,
} from "../domain/week-comparison"
import { getPreviousWeekRange, getWeekRange } from "../domain/week-range"
import { WeekSummary } from "../domain/week-summary"
import type { MeasurementRepository } from "../measurements/measurement-repository"

export type WeeklyDashboardRepository = Pick<MeasurementRepository, "list">

export type WeeklyDashboardConfig = {
  currentDate: string
  heightCm: number
}

export type WeeklyDisplayMode = "current-week" | "latest-recorded-week"

export type WeeklyDisplaySummary = {
  mode: WeeklyDisplayMode
  summary: WeekSummary
  variation: MetricVariationMap
}

export type WeeklyComparison = {
  current: WeekSummary
  display: WeeklyDisplaySummary
  previous: WeekSummary
  variation: MetricVariationMap
}

export async function getWeeklyDashboard(
  repository: WeeklyDashboardRepository,
  config: WeeklyDashboardConfig,
): Promise<WeeklyComparison> {
  const measurements = await repository.list()
  const currentRange = getWeekRange(config.currentDate)
  const previousRange = getPreviousWeekRange(currentRange.weekStartDate)

  const current = WeekSummary.forRange(measurements, currentRange, {
    currentDate: config.currentDate,
    heightCm: config.heightCm,
    isCurrentWeek: true,
  })
  const previous = WeekSummary.forRange(measurements, previousRange, {
    currentDate: config.currentDate,
    heightCm: config.heightCm,
    isCurrentWeek: false,
  })
  const display = createDisplaySummary(measurements, {
    current,
    currentDate: config.currentDate,
    heightCm: config.heightCm,
    previous,
  })

  return {
    current,
    display,
    previous,
    variation: WeekComparison.compare(current, previous),
  }
}

function createDisplaySummary(
  measurements: Measurement[],
  options: {
    current: WeekSummary
    currentDate: string
    heightCm: number
    previous: WeekSummary
  },
): WeeklyDisplaySummary {
  if (options.current.measurementCount > 0) {
    return {
      mode: "current-week",
      summary: options.current,
      variation: WeekComparison.compare(options.current, options.previous),
    }
  }

  const latestMeasurement = measurements
    .filter((measurement) => measurement.date <= options.currentDate)
    .sort((left, right) => right.date.localeCompare(left.date))[0]

  if (!latestMeasurement) {
    return {
      mode: "current-week",
      summary: options.current,
      variation: {},
    }
  }

  const latestRange = getWeekRange(latestMeasurement.date)
  const latestPreviousRange = getPreviousWeekRange(latestRange.weekStartDate)
  const latest = WeekSummary.forRange(measurements, latestRange, {
    currentDate: options.currentDate,
    heightCm: options.heightCm,
    isCurrentWeek: false,
  })
  const latestPrevious = WeekSummary.forRange(
    measurements,
    latestPreviousRange,
    {
      currentDate: options.currentDate,
      heightCm: options.heightCm,
      isCurrentWeek: false,
    },
  )

  return {
    mode: "latest-recorded-week",
    summary: latest,
    variation: WeekComparison.compare(latest, latestPrevious),
  }
}

export function getCurrentDateOnly(timeZone: string, now = new Date()): string {
  const parts = new Intl.DateTimeFormat("en-US", {
    day: "2-digit",
    month: "2-digit",
    timeZone,
    year: "numeric",
  }).formatToParts(now)
  const year = parts.find((part) => part.type === "year")?.value
  const month = parts.find((part) => part.type === "month")?.value
  const day = parts.find((part) => part.type === "day")?.value

  if (!year || !month || !day) {
    throw new Error("Unable to derive current date for configured time zone")
  }

  return `${year}-${month}-${day}`
}
