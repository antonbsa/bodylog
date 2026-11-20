import type {
  CsvImportPreview,
  CsvImportResult,
  CsvImportRowError,
} from "../../../../types/measurements"

export type ImportErrorGroup = {
  column: string
  errors: CsvImportRowError[]
  message: string
}

export function plural(count: number, one: string, many: string): string {
  return `${count} ${count === 1 ? one : many}`
}

/** Toast after a confirmed import, e.g. `5 medidas importadas (3 novas, 2 atualizadas) · 1 inválida pulada`. */
export function formatImportResultMessage(result: CsvImportResult): string {
  const total = result.created + result.updated
  const message = `${plural(total, "medida importada", "medidas importadas")} (${plural(result.created, "nova", "novas")}, ${plural(result.updated, "atualizada", "atualizadas")})`

  return result.skippedInvalid > 0
    ? `${message} · ${plural(result.skippedInvalid, "inválida pulada", "inválidas puladas")}`
    : message
}

/** The action the preview dialog offers; null when confirming would write nothing. */
export function getImportAction(
  preview: CsvImportPreview,
): { label: string; skipInvalid: boolean } | null {
  if (preview.counts.created + preview.counts.updated === 0) {
    return null
  }

  return preview.counts.invalid > 0
    ? { label: "Pular inválidas e importar", skipInvalid: true }
    : { label: "Confirmar", skipInvalid: false }
}

/** Groups row errors by column and message, in the order each group first appears in the file. */
export function groupImportErrors(
  errors: CsvImportRowError[],
): ImportErrorGroup[] {
  const groups = new Map<string, ImportErrorGroup>()

  for (const error of errors) {
    const key = JSON.stringify([error.column, error.message])
    const group = groups.get(key)

    if (group) {
      group.errors.push(error)
    } else {
      groups.set(key, {
        column: error.column,
        errors: [error],
        message: error.message,
      })
    }
  }

  return [...groups.values()]
}
