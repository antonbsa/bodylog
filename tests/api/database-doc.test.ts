import { readdirSync, readFileSync } from "node:fs"
import { DatabaseSync } from "node:sqlite"
import { describe, expect, it } from "vitest"

const migrationsDir = new URL("../../infra/migrations/", import.meta.url)
const docUrl = new URL("../../docs/reference/database.md", import.meta.url)

interface Column {
  name: string
  type: string
  pk: boolean
  fk: boolean
  nullable: boolean
}

function migratedDatabase(): DatabaseSync {
  const db = new DatabaseSync(":memory:")

  for (const file of readdirSync(migrationsDir).sort()) {
    if (file.endsWith(".sql")) {
      db.exec(readFileSync(new URL(file, migrationsDir), "utf8"))
    }
  }

  return db
}

function byName(a: Column, b: Column): number {
  return a.name.localeCompare(b.name)
}

function schemaTables(db: DatabaseSync): Record<string, Column[]> {
  const tables = db
    .prepare(
      `SELECT name FROM sqlite_master
       WHERE type = 'table' AND name NOT LIKE 'sqlite_%' AND name <> 'd1_migrations'`,
    )
    .all() as { name: string }[]

  return Object.fromEntries(
    tables.map(({ name }) => {
      const fkColumns = new Set(
        (
          db.prepare(`PRAGMA foreign_key_list(${name})`).all() as {
            from: string
          }[]
        ).map((fk) => fk.from),
      )
      const columns = (
        db.prepare(`PRAGMA table_info(${name})`).all() as {
          name: string
          type: string
          notnull: number
          pk: number
        }[]
      ).map((column) => ({
        name: column.name,
        type: column.type.toLowerCase(),
        pk: column.pk > 0,
        fk: fkColumns.has(column.name),
        // A TEXT primary key can report notnull = 0, but it is never null in practice
        nullable: column.notnull === 0 && column.pk === 0,
      }))

      return [name, columns.sort(byName)]
    }),
  )
}

/** Reads `<type> <column> [PK|FK|UK, ...] ["comment"]` lines of each entity in the erDiagram. */
function docTables(): Record<string, Column[]> {
  const markdown = readFileSync(docUrl, "utf8")
  const diagram = /```mermaid\s+erDiagram\n([\s\S]*?)```/.exec(markdown)?.[1]

  if (!diagram) {
    throw new Error("Missing mermaid erDiagram in database.md")
  }

  const tables: Record<string, Column[]> = {}

  for (const [, name, body] of diagram.matchAll(
    /^\s*(\w+) \{\n([\s\S]*?)^\s*\}/gm,
  )) {
    tables[name] = body
      .split("\n")
      .filter((line) => line.trim())
      .map((line) => {
        const [, type, column, keys = "", comment = ""] =
          /^\s*(\w+) (\w+)([A-Z, ]*?)(?: "(.*)")?\s*$/.exec(line) ?? []

        if (!type) {
          throw new Error(`Unparseable column line in ${name}: ${line}`)
        }

        return {
          name: column,
          type,
          pk: /\bPK\b/.test(keys),
          fk: /\bFK\b/.test(keys),
          nullable: comment.includes("nullable"),
        }
      })
      .sort(byName)
  }

  return tables
}

describe("database.md diagram", () => {
  const schema = schemaTables(migratedDatabase())
  const doc = docTables()

  it("lists the same tables as the migrations", () => {
    expect(Object.keys(doc).sort()).toEqual(Object.keys(schema).sort())
  })

  it.each(Object.keys(schema))(
    "lists every column of %s as the migrations define it",
    (table) => {
      expect(doc[table]).toEqual(schema[table])
    },
  )
})
