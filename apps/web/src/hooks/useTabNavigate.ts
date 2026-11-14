import { useNavigate } from "react-router"

/** Location state that `/registro` receives so Cancelar can return to where the user came from. */
export type OriginState = { from: string }

/** Reads the origin path from location state; anything but an in-app absolute path falls back to Início. */
export function readOrigin(state: unknown): string {
  const from = (state as Partial<OriginState> | null)?.from

  return typeof from === "string" && from.startsWith("/") ? from : "/"
}

/**
 * Single decision point for how the tab layout navigates. The iOS edge-swipe gesture follows browser history,
 * and native tab apps never stack tab switches, so tab layout navigation replaces the entry instead of pushing.
 * A future desktop layout without the bottom bar should push again by changing `replace` here.
 */
export function useTabNavigate() {
  const navigate = useNavigate()
  const replace = true

  return {
    navigate: (to: string, state?: OriginState) =>
      navigate(to, { replace, state }),
    replace,
  }
}
