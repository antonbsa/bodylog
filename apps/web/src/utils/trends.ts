import { getVariationChip, type VariationChip } from "./dashboard-summary"
import { shiftIsoDate } from "./date-format"
import type { TrendPoint } from "../../../../types/trends"

export type TrendMetricKey = Exclude<keyof TrendPoint, "date">

export type TrendMetric = {
  /** Unit of the comparison chip. */
  changeUnit: string
  decimals: number
  key: TrendMetricKey
  label: string
  /** Unit shown next to values. */
  unit: string
}

export const TREND_METRICS: TrendMetric[] = [
  { changeUnit: "kg", decimals: 1, key: "weightKg", label: "Peso", unit: "kg" },
  {
    changeUnit: "p.p.",
    decimals: 1,
    key: "bodyFatPercentage",
    label: "Gordura",
    unit: "%",
  },
  {
    changeUnit: "p.p.",
    decimals: 1,
    key: "musclePercentage",
    label: "Músculo",
    unit: "%",
  },
  {
    changeUnit: "cm",
    decimals: 1,
    key: "waistCm",
    label: "Cintura",
    unit: "cm",
  },
  { changeUnit: "h", decimals: 1, key: "sleepHours", label: "Sono", unit: "h" },
  {
    changeUnit: "pts",
    decimals: 1,
    key: "disposition",
    label: "Disposição",
    unit: "/5",
  },
  {
    changeUnit: "kcal",
    decimals: 0,
    key: "restingMetabolismKcal",
    label: "Metabolismo",
    unit: "kcal",
  },
  {
    changeUnit: "kg/m²",
    decimals: 1,
    key: "bmi",
    label: "IMC",
    unit: "kg/m²",
  },
]

export type TrendPeriod = "14" | "30" | "90" | "365" | "all"

export const TREND_PERIODS: Array<{ label: string; value: TrendPeriod }> = [
  { label: "14d", value: "14" },
  { label: "30d", value: "30" },
  { label: "90d", value: "90" },
  { label: "1 ano", value: "365" },
  { label: "Tudo", value: "all" },
]

/** Fewer in-window points than this show the "not enough data" card. */
export const MIN_TREND_POINTS = 3

export type MetricPoint = { date: string; value: number }

export type TrendWindow = {
  /** The metric's first record anywhere, or null without data. */
  firstDate: string | null
  /** True when the metric starts after the period's start, so the chart starts at its first record. */
  clipped: boolean
  end: string
  points: MetricPoint[]
  start: string
}

export type WeeklyAverage = {
  average: number
  count: number
  /** Mean day offset of the week's points from the window start; where the chart plots the average. */
  offset: number
  weekEndDate: string
  weekStartDate: string
}

/** Days from `from` to `to` (both ISO dates); timezone and DST free. */
export function diffDays(to: string, from: string): number {
  return Math.round(
    (Date.parse(`${to}T00:00:00.000Z`) - Date.parse(`${from}T00:00:00.000Z`)) /
      86_400_000,
  )
}

/** Monday of the week containing the ISO date. */
export function getWeekStart(date: string): string {
  const weekday = new Date(`${date}T00:00:00.000Z`).getUTCDay()

  return shiftIsoDate(date, -((weekday + 6) % 7))
}

function mean(values: number[]): number {
  return values.reduce((sum, value) => sum + value, 0) / values.length
}

/** Points that have a value for the metric, oldest first as received. */
export function getMetricPoints(
  points: TrendPoint[],
  metric: TrendMetricKey,
): MetricPoint[] {
  return points.flatMap((point) => {
    const value = point[metric]

    return value === null ? [] : [{ date: point.date, value }]
  })
}

/** Window ending today; clipped to the first record when the history is shorter than the period. */
export function getTrendWindow(
  metricPoints: MetricPoint[],
  period: TrendPeriod,
  today: string,
): TrendWindow {
  const firstDate = metricPoints[0]?.date ?? null
  let start: string
  let clipped = false

  if (period === "all") {
    start = firstDate ?? shiftIsoDate(today, -13)
  } else {
    start = shiftIsoDate(today, -(Number(period) - 1))

    if (firstDate !== null && firstDate > start) {
      start = firstDate
      clipped = true
    }
  }

  return {
    clipped,
    end: today,
    firstDate,
    points: metricPoints.filter(
      (point) => point.date >= start && point.date <= today,
    ),
    start,
  }
}

/** Monday-start weeks, oldest first, each the plain mean of its in-window points. */
export function getWeeklyAverages(
  points: MetricPoint[],
  start: string,
): WeeklyAverage[] {
  const byWeek = new Map<string, MetricPoint[]>()

  for (const point of points) {
    const weekStart = getWeekStart(point.date)

    byWeek.set(weekStart, [...(byWeek.get(weekStart) ?? []), point])
  }

  return [...byWeek.keys()].sort().map((weekStartDate) => {
    const weekPoints = byWeek.get(weekStartDate) ?? []

    return {
      average: mean(weekPoints.map((point) => point.value)),
      count: weekPoints.length,
      offset: mean(weekPoints.map((point) => diffDays(point.date, start))),
      weekEndDate: shiftIsoDate(weekStartDate, 6),
      weekStartDate,
    }
  })
}

export function getPeriodAverage(points: MetricPoint[]): number {
  return mean(points.map((point) => point.value))
}

/** Last week's average against the first; "Sem comparação" with fewer than two weeks. */
export function getWindowChip(
  weeks: WeeklyAverage[],
  metric: TrendMetric,
): VariationChip {
  if (weeks.length < 2) {
    return getVariationChip(null, null, metric.changeUnit)
  }

  return getVariationChip(
    weeks[weeks.length - 1].average,
    weeks[0].average,
    metric.changeUnit,
    metric.decimals,
  )
}

/** Step of 1, 2, 5 or 10 times a power of ten that is at least `raw`. */
export function getNiceStep(raw: number): number {
  const power = Math.pow(10, Math.floor(Math.log10(raw)))
  const fraction = raw / power

  return (
    (fraction <= 1 ? 1 : fraction <= 2 ? 2 : fraction <= 5 ? 5 : 10) * power
  )
}

/** Y axis range and tick values, with a minimum span so a flat line still has a grid. */
export function getYAxis(values: number[]): {
  max: number
  min: number
  step: number
  ticks: number[]
} {
  let min = Math.min(...values)
  let max = Math.max(...values)

  if (max - min < 0.5) {
    max += 0.5
    min -= 0.5
  }

  const step = getNiceStep((max - min) / 4)
  const tickMin = Math.floor(min / step + 1e-9) * step
  const tickMax = Math.ceil(max / step - 1e-9) * step
  const ticks: number[] = []

  for (let tick = tickMin; tick <= tickMax + 1e-9; tick += step) {
    ticks.push(tick)
  }

  return { max: tickMax, min: tickMin, step, ticks }
}
