import { spawnSync } from "node:child_process"
import {
  chmodSync,
  existsSync,
  mkdtempSync,
  readFileSync,
  rmSync,
  writeFileSync,
} from "node:fs"
import { tmpdir } from "node:os"
import { delimiter, join } from "node:path"
import { describe, expect, it } from "vitest"

const script = new URL(
  "../../infra/scripts/deploy/check-secrets.mjs",
  import.meta.url,
).pathname

type FakeAttempt = { stdout?: string; stderr?: string; status: number }

/** Runs check-secrets with a fake `npx` first on PATH that replays `attempts` in order and logs each call's argv. */
function runCheckSecrets(args: string[], attempts: FakeAttempt[]) {
  const dir = mkdtempSync(join(tmpdir(), "check-secrets-"))
  writeFileSync(join(dir, "attempts.json"), JSON.stringify(attempts))
  writeFileSync(
    join(dir, "npx"),
    `#!/usr/bin/env node
const fs = require("node:fs")
const log = ${JSON.stringify(join(dir, "calls.log"))}
fs.appendFileSync(log, process.argv.slice(2).join(" ") + "\\n")
const calls = fs.readFileSync(log, "utf-8").trim().split("\\n").length
const attempts = JSON.parse(fs.readFileSync(${JSON.stringify(join(dir, "attempts.json"))}, "utf-8"))
const attempt = attempts[Math.min(calls, attempts.length) - 1]
process.stdout.write(attempt.stdout ?? "")
process.stderr.write(attempt.stderr ?? "")
process.exit(attempt.status)
`,
  )
  chmodSync(join(dir, "npx"), 0o755)

  const result = spawnSync(process.execPath, [script, ...args], {
    encoding: "utf-8",
    env: { ...process.env, PATH: `${dir}${delimiter}${process.env.PATH}` },
  })
  const log = join(dir, "calls.log")
  const calls = existsSync(log)
    ? readFileSync(log, "utf-8").trim().split("\n")
    : []
  rmSync(dir, { recursive: true, force: true })
  return { ...result, calls }
}

const secrets = (...names: string[]) =>
  JSON.stringify(names.map((name) => ({ name, type: "secret_text" })))

describe("check-secrets", () => {
  it("passes when every required secret exists in the environment", () => {
    const result = runCheckSecrets(
      ["--env", "preview"],
      [{ status: 0, stdout: secrets("APP_PASSWORD", "SESSION_SECRET") }],
    )

    expect(result.status).toBe(0)
    expect(result.calls).toEqual([
      "wrangler secret list --env preview --format json",
    ])
  })

  it("fails naming the missing secret", () => {
    const result = runCheckSecrets(
      ["--env", "production"],
      [{ status: 0, stdout: secrets("APP_PASSWORD") }],
    )

    expect(result.status).toBe(1)
    expect(result.stderr).toContain(
      "Missing required secret(s) for --env production: SESSION_SECRET",
    )
  })

  it("rejects an unknown environment without calling wrangler", () => {
    const result = runCheckSecrets(["--env", "staging"], [{ status: 0 }])

    expect(result.status).toBe(1)
    expect(result.calls).toEqual([])
  })

  it("retries a transient Cloudflare failure", () => {
    const result = runCheckSecrets(
      ["--env", "preview"],
      [
        { status: 1, stderr: "upstream connect error or disconnect/reset" },
        { status: 0, stdout: secrets("APP_PASSWORD", "SESSION_SECRET") },
      ],
    )

    expect(result.status).toBe(0)
    expect(result.calls).toHaveLength(2)
  })

  it("fails at once on a non-transient wrangler error", () => {
    const result = runCheckSecrets(
      ["--env", "preview"],
      [{ status: 1, stderr: "Authentication error [code: 10000]" }],
    )

    expect(result.status).toBe(1)
    expect(result.stderr).toContain("Authentication error")
    expect(result.calls).toHaveLength(1)
  })
})
