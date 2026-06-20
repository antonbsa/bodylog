import { useEffect, useRef, useState } from "react"
import { Callout } from "@radix-ui/themes"

import { formatApiErrorMessage } from "../../../../../infra/errors"
import { Button } from "../../components/Button"
import {
  exportMeasurementsCsv,
  importMeasurementsCsv,
} from "../../api/measurements"
import { ConfirmationDialog } from "./ConfirmationDialog"
import { MeasurementHistory } from "./MeasurementHistory"
import {
  PlaceholderSummary,
  WeeklyDashboardSummary,
} from "./WeeklyDashboardSummary"
import { useMeasurementHistory } from "../../hooks/useMeasurementHistory"
import { useWeeklyDashboard } from "../../hooks/useWeeklyDashboard"
import {
  formatImportPartialMessage,
  formatImportSuccessMessage,
} from "../../utils/csv-import-summary"
import type { CsvImportSummary } from "../../../../../types/measurements"

type ExportState =
  | {
      message: string
      status: "error"
    }
  | {
      message: null
      status: "idle" | "loading"
    }

type ImportState =
  | {
      message: string
      status: "error"
    }
  | {
      message: null
      status: "idle" | "loading"
      summary: CsvImportSummary | null
    }

type AuthenticatedDashboardProps = {
  onLogout: () => Promise<void> | void
  onOpenMeasurementForm: (date?: string) => void
  onRefreshData: () => void
  refreshKey: number
  savedMessage: string | null
}

export function AuthenticatedDashboard({
  onLogout,
  onOpenMeasurementForm,
  onRefreshData,
  refreshKey,
  savedMessage,
}: AuthenticatedDashboardProps) {
  const { reload: reloadDashboard, state: dashboardState } =
    useWeeklyDashboard()
  const {
    loadMore: loadMoreHistory,
    reload: reloadHistory,
    remove: removeHistoryMeasurement,
    state: historyState,
  } = useMeasurementHistory({ onRemoved: reloadDashboard })
  const [exportState, setExportState] = useState<ExportState>({
    message: null,
    status: "idle",
  })
  const [importState, setImportState] = useState<ImportState>({
    message: null,
    status: "idle",
    summary: null,
  })
  const [isLogoutDialogOpen, setIsLogoutDialogOpen] = useState(false)
  const [isLoggingOut, setIsLoggingOut] = useState(false)
  const importFileInputRef = useRef<HTMLInputElement | null>(null)
  const lastHandledRefreshKey = useRef(refreshKey)

  // The hooks load on mount; this only reacts to external refresh signals
  // (window focus / saved measurement) propagated through refreshKey.
  useEffect(() => {
    if (lastHandledRefreshKey.current === refreshKey) {
      return
    }

    lastHandledRefreshKey.current = refreshKey
    reloadDashboard()
    reloadHistory()
  }, [refreshKey, reloadDashboard, reloadHistory])

  function handleExportCsv() {
    setExportState({
      message: null,
      status: "loading",
    })

    exportMeasurementsCsv()
      .then((csvBlob) => {
        const url = URL.createObjectURL(csvBlob)
        const link = document.createElement("a")

        link.href = url
        link.download = "bodylog-measurements.csv"
        link.click()
        URL.revokeObjectURL(url)
        setExportState({
          message: null,
          status: "idle",
        })
      })
      .catch((error: unknown) => {
        setExportState({
          message: formatApiErrorMessage(error),
          status: "error",
        })
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
        reloadDashboard()
        reloadHistory()
      })
      .catch((error: unknown) => {
        setImportState({
          message: formatApiErrorMessage(error),
          status: "error",
        })
      })
      .finally(() => {
        if (importFileInputRef.current) {
          importFileInputRef.current.value = ""
        }
      })
  }

  function handleLogoutDialogOpenChange(open: boolean) {
    if (isLoggingOut) {
      return
    }

    setIsLogoutDialogOpen(open)
  }

  function handleConfirmLogout() {
    setIsLoggingOut(true)

    try {
      const logoutResult = onLogout()

      Promise.resolve(logoutResult).catch(() => setIsLoggingOut(false))
    } catch {
      setIsLoggingOut(false)
    }
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
            disabled={dashboardState.status === "loading"}
            onClick={onRefreshData}
            type="button"
            variant="secondary"
          >
            Atualizar dados
          </Button>
          <Button
            disabled={exportState.status === "loading"}
            onClick={handleExportCsv}
            type="button"
            variant="secondary"
          >
            {exportState.status === "loading"
              ? "Exportando..."
              : "Exportar CSV"}
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
          <Button
            onClick={() => setIsLogoutDialogOpen(true)}
            type="button"
            variant="secondary"
          >
            Sair
          </Button>
        </div>
      </header>

      <ConfirmationDialog
        confirmLabel="Sair"
        confirmVariant="danger"
        confirmingLabel="Saindo..."
        description="Deseja encerrar a sessão atual?"
        isConfirming={isLoggingOut}
        onConfirm={handleConfirmLogout}
        onOpenChange={handleLogoutDialogOpenChange}
        open={isLogoutDialogOpen}
        title="Sair do BodyLog"
      />

      {savedMessage ? (
        <Callout.Root color="green" role="status">
          <Callout.Text>{savedMessage}</Callout.Text>
        </Callout.Root>
      ) : null}

      {exportState.status === "error" ? (
        <Callout.Root color="red" role="alert">
          <Callout.Text>{exportState.message}</Callout.Text>
        </Callout.Root>
      ) : null}

      {importState.status === "error" ? (
        <Callout.Root color="red" role="alert">
          <Callout.Text>{importState.message}</Callout.Text>
        </Callout.Root>
      ) : null}

      {importState.status !== "error" && importState.summary ? (
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

      {dashboardState.status === "error" ? (
        <Callout.Root color="red" role="alert">
          <Callout.Text>
            {dashboardState.message ??
              "Não foi possível carregar o resumo semanal."}
          </Callout.Text>
        </Callout.Root>
      ) : null}

      {dashboardState.status === "loading" && !dashboardState.dashboard ? (
        <Callout.Root role="status">
          <Callout.Text>Carregando resumo semanal...</Callout.Text>
        </Callout.Root>
      ) : null}

      {dashboardState.dashboard ? (
        <WeeklyDashboardSummary dashboard={dashboardState.dashboard} />
      ) : (
        <PlaceholderSummary />
      )}

      <MeasurementHistory
        onEditMeasurement={onOpenMeasurementForm}
        onLoadMore={loadMoreHistory}
        onRemove={removeHistoryMeasurement}
        state={historyState}
      />
    </>
  )
}
