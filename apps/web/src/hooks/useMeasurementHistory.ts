import { useCallback, useEffect, useRef, useState } from "react"

import { formatApiErrorMessage } from "../../../../infra/errors"
import { deleteMeasurement, listMeasurements } from "../api/measurements"
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

export function useMeasurementHistory({
  onRemoved,
}: {
  onRemoved?: () => void
} = {}): {
  loadMore: () => void
  reload: () => void
  remove: (
    measurement: ListedMeasurement,
    displayDate: string,
  ) => Promise<boolean>
  state: MeasurementHistoryState
} {
  const [visibleLimit, setVisibleLimit] = useState(HISTORY_PAGE_SIZE)
  const [state, setState] = useState<MeasurementHistoryState>({
    deletingId: null,
    hasMore: false,
    items: [],
    message: null,
    messageKind: null,
    status: "loading",
  })
  const requestIdRef = useRef(0)

  const reload = useCallback(() => {
    const requestId = (requestIdRef.current += 1)

    setState((currentState) => ({ ...currentState, status: "loading" }))

    listMeasurements({ limit: visibleLimit + 1 })
      .then((items) => {
        if (requestId !== requestIdRef.current) {
          return
        }

        setState({
          deletingId: null,
          hasMore: items.length > visibleLimit,
          items: items.slice(0, visibleLimit),
          message: null,
          messageKind: null,
          status: "loaded",
        })
      })
      .catch((error: unknown) => {
        if (requestId !== requestIdRef.current) {
          return
        }

        setState((currentState) => ({
          ...currentState,
          message: formatApiErrorMessage(error),
          messageKind: "error",
          status: "error",
        }))
      })
  }, [visibleLimit])

  useEffect(() => {
    reload()
  }, [reload])

  const loadMore = useCallback(() => {
    setVisibleLimit((currentLimit) => currentLimit + HISTORY_PAGE_SIZE)
  }, [])

  const remove = useCallback(
    (measurement: ListedMeasurement, displayDate: string): Promise<boolean> => {
      setState((currentState) => ({
        ...currentState,
        deletingId: measurement.id,
        message: null,
        messageKind: null,
      }))

      return deleteMeasurement(measurement.id)
        .then(() => {
          setState((currentState) => ({
            ...currentState,
            deletingId: null,
            items: currentState.items.filter(
              (item) => item.id !== measurement.id,
            ),
            message: `Medida de ${displayDate} excluída.`,
            messageKind: "success",
            status: "loaded",
          }))
          onRemoved?.()

          return true
        })
        .catch((error: unknown) => {
          setState((currentState) => ({
            ...currentState,
            deletingId: null,
            message: formatApiErrorMessage(error),
            messageKind: "error",
          }))

          return false
        })
    },
    [onRemoved],
  )

  return { loadMore, reload, remove, state }
}
