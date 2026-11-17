#!/usr/bin/env node
/**
 * Validates the frontmatter of every ADR and keeps the index in
 * docs/decisions/README.md generated from it.
 *
 * Usage:
 *   node infra/scripts/docs-indexes.mjs          write the index between the marker comments
 *   import { checkDocsIndexes } from "./docs-indexes.mjs"   used by check-docs.mjs
 */

import { readdirSync, readFileSync, writeFileSync } from "node:fs"
import { resolve } from "node:path"
import { fileURLToPath } from "node:url"
import { parse } from "yaml"

const REPO_ROOT = resolve(fileURLToPath(import.meta.url), "../../..")
const DIR = "docs/decisions"
const README = resolve(REPO_ROOT, DIR, "README.md")
const START = "<!-- docs-index:start -->"
const END = "<!-- docs-index:end -->"

const STATUSES = ["Proposed", "Accepted", "Rejected", "Superseded"]
const AREAS = ["product", "platform", "web", "delivery", "process"]
// Relation key -> [inverse key, label shown in the index]
const RELATIONS = {
  supersedes: ["superseded-by", "supersedes"],
  "superseded-by": ["supersedes", "superseded by"],
  amends: ["amended-by", "amends"],
  "amended-by": ["amends", "amended by"],
}
const KNOWN_KEYS = new Set(["status", "area", ...Object.keys(RELATIONS)])

/** @returns {{id: string, file: string, title: string, meta: object, prose: string, problems: string[]}[]} */
function loadRecords() {
  return readdirSync(resolve(REPO_ROOT, DIR))
    .filter((f) => /^\d{4}-.*\.md$/.test(f))
    .sort()
    .map((name) => {
      const file = `${DIR}/${name}`
      const text = readFileSync(resolve(REPO_ROOT, file), "utf8")
      const problems = []
      const fm = text.match(/^---\n([\s\S]*?)\n---\n/)
      let meta = {}
      if (!fm) problems.push("missing YAML frontmatter")
      else {
        try {
          meta = parse(fm[1]) ?? {}
        } catch (e) {
          problems.push(`invalid YAML frontmatter: ${e.message}`)
        }
      }
      const title = text.match(/^# \d{4} — (.+)$/m)?.[1]
      if (!title) problems.push('missing "# NNNN — Title" heading')
      const prose =
        text
          .match(/^## Status\s+([\s\S]*?)(?=^## |$(?![\s\S]))/m)?.[1]
          .trim() ?? ""
      return {
        id: name.slice(0, 4),
        file,
        title: title ?? name,
        meta,
        prose,
        problems,
      }
    })
}

function validate(records) {
  const byId = new Map(records.map((r) => [r.id, r]))
  const errors = []
  const fail = (r, msg) => errors.push(`${r.file}: ${msg}`)
  for (const r of records) {
    for (const p of r.problems) fail(r, p)
    if (r.problems.length) continue
    const { status, area } = r.meta
    if (!STATUSES.includes(status))
      fail(r, `status "${status}" must be one of: ${STATUSES.join(", ")}`)
    else if (!new RegExp(`^${status}(?![A-Za-z])`).test(r.prose)) {
      fail(
        r,
        `frontmatter status "${status}" does not start the "## Status" prose`,
      )
    }
    if (!AREAS.includes(area))
      fail(r, `area "${area}" must be one of: ${AREAS.join(", ")}`)
    for (const key of Object.keys(r.meta))
      if (!KNOWN_KEYS.has(key)) fail(r, `unknown frontmatter key "${key}"`)
    for (const key of Object.keys(RELATIONS)) {
      const values = r.meta[key]
      if (values === undefined) continue
      if (
        !Array.isArray(values) ||
        values.length === 0 ||
        values.some((v) => typeof v !== "string")
      ) {
        fail(
          r,
          `${key} must be a non-empty list of quoted strings (omit it when empty)`,
        )
        continue
      }
      for (const v of values) {
        const other = byId.get(v)
        if (!other) {
          fail(r, `${key} ${v}: no such ADR`)
          continue
        }
        const inverse = RELATIONS[key][0]
        const back = other.meta[inverse]
        if (!Array.isArray(back) || !back.includes(r.id)) {
          fail(r, `${key} ${v}: ${other.file} lacks the inverse (${inverse})`)
        }
      }
    }
    if (status === "Superseded" && !r.meta["superseded-by"])
      fail(r, "status Superseded needs superseded-by")
  }
  return errors
}

function line(r) {
  const parts = [
    `[${r.id} — ${r.title}](${r.file.split("/").pop()})`,
    r.meta.status,
  ]
  for (const key of Object.keys(RELATIONS)) {
    const values = r.meta[key]
    if (values) parts.push(`${RELATIONS[key][1]} ${values.join(", ")}`)
  }
  return `- ${parts.join(" · ")}`
}

function renderBlock(records) {
  return AREAS.map((area) => {
    const group = records.filter((r) => r.meta.area === area)
    return group.length
      ? `### ${area[0].toUpperCase()}${area.slice(1)}\n\n${group.map(line).join("\n")}`
      : ""
  })
    .filter(Boolean)
    .join("\n\n")
}

/** @returns {{text: string, next: string | null}} the README now and with a freshly generated index (null when the markers are missing) */
function readmeWith(block) {
  const text = readFileSync(README, "utf8")
  const start = text.indexOf(START)
  const end = text.indexOf(END)
  if (start === -1 || end === -1 || end < start) return { text, next: null }
  return {
    text,
    next: `${text.slice(0, start + START.length)}\n\n${block}\n\n${text.slice(end)}`,
  }
}

/** @returns {string[]} problems: frontmatter errors and an index that differs from the generator's output */
export function checkDocsIndexes() {
  const records = loadRecords()
  const errors = validate(records)
  if (errors.length) return errors
  const { text, next } = readmeWith(renderBlock(records))
  if (next === null)
    errors.push(`${DIR}/README.md: missing ${START} / ${END} markers`)
  else if (next !== text)
    errors.push(
      `${DIR}/README.md: generated index is stale, run "npm run docs:index"`,
    )
  return errors
}

function writeIndex() {
  const records = loadRecords()
  const errors = validate(records)
  if (errors.length) return errors
  const { next } = readmeWith(renderBlock(records))
  if (next === null)
    errors.push(`${DIR}/README.md: missing ${START} / ${END} markers`)
  else writeFileSync(README, next)
  return errors
}

if (process.argv[1] === fileURLToPath(import.meta.url)) {
  const errors = writeIndex()
  if (errors.length) {
    console.error(`docs-indexes: ${errors.length} problem(s)\n`)
    for (const e of errors) console.error(`  ${e}`)
    process.exit(1)
  }
  console.log("docs-indexes: index written")
}
