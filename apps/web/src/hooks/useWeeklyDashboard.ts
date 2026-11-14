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

  const state: WeeklyDashboardState = query.isFetching
    ? { dashboard: query.data ?? null, message: null, status: "loading" }
    : query.isError
      ? {
          dashboard: null,
          message: formatApiErrorMessage(query.error),
          status: "error",
        }
      : { dashboard: query.data ?? null, message: null, status: "loaded" }

  return {
    reload: () => {
      query.refetch()
    },
    state,
  }
}
