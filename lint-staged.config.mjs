import path from "node:path"

const scripts = "*.{js,jsx,mjs,cjs,ts,tsx}"

/** Typecheck projects a staged file can break; `tests` also compiles the app sources. */
function projectsFor(file) {
  if (/^(types|domain)\//.test(file) || file === "infra/errors.ts") {
    return ["shared", "api", "web", "tests"]
  }
  if (file.startsWith("apps/api/")) return ["api", "tests"]
  if (file.startsWith("apps/web/")) return ["web", "tests"]
  if (/^tests\/e2e(-api)?\//.test(file) || /^playwright\./.test(file)) {
    return ["e2e"]
  }
  if (file.startsWith("tests/")) return ["tests"]
  if (file.startsWith("infra/scripts/")) return ["scripts"]
  return []
}

// Globs run concurrently, so file-editing tasks must never match the same file twice.
export default {
  [scripts]: ["eslint --fix", "prettier --write"],
  [`!(${scripts})`]: "prettier --write --ignore-unknown",
  // One function for all projects so each typecheck script runs once per commit.
  "*.{ts,tsx}": (files) => {
    const projects = new Set(
      files.flatMap((f) => projectsFor(path.relative(process.cwd(), f))),
    )
    return [...projects].map((p) => `npm run typecheck:${p}`)
  },
}
