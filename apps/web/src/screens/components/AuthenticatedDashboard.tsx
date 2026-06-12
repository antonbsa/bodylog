import { useEffect, useState } from "react"

import {
  getWeeklyDashboard,
  type MetricDirection,
  type MetricVariation,
  type WeeklyDashboard,
  type WeekSummary,
} from "../../api/dashboard"
import { formatDisplayDateFromIso, getTodayIsoDate } from "./date-format"

type DashboardState = {
  dashboard: WeeklyDashboard | null
  status: "error" | "loaded" | "loading"
}

type AuthenticatedDashboardProps = {
  onLogout: () => void
  onOpenMeasurementForm: () => void
  refreshKey: number
  savedMessage: string | null
}

type SummaryMetric = {
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

const ptBrNumberFormatter = new Intl.NumberFormat("pt-BR", {
  maximumFractionDigits: 1,
  minimumFractionDigits: 0,
})

const ptBrPreciseNumberFormatter = new Intl.NumberFormat("pt-BR", {
  maximumFractionDigits: 2,
  minimumFractionDigits: 0,
})

export function AuthenticatedDashboard({
  onLogout,
  onOpenMeasurementForm,
  refreshKey,
  savedMessage,
}: AuthenticatedDashboardProps) {
  const [state, setState] = useState<DashboardState>({
    dashboard: null,
    status: "loading",
  })

  useEffect(() => {
    let isCurrentRequest = true

    setState((currentState) => ({
      dashboard: currentState.dashboard,
      status: "loading",
    }))

    getWeeklyDashboard()
      .then((dashboard) => {
        if (isCurrentRequest) {
          setState({
            dashboard,
            status: "loaded",
          })
        }
      })
      .catch(() => {
        if (isCurrentRequest) {
          setState({
            dashboard: null,
            status: "error",
          })
        }
      })

    return () => {
      isCurrentRequest = false
    }
  }, [refreshKey])

  const dashboard = state.dashboard

  return (
    <>
      <header className="app-header">
        <section className="hero" aria-labelledby="page-title">
          <p className="eyebrow">BodyLog</p>
          <h1 id="page-title">Resumo da semana</h1>
          <p className="intro">
            Médias da semana atual e comparação com a semana anterior.
          </p>
        </section>

        <div className="header-actions">
          <button
            className="primary-action"
            onClick={onOpenMeasurementForm}
            type="button"
          >
            Registrar medida
          </button>
          <button className="secondary-action" onClick={onLogout} type="button">
            Sair
          </button>
        </div>
      </header>

      {savedMessage ? (
        <p className="form-success" role="status">
          {savedMessage}
        </p>
      ) : null}

      {state.status === "error" ? (
        <section className="dashboard-message" role="alert">
          Não foi possível carregar o resumo semanal.
        </section>
      ) : null}

      {state.status === "loading" && !dashboard ? (
        <section className="dashboard-message" role="status">
          Carregando resumo semanal...
        </section>
      ) : null}

      {dashboard ? (
        <WeeklyDashboardSummary dashboard={dashboard} />
      ) : (
        <PlaceholderSummary />
      )}
    </>
  )
}

function WeeklyDashboardSummary({ dashboard }: { dashboard: WeeklyDashboard }) {
  const metrics = createSummaryMetrics(dashboard)
  const currentReliability = getReliability(dashboard.current.measurementCount)
  const previousReliability = getReliability(
    dashboard.previous.measurementCount,
  )
  const availableDays = getAvailableDaysSoFar(dashboard.current)

  return (
    <>
      <section className="dashboard-context" aria-label="Contexto semanal">
        <div>
          <p className="context-label">Semana atual</p>
          <p className="context-value">
            {formatDisplayDateFromIso(dashboard.current.weekStartDate)} a{" "}
            {formatDisplayDateFromIso(dashboard.current.weekEndDate)}
          </p>
        </div>
        <div>
          <p className="context-label">Registros</p>
          <p className="context-value">
            {dashboard.current.measurementCount}/{availableDays}
          </p>
        </div>
        <div>
          <p className="context-label">Confiabilidade</p>
          <p className={`context-value ${currentReliability.className}`}>
            {currentReliability.label}
          </p>
        </div>
      </section>

      {dashboard.current.isPartialWeek ? (
        <p className="partial-week-note">
          Semana em andamento: comparação parcial contra a semana anterior
          completa.
        </p>
      ) : null}

      <section className="summary-grid" aria-label="Resumo semanal">
        {metrics.map((metric) => (
          <SummaryCard key={metric.label} metric={metric} />
        ))}
      </section>

      <section className="comparison-context" aria-label="Semana anterior">
        <span>
          Semana anterior:{" "}
          {formatDisplayDateFromIso(dashboard.previous.weekStartDate)} a{" "}
          {formatDisplayDateFromIso(dashboard.previous.weekEndDate)}
        </span>
        <span>{dashboard.previous.measurementCount} registros</span>
        <span className={previousReliability.className}>
          {previousReliability.label}
        </span>
      </section>
    </>
  )
}

function SummaryCard({ metric }: { metric: SummaryMetric }) {
  const outcomeClass = getOutcomeClass(
    metric.directionMetric,
    metric.variation?.direction ?? null,
  )

  return (
    <article className={`metric-card ${outcomeClass}`}>
      <div className="metric-card-header">
        <p>{metric.label}</p>
        <DirectionBadge direction={metric.variation?.direction ?? null} />
      </div>

      <strong>{formatPrimaryValue(metric.value, metric.type)}</strong>

      <span>
        {metric.secondaryLabel}: {formatSecondaryValue(metric.secondaryValue)}
      </span>

      <div className="variation-card">
        <p>Variação</p>
        <strong>{formatPrimaryVariation(metric.variation, metric.type)}</strong>
        <span>
          {formatSecondaryVariation(
            metric.variationSecondary,
            metric.variationSecondaryType,
          )}
        </span>
      </div>
    </article>
  )
}

function DirectionBadge({ direction }: { direction: MetricDirection | null }) {
  return (
    <span className="direction-badge">
      {direction === "up"
        ? "Subiu"
        : direction === "down"
          ? "Caiu"
          : direction === "stable"
            ? "Estável"
            : "Sem comparação"}
    </span>
  )
}

function PlaceholderSummary() {
  return (
    <section className="summary-grid" aria-label="Resumo semanal">
      {["Peso médio", "Gordura corporal", "Massa muscular"].map((label) => (
        <article className="metric-card" key={label}>
          <div className="metric-card-header">
            <p>{label}</p>
          </div>
          <strong>-</strong>
          <span>Semana atual</span>
          <div className="variation-card">
            <p>Variação</p>
            <strong>-</strong>
            <span>-</span>
          </div>
        </article>
      ))}
    </section>
  )
}

function createSummaryMetrics(dashboard: WeeklyDashboard): SummaryMetric[] {
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

function getAvailableDaysSoFar(currentWeek: WeekSummary): number {
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

function getDateOnlyDifferenceInDays(startDate: string, endDate: string) {
  const start = new Date(`${startDate}T00:00:00.000Z`)
  const end = new Date(`${endDate}T00:00:00.000Z`)
  const millisecondsPerDay = 24 * 60 * 60 * 1000

  return Math.round((end.getTime() - start.getTime()) / millisecondsPerDay)
}

function getReliability(measurementCount: number): {
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

function getOutcomeClass(
  metric: SummaryMetric["directionMetric"],
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

function formatPrimaryValue(
  value: number | null,
  type: SummaryMetric["type"],
): string {
  if (value === null) {
    return "-"
  }

  return type === "percentage"
    ? `${ptBrNumberFormatter.format(value)}%`
    : `${ptBrNumberFormatter.format(value)} kg`
}

function formatSecondaryValue(value: number | null): string {
  return value === null ? "-" : ptBrPreciseNumberFormatter.format(value)
}

function formatPrimaryVariation(
  variation: MetricVariation | undefined,
  type: SummaryMetric["type"],
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

  return `${formatSignedNumber(value)}${suffix}`
}

function formatSecondaryVariation(
  variation: MetricVariation | undefined,
  type: SummaryMetric["variationSecondaryType"],
): string {
  if (!variation) {
    return type === "relativePercentage"
      ? "Sem variação relativa"
      : "Sem variação em kg"
  }

  if (type === "relativePercentage") {
    return variation.relativePercentage === null
      ? "Sem variação relativa"
      : `${formatSignedNumber(variation.relativePercentage)}%`
  }

  if (variation.absolute === undefined) {
    return "Sem variação em kg"
  }

  return `${formatSignedNumber(variation.absolute)} kg`
}

function formatSignedNumber(value: number): string {
  const sign = value > 0 ? "+" : ""

  return `${sign}${ptBrPreciseNumberFormatter.format(value)}`
}
