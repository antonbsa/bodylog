import type { QueryClient } from "@tanstack/react-query"

// Every measurement query shares the "measurements" prefix so one invalidation covers lists and by-date lookups.
export const queryKeys = {
  dashboard: ["dashboard"] as const,
  historyWeeks: ["measurements", "history-weeks"] as const,
  measurementByDate: (date: string) =>
    ["measurements", "by-date", date] as const,
  measurements: ["measurements"] as const,
  // Keyed by the first day of the month, so the key never depends on time zones.
  measurementsOfMonth: (monthStart: string) =>
    ["measurements", "month", monthStart] as const,
  trends: ["measurements", "trends"] as const,
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
