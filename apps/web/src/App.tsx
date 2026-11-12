import { useEffect, useState } from "react"
import { Outlet, Route, Routes } from "react-router"

import { checkSession, logout } from "./api/auth"
import { HistoryScreen } from "./screens/HistoryScreen"
import { HomeScreen } from "./screens/HomeScreen"
import { LoginScreen } from "./screens/LoginScreen"
import { NotFoundScreen } from "./screens/NotFoundScreen"
import { RegistrationScreen } from "./screens/RegistrationScreen"
import { SettingsScreen } from "./screens/SettingsScreen"
import { TabLayout } from "./screens/TabLayout"
import { TrendsScreen } from "./screens/TrendsScreen"

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

  return (
    <Routes>
      <Route
        element={
          authState === "authenticated" ? (
            <Outlet />
          ) : (
            <LoginScreen onLoginSuccess={() => setAuthState("authenticated")} />
          )
        }
      >
        <Route element={<TabLayout />}>
          <Route index element={<HomeScreen />} />
          <Route path="historico" element={<HistoryScreen />} />
          <Route path="tendencias" element={<TrendsScreen />} />
          <Route
            path="ajustes"
            element={<SettingsScreen onLogout={handleLogout} />}
          />
        </Route>
        <Route path="registro" element={<RegistrationScreen />} />
      </Route>
      <Route path="*" element={<NotFoundScreen />} />
    </Routes>
  )
}
