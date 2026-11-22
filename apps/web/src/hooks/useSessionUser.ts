import { useQuery } from "@tanstack/react-query"

import { getSessionUser } from "../api/auth"
import { queryKeys } from "../api/queryKeys"

export function useSessionUser() {
  return useQuery({
    queryFn: getSessionUser,
    queryKey: queryKeys.sessionUser,
    staleTime: Infinity,
  })
}
