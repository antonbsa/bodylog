import type { MeasurementRepository } from "../../db/repositories/measurements"
import type { WeeklyDashboard } from "../../../../../types/dashboard"
import { getPreviousWeekRange, getWeekRange } from "../../domain/week-range"
import { WeekSummary } from "../../domain/week-summary"

type WeeklyDashboardConfig = {
  currentDate: string
  heightCm: number | null
}

export type WeeklyDashboardRepository = Pick<MeasurementRepository, "list">

export async function getWeeklyDashboard(
  repository: WeeklyDashboardRepository,
  config: WeeklyDashboardConfig,
): Promise<WeeklyDashboard> {
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

  return { current, previous }
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
