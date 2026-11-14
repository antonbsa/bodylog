import { useState } from "react"
import {
  keepPreviousData,
  useMutation,
  useQuery,
  useQueryClient,
} from "@tanstack/react-query"

import { formatApiErrorMessage } from "../../../../infra/errors"
import { deleteMeasurement, listMeasurements } from "../api/measurements"
import { invalidateMeasurementData, queryKeys } from "../api/queryKeys"
import type { ListedMeasurement } from "../types"

export const HISTORY_PAGE_SIZE = 30

export type MeasurementHistoryState = {
  deletingId: string | null
  hasMore: boolean
  items: ListedMeasurement[]
  message: string | null
  messageKind: "error" | "success" | null
  status: "error" | "loaded" | "loading"
}

export function useMeasurementHistory(): {
  loadMore: () => void
  reload: () => void
  remove: (
    measurement: ListedMeasurement,
    displayDate: string,
  ) => Promise<boolean>
  state: MeasurementHistoryState
} {
  const queryClient = useQueryClient()
  const [visibleLimit, setVisibleLimit] = useState(HISTORY_PAGE_SIZE)
  const [feedback, setFeedback] = useState<{
    kind: "error" | "success"
    message: string
  } | null>(null)

  // One extra row tells whether there is another page.
  const query = useQuery({
    // Keeps the current rows visible while "Carregar mais" fetches the larger list.
    placeholderData: keepPreviousData,
    queryFn: () => listMeasurements({ limit: visibleLimit + 1 }),
    queryKey: queryKeys.measurementList(visibleLimit + 1),
  })
  const removal = useMutation({
    mutationFn: (measurement: ListedMeasurement) =>
      deleteMeasurement(measurement.id),
    onSuccess: () => invalidateMeasurementData(queryClient),
  })

  const items = query.data ?? []
  const status = query.isFetching
    ? "loading"
    : query.isError
      ? "error"
      : "loaded"

  async function remove(
    measurement: ListedMeasurement,
    displayDate: string,
  ): Promise<boolean> {
    setFeedback(null)

    try {
      await removal.mutateAsync(measurement)
      setFeedback({
        kind: "success",
        message: `Medida de ${displayDate} excluída.`,
      })

      return true
    } catch (error) {
      setFeedback({ kind: "error", message: formatApiErrorMessage(error) })

      return false
    }
  }

  return {
    loadMore: () => setVisibleLimit((limit) => limit + HISTORY_PAGE_SIZE),
    reload: () => {
      setFeedback(null)
      query.refetch()
    },
    remove,
    state: {
      deletingId: removal.isPending ? removal.variables.id : null,
      hasMore: items.length > visibleLimit,
      items: items.slice(0, visibleLimit),
      message:
        status === "error" && query.error
          ? formatApiErrorMessage(query.error)
          : (feedback?.message ?? null),
      messageKind: status === "error" ? "error" : (feedback?.kind ?? null),
      status,
    },
  }
}
