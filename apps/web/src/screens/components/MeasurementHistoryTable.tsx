import { ScrollArea, Table, Theme } from "@radix-ui/themes"

import type { ListedMeasurement } from "../../api/measurements"
import { formatDisplayDateFromIso } from "../../utils/date-format"
import {
  formatDisplayNumber,
  formatOptionalPreciseDisplayNumber,
  formatPreciseDisplayNumber,
} from "../../utils/number-format"

type MeasurementHistoryTableProps = {
  measurements: ListedMeasurement[]
  onEditMeasurement: (date: string) => void
}

type MeasurementHistoryRowProps = {
  measurement: ListedMeasurement
  onEditMeasurement: (date: string) => void
}

function formatKg(value: number): string {
  return `${formatPreciseDisplayNumber(value)} kg`
}

function formatOptionalKg(value: number | null): string {
  return value === null
    ? "-"
    : `${formatOptionalPreciseDisplayNumber(value)} kg`
}

function formatPercentage(value: number | null): string {
  return value === null ? "-" : `${formatPreciseDisplayNumber(value)}%`
}

function formatRestingMetabolism(value: number | null): string {
  return value === null ? "-" : `${formatDisplayNumber(value)} kcal`
}

function MeasurementHistoryRow({
  measurement,
  onEditMeasurement,
}: MeasurementHistoryRowProps) {
  const displayDate = formatDisplayDateFromIso(measurement.date)

  return (
    <Table.Row>
      <Table.RowHeaderCell>{displayDate}</Table.RowHeaderCell>
      <Table.Cell>{formatKg(measurement.weightKg)}</Table.Cell>
      <Table.Cell>
        {formatPreciseDisplayNumber(measurement.derived.bmi)}
      </Table.Cell>
      <Table.Cell>{formatPercentage(measurement.bodyFatPercentage)}</Table.Cell>
      <Table.Cell>{formatOptionalKg(measurement.derived.bodyFatKg)}</Table.Cell>
      <Table.Cell>{formatPercentage(measurement.musclePercentage)}</Table.Cell>
      <Table.Cell>{formatOptionalKg(measurement.derived.muscleKg)}</Table.Cell>
      <Table.Cell>
        {formatRestingMetabolism(measurement.restingMetabolismKcal)}
      </Table.Cell>
      <Table.Cell>
        <div className="history-actions">
          <button
            className="secondary-action compact-action"
            onClick={() => onEditMeasurement(measurement.date)}
            type="button"
          >
            Editar
          </button>
          <button
            aria-label={`Excluir medida de ${displayDate}`}
            className="danger-action compact-action"
            onClick={() => undefined}
            type="button"
          >
            Excluir
          </button>
        </div>
      </Table.Cell>
    </Table.Row>
  )
}

export function MeasurementHistoryTable({
  measurements,
  onEditMeasurement,
}: MeasurementHistoryTableProps) {
  return (
    <Theme
      accentColor="gray"
      appearance="dark"
      asChild
      grayColor="slate"
      hasBackground={false}
      radius="small"
    >
      <ScrollArea
        className="history-table-scroll"
        scrollbars="horizontal"
        size="2"
        type="always"
      >
        <div className="history-table-content">
          <table className="history-table">
            <caption className="visually-hidden">Histórico de medidas</caption>
            <Table.Header>
              <Table.Row>
                <Table.ColumnHeaderCell>Data</Table.ColumnHeaderCell>
                <Table.ColumnHeaderCell>Peso</Table.ColumnHeaderCell>
                <Table.ColumnHeaderCell>IMC</Table.ColumnHeaderCell>
                <Table.ColumnHeaderCell>BF (%)</Table.ColumnHeaderCell>
                <Table.ColumnHeaderCell>BF (kg)</Table.ColumnHeaderCell>
                <Table.ColumnHeaderCell>Músculo (%)</Table.ColumnHeaderCell>
                <Table.ColumnHeaderCell>Músculo (kg)</Table.ColumnHeaderCell>
                <Table.ColumnHeaderCell>RM</Table.ColumnHeaderCell>
                <Table.ColumnHeaderCell>Ações</Table.ColumnHeaderCell>
              </Table.Row>
            </Table.Header>
            <Table.Body>
              {measurements.map((measurement) => (
                <MeasurementHistoryRow
                  key={measurement.id}
                  measurement={measurement}
                  onEditMeasurement={onEditMeasurement}
                />
              ))}
            </Table.Body>
            <tfoot aria-hidden="true">
              <Table.Row>
                <Table.Cell
                  className="history-table-scroll-spacer"
                  colSpan={9}
                />
              </Table.Row>
            </tfoot>
          </table>
        </div>
      </ScrollArea>
    </Theme>
  )
}
