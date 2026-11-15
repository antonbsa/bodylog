import { useEffect, type RefObject } from "react"

import { isKeyboardOpen } from "../utils/keyboard-offset"

/**
 * Flags a fixed-bottom footer with `data-keyboard-open` while the iOS keyboard is open
 * (the layout viewport does not shrink there, so the footer is hidden by CSS), and
 * publishes its height as `--reg-foot-h` on the root so the page can pad and
 * scroll-pad around it.
 */
export function useKeyboardOpenFlag(ref: RefObject<HTMLElement | null>) {
  useEffect(() => {
    const footer = ref.current
    const viewport = window.visualViewport

    if (!footer) {
      return
    }

    const root = document.documentElement

    function publishHeight() {
      if (footer) {
        root.style.setProperty("--reg-foot-h", `${footer.offsetHeight}px`)
      }
    }

    function flagKeyboard() {
      if (viewport && footer) {
        footer.toggleAttribute(
          "data-keyboard-open",
          isKeyboardOpen({
            innerHeight: window.innerHeight,
            viewportHeight: viewport.height,
          }),
        )
      }
    }

    const observer = new ResizeObserver(publishHeight)

    observer.observe(footer)
    publishHeight()
    flagKeyboard()
    viewport?.addEventListener("resize", flagKeyboard)

    return () => {
      observer.disconnect()
      viewport?.removeEventListener("resize", flagKeyboard)
      root.style.removeProperty("--reg-foot-h")
    }
  }, [ref])
}
