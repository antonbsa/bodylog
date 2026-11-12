import { StrictMode } from "react"
import { createRoot } from "react-dom/client"
import { BrowserRouter } from "react-router"
import { Theme } from "@radix-ui/themes"

import { App } from "./App"
import { useResolvedTheme } from "./hooks/useResolvedTheme"
import "@radix-ui/themes/styles.css"
import "./styles/fonts.css"
import "./styles/tokens.css"
import "./styles.css"

// iOS Safari ignores user-scalable=no for pinch, so cancel its gesture events.
for (const type of ["gesturestart", "gesturechange", "gestureend"]) {
  document.addEventListener(type, (event) => event.preventDefault(), {
    passive: false,
  })
}

const rootElement = document.getElementById("root")

if (!rootElement) {
  throw new Error("Root element not found")
}

// Radix Themes stays only for behavior and the not-yet-redone components; the
// project tokens own the colors (see ADR 0026). It follows the resolved theme.
function Root() {
  const appearance = useResolvedTheme()

  return (
    <Theme
      accentColor="gray"
      appearance={appearance}
      className="app-root"
      grayColor="slate"
      hasBackground={false}
      radius="small"
    >
      <BrowserRouter>
        <App />
      </BrowserRouter>
    </Theme>
  )
}

createRoot(rootElement).render(
  <StrictMode>
    <Root />
  </StrictMode>,
)
