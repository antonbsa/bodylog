import { useCallback, useEffect, useState } from "react"

import { formatApiErrorMessage } from "../../../../infra/errors"
import { getMeasurementByDate, listMeasurements } from "../api/measurements"
import { shiftIsoDate } from "../utils/date-format"
import type { Measurement } from "../../../../types/measurements"
import type { ListedMeasurement } from "../types"

export type RegistrationData = {
  date: string
  /** Configured height, present only when a record exists (edit mode). */
  heightCm: number | null
  measurement: Measurement | null
  /** Latest record before `date`, used only for the "anterior" hints. */
  previous: ListedMeasurement | null
}

type LookupResult =
  | { data: RegistrationData; status: "ready" }
  | { date: string; message: string; status: "error" }

/**
 * Looks up the record for `date` and the one before it. `data` and `error`
 * are null while a different date than the requested one is still loading,
 * so the screen never shows the previous date's values.
 */
export function useRegistrationData(date: string): {
  data: RegistrationData | null
  error: string | null
  reload: () => void
} {
  const [result, setResult] = useState<LookupResult | null>(null)
  const [attempt, setAttempt] = useState(0)

  useEffect(() => {
    let isCurrent = true

    async function load() {
      try {
        const [lookup, previousItems] = await Promise.all([
          getMeasurementByDate(date),
          // The hint is optional, so a failed lookup must not block the form.
          listMeasurements({ limit: 1, to: shiftIsoDate(date, -1) }).catch(
            () => [],
          ),
        ])

        if (isCurrent) {
          setResult({
            data: {
              date,
              heightCm: lookup?.heightCm ?? null,
              measurement: lookup?.item ?? null,
              previous: previousItems[0] ?? null,
            },
            status: "ready",
          })
        }
      } catch (error) {
        if (isCurrent) {
          setResult({
            date,
            message: formatApiErrorMessage(error),
            status: "error",
          })
        }
      }
    }

    load()

    return () => {
      isCurrent = false
    }
  }, [attempt, date])

  const reload = useCallback(() => {
    setResult(null)
    setAttempt((current) => current + 1)
  }, [])

  const matches =
    result !== null &&
    (result.status === "ready" ? result.data.date : result.date) === date

  return {
    data: matches && result.status === "ready" ? result.data : null,
    error: matches && result.status === "error" ? result.message : null,
    reload,
  }
}
