import path from "node:path"
import { fileURLToPath } from "node:url"
import js from "@eslint/js"
import { FlatCompat } from "@eslint/eslintrc"

import prettierConfig from "./prettier.config.mjs"

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)
const compat = new FlatCompat({
  baseDirectory: __dirname,
  recommendedConfig: js.configs.recommended,
  allConfig: js.configs.all,
})

export default [
  {
    ignores: [
      ".agents/**",
      "**/dist/**",
      "coverage/**",
      "node_modules/**",
      "**/playwright-report/**",
      "**/test-results/**",
      ".wrangler/**",
      "apps/api/.wrangler/**",
    ],
  },
  ...compat.extends("@rocketseat/eslint-config/react"),
  {
    rules: {
      "prettier/prettier": ["error", prettierConfig],
    },
  },
  {
    // Vite's dev optimizer pre-bundles a whole barrel (MBs over the LAN); the build tree-shakes it.
    files: ["apps/web/src/**"],
    rules: {
      "no-restricted-imports": [
        "error",
        {
          paths: [
            {
              name: "@phosphor-icons/react",
              message:
                'Import each icon from "@phosphor-icons/react/dist/csr/<Icon>".',
            },
            {
              name: "react-day-picker/locale",
              message:
                'Import the locale from "react-day-picker/locale/pt-BR".',
            },
          ],
        },
      ],
    },
  },
  {
    files: ["tests/e2e/**/*.spec.ts"],
    rules: {
      "no-restricted-imports": [
        "error",
        {
          paths: [
            {
              name: "@playwright/test",
              message:
                "Import from ./fixtures, which answers unmocked /api calls.",
            },
          ],
        },
      ],
    },
  },
]
