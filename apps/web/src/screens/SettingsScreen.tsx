import { useRef, useState, useSyncExternalStore } from "react"
import { useQueryClient } from "@tanstack/react-query"

import { formatApiErrorMessage } from "../../../../infra/errors"
import { PageTitle } from "./components/PageTitle"
import { invalidateMeasurementData } from "../api/queryKeys"
import {
  exportMeasurementsCsv,
  importMeasurementsCsv,
  previewMeasurementsCsv,
} from "../api/measurements"
import type { CsvImportPreview } from "../../../../types/measurements"
import { ConfirmationDialog } from "./components/ConfirmationDialog"
import { ImportPreviewDialog } from "./components/ImportPreviewDialog"
import { useToast } from "../hooks/useToast"
import {
  getThemePreference,
  setThemePreference,
  subscribeToTheme,
  type ThemePreference,
} from "../theme"
import { formatImportResultMessage } from "../utils/csv-import-summary"

const THEME_OPTIONS: Array<{ label: string; value: ThemePreference }> = [
  { label: "Sistema", value: "system" },
  { label: "Claro", value: "light" },
  { label: "Escuro", value: "dark" },
]

type SettingsScreenProps = {
  onLogout: () => Promise<void> | void
}

export function SettingsScreen({ onLogout }: SettingsScreenProps) {
  const queryClient = useQueryClient()
  const toast = useToast()
  const themePreference = useSyncExternalStore(
    subscribeToTheme,
    getThemePreference,
  )
  const [isExporting, setIsExporting] = useState(false)
  const [isPreviewing, setIsPreviewing] = useState(false)
  const [isImporting, setIsImporting] = useState(false)
  const [pendingImport, setPendingImport] = useState<{
    file: File
    preview: CsvImportPreview
  } | null>(null)
  const [isLogoutDialogOpen, setIsLogoutDialogOpen] = useState(false)
  const [isLoggingOut, setIsLoggingOut] = useState(false)
  const importFileInputRef = useRef<HTMLInputElement | null>(null)

  function handleExportCsv() {
    setIsExporting(true)

    exportMeasurementsCsv()
      .then((csvBlob) => {
        const url = URL.createObjectURL(csvBlob)
        const link = document.createElement("a")

        link.href = url
        link.download = "bodylog-measurements.csv"
        link.click()
        URL.revokeObjectURL(url)
        toast.showSuccess("CSV exportado")
      })
      .catch((error: unknown) => toast.showError(formatApiErrorMessage(error)))
      .finally(() => setIsExporting(false))
  }

  function handleChooseImportFile(file: File | undefined) {
    if (importFileInputRef.current) {
      importFileInputRef.current.value = ""
    }

    if (!file) {
      return
    }

    setIsPreviewing(true)

    previewMeasurementsCsv(file)
      .then((preview) => setPendingImport({ file, preview }))
      .catch((error: unknown) => toast.showError(formatApiErrorMessage(error)))
      .finally(() => setIsPreviewing(false))
  }

  function handleConfirmImport(skipInvalid: boolean) {
    if (!pendingImport) {
      return
    }

    setIsImporting(true)

    importMeasurementsCsv(pendingImport.file, { skipInvalid })
      .then(async (result) => {
        await invalidateMeasurementData(queryClient)
        toast.showSuccess(formatImportResultMessage(result))
      })
      .catch((error: unknown) => toast.showError(formatApiErrorMessage(error)))
      .finally(() => {
        setIsImporting(false)
        setPendingImport(null)
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
      <PageTitle>Ajustes</PageTitle>

      <div className="card">
        <div className="set-block">
          <span className="k" id="theme-label">
            Tema
          </span>
          <div aria-labelledby="theme-label" className="seg" role="radiogroup">
            {THEME_OPTIONS.map((option) => (
              <button
                aria-checked={option.value === themePreference}
                key={option.value}
                onClick={() => setThemePreference(option.value)}
                role="radio"
                type="button"
              >
                {option.label}
              </button>
            ))}
          </div>
        </div>
        <button
          className="set-row"
          disabled={isExporting}
          onClick={handleExportCsv}
          type="button"
        >
          {isExporting ? "Exportando..." : "Exportar CSV"}
        </button>
        <button
          className="set-row"
          disabled={isPreviewing || isImporting}
          onClick={() => importFileInputRef.current?.click()}
          type="button"
        >
          {isPreviewing ? "Analisando..." : "Importar CSV"}
        </button>
        <p className="set-hint">
          Colunas obrigatórias: Data e Peso. Datas em DD/MM/AAAA ou AAAA-MM-DD.
        </p>
        <details className="set-format">
          <summary>Ver formato</summary>
          <p>
            Colunas reconhecidas pelo nome do cabeçalho: Data, Peso, Gordura,
            Músculo, Metabolismo basal, Cintura, Sono, Disposição e Notas. Os
            nomes do arquivo exportado pelo app também funcionam.
          </p>
          <p>
            Números com ponto ou vírgula decimal, sem unidades (72,5 e não 72,5
            kg). O ponto de milhar só vale no metabolismo basal (1.696). O
            separador pode ser vírgula ou ponto e vírgula.
          </p>
          <p>
            Colunas desconhecidas, como IMC, são ignoradas. Colunas ausentes
            mantêm o valor já salvo; célula vazia limpa o valor.
          </p>
        </details>
        <input
          ref={importFileInputRef}
          accept=".csv,text/csv"
          hidden
          onChange={(event) => handleChooseImportFile(event.target.files?.[0])}
          type="file"
        />
        <button
          className="set-row danger"
          onClick={() => setIsLogoutDialogOpen(true)}
          type="button"
        >
          Sair
        </button>
      </div>

      <ImportPreviewDialog
        isImporting={isImporting}
        onCancel={() => setPendingImport(null)}
        onConfirm={handleConfirmImport}
        preview={pendingImport?.preview ?? null}
      />

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
    </>
  )
}
