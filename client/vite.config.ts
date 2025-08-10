import path from "path"
import { defineConfig } from "vitest/config"
import react from "@vitejs/plugin-react"
import tailwindcss from "@tailwindcss/vite"

// https://vite.dev/config/
export default defineConfig({
  plugins: [react(), tailwindcss()],
  base: "/",
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
      "tslib": "tslib/tslib.es6.js"
    },
  },
  test: {
    environment: "jsdom",
    deps: {
      inline: ["tslib", "emblor"]
    }
  }
})
