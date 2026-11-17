const scripts = "*.{js,jsx,mjs,cjs,ts,tsx}"

// Globs run concurrently, so file-editing tasks must never match the same file twice.
export default {
  [scripts]: ["eslint --fix", "prettier --write"],
  [`!(${scripts})`]: "prettier --write --ignore-unknown",
  "apps/api/**/*.{ts,tsx}": () => "npm run typecheck:api",
  "apps/web/**/*.{ts,tsx}": () => "npm run typecheck:web",
  "{types/**/*.ts,domain/**/*.ts,infra/errors.ts}": () =>
    "npm run typecheck:shared",
}
