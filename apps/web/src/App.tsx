import { useEffect, useState } from "react"

import { checkSession, logout } from "./api/auth"
import { AuthenticatedApp } from "./screens/AuthenticatedApp"
import { LoginScreen } from "./screens/LoginScreen"

type AuthState = "checking" | "authenticated" | "unauthenticated"

export function App() {
  const [authState, setAuthState] = useState<AuthState>("checking")

  useEffect(() => {
    let isMounted = true

    async function hydrateSession() {
      const hasSession = await checkSession()

      if (isMounted) {
        setAuthState(hasSession ? "authenticated" : "unauthenticated")
      }
    }

    hydrateSession()

    return () => {
      isMounted = false
    }
  }, [])

  async function handleLogout() {
    await logout()
    setAuthState("unauthenticated")
  }

  if (authState === "checking") {
    return (
      <main className="app-shell auth-check">
        <p>Carregando...</p>
      </main>
    )
  }

  return authState === "authenticated" ? (
    <AuthenticatedApp onLogout={handleLogout} />
  ) : (
    <LoginScreen onLoginSuccess={() => setAuthState("authenticated")} />
  )
}
