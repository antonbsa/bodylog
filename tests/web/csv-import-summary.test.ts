import { describe, expect, it } from "vitest"

import {
  formatImportResultMessage,
  getImportAction,
} from "../../apps/web/src/utils/csv-import-summary"
import type { CsvImportPreview } from "../../types/measurements"

const preview: CsvImportPreview = {
  counts: { created: 0, invalid: 0, noMeasurement: 0, updated: 0 },
  ignoredColumns: [],
  invalidRows: [],
  period: null,
  updatedDates: [],
}

describe("formatImportResultMessage", () => {
  it("reports the total with new and updated counts", () => {
    expect(
      formatImportResultMessage({ created: 3, skippedInvalid: 0, updated: 2 }),
    ).toBe("5 medidas importadas (3 novas, 2 atualizadas)")
  })

  it("uses the singular and appends the skipped invalid rows", () => {
    expect(
      formatImportResultMessage({ created: 1, skippedInvalid: 1, updated: 0 }),
    ).toBe("1 medida importada (1 nova, 0 atualizadas) · 1 inválida pulada")
    expect(
      formatImportResultMessage({ created: 0, skippedInvalid: 4, updated: 2 }),
    ).toBe(
      "2 medidas importadas (0 novas, 2 atualizadas) · 4 inválidas puladas",
    )
  })
})

describe("getImportAction", () => {
  it("confirms when every row is valid", () => {
    expect(
      getImportAction({
        ...preview,
        counts: { ...preview.counts, created: 2 },
      }),
    ).toEqual({ label: "Confirmar", skipInvalid: false })
  })

  it("offers to skip invalid rows when there are some", () => {
    expect(
      getImportAction({
        ...preview,
        counts: { ...preview.counts, invalid: 1, updated: 2 },
      }),
    ).toEqual({ label: "Pular inválidas e importar", skipInvalid: true })
  })

  it("hides the action when nothing would be written", () => {
    expect(
      getImportAction({
        ...preview,
        counts: { ...preview.counts, invalid: 3, noMeasurement: 1 },
      }),
    ).toBeNull()
  })
})
