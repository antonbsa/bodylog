import { StrictMode } from "react"
import { createRoot } from "react-dom/client"
import { Theme } from "@radix-ui/themes"

import { App } from "./App"
import "@radix-ui/themes/styles.css"
import "./styles.css"

const rootElement = document.getElementById("root")

if (!rootElement) {
  throw new Error("Root element not found")
}

createRoot(rootElement).render(
  <StrictMode>
    <Theme
      accentColor="gray"
      appearance="dark"
      grayColor="slate"
      hasBackground={false}
      radius="small"
    >
      <App />
    </Theme>
  </StrictMode>,
)
