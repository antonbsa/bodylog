import { useQuery } from "@tanstack/react-query"

import { formatApiErrorMessage } from "../../../../infra/errors"
import { getWeeklyDashboard } from "../api/dashboard"
import { queryKeys } from "../api/queryKeys"
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
  const query = useQuery({
    queryFn: getWeeklyDashboard,
    queryKey: queryKeys.dashboard,
  })

  const status = query.data ? "loaded" : query.isError ? "error" : "loading"
  const state: WeeklyDashboardState = {
    dashboard: query.data ?? null,
    message:
      status === "error" && query.error
        ? formatApiErrorMessage(query.error)
        : null,
    status,
  }

  return {
    reload: () => {
      query.refetch()
    },
    state,
  }
}
