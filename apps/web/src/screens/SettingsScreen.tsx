import { useRef, useState, useSyncExternalStore } from "react"
import { useQueryClient } from "@tanstack/react-query"

import { formatApiErrorMessage } from "../../../../infra/errors"
import { PageTitle } from "./components/PageTitle"
import { invalidateMeasurementData } from "../api/queryKeys"
import {
  exportMeasurementsCsv,
  importMeasurementsCsv,
} from "../api/measurements"
import { ConfirmationDialog } from "./components/ConfirmationDialog"
import { useToast } from "../hooks/useToast"
import {
  getThemePreference,
  setThemePreference,
  subscribeToTheme,
  type ThemePreference,
} from "../theme"
import {
  formatImportPartialMessage,
  formatImportSuccessMessage,
} from "../utils/csv-import-summary"

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
  const [isImporting, setIsImporting] = useState(false)
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

  function handleImportCsv(file: File | undefined) {
    if (!file) {
      return
    }

    setIsImporting(true)

    importMeasurementsCsv(file)
      .then((summary) => {
        invalidateMeasurementData(queryClient)

        if (summary.errors.length > 0) {
          toast.showError(formatImportPartialMessage(summary))
        } else {
          toast.showSuccess(formatImportSuccessMessage(summary))
        }
      })
      .catch((error: unknown) => toast.showError(formatApiErrorMessage(error)))
      .finally(() => {
        setIsImporting(false)

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
          disabled={isImporting}
          onClick={() => importFileInputRef.current?.click()}
          type="button"
        >
          {isImporting ? "Importando..." : "Importar CSV"}
        </button>
        <input
          ref={importFileInputRef}
          accept=".csv,text/csv"
          hidden
          onChange={(event) => handleImportCsv(event.target.files?.[0])}
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
