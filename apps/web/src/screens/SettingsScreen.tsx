import { useRef, useState, useSyncExternalStore } from "react"
import { useQueryClient } from "@tanstack/react-query"

import { formatApiErrorMessage } from "../../../../infra/errors"
import { PageTitle } from "./components/PageTitle"
import { updateProfile } from "../api/auth"
import { invalidateMeasurementData, queryKeys } from "../api/queryKeys"
import {
  exportMeasurementsCsv,
  importMeasurementsCsv,
  previewMeasurementsCsv,
} from "../api/measurements"
import type { CsvImportPreview } from "../../../../types/measurements"
import { ApiTokensSection } from "./components/ApiTokensSection"
import { ConfirmationDialog } from "./components/ConfirmationDialog"
import { CsvFormatDialog } from "./components/CsvFormatDialog"
import { HeightDialog } from "./components/HeightDialog"
import { ImportPreviewDialog } from "./components/ImportPreviewDialog"
import { useSessionUser } from "../hooks/useSessionUser"
import { useToast } from "../hooks/useToast"
import {
  getThemePreference,
  setThemePreference,
  subscribeToTheme,
  type ThemePreference,
} from "../theme"
import { formatImportResultMessage } from "../utils/csv-import-summary"
import { formatHeight } from "../utils/height"

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
  const user = useSessionUser().data ?? null
  const [isHeightDialogOpen, setIsHeightDialogOpen] = useState(false)
  const [isSavingHeight, setIsSavingHeight] = useState(false)
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

  function handleSaveHeight(heightCm: number) {
    setIsSavingHeight(true)

    updateProfile({ heightCm })
      .then(async (updatedUser) => {
        queryClient.setQueryData(queryKeys.sessionUser, updatedUser)
        // BMI on every screen comes from the height.
        await invalidateMeasurementData(queryClient)
        setIsHeightDialogOpen(false)
        toast.showSuccess("Altura salva")
      })
      .catch((error: unknown) => toast.showError(formatApiErrorMessage(error)))
      .finally(() => setIsSavingHeight(false))
  }

  function handleHeightDialogOpenChange(open: boolean) {
    if (!isSavingHeight) {
      setIsHeightDialogOpen(open)
    }
  }

  /** Copies the agent prompt; the clipboard can be missing or reject (e.g. Safari drops the click's activation). */
  function handleCopyAgentPrompt() {
    const prompt = `Quero importar meu histórico de medidas no BodyLog. Siga as instruções em ${window.location.origin}/import-format.md para converter a planilha que vou te enviar em um arquivo CSV. Pergunte quando algo estiver ambíguo e não invente valores. No fim, me devolva o arquivo para eu importar em Ajustes.`

    Promise.resolve()
      .then(() => navigator.clipboard.writeText(prompt))
      .then(
        () => toast.showSuccess("Instruções copiadas"),
        () => toast.showError("Não foi possível copiar as instruções"),
      )
  }

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
          disabled={user === null}
          onClick={() => setIsHeightDialogOpen(true)}
          type="button"
        >
          <span className="set-label">
            Altura
            {user?.heightCm === null ? (
              <span className="set-note">
                Informe sua altura para calcular o IMC.
              </span>
            ) : null}
          </span>
          <span className="set-value">
            {user ? formatHeight(user.heightCm) : "—"}
          </span>
        </button>
        <button
          className="set-row"
          disabled={isExporting}
          onClick={handleExportCsv}
          type="button"
        >
          {isExporting ? "Exportando..." : "Exportar CSV"}
        </button>
        <div className="set-split">
          <button
            className="set-row"
            disabled={isPreviewing || isImporting}
            onClick={() => importFileInputRef.current?.click()}
            type="button"
          >
            {isPreviewing ? "Analisando..." : "Importar CSV"}
          </button>
          <CsvFormatDialog />
        </div>
        <button
          className="set-row"
          onClick={handleCopyAgentPrompt}
          type="button"
        >
          Copiar instruções para agente
        </button>
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

      <ApiTokensSection />

      <HeightDialog
        heightCm={user?.heightCm ?? null}
        isSaving={isSavingHeight}
        onOpenChange={handleHeightDialogOpenChange}
        onSave={handleSaveHeight}
        open={isHeightDialogOpen}
      />

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
