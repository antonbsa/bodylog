import { createContext, useContext } from "react"

export type ToastApi = {
  /** Auto-dismisses after a short delay. */
  showSuccess: (message: string) => void
  /** Stays until the user closes it. */
  showError: (message: string) => void
}

export const ToastContext = createContext<ToastApi | null>(null)

export function useToast(): ToastApi {
  const toast = useContext(ToastContext)

  if (!toast) {
    throw new Error("useToast must be used inside ToastProvider")
  }

  return toast
}
