import type { MeasurementRepository } from "../../db/repositories/measurements"
import {
  isWithinMeasurementLimit,
  MEASUREMENT_LIMITS,
  normalizeNotes,
} from "../../../../../domain/measurement"
import {
  createCsvFileError,
  createCsvInvalidRowsError,
} from "../../http/request-validation"
import type { ImportedMeasurementRow } from "../../types"
import type {
  CsvImportPreview,
  CsvImportResult,
  CsvImportRowError,
} from "../../../../../types/measurements"
import { findCsvField, type CsvField } from "./csv-columns"
import { decodeCsvBytes, detectDelimiter, parseCsvRecords } from "./csv-text"
import { parseCsvDate, parseCsvNumber } from "./csv-values"

type CsvColumn = {
  field: CsvField
  header: string
  index: number
}

type LimitedField = keyof typeof MEASUREMENT_LIMITS

/** Fields whose cells hold a measurement; a row with none of them is "no measurement". */
const VALUE_FIELDS: CsvField[] = [
  "weightKg",
  "bodyFatPercentage",
  "musclePercentage",
  "restingMetabolismKcal",
  "waistCm",
  "sleepHours",
  "disposition",
  "notes",
]

const NUMERIC_FIELDS = [
  "weightKg",
  "bodyFatPercentage",
  "musclePercentage",
  "restingMetabolismKcal",
  "waistCm",
  "sleepHours",
  "disposition",
] as const satisfies readonly (CsvField & LimitedField)[]

type NumericField = (typeof NUMERIC_FIELDS)[number]

export type CsvAnalysis = {
  ignoredColumns: string[]
  invalidRowCount: number
  invalidRows: CsvImportRowError[]
  noMeasurementCount: number
  validRows: ImportedMeasurementRow[]
}

/**
 * Validates a whole file without touching the database; throws a validation error for file-level problems.
 * `existingDates` are the user's recorded dates: only there may a row omit its weight (ADR 0049).
 */
export function analyzeMeasurementsCsv(
  bytes: ArrayBuffer,
  importedAt: string = new Date().toISOString(),
  existingDates: ReadonlySet<string> = new Set(),
): CsvAnalysis {
  const text = decodeCsvBytes(bytes)

  if (text.trim() === "") {
    throw createCsvFileError("O arquivo CSV está vazio.")
  }

  const records = parseCsvRecords(text, detectDelimiter(text))

  if (!records) {
    throw createCsvFileError(
      "Não foi possível ler o arquivo CSV.",
      "Verifique se as aspas das células estão fechadas e tente novamente.",
    )
  }

  const [headers = [], ...rows] = records
  const { columns, ignoredColumns } = mapColumns(headers)
  const columnOf = (field: CsvField) =>
    columns.find((column) => column.field === field)
  const analysis: CsvAnalysis = {
    ignoredColumns,
    invalidRowCount: 0,
    invalidRows: [],
    noMeasurementCount: 0,
    validRows: [],
  }
  const firstRowOfDate = new Map<string, number>()
  const dateColumn = columnOf("date")
  const weightColumn = columnOf("weightKg")

  if (!dateColumn) {
    throw missingColumnError("Data", "date")
  }

  if (!weightColumn) {
    throw missingColumnError("Peso", "weight_kg")
  }

  for (const [index, rawRow] of rows.entries()) {
    const rowNumber = index + 2
    // Cells past the header are a spreadsheet's side area and have no field to map to.
    const row = rawRow.slice(0, headers.length)

    if (row.every((cell) => cell.trim() === "")) {
      continue
    }

    const errors: CsvImportRowError[] = []
    const addError = (column: CsvColumn, message: string) =>
      errors.push({
        column: column.header,
        message,
        row: rowNumber,
        value: row[column.index] ?? "",
      })

    if (row.length < headers.length) {
      errors.push({
        column: "",
        message: "A linha tem menos colunas que o cabeçalho.",
        row: rowNumber,
        value: "",
      })
      recordInvalid(analysis, errors)
      continue
    }

    const cell = (column: CsvColumn) => (row[column.index] ?? "").trim()
    const hasValues = columns.some(
      (column) => VALUE_FIELDS.includes(column.field) && cell(column) !== "",
    )
    const rawDate = cell(dateColumn)

    if (!hasValues && rawDate === "") {
      continue
    }

    const date = parseCsvDate(rawDate)

    if (!date) {
      addError(
        dateColumn,
        rawDate === ""
          ? "Data obrigatória."
          : "Data inválida. Use DD/MM/AAAA ou AAAA-MM-DD.",
      )
    }

    if (!hasValues) {
      if (date) {
        analysis.noMeasurementCount += 1
      } else {
        recordInvalid(analysis, errors)
      }

      continue
    }

    const parsed = parseRowValues(columns, cell, addError)

    if (date && firstRowOfDate.has(date)) {
      addError(
        dateColumn,
        `Data repetida. Já aparece na linha ${firstRowOfDate.get(date)}.`,
      )
    }

    if (date && cell(weightColumn) === "" && !existingDates.has(date)) {
      addError(weightColumn, "Peso obrigatório.")
    }

    if (errors.length > 0 || !date) {
      recordInvalid(analysis, errors)
      continue
    }

    firstRowOfDate.set(date, rowNumber)
    analysis.validRows.push({
      createdAt: parsed.createdAt,
      date,
      fields: parsed.fields,
      updatedAt: parsed.updatedAt ?? importedAt,
      weightKg: parsed.weightKg,
    })
  }

  return analysis
}

export async function previewMeasurementsCsv(
  bytes: ArrayBuffer,
  repository: MeasurementRepository,
): Promise<CsvImportPreview> {
  const existingDates = new Set(await repository.listDates())
  const analysis = analyzeMeasurementsCsv(
    bytes,
    new Date().toISOString(),
    existingDates,
  )
  const dates = analysis.validRows.map((row) => row.date).sort()
  const updatedDates = dates.filter((date) => existingDates.has(date))

  return {
    counts: {
      created: dates.length - updatedDates.length,
      invalid: analysis.invalidRowCount,
      noMeasurement: analysis.noMeasurementCount,
      updated: updatedDates.length,
    },
    ignoredColumns: analysis.ignoredColumns,
    invalidRows: analysis.invalidRows,
    period:
      dates.length > 0
        ? { from: dates[0] as string, to: dates[dates.length - 1] as string }
        : null,
    updatedDates,
  }
}

export async function importMeasurementsCsv(
  bytes: ArrayBuffer,
  repository: MeasurementRepository,
  options: { importedAt?: Date; skipInvalid: boolean },
): Promise<CsvImportResult> {
  const existingDates = new Set(await repository.listDates())
  const analysis = analyzeMeasurementsCsv(
    bytes,
    (options.importedAt ?? new Date()).toISOString(),
    existingDates,
  )

  if (analysis.invalidRowCount > 0 && !options.skipInvalid) {
    throw createCsvInvalidRowsError(analysis.invalidRowCount)
  }

  if (analysis.validRows.length === 0) {
    throw createCsvFileError("O arquivo não tem medidas válidas para importar.")
  }

  const updated = analysis.validRows.filter((row) =>
    existingDates.has(row.date),
  ).length

  await repository.upsertImportedBatch(analysis.validRows)

  return {
    created: analysis.validRows.length - updated,
    skippedInvalid: analysis.invalidRowCount,
    updated,
  }
}

function mapColumns(headers: string[]): {
  columns: CsvColumn[]
  ignoredColumns: string[]
} {
  const columns: CsvColumn[] = []
  const ignoredColumns: string[] = []

  for (const [index, rawHeader] of headers.entries()) {
    const header = rawHeader.trim()
    const field = findCsvField(header)

    if (!field) {
      if (header !== "") {
        ignoredColumns.push(header)
      }

      continue
    }

    const duplicate = columns.find((column) => column.field === field)

    if (duplicate) {
      throw createCsvFileError(
        `As colunas "${duplicate.header}" e "${header}" representam o mesmo campo.`,
        "Mantenha apenas uma delas no arquivo e tente novamente.",
      )
    }

    columns.push({ field, header, index })
  }

  return { columns, ignoredColumns }
}

function missingColumnError(label: string, canonicalHeader: string) {
  return createCsvFileError(
    `A coluna obrigatória "${label}" não foi encontrada.`,
    `Inclua uma coluna chamada "${label}" (ou "${canonicalHeader}") e tente novamente.`,
  )
}

/** Spreadsheets often end rows with extra delimiters; blank cells past the header are dropped, anything else still counts as a mismatch. */
function recordInvalid(analysis: CsvAnalysis, errors: CsvImportRowError[]) {
  analysis.invalidRowCount += 1
  analysis.invalidRows.push(...errors)
}

function parseRowValues(
  columns: CsvColumn[],
  cell: (column: CsvColumn) => string,
  addError: (column: CsvColumn, message: string) => void,
): {
  createdAt?: string
  fields: ImportedMeasurementRow["fields"]
  updatedAt?: string
  weightKg?: number
} {
  const fields: Record<string, number | string | null> = {}
  const result: ReturnType<typeof parseRowValues> = { fields }

  for (const column of columns) {
    const text = cell(column)

    // An empty cell carries no value: the stored one stays (ADR 0049).
    if (text === "") {
      continue
    }

    if (column.field === "notes") {
      fields.notes = normalizeNotes(text)
    } else if (column.field === "createdAt" || column.field === "updatedAt") {
      const timestamp = parseTimestamp(text)

      if (timestamp === null) {
        addError(column, "Data e hora inválidas.")
      } else {
        result[column.field] = timestamp
      }
    } else if (isNumericField(column.field)) {
      const value = parseNumericCell(column.field, text)

      if (typeof value === "string") {
        addError(column, value)
      } else if (column.field === "weightKg") {
        result.weightKg = value
      } else {
        fields[column.field] = value
      }
    }
  }

  return result
}

function isNumericField(field: CsvField): field is NumericField {
  return (NUMERIC_FIELDS as readonly string[]).includes(field)
}

/** The number or a Portuguese error message. */
function parseNumericCell(field: NumericField, text: string): number | string {
  const parsed = parseCsvNumber(text, {
    thousandsDot: field === "restingMetabolismKcal",
  })

  if (parsed === null) {
    return "Número inválido. Use apenas dígitos, com ponto ou vírgula decimal."
  }

  const value = field === "restingMetabolismKcal" ? Math.round(parsed) : parsed

  if (isWithinMeasurementLimit(field, value)) {
    return value
  }

  const { max, min } = MEASUREMENT_LIMITS[field]
  const isInteger = "integer" in MEASUREMENT_LIMITS[field]

  return isInteger
    ? `Fora do limite. Use um número inteiro de ${min} a ${max}.`
    : `Fora do limite. Use um valor de ${min} a ${max}.`
}

/** An ISO-normalized timestamp, or null when unreadable. */
function parseTimestamp(text: string): string | null {
  const time = Date.parse(text)

  return Number.isNaN(time) ? null : new Date(time).toISOString()
}
