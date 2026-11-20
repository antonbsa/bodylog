import { readdirSync, readFileSync } from "node:fs"
import { DatabaseSync } from "node:sqlite"

const migrationsDir = new URL("../../infra/migrations/", import.meta.url)

type SqlValue = string | number | null

/** A D1 stand-in backed by real SQLite and the real migrations, so SQL is parsed and executed instead of matched by text. */
export function createSqliteD1(): { d1: D1Database; sqlite: DatabaseSync } {
  const sqlite = new DatabaseSync(":memory:")

  for (const name of readdirSync(migrationsDir).sort()) {
    sqlite.exec(readFileSync(new URL(name, migrationsDir), "utf8"))
  }

  class Statement {
    private bindings: SqlValue[] = []
    private readonly sql: string

    constructor(sql: string) {
      this.sql = sql
    }

    bind(...values: SqlValue[]) {
      this.bindings = values

      return this
    }

    async run() {
      const result = sqlite.prepare(this.sql).run(...this.bindings)

      return { meta: { changes: Number(result.changes) }, success: true }
    }

    async first() {
      return sqlite.prepare(this.sql).get(...this.bindings) ?? null
    }

    async all() {
      return {
        results: sqlite.prepare(this.sql).all(...this.bindings),
        success: true,
      }
    }
  }

  const d1 = {
    prepare: (sql: string) => new Statement(sql),
    async batch(statements: Statement[]) {
      sqlite.exec("BEGIN")

      try {
        const results = []

        for (const statement of statements) {
          results.push(await statement.run())
        }

        sqlite.exec("COMMIT")

        return results
      } catch (error) {
        sqlite.exec("ROLLBACK")
        throw error
      }
    },
  } as unknown as D1Database

  return { d1, sqlite }
}
