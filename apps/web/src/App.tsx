import { useCallback, useEffect, useState } from "react"
import { Outlet, Route, Routes } from "react-router"
import { useQueryClient } from "@tanstack/react-query"

import { getSessionUser, logout, updateProfile } from "./api/auth"
import { queryKeys } from "./api/queryKeys"
import { HistoryScreen } from "./screens/HistoryScreen"
import { HomeScreen } from "./screens/HomeScreen"
import { LoginScreen } from "./screens/LoginScreen"
import { NotFoundScreen } from "./screens/NotFoundScreen"
import { RegistrationScreen } from "./screens/RegistrationScreen"
import { SettingsScreen } from "./screens/SettingsScreen"
import { TabLayout } from "./screens/TabLayout"
import { TrendsScreen } from "./screens/TrendsScreen"
import { getTimeZoneToSync } from "./utils/time-zone-sync"
import type { SessionUser } from "../../../types/auth"

type AuthState = "checking" | "authenticated" | "unauthenticated"

/** Stores the device's zone when it moved, so the API's "today" follows the user; a failed sync keeps the old zone. */
async function syncDeviceTimeZone(user: SessionUser): Promise<SessionUser> {
  const timeZone = getTimeZoneToSync(
    user.timeZone,
    Intl.DateTimeFormat().resolvedOptions().timeZone,
  )

  if (timeZone === null) {
    return user
  }

  return updateProfile({ timeZone }).catch(() => user)
}

export function App() {
  const queryClient = useQueryClient()
  const [authState, setAuthState] = useState<AuthState>("checking")

  // The sync finishes before any screen loads, so the first dashboard already uses the new zone.
  const hydrateSession = useCallback(
    async (isCurrent: () => boolean = () => true) => {
      const user = await getSessionUser()
      const syncedUser = user ? await syncDeviceTimeZone(user) : null

      if (!isCurrent()) {
        return
      }

      if (syncedUser) {
        queryClient.setQueryData(queryKeys.sessionUser, syncedUser)
      }

      setAuthState(syncedUser ? "authenticated" : "unauthenticated")
    },
    [queryClient],
  )

  useEffect(() => {
    let isMounted = true

    hydrateSession(() => isMounted)

    return () => {
      isMounted = false
    }
  }, [hydrateSession])

  async function handleLogout() {
    await logout()
    queryClient.clear()
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
            <LoginScreen onLoginSuccess={() => hydrateSession()} />
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
