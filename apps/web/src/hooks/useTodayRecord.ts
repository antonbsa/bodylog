import { useQuery } from "@tanstack/react-query"

import { formatApiErrorMessage } from "../../../../infra/errors"
import { lookupQuery, previousQuery } from "./useRegistrationData"
import type { Measurement } from "../../../../types/measurements"
import type { ListedMeasurement } from "../types"

/** Shares its queries with the registration screen, so saving there updates Início through the cache. */
export function useTodayRecord(today: string): {
  error: string | null
  isLoading: boolean
  last: ListedMeasurement | null
  measurement: Measurement | null
  reload: () => void
} {
  const lookup = useQuery(lookupQuery(today))
  const previous = useQuery(previousQuery(today))

  return {
    error:
      lookup.data === undefined && lookup.isError
        ? formatApiErrorMessage(lookup.error)
        : null,
    isLoading: lookup.data === undefined && !lookup.isError,
    last: previous.data?.[0] ?? null,
    measurement: lookup.data?.item ?? null,
    reload: () => {
      lookup.refetch()
      previous.refetch()
    },
  }
}
