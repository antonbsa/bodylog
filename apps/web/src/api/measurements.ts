import { createFallbackApiError, throwApiError } from "../../../../infra/errors"
import { api } from "./client"
import type {
  CsvImportPreview,
  CsvImportResult,
  Measurement,
  MeasurementInput,
  MeasurementLookup,
} from "../../../../types/measurements"
import type { ListedMeasurement } from "../types"

export async function listMeasurements(options: {
  from?: string
  limit: number
  offset?: number
  to?: string
}): Promise<ListedMeasurement[]> {
  const query = new URLSearchParams({
    limit: String(options.limit),
    offset: String(options.offset ?? 0),
  })

  if (options.from) {
    query.set("from", options.from)
  }

  if (options.to) {
    query.set("to", options.to)
  }

  const response = await api(`/api/measurements?${query}`, {
    method: "GET",
  })

  if (!response.ok) {
    await throwApiError(response, {
      action: "Atualize a página e tente novamente.",
      message: "Não foi possível carregar o histórico.",
    })
  }

  const payload = (await response.json()) as {
    items: ListedMeasurement[]
  }

  return payload.items
}

export async function getMeasurementByDate(
  date: string,
): Promise<MeasurementLookup | null> {
  const response = await api(`/api/measurements/by-date/${date}`, {
    method: "GET",
  })

  if (response.status === 404) {
    return null
  }

  if (!response.ok) {
    await throwApiError(response, {
      action: "Verifique a data selecionada e tente novamente.",
      message: "Não foi possível carregar a medida dessa data.",
    })
  }

  return (await response.json()) as MeasurementLookup
}

export async function saveMeasurementByDate(
  date: string,
  input: MeasurementInput,
): Promise<Measurement> {
  const response = await api(`/api/measurements/by-date/${date}`, {
    body: JSON.stringify(input),
    headers: { "content-type": "application/json" },
    method: "PUT",
  })

  if (!response.ok) {
    await throwApiError(response, {
      action: "Revise os campos da medida e tente novamente.",
      message: "Não foi possível salvar a medida.",
    })
  }

  const payload = (await response.json()) as {
    item: Measurement
  }

  return payload.item
}

export async function deleteMeasurement(id: string): Promise<void> {
  const response = await api(`/api/measurements/${id}`, {
    method: "DELETE",
  })

  if (!response.ok) {
    await throwApiError(response, {
      action: "Atualize o histórico e tente novamente.",
      message: "Não foi possível excluir a medida.",
    })
  }
}

export async function exportMeasurementsCsv(): Promise<Blob> {
  const response = await api("/api/export/csv", { method: "GET" })

  if (!response.ok) {
    await throwApiError(response, {
      action: "Tente exportar novamente em instantes.",
      message: "Não foi possível exportar o CSV.",
    })
  }

  return response.blob()
}

async function postCsv<T>(
  path: string,
  file: File,
  skipInvalid: boolean,
): Promise<T> {
  const formData = new FormData()

  formData.append("file", file)

  if (skipInvalid) {
    formData.append("skipInvalid", "true")
  }

  const response = await api(path, { body: formData, method: "POST" })

  if (!response.ok) {
    await throwApiError(response, {
      action: "Revise o arquivo CSV e tente novamente.",
      message: "Não foi possível importar o CSV.",
    })
  }

  const payload = (await response.json().catch(() => null)) as T | null

  if (!payload) {
    throw createFallbackApiError({
      action: "Tente importar o arquivo novamente.",
      message: "A resposta da importação está inválida.",
    })
  }

  return payload
}

/** Validates the file on the server without writing anything. */
export function previewMeasurementsCsv(file: File): Promise<CsvImportPreview> {
  return postCsv("/api/import/csv/preview", file, false)
}

export function importMeasurementsCsv(
  file: File,
  options: { skipInvalid: boolean },
): Promise<CsvImportResult> {
  return postCsv("/api/import/csv", file, options.skipInvalid)
}
