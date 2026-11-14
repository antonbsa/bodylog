import { describe, expect, it } from "vitest"

import {
  formatImportPartialMessage,
  formatImportSuccessMessage,
} from "../../apps/web/src/utils/csv-import-summary"

const summary = { created: 0, errors: [], skipped: 0, updated: 0 }

describe("formatImportSuccessMessage", () => {
  it("counts created and updated rows, ignoring skipped ones", () => {
    expect(
      formatImportSuccessMessage({
        ...summary,
        created: 20,
        skipped: 3,
        updated: 4,
      }),
    ).toBe("24 medidas importadas")
  })

  it("uses the singular for one measurement", () => {
    expect(formatImportSuccessMessage({ ...summary, updated: 1 })).toBe(
      "1 medida importada",
    )
  })

  it("uses the plural for zero", () => {
    expect(formatImportSuccessMessage({ ...summary, skipped: 2 })).toBe(
      "0 medidas importadas",
    )
  })
})

describe("formatImportPartialMessage", () => {
  it("reports the counts and the first row error", () => {
    expect(
      formatImportPartialMessage({
        ...summary,
        created: 2,
        errors: [
          { message: "peso inválido", row: 3 },
          { message: "data inválida", row: 5 },
        ],
      }),
    ).toBe(
      "Importação parcial: 2 criados, 0 atualizados, 0 ignorados, 2 erros. Primeiro erro: linha 3, peso inválido.",
    )
  })
})
