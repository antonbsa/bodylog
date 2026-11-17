// PreToolUse guard for Edit/Write/NotebookEdit: enforces the worktree rule from AGENTS.md "Worktrees and `.agents/`".
import { execFileSync } from "node:child_process"
import { existsSync } from "node:fs"
import { dirname, relative } from "node:path"
import { fileURLToPath } from "node:url"
import { decide, readHookInput } from "./hook-io.mjs"

const { tool_input: input = {} } = readHookInput()
const file = input.file_path ?? input.notebook_path
if (!file) process.exit(0)

function git(cwd, ...args) {
  try {
    return execFileSync("git", ["-C", cwd, ...args], {
      encoding: "utf8",
      stdio: ["ignore", "pipe", "ignore"],
    }).trim()
  } catch {
    return null
  }
}

let dir = dirname(file)
while (!existsSync(dir)) dir = dirname(dir)
// Resolved from the file, not the session, so a file inside a worktree checks that worktree's branch.
const root = git(dir, "rev-parse", "--show-toplevel")
if (!root) process.exit(0)

// Other repositories (notes, sibling projects) are not governed by this rule; every bodylog worktree shares one common git dir.
const projectDir = fileURLToPath(new URL("../..", import.meta.url))
const commonDir = (cwd) =>
  git(cwd, "rev-parse", "--path-format=absolute", "--git-common-dir")
if (commonDir(root) !== commonDir(projectDir)) process.exit(0)

const onMain = git(root, "branch", "--show-current") === "main"
const ignored = git(root, "check-ignore", "-q", file) !== null
if (onMain && !ignored) {
  decide(
    "deny",
    `${relative(root, file)} is in a checkout on \`main\`. Create a worktree first (\`git worktree add -b <branch-name> .agents/worktrees/<branch-name> origin/main\`), then edit the file there.`,
  )
}
