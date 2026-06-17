import { useEffect, useRef, useState } from "react"
import { Badge, Callout, Card } from "@radix-ui/themes"

import { Button } from "../../components/Button"
import {
  getWeeklyDashboard,
  type MetricDirection,
  type WeeklyDashboard,
} from "../../api/dashboard"
import {
  deleteMeasurement,
  CsvImportError,
  exportMeasurementsCsv,
  importMeasurementsCsv,
  listMeasurements,
  type CsvImportSummary,
  type ListedMeasurement,
} from "../../api/measurements"
import { DeleteConfirmationDialog } from "./DeleteConfirmationDialog"
import { MeasurementHistoryTable } from "./MeasurementHistoryTable"
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
  type OutcomeClass,
} from "../../utils/dashboard-summary"
import {
  formatImportFailureMessage,
  formatImportPartialMessage,
  formatImportSuccessMessage,
} from "../../utils/csv-import-summary"
import { formatDisplayDateFromIso } from "../../utils/date-format"

const HISTORY_PAGE_SIZE = 20

type DashboardState = {
  dashboard: WeeklyDashboard | null
  status: "error" | "loaded" | "loading"
}

type ExportState = "error" | "idle" | "loading"
type ImportState =
  | {
      message: string
      status: "error"
      summary: CsvImportSummary | null
    }
  | {
      message: null
      status: "idle" | "loading"
      summary: CsvImportSummary | null
    }

type MeasurementHistoryState = {
  deletingId: string | null
  hasMore: boolean
  items: ListedMeasurement[]
  message: string | null
  status: "error" | "loaded" | "loading"
}

type AuthenticatedDashboardProps = {
  onLogout: () => void
  onOpenMeasurementForm: (date?: string) => void
  refreshKey: number
  savedMessage: string | null
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

const OUTCOME_BADGE_COLOR: Record<OutcomeClass, "gray" | "green" | "red"> = {
  "metric-card-negative": "red",
  "metric-card-positive": "green",
  "metric-card-stable": "gray",
  "metric-card-unavailable": "gray",
}

function SummaryCard({ metric }: { metric: DashboardCardModel }) {
  const outcomeClass = getOutcomeClass(
    metric.directionMetric,
    metric.variation?.direction ?? null,
  )

  return (
    <Card className={`metric-card ${outcomeClass}`}>
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

function PlaceholderSummary() {
  return (
    <section className="summary-grid" aria-label="Resumo semanal">
      {["Peso médio", "Gordura corporal", "Massa muscular"].map((label) => (
        <Card className="metric-card" key={label}>
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

function MeasurementHistory({
  onDeletedMeasurement,
  onEditMeasurement,
  refreshKey,
}: {
  onDeletedMeasurement: () => void
  onEditMeasurement: (date: string) => void
  refreshKey: number
}) {
  const [visibleLimit, setVisibleLimit] = useState(HISTORY_PAGE_SIZE)
  const [pendingDeleteMeasurement, setPendingDeleteMeasurement] =
    useState<ListedMeasurement | null>(null)
  const [state, setState] = useState<MeasurementHistoryState>({
    deletingId: null,
    hasMore: false,
    items: [],
    message: null,
    status: "loading",
  })

  useEffect(() => {
    let isCurrentRequest = true

    setState((currentState) => ({
      ...currentState,
      status: "loading",
    }))

    listMeasurements({
      limit: visibleLimit + 1,
    })
      .then((items) => {
        if (!isCurrentRequest) {
          return
        }

        setState({
          deletingId: null,
          hasMore: items.length > visibleLimit,
          items: items.slice(0, visibleLimit),
          message: null,
          status: "loaded",
        })
      })
      .catch(() => {
        if (isCurrentRequest) {
          setState((currentState) => ({
            ...currentState,
            status: "error",
          }))
        }
      })

    return () => {
      isCurrentRequest = false
    }
  }, [refreshKey, visibleLimit])

  const isInitialLoading =
    state.status === "loading" && state.items.length === 0
  const isEmpty = state.status === "loaded" && state.items.length === 0

  const pendingDeleteDisplayDate = pendingDeleteMeasurement
    ? formatDisplayDateFromIso(pendingDeleteMeasurement.date)
    : null

  function handleDeleteDialogOpenChange(open: boolean) {
    if (state.deletingId) {
      return
    }

    if (!open) {
      setPendingDeleteMeasurement(null)
    }
  }

  function handleDeleteMeasurement(measurement: ListedMeasurement) {
    setPendingDeleteMeasurement(measurement)
  }

  function handleConfirmDeleteMeasurement() {
    if (!pendingDeleteMeasurement || !pendingDeleteDisplayDate) {
      return
    }

    const measurement = pendingDeleteMeasurement
    const displayDate = pendingDeleteDisplayDate

    setState((currentState) => ({
      ...currentState,
      deletingId: measurement.id,
      message: null,
    }))

    deleteMeasurement(measurement.id)
      .then(() => {
        setState((currentState) => ({
          ...currentState,
          deletingId: null,
          items: currentState.items.filter(
            (item) => item.id !== measurement.id,
          ),
          message: `Medida de ${displayDate} excluída.`,
          status: "loaded",
        }))
        setPendingDeleteMeasurement(null)
        onDeletedMeasurement()
      })
      .catch(() => {
        setState((currentState) => ({
          ...currentState,
          deletingId: null,
          message: "Não foi possível excluir a medida.",
        }))
      })
  }

  return (
    <section className="history-section" aria-label="Histórico de medidas">
      {state.status === "error" ? (
        <Callout.Root color="red" role="alert">
          <Callout.Text>Não foi possível carregar o histórico.</Callout.Text>
        </Callout.Root>
      ) : null}

      {isInitialLoading ? (
        <Callout.Root role="status">
          <Callout.Text>Carregando histórico...</Callout.Text>
        </Callout.Root>
      ) : null}

      {state.message ? (
        <Callout.Root
          color={state.message.startsWith("Não foi possível") ? "red" : "green"}
          role="status"
        >
          <Callout.Text>{state.message}</Callout.Text>
        </Callout.Root>
      ) : null}

      {isEmpty ? <p className="history-empty">Nenhum registro ainda.</p> : null}

      {state.items.length > 0 ? (
        <MeasurementHistoryTable
          deletingMeasurementId={state.deletingId}
          measurements={state.items}
          onDeleteMeasurement={handleDeleteMeasurement}
          onEditMeasurement={onEditMeasurement}
        />
      ) : null}

      {state.hasMore ? (
        <Button
          disabled={state.status === "loading"}
          fullWidth
          onClick={() =>
            setVisibleLimit((currentLimit) => currentLimit + HISTORY_PAGE_SIZE)
          }
          type="button"
          variant="secondary"
        >
          {state.status === "loading" ? "Carregando..." : "Carregar mais"}
        </Button>
      ) : null}

      <DeleteConfirmationDialog
        description={
          pendingDeleteDisplayDate
            ? `Excluir a medida de ${pendingDeleteDisplayDate}? Esta ação não pode ser desfeita.`
            : ""
        }
        isConfirming={state.deletingId !== null}
        onConfirm={handleConfirmDeleteMeasurement}
        onOpenChange={handleDeleteDialogOpenChange}
        open={pendingDeleteMeasurement !== null}
      />
    </section>
  )
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
  const [deletedRefreshKey, setDeletedRefreshKey] = useState(0)
  const [importRefreshKey, setImportRefreshKey] = useState(0)
  const [exportState, setExportState] = useState<ExportState>("idle")
  const [importState, setImportState] = useState<ImportState>({
    message: null,
    status: "idle",
    summary: null,
  })
  const importFileInputRef = useRef<HTMLInputElement | null>(null)

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
  }, [deletedRefreshKey, importRefreshKey, refreshKey])

  const dashboard = state.dashboard

  function handleExportCsv() {
    setExportState("loading")

    exportMeasurementsCsv()
      .then((csvBlob) => {
        const url = URL.createObjectURL(csvBlob)
        const link = document.createElement("a")

        link.href = url
        link.download = "bodylog-measurements.csv"
        link.click()
        URL.revokeObjectURL(url)
        setExportState("idle")
      })
      .catch(() => {
        setExportState("error")
      })
  }

  function handleImportCsv(file: File | undefined) {
    if (!file) {
      return
    }

    setImportState({
      message: null,
      status: "loading",
      summary: null,
    })

    importMeasurementsCsv(file)
      .then((summary) => {
        setImportState({
          message: null,
          status: "idle",
          summary,
        })
        setImportRefreshKey((currentKey) => currentKey + 1)
      })
      .catch((error: unknown) => {
        const summary = error instanceof CsvImportError ? error.summary : null

        setImportState({
          message: formatImportFailureMessage(summary),
          status: "error",
          summary,
        })
      })
      .finally(() => {
        if (importFileInputRef.current) {
          importFileInputRef.current.value = ""
        }
      })
  }

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
          <Button onClick={() => onOpenMeasurementForm()} type="button">
            Registrar medida
          </Button>
          <Button
            disabled={exportState === "loading"}
            onClick={handleExportCsv}
            type="button"
            variant="secondary"
          >
            {exportState === "loading" ? "Exportando..." : "Exportar CSV"}
          </Button>
          <Button
            disabled={importState.status === "loading"}
            onClick={() => importFileInputRef.current?.click()}
            type="button"
            variant="secondary"
          >
            {importState.status === "loading"
              ? "Importando..."
              : "Importar CSV"}
          </Button>
          <input
            ref={importFileInputRef}
            accept=".csv,text/csv"
            className="visually-hidden"
            onChange={(event) => handleImportCsv(event.target.files?.[0])}
            type="file"
          />
          <Button onClick={onLogout} type="button" variant="secondary">
            Sair
          </Button>
        </div>
      </header>

      {savedMessage ? (
        <Callout.Root color="green" role="status">
          <Callout.Text>{savedMessage}</Callout.Text>
        </Callout.Root>
      ) : null}

      {exportState === "error" ? (
        <Callout.Root color="red" role="alert">
          <Callout.Text>Não foi possível exportar o CSV.</Callout.Text>
        </Callout.Root>
      ) : null}

      {importState.status === "error" ? (
        <Callout.Root color="red" role="alert">
          <Callout.Text>{importState.message}</Callout.Text>
        </Callout.Root>
      ) : null}

      {importState.summary && importState.status !== "error" ? (
        importState.summary.errors.length > 0 ? (
          <Callout.Root color="red" role="alert">
            <Callout.Text>
              {formatImportPartialMessage(importState.summary)}
            </Callout.Text>
          </Callout.Root>
        ) : (
          <Callout.Root color="green" role="status">
            <Callout.Text>
              {formatImportSuccessMessage(importState.summary)}
            </Callout.Text>
          </Callout.Root>
        )
      ) : null}

      {state.status === "error" ? (
        <Callout.Root color="red" role="alert">
          <Callout.Text>
            Não foi possível carregar o resumo semanal.
          </Callout.Text>
        </Callout.Root>
      ) : null}

      {state.status === "loading" && !dashboard ? (
        <Callout.Root role="status">
          <Callout.Text>Carregando resumo semanal...</Callout.Text>
        </Callout.Root>
      ) : null}

      {dashboard ? (
        <WeeklyDashboardSummary dashboard={dashboard} />
      ) : (
        <PlaceholderSummary />
      )}

      <MeasurementHistory
        onDeletedMeasurement={() =>
          setDeletedRefreshKey((currentKey) => currentKey + 1)
        }
        onEditMeasurement={onOpenMeasurementForm}
        refreshKey={refreshKey + importRefreshKey}
      />
    </>
  )
}
