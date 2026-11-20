import { describe, expect, it } from "vitest"

import {
  findCsvField,
  normalizeHeader,
} from "../../apps/api/src/features/csv/csv-columns"
import { analyzeMeasurementsCsv } from "../../apps/api/src/features/csv/csv-import"
import {
  decodeCsvBytes,
  detectDelimiter,
  parseCsvRecords,
} from "../../apps/api/src/features/csv/csv-text"
import {
  parseCsvDate,
  parseCsvNumber,
} from "../../apps/api/src/features/csv/csv-values"
import { serializeMeasurementsCsv } from "../../apps/api/src/features/csv/csv-export"

const NOW = "2026-07-01T12:00:00.000Z"

function bytes(
  text: string,
  encoding: "latin1" | "utf8" = "utf8",
): ArrayBuffer {
  const buffer = Buffer.from(text, encoding)

  return buffer.buffer.slice(
    buffer.byteOffset,
    buffer.byteOffset + buffer.length,
  ) as ArrayBuffer
}

/** Spreadsheet-style export: `;`, Windows-1252, DD/MM/YYYY, decimal commas. */
const SPREADSHEET_CSV = [
  "Data;Peso;IMC;Gordura;Músculo;Metabolismo basal;Cintura;Sono;Disposição",
  "28/6/2026;72,5;25,7;14,2;43,1;1.696;81,5;7,5;4",
  ";;;;;;;;",
  ";71,0;;;;;;;",
  "27/06/2026;;24,9;;;;;;",
  "26/06/2026;72,1;25,5;14,6;;1.650;;6-7;3",
  "2026-06-25;72;;;;;;;",
].join("\n")

describe("header aliases", () => {
  it("normalizes case, accents and separators", () => {
    expect(normalizeHeader("  Metabolismo_Basal-KCAL ")).toBe(
      "metabolismo basal kcal",
    )
    expect(normalizeHeader("Disposição")).toBe("disposicao")
  })

  it.each([
    ["date", "date"],
    ["Data", "date"],
    ["Peso", "weightKg"],
    ["peso-kg", "weightKg"],
    ["PESO KG", "weightKg"],
    ["Músculo", "musclePercentage"],
    ["musculo_percentual", "musclePercentage"],
    ["Metabolismo basal", "restingMetabolismKcal"],
    ["metabolismo_basal_kcal", "restingMetabolismKcal"],
    ["Disposição", "disposition"],
    ["notas", "notes"],
    ["created_at", "createdAt"],
  ])("maps %s to %s", (header, field) => {
    expect(findCsvField(header)).toBe(field)
  })

  it("matches exactly, with no substring or fuzzy matching", () => {
    for (const header of [
      "IMC",
      "Peso ideal",
      "Gordura corporal",
      "pesos",
      "Datas",
    ]) {
      expect(findCsvField(header)).toBeUndefined()
    }
  })
})

describe("decoding and delimiter", () => {
  it("strips a UTF-8 BOM", () => {
    expect(decodeCsvBytes(bytes("﻿date;peso"))).toBe("date;peso")
  })

  it("falls back to Windows-1252 when the bytes are not UTF-8", () => {
    expect(decodeCsvBytes(bytes("Músculo;Disposição", "latin1"))).toBe(
      "Músculo;Disposição",
    )
  })

  it("detects the delimiter from the header line only", () => {
    expect(detectDelimiter("Data;Peso\n1,5;2")).toBe(";")
    expect(detectDelimiter("date,weight_kg\n1;2;3")).toBe(",")
  })

  it("reads quoted cells with delimiters and line breaks, and rejects an open quote", () => {
    expect(parseCsvRecords('a;"b;c";"d\ne"\n', ";")).toEqual([
      ["a", "b;c", "d\ne"],
    ])
    expect(parseCsvRecords('a;"b', ";")).toBeNull()
  })
})

describe("date parsing", () => {
  it.each([
    ["2026-06-28", "2026-06-28"],
    ["28/06/2026", "2026-06-28"],
    ["1/6/2026", "2026-06-01"],
  ])("accepts %s", (value, expected) => {
    expect(parseCsvDate(value)).toBe(expected)
  })

  it.each([
    "28/06",
    "28/06/26",
    "2026-02-30",
    "31/04/2026",
    "2026/06/28",
    "",
    "28-06-2026",
  ])("rejects %s", (value) => {
    expect(parseCsvDate(value)).toBeNull()
  })
})

describe("number parsing", () => {
  it("accepts dot and comma decimals", () => {
    expect(parseCsvNumber("72.5")).toBe(72.5)
    expect(parseCsvNumber("72,5")).toBe(72.5)
    expect(parseCsvNumber(" 7 ")).toBe(7)
  })

  it("reads a thousands dot only when asked", () => {
    expect(parseCsvNumber("1.696", { thousandsDot: true })).toBe(1696)
    expect(parseCsvNumber("1.696")).toBe(1.696)
  })

  it.each(["72,5 kg", "14%", "7h", "6-7", "-5", "1,5,2", "abc"])(
    "rejects %s",
    (value) => {
      expect(parseCsvNumber(value)).toBeNull()
    },
  )
})

describe("analyzeMeasurementsCsv", () => {
  const analysis = analyzeMeasurementsCsv(bytes(SPREADSHEET_CSV, "latin1"), NOW)

  it("classifies the spreadsheet fixture", () => {
    expect(analysis.ignoredColumns).toEqual(["IMC"])
    expect(analysis.noMeasurementCount).toBe(1)
    expect(analysis.validRows.map((row) => row.date)).toEqual([
      "2026-06-28",
      "2026-06-25",
    ])
    expect(analysis.invalidRowCount).toBe(2)
  })

  it("parses values and keeps only the file's columns", () => {
    expect(analysis.validRows[0]).toEqual({
      createdAt: undefined,
      date: "2026-06-28",
      fields: {
        bodyFatPercentage: 14.2,
        disposition: 4,
        musclePercentage: 43.1,
        restingMetabolismKcal: 1696,
        sleepHours: 7.5,
        waistCm: 81.5,
      },
      updatedAt: NOW,
      weightKg: 72.5,
    })
    expect(analysis.validRows[1]?.fields).toMatchObject({ sleepHours: null })
    expect(analysis.validRows[1]?.fields).not.toHaveProperty("notes")
  })

  it("reports row, original header, value and a Portuguese reason", () => {
    expect(analysis.invalidRows).toEqual([
      { column: "Data", message: "Data obrigatória.", row: 4, value: "" },
      {
        column: "Sono",
        message: expect.stringContaining("Número inválido"),
        row: 6,
        value: "6-7",
      },
    ])
  })
})

describe("row classification", () => {
  const analyze = (...lines: string[]) =>
    analyzeMeasurementsCsv(bytes(lines.join("\n")), NOW)

  it("makes a repeated date invalid, naming the earlier row, across formats", () => {
    const result = analyze(
      "Data,Peso",
      "2026-06-10,72",
      "10/6/2026,73",
      "11/06/2026,74",
    )

    expect(result.validRows.map((row) => row.weightKg)).toEqual([72, 74])
    expect(result.invalidRows).toEqual([
      {
        column: "Data",
        message: "Data repetida: já aparece na linha 2.",
        row: 3,
        value: "10/6/2026",
      },
    ])
  })

  it("treats notes without weight as invalid, not as no measurement", () => {
    const result = analyze("date,weight_kg,notes", "2026-06-10,,só uma nota")

    expect(result.validRows).toEqual([])
    expect(result.noMeasurementCount).toBe(0)
    expect(result.invalidRows).toEqual([
      { column: "weight_kg", message: "Peso obrigatório.", row: 2, value: "" },
    ])
  })

  it("applies the limits from the domain", () => {
    const result = analyze(
      "date,weight_kg,disposition",
      "2026-06-10,500,3",
      "2026-06-11,72,3.5",
    )

    expect(
      result.invalidRows.map((error) => [error.row, error.column]),
    ).toEqual([
      [2, "weight_kg"],
      [3, "disposition"],
    ])
  })

  it("counts a row with several bad cells once", () => {
    const result = analyze("date,weight_kg,waist_cm", "banana,abc,10")

    expect(result.invalidRowCount).toBe(1)
    expect(result.invalidRows).toHaveLength(3)
  })

  it("flags a row whose cell count differs from the header", () => {
    const result = analyze("date,weight_kg", "2026-06-10,72,5,1")

    expect(result.invalidRows[0]).toMatchObject({ row: 2 })
  })

  it("tolerates trailing delimiters and ignores blank lines", () => {
    const result = analyze("Data;Peso;", "10/06/2026;72,5;", "", ";;")

    expect(result.validRows).toHaveLength(1)
    expect(result.invalidRowCount).toBe(0)
  })

  it("uses the file's timestamps when present and leaves created_at unset otherwise", () => {
    const result = analyze(
      "date,weight_kg,created_at,updated_at",
      "2026-06-10,72,2026-06-01T10:00:00.000Z,",
    )

    expect(result.validRows[0]).toMatchObject({
      createdAt: "2026-06-01T10:00:00.000Z",
      updatedAt: NOW,
    })
  })
})

describe("file-level errors", () => {
  const message = (text: string) => {
    try {
      analyzeMeasurementsCsv(bytes(text), NOW)
    } catch (error) {
      return (error as Error).message
    }
  }

  it("names the missing required column", () => {
    expect(message("Data,Gordura\n1/1/2026,10")).toContain('"Peso"')
    expect(message("Peso,Gordura\n72,10")).toContain('"Data"')
  })

  it("rejects two headers mapped to the same field, naming both", () => {
    const text = message("Data,Peso,weight_kg\n1/1/2026,72,72")

    expect(text).toContain('"Peso"')
    expect(text).toContain('"weight_kg"')
  })

  it("rejects an empty file and an unreadable one", () => {
    expect(message("  \n")).toBe("O arquivo CSV está vazio.")
    expect(message('date,weight_kg\n"2026-01-01,72')).toBe(
      "Não foi possível ler o arquivo CSV.",
    )
  })
})

describe("round trip", () => {
  it("imports the app's own export with no ignored columns or errors", () => {
    const csv = serializeMeasurementsCsv([
      {
        bodyFatPercentage: 14.46,
        createdAt: "2026-06-09T12:00:00.000Z",
        date: "2026-06-10",
        disposition: 4,
        id: "a",
        musclePercentage: 43.72,
        notes: 'Slept well, "no" coffee',
        restingMetabolismKcal: 1700,
        sleepHours: 7.5,
        updatedAt: "2026-06-09T12:00:00.000Z",
        waistCm: 81.5,
        weightKg: 72.9,
      },
    ])
    const result = analyzeMeasurementsCsv(bytes(csv), NOW)

    expect(result.ignoredColumns).toEqual([])
    expect(result.invalidRows).toEqual([])
    expect(result.validRows[0]).toMatchObject({
      createdAt: "2026-06-09T12:00:00.000Z",
      fields: { notes: 'Slept well, "no" coffee', waistCm: 81.5 },
      weightKg: 72.9,
    })
  })
})
