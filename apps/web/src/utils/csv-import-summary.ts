import type { CsvImportSummary } from "../../../../types/measurements"

export function formatImportSuccessMessage(summary: CsvImportSummary): string {
  return `Importação concluída: ${summary.created} criados, ${summary.updated} atualizados, ${summary.skipped} ignorados.`
}

export function formatImportPartialMessage(summary: CsvImportSummary): string {
  return `Importação parcial: ${summary.created} criados, ${summary.updated} atualizados, ${summary.skipped} ignorados, ${summary.errors.length} erros. ${formatFirstImportError(summary)}`
}

function formatFirstImportError(summary: CsvImportSummary): string {
  const firstError = summary.errors[0]

  if (!firstError) {
    return ""
  }

  return `Primeiro erro: linha ${firstError.row}, ${firstError.message}.`
}
