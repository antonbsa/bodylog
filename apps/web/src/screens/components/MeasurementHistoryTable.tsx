import { useState } from "react"
import { ScrollArea, Table } from "@radix-ui/themes"

import { Button } from "../../components/Button"
import { formatDisplayDateFromIso } from "../../utils/date-format"
import {
  formatDisplayNumber,
  formatOptionalPreciseDisplayNumber,
  formatPreciseDisplayNumber,
} from "../../utils/number-format"
import type { ListedMeasurement } from "../../types"

type MeasurementHistoryTableProps = {
  deletingMeasurementId: string | null
  measurements: ListedMeasurement[]
  onDeleteMeasurement: (measurement: ListedMeasurement) => void
  onEditMeasurement: (date: string) => void
}

type MeasurementHistoryRowProps = {
  deletingMeasurementId: string | null
  isDetailExpanded: boolean
  measurement: ListedMeasurement
  onDeleteMeasurement: (measurement: ListedMeasurement) => void
  onEditMeasurement: (date: string) => void
  onToggleDetail: (measurementId: string) => void
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
  deletingMeasurementId,
  isDetailExpanded,
  measurement,
  onDeleteMeasurement,
  onEditMeasurement,
  onToggleDetail,
}: MeasurementHistoryRowProps) {
  const displayDate = formatDisplayDateFromIso(measurement.date)
  const isDeleting = deletingMeasurementId === measurement.id

  return (
    <>
      <Table.Row>
        <Table.RowHeaderCell>{displayDate}</Table.RowHeaderCell>
        <Table.Cell>{formatKg(measurement.weightKg)}</Table.Cell>
        <Table.Cell>{formatPercentage(measurement.bodyFatPercentage)}</Table.Cell>
        <Table.Cell>{formatPercentage(measurement.musclePercentage)}</Table.Cell>
        <Table.Cell className="history-col-detail">
          {formatPreciseDisplayNumber(measurement.derived.bmi)}
        </Table.Cell>
        <Table.Cell className="history-col-detail">
          {formatOptionalKg(measurement.derived.bodyFatKg)}
        </Table.Cell>
        <Table.Cell className="history-col-detail">
          {formatOptionalKg(measurement.derived.muscleKg)}
        </Table.Cell>
        <Table.Cell className="history-col-detail">
          {formatRestingMetabolism(measurement.restingMetabolismKcal)}
        </Table.Cell>
        <Table.Cell>
          <div className="history-actions">
            <Button
              disabled={isDeleting}
              onClick={() => onEditMeasurement(measurement.date)}
              size="compact"
              type="button"
              variant="secondary"
            >
              Editar
            </Button>
            <Button
              aria-label={`Excluir medida de ${displayDate}`}
              disabled={isDeleting}
              onClick={() => onDeleteMeasurement(measurement)}
              size="compact"
              type="button"
              variant="danger"
            >
              {isDeleting ? "Excluindo..." : "Excluir"}
            </Button>
          </div>
        </Table.Cell>
        <Table.Cell className="history-col-toggle">
          <Button
            aria-expanded={isDetailExpanded}
            onClick={() => onToggleDetail(measurement.id)}
            size="compact"
            type="button"
            variant="secondary"
          >
            {isDetailExpanded ? "Ocultar" : "Detalhes"}
          </Button>
        </Table.Cell>
      </Table.Row>
      {isDetailExpanded ? (
        <Table.Row className="history-detail-row">
          <Table.Cell colSpan={10}>
            <dl className="history-detail-list">
              <div>
                <dt>IMC</dt>
                <dd>{formatPreciseDisplayNumber(measurement.derived.bmi)}</dd>
              </div>
              <div>
                <dt>BF (kg)</dt>
                <dd>{formatOptionalKg(measurement.derived.bodyFatKg)}</dd>
              </div>
              <div>
                <dt>Músculo (kg)</dt>
                <dd>{formatOptionalKg(measurement.derived.muscleKg)}</dd>
              </div>
              <div>
                <dt>RM</dt>
                <dd>
                  {formatRestingMetabolism(measurement.restingMetabolismKcal)}
                </dd>
              </div>
            </dl>
          </Table.Cell>
        </Table.Row>
      ) : null}
    </>
  )
}

export function MeasurementHistoryTable({
  deletingMeasurementId,
  measurements,
  onDeleteMeasurement,
  onEditMeasurement,
}: MeasurementHistoryTableProps) {
  const [expandedMeasurementId, setExpandedMeasurementId] = useState<
    string | null
  >(null)

  function handleToggleDetail(measurementId: string) {
    setExpandedMeasurementId((currentId) =>
      currentId === measurementId ? null : measurementId,
    )
  }

  return (
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
              <Table.ColumnHeaderCell>BF (%)</Table.ColumnHeaderCell>
              <Table.ColumnHeaderCell>Músculo (%)</Table.ColumnHeaderCell>
              <Table.ColumnHeaderCell className="history-col-detail">
                IMC
              </Table.ColumnHeaderCell>
              <Table.ColumnHeaderCell className="history-col-detail">
                BF (kg)
              </Table.ColumnHeaderCell>
              <Table.ColumnHeaderCell className="history-col-detail">
                Músculo (kg)
              </Table.ColumnHeaderCell>
              <Table.ColumnHeaderCell className="history-col-detail">
                RM
              </Table.ColumnHeaderCell>
              <Table.ColumnHeaderCell>Ações</Table.ColumnHeaderCell>
              <Table.ColumnHeaderCell className="history-col-toggle">
                <span className="visually-hidden">Detalhes</span>
              </Table.ColumnHeaderCell>
            </Table.Row>
          </Table.Header>
          <Table.Body>
            {measurements.map((measurement) => (
              <MeasurementHistoryRow
                deletingMeasurementId={deletingMeasurementId}
                isDetailExpanded={expandedMeasurementId === measurement.id}
                key={measurement.id}
                measurement={measurement}
                onDeleteMeasurement={onDeleteMeasurement}
                onEditMeasurement={onEditMeasurement}
                onToggleDetail={handleToggleDetail}
              />
            ))}
          </Table.Body>
          <tfoot aria-hidden="true">
            <Table.Row>
              <Table.Cell className="history-table-scroll-spacer" colSpan={10} />
            </Table.Row>
          </tfoot>
        </table>
      </div>
    </ScrollArea>
  )
}
