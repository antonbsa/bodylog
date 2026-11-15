import { useQuery } from "@tanstack/react-query"

import { listMeasurements } from "../api/measurements"
import { queryKeys } from "../api/queryKeys"
import { getMonthRange, parseIsoDate } from "../utils/date-format"

// The list endpoint caps `limit` at 100, which covers any month.
const MONTH_LIMIT = 100

/** Query for the set of ISO dates with a record in the month starting at `monthStart` ("YYYY-MM-01"). */
export function recordedDaysQuery(monthStart: string) {
  return {
    queryFn: async () => {
      const { from, to } = getMonthRange(parseIsoDate(monthStart))
      const items = await listMeasurements({ from, limit: MONTH_LIMIT, to })

      return new Set(items.map((item) => item.date))
    },
    queryKey: queryKeys.measurementsOfMonth(monthStart),
  }
}

/** Days with a record in the given month; empty while loading or when the lookup fails. */
export function useRecordedDays(monthStart: string): ReadonlySet<string> {
  const { data } = useQuery(recordedDaysQuery(monthStart))

  return data ?? EMPTY_SET
}

const EMPTY_SET: ReadonlySet<string> = new Set()
