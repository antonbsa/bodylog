import { useState } from "react"

import { AuthenticatedApp } from "./screens/AuthenticatedApp"
import { LoginScreen } from "./screens/LoginScreen"

export function App() {
  const [isAuthenticated, setIsAuthenticated] = useState(false)

  return isAuthenticated ? (
    <AuthenticatedApp />
  ) : (
    <LoginScreen onLoginSuccess={() => setIsAuthenticated(true)} />
  )
}
