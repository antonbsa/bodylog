import { useCallback, useEffect, useRef, useState } from "react"

import { formatApiErrorMessage } from "../../../../infra/errors"
import { getWeeklyDashboard } from "../api/dashboard"
import type { WeeklyDashboard } from "../../../../types/dashboard"

export type WeeklyDashboardState = {
  dashboard: WeeklyDashboard | null
  message: string | null
  status: "error" | "loaded" | "loading"
}

export function useWeeklyDashboard(): {
  reload: () => void
  state: WeeklyDashboardState
} {
  const [state, setState] = useState<WeeklyDashboardState>({
    dashboard: null,
    message: null,
    status: "loading",
  })
  const requestIdRef = useRef(0)

  const reload = useCallback(() => {
    const requestId = (requestIdRef.current += 1)

    setState((currentState) => ({
      dashboard: currentState.dashboard,
      message: null,
      status: "loading",
    }))

    getWeeklyDashboard()
      .then((dashboard) => {
        if (requestId === requestIdRef.current) {
          setState({ dashboard, message: null, status: "loaded" })
        }
      })
      .catch((error: unknown) => {
        if (requestId === requestIdRef.current) {
          setState({
            dashboard: null,
            message: formatApiErrorMessage(error),
            status: "error",
          })
        }
      })
  }, [])

  useEffect(() => {
    reload()
  }, [reload])

  return { reload, state }
}
