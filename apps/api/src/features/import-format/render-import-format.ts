import { MEASUREMENT_LIMITS } from "../../../../../domain/measurement"
import { FIELD_ALIASES, type CsvField } from "../csv/csv-columns"

type FieldDescription = {
  description: string
  type: string
  unit: string
}

/** Typed on every `CsvField` so a new field can't ship without a description on the page. */
const FIELD_DESCRIPTIONS: Record<CsvField, FieldDescription> = {
  date: {
    description: "Dia da medida. Obrigatório. Uma medida por data.",
    type: "date",
    unit: "-",
  },
  weightKg: {
    description: "Peso corporal. Obrigatório.",
    type: "decimal",
    unit: "kg",
  },
  bodyFatPercentage: {
    description: "Percentual de gordura corporal.",
    type: "decimal",
    unit: "%",
  },
  musclePercentage: {
    description: "Percentual de massa muscular.",
    type: "decimal",
    unit: "%",
  },
  restingMetabolismKcal: {
    description:
      "Metabolismo basal. Valores com fração são arredondados; `1.696` é lido como 1696.",
    type: "decimal",
    unit: "kcal",
  },
  waistCm: {
    description: "Circunferência da cintura.",
    type: "decimal",
    unit: "cm",
  },
  sleepHours: {
    description: "Horas dormidas na noite anterior, em decimal (7.5 = 7h30).",
    type: "decimal",
    unit: "h",
  },
  disposition: {
    description: "Disposição do dia, de 1 (pior) a 5 (melhor).",
    type: "integer",
    unit: "-",
  },
  notes: {
    description: "Texto livre.",
    type: "text",
    unit: "-",
  },
  createdAt: {
    description:
      "Quando a medida foi criada. Mantém o valor original da medida. Só existe em exportações do BodyLog.",
    type: "timestamp ISO 8601",
    unit: "-",
  },
  updatedAt: {
    description:
      "Quando a medida foi alterada pela última vez. Mantém o valor original; sem a coluna, vale o horário da importação. Só existe em exportações do BodyLog.",
    type: "timestamp ISO 8601",
    unit: "-",
  },
}

const EXAMPLE_CSV = `date,weight_kg,body_fat_percentage,muscle_percentage,resting_metabolism_kcal,waist_cm,sleep_hours,disposition,notes
2026-06-01,82.4,21.5,38.2,1696,92,7.5,4,Treino de perna
2026-06-02,82.1,,,,,6,3,
2026-06-03,81.9,21.3,,,,,,`

function limitsOf(field: CsvField): string {
  if (!(field in MEASUREMENT_LIMITS)) {
    return "-"
  }

  const limit = MEASUREMENT_LIMITS[field as keyof typeof MEASUREMENT_LIMITS]
  const range = `${limit.min} a ${limit.max}`

  return "integer" in limit ? `${range} (inteiro)` : range
}

function fieldRow(field: CsvField): string {
  const { description, type, unit } = FIELD_DESCRIPTIONS[field]
  const [canonical = "", ...others] = FIELD_ALIASES[field]
  const aliases = others.map((alias) => `\`${alias}\``).join(", ") || "-"

  return `| \`${canonical}\` | ${aliases} | ${type} | ${unit} | ${limitsOf(field)} | ${description} |`
}

/** Markdown page that tells an agent how to turn a spreadsheet into a CSV the importer accepts. */
export function renderImportFormat(): string {
  const rows = (Object.keys(FIELD_ALIASES) as CsvField[]).map(fieldRow)

  return `# Formato de importação de CSV do BodyLog

Estas instruções são para um agente que vai converter a planilha de uma pessoa em um arquivo CSV que o BodyLog importa. Extraia só os dados deste formato, nunca invente nem estime valores e não faça perguntas durante a conversão: o que não se encaixar fica de fora e vai na lista de ignorados.

## Campos

Só \`date\` e \`weight_kg\` são obrigatórios. Use sempre o cabeçalho canônico (primeira coluna da tabela). A coluna "Outros cabeçalhos" lista os nomes que o importador também aceita; a comparação ignora maiúsculas, acentos e a diferença entre \`_\`, \`-\` e espaço. Valores fora dos limites tornam a linha inválida.

| Cabeçalho canônico | Outros cabeçalhos | Tipo | Unidade | Limites | Descrição |
| --- | --- | --- | --- | --- | --- |
${rows.join("\n")}

## Formato de saída

Gere o arquivo neste formato único:

- Cabeçalhos canônicos em inglês (\`date\`, \`weight_kg\`, ...).
- Delimitador \`,\`.
- Datas em \`YYYY-MM-DD\`.
- Números com ponto decimal e sem separador de milhar, sem unidades.
- Codificação UTF-8.

O importador também aceita datas \`D/M/YYYY\`, vírgula decimal, delimitador \`;\` e Windows-1252, mas não os use ao gerar o arquivo.

## Regras de conversão

1. Descubra qual coluna da planilha corresponde a cada campo. Coluna sem campo correspondente (por exemplo IMC, ou gordura em kg) é descartada, sem conversão. Dados fora do formato não entram no arquivo.
2. Datas: se alguma data da coluna tiver uma parte maior que 12, deduza a ordem dia/mês a partir dela. Se nenhuma tiver, a ordem não pode ser definida e todas as linhas dessa coluna ficam de fora. Se faltar o ano, use o ano atual.
3. Se uma data aparecer em mais de uma linha, todas as linhas dessa data ficam de fora. O arquivo não pode ter a mesma data duas vezes.
4. Remova unidades e símbolos (\`82,4 kg\` vira \`82.4\`, \`21%\` vira \`21\`). Valor solto, mal definido ou que não cabe no campo (uma faixa como \`6-7\`, texto onde vai um número, um valor fora dos limites) faz a linha inteira ficar de fora.
5. Valor desconhecido fica vazio. Nunca estime nem preencha com um padrão.
6. Se a planilha não tem uma coluna, não inclua a coluna no arquivo. Uma célula vazia também mantém o valor já salvo daquela data (a importação nunca apaga um valor); você não sabe quais datas já têm registro, então uma linha com peso desconhecido entra no arquivo com \`weight_kg\` vazio; em uma data nova a prévia a marca como inválida e a pessoa pode pulá-la ali.
7. Linhas sem nenhum valor além da data são ignoradas; linhas totalmente vazias também.

## created_at e updated_at

Essas colunas existem só em exportações do BodyLog. Se a planilha for uma exportação do BodyLog, mantenha-as como estão. Em qualquer outro caso, não as inclua, nunca as crie nem invente. Sem \`updated_at\`, o BodyLog usa o horário da importação.

## Exemplo válido

\`\`\`csv
${EXAMPLE_CSV}
\`\`\`

## Último passo

Entregue à pessoa o arquivo CSV e a lista do que ficou de fora: colunas descartadas e padrões de linhas ignoradas, cada um com linhas de exemplo. Se ela quiser ajustes, faça-os em uma segunda rodada. A pessoa importa o arquivo em Ajustes, no BodyLog, e confere a prévia antes de confirmar.
`
}
