import { spawnSync } from "node:child_process"
import { mkdtempSync, rmSync, writeFileSync } from "node:fs"
import { tmpdir } from "node:os"
import { join } from "node:path"

import { databaseName } from "./types"

const localPersistTo = process.env.BODYLOG_D1_PERSIST_TO ?? null
const wranglerConfigPath = "apps/api/wrangler.toml"

export function applyLocalMigrations(): void {
  console.log("Applying local D1 migrations...")
  runWrangler([
    "d1",
    "migrations",
    "apply",
    databaseName,
    "--local",
    ...persistToArgs(),
  ])
}

export function getMeasurementCount(): number {
  const output = runWrangler(
    [
      "d1",
      "execute",
      databaseName,
      "--local",
      ...persistToArgs(),
      "--json",
      "--command",
      "SELECT COUNT(*) AS count FROM measurements",
    ],
    { captureOutput: true },
  )

  const count = findNumberProperty(parseJsonOutput(output), "count")

  if (count === null) {
    throw new Error("Unable to read measurement count from Wrangler output.")
  }

  return count
}

export function clearMeasurements(): void {
  executeSql("DELETE FROM measurements;")
  console.log("Cleared local measurements.")
}

export function executeSql(sql: string): void {
  const tempDirectory = mkdtempSync(join(tmpdir(), "bodylog-local-db-"))
  const sqlFile = join(tempDirectory, "commands.sql")

  try {
    writeFileSync(sqlFile, sql)
    runWrangler(
      [
        "d1",
        "execute",
        databaseName,
        "--local",
        ...persistToArgs(),
        "--file",
        sqlFile,
      ],
      { captureOutput: true },
    )
  } finally {
    rmSync(tempDirectory, {
      force: true,
      recursive: true,
    })
  }
}

function persistToArgs(): string[] {
  return localPersistTo === null ? [] : ["--persist-to", localPersistTo]
}

function runWrangler(
  args: string[],
  options: { captureOutput?: boolean } = {},
): string {
  const executable = process.platform === "win32" ? "npx.cmd" : "npx"
  const result = spawnSync(
    executable,
    ["wrangler", "--config", wranglerConfigPath, ...args],
    {
      encoding: "utf8",
      stdio: options.captureOutput === true ? "pipe" : "inherit",
    },
  )

  if (result.status !== 0) {
    throw new Error(
      [
        `Wrangler command failed: npx wrangler --config ${wranglerConfigPath} ${args.join(" ")}`,
        result.stdout,
        result.stderr,
      ]
        .filter(Boolean)
        .join("\n"),
    )
  }

  return result.stdout ?? ""
}

function parseJsonOutput(output: string): unknown {
  const jsonStart = output.search(/[[{]/)

  if (jsonStart === -1) {
    throw new Error("Wrangler did not return JSON output.")
  }

  return JSON.parse(output.slice(jsonStart))
}

function findNumberProperty(value: unknown, property: string): number | null {
  if (Array.isArray(value)) {
    for (const item of value) {
      const found = findNumberProperty(item, property)
      if (found !== null) {
        return found
      }
    }
  }

  if (isRecord(value)) {
    if (typeof value[property] === "number") {
      return value[property]
    }

    for (const item of Object.values(value)) {
      const found = findNumberProperty(item, property)
      if (found !== null) {
        return found
      }
    }
  }

  return null
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null
}
