import { Badge, Card } from "@radix-ui/themes"

import {
  createDashboardCardModels,
  formatPrimaryValue,
  formatPrimaryVariation,
  formatSecondaryValue,
  formatSecondaryVariation,
  getAvailableDaysSoFar,
  getDirectionLabel,
  getOutcomeClass,
  getReliability,
} from "../../utils/dashboard-summary"
import { formatDisplayDateFromIso } from "../../utils/date-format"
import type {
  MetricDirection,
  WeeklyDashboard,
} from "../../../../../types/dashboard"
import type { DashboardCardModel, OutcomeClass } from "../../types"

const OUTCOME_BADGE_COLOR: Record<OutcomeClass, "gray" | "green" | "red"> = {
  "metric-card-negative": "red",
  "metric-card-positive": "green",
  "metric-card-stable": "gray",
  "metric-card-unavailable": "gray",
}

const METRIC_TINT_CLASS: Record<
  DashboardCardModel["directionMetric"],
  string
> = {
  bodyFat: "metric-tint-fat",
  muscle: "metric-tint-muscle",
  weight: "metric-tint-weight",
}

export function WeeklyDashboardSummary({
  dashboard,
}: {
  dashboard: WeeklyDashboard
}) {
  const metrics = createDashboardCardModels(dashboard)
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

      {dashboard.display.mode === "latest-recorded-week" ? (
        <p className="partial-week-note">
          Exibindo últimos dados registrados:{" "}
          {formatDisplayDateFromIso(dashboard.display.summary.weekStartDate)} a{" "}
          {formatDisplayDateFromIso(dashboard.display.summary.weekEndDate)}.
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

function SummaryCard({ metric }: { metric: DashboardCardModel }) {
  const outcomeClass = getOutcomeClass(
    metric.directionMetric,
    metric.variation?.direction ?? null,
  )
  const tintClass = METRIC_TINT_CLASS[metric.directionMetric]
  const isHero = metric.directionMetric === "weight"

  return (
    <Card
      className={`metric-card ${tintClass} ${outcomeClass} ${
        isHero ? "metric-card-hero" : ""
      }`}
    >
      <div className="metric-card-header">
        <p>{metric.label}</p>
        <DirectionBadge
          direction={metric.variation?.direction ?? null}
          outcomeClass={outcomeClass}
        />
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
    </Card>
  )
}

function DirectionBadge({
  direction,
  outcomeClass,
}: {
  direction: MetricDirection | null
  outcomeClass: OutcomeClass
}) {
  return (
    <Badge color={OUTCOME_BADGE_COLOR[outcomeClass]} radius="large">
      {getDirectionLabel(direction)}
    </Badge>
  )
}

const PLACEHOLDER_CARDS = [
  { label: "Peso médio", tintClass: "metric-tint-weight metric-card-hero" },
  { label: "Gordura corporal", tintClass: "metric-tint-fat" },
  { label: "Massa muscular", tintClass: "metric-tint-muscle" },
]

export function PlaceholderSummary() {
  return (
    <section className="summary-grid" aria-label="Resumo semanal">
      {PLACEHOLDER_CARDS.map(({ label, tintClass }) => (
        <Card className={`metric-card ${tintClass}`} key={label}>
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
        </Card>
      ))}
    </section>
  )
}
