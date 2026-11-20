import { describe, expect, it } from "vitest"

import {
  formatImportResultMessage,
  getImportAction,
  describeImportErrorGroup,
  groupImportErrors,
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

describe("groupImportErrors", () => {
  it("groups by column and message in file order, keeping every row", () => {
    const groups = groupImportErrors([
      { column: "Data", message: "Data inválida.", row: 2, value: "13/05" },
      { column: "Sono", message: "Número inválido.", row: 2, value: "6-7" },
      { column: "Data", message: "Data inválida.", row: 3, value: "14/05" },
      { column: "Cintura", message: "Número inválido.", row: 4, value: "x" },
    ])

    expect(
      groups.map((group) => [
        group.column,
        group.message,
        group.errors.map((error) => error.row),
      ]),
    ).toEqual([
      ["Data", "Data inválida.", [2, 3]],
      ["Sono", "Número inválido.", [2]],
      ["Cintura", "Número inválido.", [4]],
    ])
  })
})

describe("describeImportErrorGroup", () => {
  const describeGroup = (column: string, message: string) =>
    describeImportErrorGroup({ column, errors: [], message })

  it("keeps a reason that already names the column as the title", () => {
    expect(
      describeGroup("Data", "Data inválida. Use DD/MM/AAAA ou AAAA-MM-DD."),
    ).toEqual({ hint: "Use DD/MM/AAAA ou AAAA-MM-DD.", title: "Data inválida" })
    expect(describeGroup("Peso", "Peso obrigatório.")).toEqual({
      hint: "",
      title: "Peso obrigatório",
    })
  })

  it("prefixes the column when the reason does not name it", () => {
    expect(
      describeGroup(
        "Disposição",
        "Fora do limite. Use um número inteiro de 1 a 5.",
      ),
    ).toEqual({
      hint: "Use um número inteiro de 1 a 5.",
      title: "Disposição: fora do limite",
    })
  })
})
