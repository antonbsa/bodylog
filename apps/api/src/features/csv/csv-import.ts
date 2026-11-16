import type { MeasurementRepository } from "../../db/repositories/measurements"
import {
  isWithinMeasurementLimit,
  normalizeNotes,
  type MEASUREMENT_LIMITS,
} from "../../../../../domain/measurement"
import type { ImportedMeasurementInput } from "../../types"
import type {
  CsvImportRowError,
  CsvImportSummary,
} from "../../../../../types/measurements"

const legacyHeaders = [
  "date",
  "weight_kg",
  "body_fat_percentage",
  "muscle_percentage",
  "resting_metabolism_kcal",
] as const

const newFieldHeaders = [
  "waist_cm",
  "sleep_hours",
  "disposition",
  "notes",
] as const
const auditHeaders = ["created_at", "updated_at"] as const

// CSVs exported before the redesign have neither the new fields nor, for
// spreadsheet imports, the audit timestamps; all four combinations import.
const supportedHeaderSets: readonly (readonly string[])[] = [
  legacyHeaders,
  [...legacyHeaders, ...auditHeaders],
  [...legacyHeaders, ...newFieldHeaders],
  [...legacyHeaders, ...newFieldHeaders, ...auditHeaders],
]

type ImportCsvOptions = {
  importedAt?: Date
}

type CsvRowResult =
  | {
      input: ImportedMeasurementInput
      ok: true
    }
  | {
      errors: CsvImportRowError[]
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
      headers: headerResult.headers,
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
      headers: string[]
      ok: true
    }
  | {
      error: string
      ok: false
    } {
  const normalizedHeaders = headers.map((header) => header.trim())

  if (supportedHeaderSets.some((set) => arraysEqual(normalizedHeaders, set))) {
    return {
      headers: normalizedHeaders,
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
    headers: string[]
    importedAt: string
    rowNumber: number
  },
): CsvRowResult {
  const errors: CsvImportRowError[] = []

  if (row.length !== options.headers.length) {
    return {
      errors: [
        {
          message: `Expected ${options.headers.length} columns. Quote decimal-comma values or use dot decimals.`,
          row: options.rowNumber,
        },
      ],
      ok: false,
    }
  }

  const cell = (header: string) => {
    const index = options.headers.indexOf(header)

    return index === -1 ? undefined : row[index]
  }
  const date = cell("date") ?? ""
  const parsedWeightKg = parseRequiredNumber(cell("weight_kg"))
  const parsedBodyFatPercentage = parseOptionalNumber(
    cell("body_fat_percentage"),
  )
  const parsedMusclePercentage = parseOptionalNumber(cell("muscle_percentage"))
  const parsedRestingMetabolismKcal = parseOptionalRestingMetabolism(
    cell("resting_metabolism_kcal"),
  )
  const parsedWaistCm = parseOptionalNumber(cell("waist_cm"))
  const parsedSleepHours = parseOptionalNumber(cell("sleep_hours"))
  const parsedDisposition = parseOptionalNumber(cell("disposition"))
  const notes = normalizeNotes(cell("notes") ?? "")
  const parsedCreatedAt = parseOptionalTimestamp(
    cell("created_at"),
    options.importedAt,
  )
  const parsedUpdatedAt = parseOptionalTimestamp(
    cell("updated_at"),
    options.importedAt,
  )

  const addError = (message: string) =>
    errors.push({ message, row: options.rowNumber })
  const isInvalid = (
    field: keyof typeof MEASUREMENT_LIMITS,
    value: number | null | undefined,
  ) =>
    value === undefined ||
    (value !== null && !isWithinMeasurementLimit(field, value))

  if (!isDateOnly(date)) {
    addError("Invalid date")
  }

  if (
    parsedWeightKg === null ||
    !isWithinMeasurementLimit("weightKg", parsedWeightKg)
  ) {
    addError("Invalid weight value")
  }

  if (isInvalid("bodyFatPercentage", parsedBodyFatPercentage)) {
    addError("Invalid body fat percentage")
  }

  if (isInvalid("musclePercentage", parsedMusclePercentage)) {
    addError("Invalid muscle percentage")
  }

  const restingMetabolismKcal =
    parsedRestingMetabolismKcal === null ||
    parsedRestingMetabolismKcal === undefined
      ? parsedRestingMetabolismKcal
      : Math.trunc(parsedRestingMetabolismKcal)

  if (isInvalid("restingMetabolismKcal", restingMetabolismKcal)) {
    addError("Invalid resting metabolism")
  }

  if (isInvalid("waistCm", parsedWaistCm)) {
    addError("Invalid waist")
  }

  if (isInvalid("sleepHours", parsedSleepHours)) {
    addError("Invalid sleep hours")
  }

  if (isInvalid("disposition", parsedDisposition)) {
    addError("Invalid disposition")
  }

  if (parsedCreatedAt === null) {
    addError("Invalid created_at timestamp")
  }

  if (parsedUpdatedAt === null) {
    addError("Invalid updated_at timestamp")
  }

  if (
    errors.length > 0 ||
    parsedWeightKg === null ||
    parsedBodyFatPercentage === undefined ||
    parsedMusclePercentage === undefined ||
    restingMetabolismKcal === undefined ||
    parsedWaistCm === undefined ||
    parsedSleepHours === undefined ||
    parsedDisposition === undefined
  ) {
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
      disposition: parsedDisposition,
      musclePercentage: parsedMusclePercentage,
      notes,
      restingMetabolismKcal,
      sleepHours: parsedSleepHours,
      updatedAt: parsedUpdatedAt ?? options.importedAt,
      waistCm: parsedWaistCm,
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
