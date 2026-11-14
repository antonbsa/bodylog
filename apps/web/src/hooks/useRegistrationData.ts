import { useEffect, useMemo } from "react"
import { useQuery, useQueryClient } from "@tanstack/react-query"

import { formatApiErrorMessage } from "../../../../infra/errors"
import { queryKeys } from "../api/queryKeys"
import { getMeasurementByDate, listMeasurements } from "../api/measurements"
import {
  getMonthRange,
  isPastOrTodayIsoDate,
  parseIsoDate,
  shiftIsoDate,
} from "../utils/date-format"
import { recordedDaysQuery } from "./useRecordedDays"
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

// Keeps prefetched neighbours from being refetched on every effect run.
const PREFETCH_STALE_MS = 60_000

function lookupQuery(date: string) {
  return {
    queryFn: () => getMeasurementByDate(date),
    queryKey: queryKeys.measurementByDate(date),
  }
}

function previousQuery(date: string) {
  return {
    // The hint is optional, so a failed lookup must not block the form.
    queryFn: () =>
      listMeasurements({ limit: 1, to: shiftIsoDate(date, -1) }).catch(
        () => [],
      ),
    queryKey: queryKeys.previousMeasurement(date),
  }
}

/**
 * Looks up the record for `date` and the one before it, and prefetches the
 * adjacent days so the date arrows are instant. `data` and `error` are null
 * while `date` has nothing cached, so the screen never shows another date's values.
 */
export function useRegistrationData(date: string): {
  data: RegistrationData | null
  error: string | null
  reload: () => void
} {
  const queryClient = useQueryClient()
  const lookup = useQuery(lookupQuery(date))
  const previous = useQuery(previousQuery(date))
  const lookupData = lookup.data
  const previousItems = previous.data

  // Stable while the query data is unchanged: the screen resets the form when this reference changes.
  const data = useMemo<RegistrationData | null>(
    () =>
      lookupData === undefined || previousItems === undefined
        ? null
        : {
            date,
            heightCm: lookupData?.heightCm ?? null,
            measurement: lookupData?.item ?? null,
            previous: previousItems[0] ?? null,
          },
    [date, lookupData, previousItems],
  )
  const isReady = data !== null

  useEffect(() => {
    if (!isReady) {
      return
    }

    const neighbours = [shiftIsoDate(date, -1), shiftIsoDate(date, 1)].filter(
      (neighbour) => isPastOrTodayIsoDate(neighbour),
    )

    for (const neighbour of neighbours) {
      queryClient.prefetchQuery({
        ...lookupQuery(neighbour),
        staleTime: PREFETCH_STALE_MS,
      })
      queryClient.prefetchQuery({
        ...previousQuery(neighbour),
        staleTime: PREFETCH_STALE_MS,
      })
    }

    // So the calendar sheet opens with its marks already loaded.
    queryClient.prefetchQuery({
      ...recordedDaysQuery(getMonthRange(parseIsoDate(date)).from),
      staleTime: PREFETCH_STALE_MS,
    })
  }, [date, isReady, queryClient])

  function reload() {
    lookup.refetch()
    previous.refetch()
  }

  return {
    data,
    error:
      lookupData === undefined && lookup.isError
        ? formatApiErrorMessage(lookup.error)
        : null,
    reload,
  }
}
