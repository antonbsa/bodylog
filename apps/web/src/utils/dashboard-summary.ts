import type {
  MetricDirection,
  MetricVariation,
  WeeklyDashboard,
  WeekSummary,
} from "../api/dashboard"
import { getDateOnlyDifferenceInDays, getTodayIsoDate } from "./date-format"
import {
  formatDisplayNumber,
  formatOptionalPreciseDisplayNumber,
  formatSignedDisplayNumber,
} from "./number-format"

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

export function createDashboardCardModels(
  dashboard: WeeklyDashboard,
): DashboardCardModel[] {
  return [
    {
      directionMetric: "weight",
      label: "Peso médio",
      secondaryLabel: "IMC médio",
      secondaryValue: dashboard.current.averages.bmi,
      type: "weight",
      value: dashboard.current.averages.weightKg,
      variation: dashboard.variation.weightKg,
      variationSecondary: dashboard.variation.weightKg,
      variationSecondaryType: "relativePercentage",
    },
    {
      directionMetric: "bodyFat",
      label: "Gordura corporal",
      secondaryLabel: "BF kg",
      secondaryValue: dashboard.current.averages.bodyFatKg,
      type: "percentage",
      value: dashboard.current.averages.bodyFatPercentage,
      variation: dashboard.variation.bodyFatPercentage,
      variationSecondary: dashboard.variation.bodyFatKg,
      variationSecondaryType: "absoluteKg",
    },
    {
      directionMetric: "muscle",
      label: "Músculo",
      secondaryLabel: "Músculo kg",
      secondaryValue: dashboard.current.averages.muscleKg,
      type: "percentage",
      value: dashboard.current.averages.musclePercentage,
      variation: dashboard.variation.musclePercentage,
      variationSecondary: dashboard.variation.muscleKg,
      variationSecondaryType: "absoluteKg",
    },
  ]
}

export function getAvailableDaysSoFar(currentWeek: WeekSummary): number {
  const today = getTodayIsoDate()
  const latestAvailableDate =
    today > currentWeek.weekEndDate ? currentWeek.weekEndDate : today
  const availableDays =
    getDateOnlyDifferenceInDays(
      currentWeek.weekStartDate,
      latestAvailableDate,
    ) + 1

  return Math.max(1, Math.min(7, availableDays))
}

export function getReliability(measurementCount: number): {
  className: string
  label: string
} {
  if (measurementCount <= 2) {
    return {
      className: "reliability-low",
      label: "Baixa",
    }
  }

  if (measurementCount <= 4) {
    return {
      className: "reliability-medium",
      label: "Média",
    }
  }

  return {
    className: "reliability-high",
    label: "Alta",
  }
}

export function getOutcomeClass(
  metric: DashboardCardModel["directionMetric"],
  direction: MetricDirection | null,
): string {
  if (direction === null) {
    return "metric-card-unavailable"
  }

  if (direction === "stable") {
    return "metric-card-stable"
  }

  if (metric === "bodyFat") {
    return direction === "down"
      ? "metric-card-positive"
      : "metric-card-negative"
  }

  return direction === "up" ? "metric-card-positive" : "metric-card-negative"
}

export function getDirectionLabel(direction: MetricDirection | null): string {
  const labels: Record<MetricDirection, string> = {
    down: "Caiu",
    stable: "Estável",
    up: "Subiu",
  }

  return direction ? labels[direction] : "Sem comparação"
}

export function formatPrimaryValue(
  value: number | null,
  type: DashboardCardModel["type"],
): string {
  if (value === null) {
    return "-"
  }

  return type === "percentage"
    ? `${formatDisplayNumber(value)}%`
    : `${formatDisplayNumber(value)} kg`
}

export function formatSecondaryValue(value: number | null): string {
  return formatOptionalPreciseDisplayNumber(value)
}

export function formatPrimaryVariation(
  variation: MetricVariation | undefined,
  type: DashboardCardModel["type"],
): string {
  if (!variation) {
    return "-"
  }

  const value =
    type === "percentage"
      ? variation.absolutePercentagePoints
      : variation.absolute

  if (value === undefined) {
    return "-"
  }

  const suffix = type === "percentage" ? " p.p." : " kg"

  return `${formatSignedDisplayNumber(value)}${suffix}`
}

export function formatSecondaryVariation(
  variation: MetricVariation | undefined,
  type: DashboardCardModel["variationSecondaryType"],
): string {
  if (!variation) {
    return type === "relativePercentage"
      ? "Sem variação relativa"
      : "Sem variação em kg"
  }

  if (type === "relativePercentage") {
    return variation.relativePercentage === null
      ? "Sem variação relativa"
      : `${formatSignedDisplayNumber(variation.relativePercentage)}%`
  }

  if (variation.absolute === undefined) {
    return "Sem variação em kg"
  }

  return `${formatSignedDisplayNumber(variation.absolute)} kg`
}
