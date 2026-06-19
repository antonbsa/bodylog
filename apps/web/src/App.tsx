import { useEffect, useState } from "react"

import { checkSession, logout } from "./api/auth"
import { AuthenticatedApp } from "./screens/AuthenticatedApp"
import { LoginScreen } from "./screens/LoginScreen"
import { NotFoundScreen } from "./screens/NotFoundScreen"

type AuthState = "checking" | "authenticated" | "unauthenticated"

function usePathname() {
  const [pathname, setPathname] = useState(() => window.location.pathname)

  useEffect(() => {
    function handlePopState() {
      setPathname(window.location.pathname)
    }

    window.addEventListener("popstate", handlePopState)

    return () => {
      window.removeEventListener("popstate", handlePopState)
    }
  }, [])

  return pathname
}

export function App() {
  const pathname = usePathname()
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

  if (pathname !== "/") {
    return <NotFoundScreen />
  }

  return authState === "authenticated" ? (
    <AuthenticatedApp onLogout={handleLogout} />
  ) : (
    <LoginScreen onLoginSuccess={() => setAuthState("authenticated")} />
  )
}
