/** The request that tells an agent to turn the user's spreadsheet into an import CSV; `formatSource` completes "Siga as instruções ..." with where the format lives. */
export function buildImportAgentPrompt(formatSource: string): string {
  return `Quero importar meu histórico de medidas no BodyLog. Siga as instruções ${formatSource} para converter a planilha que vou te enviar em um arquivo CSV. Extraia só os dados do formato e não invente valores. Não pergunte nada durante a conversão: o que não se encaixar fica de fora. Me devolva o arquivo para eu importar em Ajustes, junto com a lista do que foi ignorado.`
}
