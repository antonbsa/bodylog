#!/usr/bin/env node
/**
 * Fails, naming each one, when a required Worker secret was never set with `wrangler secret put` for the given environment.
 * `wrangler secret list` returns names only, so this checks presence, not values.
 *
 * Usage: node infra/scripts/deploy/check-secrets.mjs --env <preview|production>
 */

import { resolve } from "node:path"
import { fileURLToPath } from "node:url"

import { runWranglerWithRetry } from "./lib/run-wrangler-with-retry.mjs"

const API_DIR = resolve(fileURLToPath(import.meta.url), "../../../../apps/api")

const REQUIRED_SECRETS = ["APP_PASSWORD", "SESSION_SECRET"]
const ENVIRONMENTS = ["preview", "production"]

const envIndex = process.argv.indexOf("--env")
const env = envIndex >= 0 ? process.argv[envIndex + 1] : undefined
if (!ENVIRONMENTS.includes(env)) {
  console.error(
    `Usage: node infra/scripts/deploy/check-secrets.mjs --env <${ENVIRONMENTS.join("|")}>`,
  )
  process.exit(1)
}

const result = await runWranglerWithRetry(
  ["secret", "list", "--env", env, "--format", "json"],
  { cwd: API_DIR },
)
if (result.status !== 0 || result.error) {
  console.error(result.stderr || result.stdout || result.error?.message)
  process.exit(result.status || 1)
}

const existingSecrets = new Set(
  JSON.parse(result.stdout).map((secret) => secret.name),
)
const missingSecrets = REQUIRED_SECRETS.filter(
  (name) => !existingSecrets.has(name),
)

if (missingSecrets.length > 0) {
  console.error(
    `Missing required secret(s) for --env ${env}: ${missingSecrets.join(", ")}\n` +
      `Set them from apps/api with: npx wrangler secret put <NAME> --env ${env}`,
  )
  process.exit(1)
}

console.log(`All required secrets present for --env ${env}.`)
