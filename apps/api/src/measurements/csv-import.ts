import type { MeasurementRepository } from "./measurement-repository"
import type { ImportedMeasurementInput } from "./types"

const requiredHeaders = [
  "date",
  "weight_kg",
  "body_fat_percentage",
  "muscle_percentage",
  "resting_metabolism_kcal",
] as const

const fullHeaders = [...requiredHeaders, "created_at", "updated_at"] as const

type ImportCsvOptions = {
  importedAt?: Date
}

export type CsvImportRowIssue = {
  message: string
  row: number
}

export type CsvImportSummary = {
  created: number
  errors: CsvImportRowIssue[]
  skipped: number
  updated: number
}

type CsvRowResult =
  | {
      input: ImportedMeasurementInput
      ok: true
    }
  | {
      errors: CsvImportRowIssue[]
      ok: false
    }

export async function importMeasurementsCsv(
  csv: string,
  repository: MeasurementRepository,
  options: ImportCsvOptions = {},
): Promise<CsvImportSummary> {
  const importedAt = (options.importedAt ?? new Date()).toISOString()
  const parseResult = parseCsv(csv)

  if (!parseResult.ok) {
    return {
      created: 0,
      errors: [
        {
          message: parseResult.error,
          row: 1,
        },
      ],
      skipped: 0,
      updated: 0,
    }
  }

  const [headers, ...rows] = parseResult.rows
  const headerResult = validateHeaders(headers ?? [])

  if (!headerResult.ok) {
    return {
      created: 0,
      errors: [
        {
          message: headerResult.error,
          row: 1,
        },
      ],
      skipped: rows.length,
      updated: 0,
    }
  }

  const summary: CsvImportSummary = {
    created: 0,
    errors: [],
    skipped: 0,
    updated: 0,
  }

  for (const [index, row] of rows.entries()) {
    const rowNumber = index + 2

    if (isBlankRow(row)) {
      summary.skipped += 1
      continue
    }

    const rowResult = parseMeasurementCsvRow(row, {
      hasAuditTimestamps: headerResult.hasAuditTimestamps,
      importedAt,
      rowNumber,
    })

    if (!rowResult.ok) {
      summary.errors.push(...rowResult.errors)
      summary.skipped += 1
      continue
    }

    const result = await repository.upsertImportedByDate(rowResult.input)

    if (result.operation === "created") {
      summary.created += 1
    } else {
      summary.updated += 1
    }
  }

  return summary
}

function validateHeaders(headers: string[]):
  | {
      hasAuditTimestamps: boolean
      ok: true
    }
  | {
      error: string
      ok: false
    } {
  const normalizedHeaders = headers.map((header) => header.trim())

  if (arraysEqual(normalizedHeaders, requiredHeaders)) {
    return {
      hasAuditTimestamps: false,
      ok: true,
    }
  }

  if (arraysEqual(normalizedHeaders, fullHeaders)) {
    return {
      hasAuditTimestamps: true,
      ok: true,
    }
  }

  return {
    error: "Invalid CSV headers",
    ok: false,
  }
}

function parseMeasurementCsvRow(
  row: string[],
  options: {
    hasAuditTimestamps: boolean
    importedAt: string
    rowNumber: number
  },
): CsvRowResult {
  const expectedLength = options.hasAuditTimestamps
    ? fullHeaders.length
    : requiredHeaders.length
  const errors: CsvImportRowIssue[] = []

  if (row.length !== expectedLength) {
    return {
      errors: [
        {
          message: `Expected ${expectedLength} columns. Quote decimal-comma values or use dot decimals.`,
          row: options.rowNumber,
        },
      ],
      ok: false,
    }
  }

  const [
    date,
    weightKg,
    bodyFatPercentage,
    musclePercentage,
    restingMetabolismKcal,
    createdAt,
    updatedAt,
  ] = row
  const parsedWeightKg = parseRequiredNumber(weightKg)
  const parsedBodyFatPercentage = parseOptionalNumber(bodyFatPercentage)
  const parsedMusclePercentage = parseOptionalNumber(musclePercentage)
  const parsedRestingMetabolismKcal = parseOptionalRestingMetabolism(
    restingMetabolismKcal,
  )
  const parsedCreatedAt = parseOptionalTimestamp(createdAt, options.importedAt)
  const parsedUpdatedAt = parseOptionalTimestamp(updatedAt, options.importedAt)

  if (!isDateOnly(date)) {
    errors.push({
      message: "Invalid date",
      row: options.rowNumber,
    })
  }

  if (parsedWeightKg === null) {
    errors.push({
      message: "Invalid weight value",
      row: options.rowNumber,
    })
  }

  if (parsedBodyFatPercentage === undefined) {
    errors.push({
      message: "Invalid body fat percentage",
      row: options.rowNumber,
    })
  }

  if (parsedMusclePercentage === undefined) {
    errors.push({
      message: "Invalid muscle percentage",
      row: options.rowNumber,
    })
  }

  if (parsedRestingMetabolismKcal === undefined) {
    errors.push({
      message: "Invalid resting metabolism",
      row: options.rowNumber,
    })
  }

  if (parsedCreatedAt === null) {
    errors.push({
      message: "Invalid created_at timestamp",
      row: options.rowNumber,
    })
  }

  if (parsedUpdatedAt === null) {
    errors.push({
      message: "Invalid updated_at timestamp",
      row: options.rowNumber,
    })
  }

  if (errors.length > 0 || parsedWeightKg === null) {
    return {
      errors,
      ok: false,
    }
  }

  return {
    input: {
      bodyFatPercentage: parsedBodyFatPercentage,
      createdAt: parsedCreatedAt ?? options.importedAt,
      date,
      musclePercentage: parsedMusclePercentage,
      restingMetabolismKcal:
        parsedRestingMetabolismKcal === null ||
        parsedRestingMetabolismKcal === undefined
          ? null
          : Math.trunc(parsedRestingMetabolismKcal),
      updatedAt: parsedUpdatedAt ?? options.importedAt,
      weightKg: parsedWeightKg,
    },
    ok: true,
  }
}

function parseCsv(csv: string):
  | {
      ok: true
      rows: string[][]
    }
  | {
      error: string
      ok: false
    } {
  const rows: string[][] = []
  let currentCell = ""
  let currentRow: string[] = []
  let isQuoted = false

  for (let index = 0; index < csv.length; index += 1) {
    const character = csv[index]
    const nextCharacter = csv[index + 1]

    if (isQuoted) {
      if (character === '"' && nextCharacter === '"') {
        currentCell += '"'
        index += 1
      } else if (character === '"') {
        isQuoted = false
      } else {
        currentCell += character
      }

      continue
    }

    if (character === '"') {
      if (currentCell.length > 0) {
        return {
          error: "Invalid quoted cell",
          ok: false,
        }
      }

      isQuoted = true
      continue
    }

    if (character === ",") {
      currentRow.push(currentCell)
      currentCell = ""
      continue
    }

    if (character === "\n" || character === "\r") {
      currentRow.push(currentCell)
      rows.push(currentRow)
      currentCell = ""
      currentRow = []

      if (character === "\r" && nextCharacter === "\n") {
        index += 1
      }

      continue
    }

    currentCell += character
  }

  if (isQuoted) {
    return {
      error: "Unclosed quoted cell",
      ok: false,
    }
  }

  if (currentCell.length > 0 || currentRow.length > 0) {
    currentRow.push(currentCell)
    rows.push(currentRow)
  }

  return {
    ok: true,
    rows,
  }
}

function parseRequiredNumber(value: string | undefined): number | null {
  if (value === undefined || value.trim() === "") {
    return null
  }

  const parsedValue = Number(normalizeDecimalNumber(value))

  return Number.isFinite(parsedValue) ? parsedValue : null
}

function parseOptionalNumber(
  value: string | undefined,
): number | null | undefined {
  if (value === undefined || value.trim() === "") {
    return null
  }

  const parsedValue = Number(normalizeDecimalNumber(value))

  return Number.isFinite(parsedValue) ? parsedValue : undefined
}

function parseOptionalRestingMetabolism(
  value: string | undefined,
): number | null | undefined {
  if (value === undefined || value.trim() === "") {
    return null
  }

  const normalizedValue = normalizeIntegerNumber(value)
  const parsedValue = Number(normalizedValue)

  return Number.isFinite(parsedValue) ? parsedValue : undefined
}

function normalizeDecimalNumber(value: string): string {
  const trimmedValue = value.trim()

  if (trimmedValue.includes(",") && !trimmedValue.includes(".")) {
    return trimmedValue.replace(",", ".")
  }

  return trimmedValue
}

function normalizeIntegerNumber(value: string): string {
  const trimmedValue = value.trim()

  if (/^\d{1,3}([.,]\d{3})+$/.test(trimmedValue)) {
    return trimmedValue.replaceAll(/[.,]/g, "")
  }

  return normalizeDecimalNumber(trimmedValue)
}

function parseOptionalTimestamp(
  value: string | undefined,
  fallback: string,
): string | null | undefined {
  if (value === undefined || value.trim() === "") {
    return undefined
  }

  const parsedValue = Date.parse(value)

  if (Number.isNaN(parsedValue)) {
    return null
  }

  return new Date(parsedValue).toISOString() || fallback
}

function isBlankRow(row: string[]): boolean {
  return row.every((cell) => cell.trim() === "")
}

function isDateOnly(value: string): boolean {
  const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(value)

  if (!match) {
    return false
  }

  const [, year, month, day] = match
  const parsedDate = new Date(
    Date.UTC(Number(year), Number(month) - 1, Number(day)),
  )

  return (
    parsedDate.getUTCFullYear() === Number(year) &&
    parsedDate.getUTCMonth() === Number(month) - 1 &&
    parsedDate.getUTCDate() === Number(day)
  )
}

function arraysEqual(
  actual: readonly string[],
  expected: readonly string[],
): boolean {
  return (
    actual.length === expected.length &&
    actual.every((value, index) => value === expected[index])
  )
}
