import {
  useCallback,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react"
import { X } from "@phosphor-icons/react"

import { ToastContext, type ToastApi } from "../hooks/useToast"

const SUCCESS_DURATION_MS = 2600

type Toast = { id: number; kind: "success" | "error"; message: string }

/** Renders one toast at a time; a new one replaces the current one. */
export function ToastProvider({ children }: { children: ReactNode }) {
  const [toast, setToast] = useState<Toast | null>(null)

  const show = useCallback((kind: Toast["kind"], message: string) => {
    setToast((current) => ({ id: (current?.id ?? 0) + 1, kind, message }))
  }, [])

  const api = useMemo<ToastApi>(
    () => ({
      showError: (message) => show("error", message),
      showSuccess: (message) => show("success", message),
    }),
    [show],
  )

  useEffect(() => {
    if (toast?.kind !== "success") {
      return
    }

    const timer = setTimeout(() => setToast(null), SUCCESS_DURATION_MS)

    return () => clearTimeout(timer)
  }, [toast])

  return (
    <ToastContext.Provider value={api}>
      {children}
      <div className="toast-region">
        {/* The status region stays mounted so screen readers pick up its updates. */}
        <div role="status">
          {toast?.kind === "success" ? (
            <p className="toast" key={toast.id}>
              {toast.message}
            </p>
          ) : null}
        </div>
        {toast?.kind === "error" ? (
          <div className="toast toast-error" key={toast.id} role="alert">
            <p>{toast.message}</p>
            <button
              aria-label="Fechar"
              className="toast-close"
              onClick={() => setToast(null)}
              type="button"
            >
              <X aria-hidden="true" size={20} weight="bold" />
            </button>
          </div>
        ) : null}
      </div>
    </ToastContext.Provider>
  )
}
