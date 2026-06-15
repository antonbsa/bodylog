import { useState } from "react"

import type { Measurement } from "../api/measurements"
import { AuthenticatedDashboard } from "./components/AuthenticatedDashboard"
import { formatDisplayDateFromIso } from "../utils/date-format"
import { MeasurementForm } from "./components/MeasurementForm"

type AuthenticatedAppProps = {
  onLogout: () => void
}

export function AuthenticatedApp({ onLogout }: AuthenticatedAppProps) {
  const [isMeasurementFormOpen, setIsMeasurementFormOpen] = useState(false)
  const [selectedMeasurementDate, setSelectedMeasurementDate] = useState<
    string | null
  >(null)
  const [savedMessage, setSavedMessage] = useState<string | null>(null)
  // simple way to trigger a refresh of the dashboard when a new measurement is saved
  const [dashboardRefreshKey, setDashboardRefreshKey] = useState(0)

  function openMeasurementForm(date?: string) {
    setSavedMessage(null)
    setSelectedMeasurementDate(date ?? null)
    setIsMeasurementFormOpen(true)
  }

  function handleMeasurementSaved(measurement: Measurement) {
    setSavedMessage(
      `Medida de ${formatDisplayDateFromIso(measurement.date)} salva.`,
    )
    setDashboardRefreshKey((currentKey) => currentKey + 1)
    setIsMeasurementFormOpen(false)
  }

  return (
    <main className="app-shell">
      <AuthenticatedDashboard
        onLogout={onLogout}
        onOpenMeasurementForm={openMeasurementForm}
        refreshKey={dashboardRefreshKey}
        savedMessage={savedMessage}
      />

      {isMeasurementFormOpen ? (
        <MeasurementForm
          initialDate={selectedMeasurementDate ?? undefined}
          onClose={() => setIsMeasurementFormOpen(false)}
          onSaved={handleMeasurementSaved}
        />
      ) : null}
    </main>
  )
}
