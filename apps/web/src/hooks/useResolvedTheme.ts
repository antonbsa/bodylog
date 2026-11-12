import { useSyncExternalStore } from "react"

import { getResolvedTheme, subscribeToTheme } from "../theme"

export function useResolvedTheme() {
  return useSyncExternalStore(subscribeToTheme, getResolvedTheme)
}
