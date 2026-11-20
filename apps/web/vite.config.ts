import { fileURLToPath } from "node:url"

import react from "@vitejs/plugin-react"
import { defineConfig, loadEnv } from "vite"

const envDir = fileURLToPath(new URL("../..", import.meta.url))

export default defineConfig(({ command, mode }) => ({
  // Feeds the dev-only "Entrar sem senha" button the same APP_PASSWORD `wrangler dev` reads; builds never embed it.
  define: {
    __DEV_APP_PASSWORD__: JSON.stringify(
      command === "serve" ? (loadEnv(mode, envDir, "").APP_PASSWORD ?? "") : "",
    ),
  },
  envDir,
  plugins: [react()],
  server: {
    allowedHosts: ["desktop"],
    proxy: {
      "/api": "http://localhost:8787",
    },
  },
}))
