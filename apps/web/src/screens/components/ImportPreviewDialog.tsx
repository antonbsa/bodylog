import type { ReactNode } from "react"
import { CaretRight } from "@phosphor-icons/react/dist/csr/CaretRight"
import { Dialog, Flex } from "@radix-ui/themes"

import { Button } from "../../components/Button"
import type { CsvImportPreview } from "../../../../../types/measurements"
import { formatDisplayDateFromIso } from "../../utils/date-format"
import {
  describeImportErrorGroup,
  getImportAction,
  groupImportErrors,
  plural,
} from "../../utils/csv-import-summary"

type ImportPreviewDialogProps = {
  isImporting: boolean
  onCancel: () => void
  onConfirm: (skipInvalid: boolean) => void
  preview: CsvImportPreview | null
}

type Detail = {
  items: Array<{ key: string; label: string; value?: string }>
  subtitle: string
  title: string
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

            {preview.ignoredColumns.length > 0 && (
              <p className="import-note">
                Colunas ignoradas: {preview.ignoredColumns.join(", ")}
              </p>
            )}

            {preview.updatedDates.length > 0 && (
              <ul className="import-list">
                <li>
                  <DetailRow
                    count={plural(preview.updatedDates.length, "data", "datas")}
                    detail={{
                      items: preview.updatedDates.map((date) => ({
                        key: date,
                        label: formatDisplayDateFromIso(date),
                      })),
                      subtitle: "Estas datas já têm medida salva.",
                      title: "Datas que serão atualizadas",
                    }}
                  >
                    <strong>Datas que serão atualizadas</strong>
                  </DetailRow>
                </li>
              </ul>
            )}
            {preview.invalidRows.length > 0 && (
              <section aria-labelledby="import-invalid-heading">
                <h3 className="import-heading" id="import-invalid-heading">
                  Linhas inválidas
                </h3>
                <ul className="import-list">
                  {groupImportErrors(preview.invalidRows).map((group) => {
                    const { hint, title } = describeImportErrorGroup(group)

                    return (
                      <li key={`${group.column}-${group.message}`}>
                        <DetailRow
                          count={plural(group.errors.length, "linha", "linhas")}
                          detail={{
                            items: group.errors.map((error, index) => ({
                              key: `${error.row}-${index}`,
                              label: `Linha ${error.row}`,
                              value: error.value,
                            })),
                            subtitle: hint,
                            title,
                          }}
                        >
                          <strong>{title}</strong>
                          {hint && (
                            <span className="import-row-message">{hint}</span>
                          )}
                        </DetailRow>
                      </li>
                    )
                  })}
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

/** A full-width row that opens the complete list in a sheet, so the preview keeps one row per group however long the list is. */
function DetailRow({
  children,
  count,
  detail,
}: {
  children: ReactNode
  count: string
  detail: Detail
}) {
  return (
    <Dialog.Root>
      <Dialog.Trigger>
        <button className="import-row" type="button">
          <span className="import-row-text">{children}</span>
          <span className="import-row-count">{count}</span>
          <CaretRight
            aria-hidden
            className="import-row-caret"
            size={16}
            weight="bold"
          />
        </button>
      </Dialog.Trigger>
      <Dialog.Content aria-describedby={undefined} className="import-sheet">
        <Dialog.Title className="import-sheet-title">
          {detail.title}
        </Dialog.Title>
        {detail.subtitle && (
          <p className="import-sheet-subtitle">{detail.subtitle}</p>
        )}
        <ul className="import-sheet-list">
          {detail.items.map((item) => (
            <li key={item.key}>
              <span>{item.label}</span>
              {item.value !== undefined && (
                <span className="import-sheet-value">{item.value}</span>
              )}
            </li>
          ))}
        </ul>
        <Dialog.Close>
          <Button fullWidth type="button" variant="secondary">
            Fechar
          </Button>
        </Dialog.Close>
      </Dialog.Content>
    </Dialog.Root>
  )
}
