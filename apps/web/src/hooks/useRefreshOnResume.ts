import { useEffect, useRef } from "react"

/**
 * Calls `refresh` when the window regains focus or the page is shown after being
 * in the background, with a cooldown so quick focus/blur cycles do not refetch twice.
 */
export function useRefreshOnResume(refresh: () => void) {
  const refreshRef = useRef(refresh)
  const lastResumeRefreshAtRef = useRef(0)

  useEffect(() => {
    refreshRef.current = refresh
  })

  useEffect(() => {
    function refreshAfterResume() {
      const now = Date.now()

      if (now - lastResumeRefreshAtRef.current < 500) {
        return
      }

      lastResumeRefreshAtRef.current = now
      refreshRef.current()
    }

    function handleVisibilityChange() {
      if (document.visibilityState === "visible") {
        refreshAfterResume()
      }
    }

    window.addEventListener("focus", refreshAfterResume)
    window.addEventListener("pageshow", refreshAfterResume)
    document.addEventListener("visibilitychange", handleVisibilityChange)

    return () => {
      window.removeEventListener("focus", refreshAfterResume)
      window.removeEventListener("pageshow", refreshAfterResume)
      document.removeEventListener("visibilitychange", handleVisibilityChange)
    }
  }, [])
}
