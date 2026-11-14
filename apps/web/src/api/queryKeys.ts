import type { QueryClient } from "@tanstack/react-query"

// Every measurement query shares the "measurements" prefix so one invalidation covers lists and by-date lookups.
export const queryKeys = {
  dashboard: ["dashboard"] as const,
  measurementByDate: (date: string) =>
    ["measurements", "by-date", date] as const,
  measurementList: (limit: number) => ["measurements", "list", limit] as const,
  measurements: ["measurements"] as const,
  previousMeasurement: (date: string) =>
    ["measurements", "previous", date] as const,
}

/** Refreshes everything derived from stored measurements after a write. */
export function invalidateMeasurementData(queryClient: QueryClient) {
  return Promise.all([
    queryClient.invalidateQueries({ queryKey: queryKeys.measurements }),
    queryClient.invalidateQueries({ queryKey: queryKeys.dashboard }),
  ])
}
