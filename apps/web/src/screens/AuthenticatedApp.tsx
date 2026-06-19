import { useEffect, useRef, useState } from "react"

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
  const lastResumeRefreshAtRef = useRef(0)

  function refreshDashboardData() {
    setDashboardRefreshKey((currentKey) => currentKey + 1)
  }

  // refresh dashboard data when the user focuses the window
  // or when the page is shown after being in the background
  // with a cooldown to avoid multiple refreshes if quickly focuses/unfocuses the window
  useEffect(() => {
    function refreshAfterResume() {
      const now = Date.now()

      if (now - lastResumeRefreshAtRef.current < 500) {
        return
      }

      lastResumeRefreshAtRef.current = now
      refreshDashboardData()
    }

    function handleVisibilityChange() {
      if (document.visibilityState === "visible") {
        refreshAfterResume()
      }
    }

    window.addEventListener("focus", refreshAfterResume)
    window.addEventListener("pageshow", refreshAfterResume)
    document.addEventListener("visibilitychange", handleVisibilityChange)

    return () => {
      window.removeEventListener("focus", refreshAfterResume)
      window.removeEventListener("pageshow", refreshAfterResume)
      document.removeEventListener("visibilitychange", handleVisibilityChange)
    }
  }, [])

  function openMeasurementForm(date?: string) {
    setSavedMessage(null)
    setSelectedMeasurementDate(date ?? null)
    setIsMeasurementFormOpen(true)
  }

  function handleMeasurementSaved(measurement: Measurement) {
    setSavedMessage(
      `Medida de ${formatDisplayDateFromIso(measurement.date)} salva.`,
    )
    refreshDashboardData()
    setIsMeasurementFormOpen(false)
  }

  return (
    <main className="app-shell">
      <AuthenticatedDashboard
        onLogout={onLogout}
        onOpenMeasurementForm={openMeasurementForm}
        onRefreshData={refreshDashboardData}
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
