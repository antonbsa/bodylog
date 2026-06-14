import { useEffect, useState } from "react"

import {
  getWeeklyDashboard,
  type MetricDirection,
  type WeeklyDashboard,
} from "../../api/dashboard"
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
  type DashboardCardModel,
} from "../../utils/dashboard-summary"
import { formatDisplayDateFromIso } from "../../utils/date-format"

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
  return <span className="direction-badge">{getDirectionLabel(direction)}</span>
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
