import { useState } from "react"

import { logout } from "./api/auth"
import { AuthenticatedApp } from "./screens/AuthenticatedApp"
import { LoginScreen } from "./screens/LoginScreen"

export function App() {
  const [isAuthenticated, setIsAuthenticated] = useState(false)

  async function handleLogout() {
    await logout()
    setIsAuthenticated(false)
  }

  return isAuthenticated ? (
    <AuthenticatedApp onLogout={handleLogout} />
  ) : (
    <LoginScreen onLoginSuccess={() => setIsAuthenticated(true)} />
  )
}
