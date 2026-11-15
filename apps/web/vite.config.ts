import react from "@vitejs/plugin-react"
import { defineConfig } from "vite"

export default defineConfig({
  envDir: "../..",
  plugins: [react()],
  server: {
    allowedHosts: ["desktop"],
    proxy: {
      "/api": "http://localhost:8787",
    },
  },
})
