import { parseOptionalToday } from "./dates"
import { buildDefaultSeedMeasurements } from "./seed-data"
import { buildSeedSql } from "./seed-sql"
import {
  applyLocalMigrations,
  clearMeasurements,
  executeSql,
  getMeasurementCount,
} from "./wrangler"

type Command = "setup" | "seed" | "reset"

function main(): void {
  const [command, ...args] = process.argv.slice(2)

  if (!isCommand(command)) {
    printUsage()
    process.exit(1)
  }

  const today = parseOptionalToday(args)

  if (command === "setup") {
    applyLocalMigrations()

    const count = getMeasurementCount()
    if (count > 0) {
      console.log(
        `Local D1 already has ${count} measurement(s). Skipping seed.`,
      )
      return
    }

    seed(today)
    return
  }

  if (command === "reset") {
    applyLocalMigrations()
    clearMeasurements()
    seed(today)
    return
  }

  seed(today)
}

function seed(today: Date): void {
  const measurements = buildDefaultSeedMeasurements(today)
  executeSql(buildSeedSql(measurements))
  console.log(`Seeded ${measurements.length} local mocked measurement(s).`)
}

function isCommand(value: string | undefined): value is Command {
  return value === "setup" || value === "seed" || value === "reset"
}

function printUsage(): void {
  console.log(`Usage:
  npm run db:setup:local
  npm run db:seed:local -- --today YYYY-MM-DD
  npm run db:reset:local -- --today YYYY-MM-DD

Options:
  --today YYYY-MM-DD  Override today's date for deterministic local data.`)
}

main()
