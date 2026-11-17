import { spawnSync } from "node:child_process"

const MAX_ATTEMPTS = 4
const BASE_DELAY_MS = 1000

// Kept narrow on purpose: bad arguments, auth failures and real errors must fail on the first attempt.
const TRANSIENT_PATTERNS = [
  /\b5\d{2}\b/,
  /malformed response/i,
  /upstream connect error/i,
  /disconnect\/reset before headers/i,
  /ECONNRESET|ETIMEDOUT|ECONNREFUSED|EAI_AGAIN/,
  /network error/i,
]

const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms))

/**
 * Runs `npx wrangler <args>`, retrying with exponential backoff only when the failure looks like a transient Cloudflare API blip (network reset, 5xx).
 * @returns the result of the last attempt.
 */
export async function runWranglerWithRetry(
  args,
  { cwd, maxAttempts = MAX_ATTEMPTS, baseDelayMs = BASE_DELAY_MS },
) {
  let result
  for (let attempt = 1; attempt <= maxAttempts; attempt++) {
    result = spawnSync("npx", ["wrangler", ...args], { cwd, encoding: "utf-8" })
    if (result.status === 0 && !result.error) return result

    const output = [result.stdout, result.stderr, result.error?.message]
      .filter(Boolean)
      .join("\n")
    const isTransient = TRANSIENT_PATTERNS.some((pattern) =>
      pattern.test(output),
    )
    if (!isTransient || attempt === maxAttempts) return result

    const delayMs = baseDelayMs * 2 ** (attempt - 1)
    console.warn(
      `wrangler ${args.join(" ")} failed with a transient error (attempt ${attempt}/${maxAttempts}), retrying in ${delayMs}ms...`,
    )
    await sleep(delayMs)
  }
  return result
}
