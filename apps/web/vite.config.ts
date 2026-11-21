import { fileURLToPath } from "node:url"

import react from "@vitejs/plugin-react"
import { defineConfig } from "vite"

const envDir = fileURLToPath(new URL("../..", import.meta.url))

export default defineConfig({
  envDir,
  plugins: [react()],
  server: {
    allowedHosts: ["desktop"],
    proxy: {
      "/api": "http://localhost:8787",
    },
  },
})
