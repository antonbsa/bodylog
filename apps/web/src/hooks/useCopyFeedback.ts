import { useCallback, useEffect, useRef, useState } from "react"

const COPIED_FEEDBACK_MS = 2500
// Keep in agreement with the `.token-copied` opacity transition in settings.css.
const COPIED_FADE_MS = 300

/** Copies text to the clipboard and tracks the feedback: "copied" fades out after a few seconds, "failed" stays until the next copy or `reset`. */
export function useCopyFeedback() {
  const [copyStatus, setCopyStatus] = useState<"copied" | "failed" | null>(null)
  const [isFading, setIsFading] = useState(false)
  const timeout = useRef<number | undefined>(undefined)

  useEffect(() => () => window.clearTimeout(timeout.current), [])

  const copy = useCallback((text: string) => {
    window.clearTimeout(timeout.current)

    // Can fail (e.g. Safari drops the click's activation), so callers keep a manual way to copy.
    Promise.resolve()
      .then(() => navigator.clipboard.writeText(text))
      .then(
        () => {
          setCopyStatus("copied")
          setIsFading(false)
          timeout.current = window.setTimeout(() => {
            setIsFading(true)
            // Cleared after the fade so a later copy changes the text and is announced again.
            timeout.current = window.setTimeout(() => {
              setCopyStatus(null)
              setIsFading(false)
            }, COPIED_FADE_MS)
          }, COPIED_FEEDBACK_MS)
        },
        () => {
          setCopyStatus("failed")
          setIsFading(false)
        },
      )
  }, [])

  const reset = useCallback(() => {
    window.clearTimeout(timeout.current)
    setCopyStatus(null)
    setIsFading(false)
  }, [])

  return {
    copy,
    copyStatus,
    isFading,
    /** True from a successful copy until the fade starts, for an icon that turns into a check. */
    isJustCopied: copyStatus === "copied" && !isFading,
    reset,
  }
}
