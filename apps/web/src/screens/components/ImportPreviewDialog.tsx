import { Dialog, Flex } from "@radix-ui/themes"

import { Button } from "../../components/Button"
import type { CsvImportPreview } from "../../../../../types/measurements"
import { formatDisplayDateFromIso } from "../../utils/date-format"
import { getImportAction } from "../../utils/csv-import-summary"

type ImportPreviewDialogProps = {
  isImporting: boolean
  onCancel: () => void
  onConfirm: (skipInvalid: boolean) => void
  preview: CsvImportPreview | null
}

/** What the import would do, shown before anything is written. */
export function ImportPreviewDialog({
  isImporting,
  onCancel,
  onConfirm,
  preview,
}: ImportPreviewDialogProps) {
  const action = preview ? getImportAction(preview) : null

  return (
    <Dialog.Root
      onOpenChange={(open) => {
        if (!open && !isImporting) {
          onCancel()
        }
      }}
      open={preview !== null}
    >
      <Dialog.Content
        aria-describedby={undefined}
        className="import-preview"
        maxWidth="420px"
      >
        <Dialog.Title>Importar CSV</Dialog.Title>

        {preview && (
          <div className="import-preview-body">
            <p className="import-note">
              {preview.period
                ? `Período: ${formatDisplayDateFromIso(preview.period.from)} a ${formatDisplayDateFromIso(preview.period.to)}`
                : "Nenhuma medida válida no arquivo."}
            </p>

            <dl className="import-counts">
              <Count label="novas" value={preview.counts.created} />
              <Count label="atualizadas" value={preview.counts.updated} />
              <Count label="sem medida" value={preview.counts.noMeasurement} />
              <Count label="inválidas" value={preview.counts.invalid} />
            </dl>

            {preview.updatedDates.length > 0 && (
              <details className="import-details">
                <summary>
                  Datas que serão atualizadas
                  <span>
                    Ver {preview.updatedDates.length}{" "}
                    {preview.updatedDates.length === 1 ? "data" : "datas"}
                  </span>
                </summary>
                <ul>
                  {preview.updatedDates.map((date) => (
                    <li key={date}>{formatDisplayDateFromIso(date)}</li>
                  ))}
                </ul>
              </details>
            )}

            {preview.ignoredColumns.length > 0 && (
              <p className="import-note">
                Colunas ignoradas: {preview.ignoredColumns.join(", ")}
              </p>
            )}

            {preview.invalidRows.length > 0 && (
              <section aria-label="Linhas inválidas">
                <h3 className="import-heading">Linhas inválidas</h3>
                <ul className="import-errors">
                  {preview.invalidRows.map((error, index) => (
                    <li key={`${error.row}-${error.column}-${index}`}>
                      <strong>
                        Linha {error.row}
                        {error.column && ` · ${error.column}`}
                      </strong>
                      {error.value && <code>{error.value}</code>}
                      <span>{error.message}</span>
                    </li>
                  ))}
                </ul>
              </section>
            )}
          </div>
        )}

        <Flex className="dialog-actions" direction="column" gap="2" mt="4">
          {action && (
            <Button
              disabled={isImporting}
              fullWidth
              onClick={() => onConfirm(action.skipInvalid)}
              type="button"
            >
              {isImporting ? "Importando..." : action.label}
            </Button>
          )}
          <Button
            disabled={isImporting}
            fullWidth
            onClick={onCancel}
            type="button"
            variant="secondary"
          >
            Cancelar
          </Button>
        </Flex>
      </Dialog.Content>
    </Dialog.Root>
  )
}

function Count({ label, value }: { label: string; value: number }) {
  return (
    <div>
      <dd>{value}</dd>
      <dt>{label}</dt>
    </div>
  )
}
