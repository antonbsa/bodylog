import { useLocation, useNavigate, useSearchParams } from "react-router"

import { MeasurementForm } from "./components/MeasurementForm"
import { formatDisplayDateFromIso } from "../utils/date-format"
import type { Measurement } from "../../../../types/measurements"

const ISO_DATE_PATTERN = /^\d{4}-\d{2}-\d{2}$/

/** Placeholder route: renders the existing form for `?data=YYYY-MM-DD` until sub-issue #26 redoes it. */
export function RegistrationScreen() {
  const [searchParams] = useSearchParams()
  const location = useLocation()
  const navigate = useNavigate()
  const requestedDate = searchParams.get("data")
  const initialDate =
    requestedDate && ISO_DATE_PATTERN.test(requestedDate)
      ? requestedDate
      : undefined

  function handleClose() {
    // "default" means this is the first entry (deep link), so there is nothing to go back to.
    if (location.key === "default") {
      navigate("/")
      return
    }

    navigate(-1)
  }

  function handleSaved(measurement: Measurement) {
    navigate("/", {
      state: {
        savedMessage: `Medida de ${formatDisplayDateFromIso(measurement.date)} salva.`,
      },
    })
  }

  return (
    <main className="app-shell">
      <MeasurementForm
        key={initialDate}
        initialDate={initialDate}
        onClose={handleClose}
        onSaved={handleSaved}
      />
    </main>
  )
}
