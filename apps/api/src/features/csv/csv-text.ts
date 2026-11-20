export type CsvDelimiter = "," | ";"

/** Decodes UTF-8 (BOM stripped) and falls back to Windows-1252, which spreadsheet exports commonly use. */
export function decodeCsvBytes(bytes: ArrayBuffer): string {
  const data = new Uint8Array(bytes)
  const hasBom = data[0] === 0xef && data[1] === 0xbb && data[2] === 0xbf
  const content = hasBom ? data.subarray(3) : data

  try {
    return new TextDecoder("utf-8", { fatal: true }).decode(content)
  } catch {
    return new TextDecoder("windows-1252").decode(content)
  }
}

export function detectDelimiter(text: string): CsvDelimiter {
  const headerLine = text.split(/\r\n|\n|\r/, 1)[0] ?? ""
  const semicolons = headerLine.split(";").length - 1
  const commas = headerLine.split(",").length - 1

  return semicolons > commas ? ";" : ","
}

/** Splits CSV text into records, honoring quoted cells with delimiters, quotes and line breaks; null when a quote is left open or misplaced. */
export function parseCsvRecords(
  text: string,
  delimiter: CsvDelimiter,
): string[][] | null {
  const rows: string[][] = []
  let currentCell = ""
  let currentRow: string[] = []
  let isQuoted = false

  for (let index = 0; index < text.length; index += 1) {
    const character = text[index]
    const nextCharacter = text[index + 1]

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
        return null
      }

      isQuoted = true
    } else if (character === delimiter) {
      currentRow.push(currentCell)
      currentCell = ""
    } else if (character === "\n" || character === "\r") {
      currentRow.push(currentCell)
      rows.push(currentRow)
      currentCell = ""
      currentRow = []

      if (character === "\r" && nextCharacter === "\n") {
        index += 1
      }
    } else {
      currentCell += character
    }
  }

  if (isQuoted) {
    return null
  }

  if (currentCell.length > 0 || currentRow.length > 0) {
    currentRow.push(currentCell)
    rows.push(currentRow)
  }

  return rows
}
