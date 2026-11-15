import { useInfiniteQuery, type InfiniteData } from "@tanstack/react-query"

import { formatApiErrorMessage } from "../../../../infra/errors"
import { getHistoryWeeks } from "../api/history"
import { queryKeys } from "../api/queryKeys"
import type { HistoryWeek, HistoryWeeksPage } from "../../../../types/history"

export type HistoryWeeksState = {
  hasMore: boolean
  isLoadingMore: boolean
  loadMoreError: string | null
  message: string | null
  status: "error" | "loaded" | "loading"
  weeks: HistoryWeek[]
}

export function useHistoryWeeks(): {
  loadMore: () => void
  reload: () => void
  state: HistoryWeeksState
} {
  const query = useInfiniteQuery<
    HistoryWeeksPage,
    Error,
    InfiniteData<HistoryWeeksPage, string | undefined>,
    typeof queryKeys.historyWeeks,
    string | undefined
  >({
    getNextPageParam: (lastPage) => lastPage.nextBefore ?? undefined,
    initialPageParam: undefined as string | undefined,
    queryFn: ({ pageParam }) => getHistoryWeeks(pageParam),
    queryKey: queryKeys.historyWeeks,
  })

  const weeks = query.data?.pages.flatMap((page) => page.weeks) ?? []
  const status = query.data ? "loaded" : query.isError ? "error" : "loading"

  return {
    loadMore: () => {
      query.fetchNextPage()
    },
    reload: () => {
      query.refetch()
    },
    state: {
      hasMore: query.hasNextPage,
      isLoadingMore: query.isFetchingNextPage,
      loadMoreError: query.isFetchNextPageError
        ? formatApiErrorMessage(query.error)
        : null,
      message:
        status === "error" && query.error
          ? formatApiErrorMessage(query.error)
          : null,
      status,
      weeks,
    },
  }
}
