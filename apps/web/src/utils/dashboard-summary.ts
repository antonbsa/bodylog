import type { WeeklyAverages, WeekSummary } from "../../../../types/dashboard"
import { shiftIsoDate } from "./date-format"
import { formatOneDecimal } from "./number-format"

export const WEEKLY_TARGET_DAYS = 7

const DAY_LETTERS = ["S", "T", "Q", "Q", "S", "S", "D"]

type WeeklyMetric = {
  /** Unit of the variation chip. */
  changeUnit: string
  key: keyof WeeklyAverages
  label: string
  /** Unit shown next to the average. */
  unit: string
}

/** Rows of the weekly card, in display order. */
export const WEEKLY_METRICS: WeeklyMetric[] = [
  { changeUnit: "kg", key: "weightKg", label: "Peso", unit: "kg" },
  { changeUnit: "p.p.", key: "bodyFatPercentage", label: "Gordura", unit: "%" },
  { changeUnit: "p.p.", key: "musclePercentage", label: "Músculo", unit: "%" },
  { changeUnit: "cm", key: "waistCm", label: "Cintura", unit: "cm" },
  { changeUnit: "h", key: "sleepHours", label: "Sono", unit: "h" },
  { changeUnit: "pts", key: "disposition", label: "Disposição", unit: "/5" },
]

export type VariationChip = {
  direction: "down" | "none" | "stable" | "up"
  text: string
}

function roundToOneDecimal(value: number): number {
  return Number(value.toFixed(1))
}

/** Neutral chip text; "Estável" means the change rounds to zero at the displayed precision. */
export function getVariationChip(
  current: number | null | undefined,
  previous: number | null | undefined,
  unit: string,
): VariationChip {
  if (current == null || previous == null) {
    return { direction: "none", text: "Sem comparação" }
  }

  const change = roundToOneDecimal(
    roundToOneDecimal(current) - roundToOneDecimal(previous),
  )

  if (change === 0) {
    return { direction: "stable", text: "Estável" }
  }

  const word = change > 0 ? "Subiu" : "Caiu"

  return {
    direction: change > 0 ? "up" : "down",
    text: `${word} ${formatOneDecimal(Math.abs(change))} ${unit}`,
  }
}

export type WeekDay = {
  date: string
  isToday: boolean
  letter: string
  status: "future" | "missing" | "recorded"
}

/** The seven days of a week (Monday to Sunday) with their dot state. */
export function getWeekDays(week: WeekSummary, today: string): WeekDay[] {
  const recorded = new Set(week.recordedDates)

  return DAY_LETTERS.map((letter, index) => {
    const date = shiftIsoDate(week.weekStartDate, index)

    return {
      date,
      isToday: date === today,
      letter,
      status: recorded.has(date)
        ? "recorded"
        : date > today
          ? "future"
          : "missing",
    }
  })
}
