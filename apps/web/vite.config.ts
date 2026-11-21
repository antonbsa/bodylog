import { fileURLToPath } from "node:url"

import react from "@vitejs/plugin-react"
import { defineConfig } from "vite"

const envDir = fileURLToPath(new URL("../..", import.meta.url))

export default defineConfig({
  envDir,
  plugins: [react()],
  server: {
    // The API's --local-upstream and the local OAuth App callback assume port 5173
    strictPort: true,
    allowedHosts: ["desktop"],
    proxy: {
      "/api": "http://localhost:8787",
    },
  },
})
