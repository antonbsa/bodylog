import { useState } from "react"
import { Callout } from "@radix-ui/themes"

import { Button } from "../../components/Button"
import { ConfirmationDialog } from "./ConfirmationDialog"
import { MeasurementHistoryTable } from "./MeasurementHistoryTable"
import { formatDisplayDateFromIso } from "../../utils/date-format"
import type { MeasurementHistoryState } from "../../hooks/useMeasurementHistory"
import type { ListedMeasurement } from "../../types"

type MeasurementHistoryProps = {
  onEditMeasurement: (date: string) => void
  onLoadMore: () => void
  onRemove: (
    measurement: ListedMeasurement,
    displayDate: string,
  ) => Promise<boolean>
  state: MeasurementHistoryState
}

export function MeasurementHistory({
  onEditMeasurement,
  onLoadMore,
  onRemove,
  state,
}: MeasurementHistoryProps) {
  const [pendingDeleteMeasurement, setPendingDeleteMeasurement] =
    useState<ListedMeasurement | null>(null)

  const isInitialLoading =
    state.status === "loading" && state.items.length === 0
  const isEmpty = state.status === "loaded" && state.items.length === 0

  const pendingDeleteDisplayDate = pendingDeleteMeasurement
    ? formatDisplayDateFromIso(pendingDeleteMeasurement.date)
    : null

  function handleDeleteDialogOpenChange(open: boolean) {
    if (state.deletingId) {
      return
    }

    if (!open) {
      setPendingDeleteMeasurement(null)
    }
  }

  function handleConfirmDeleteMeasurement() {
    if (!pendingDeleteMeasurement || !pendingDeleteDisplayDate) {
      return
    }

    onRemove(pendingDeleteMeasurement, pendingDeleteDisplayDate).then(
      (removed) => {
        if (removed) {
          setPendingDeleteMeasurement(null)
        }
      },
    )
  }

  return (
    <section className="history-section" aria-label="Histórico de medidas">
      {state.status === "error" ? (
        <Callout.Root color="red" role="alert">
          <Callout.Text>
            {state.message ?? "Não foi possível carregar o histórico."}
          </Callout.Text>
        </Callout.Root>
      ) : null}

      {isInitialLoading ? (
        <Callout.Root role="status">
          <Callout.Text>Carregando histórico...</Callout.Text>
        </Callout.Root>
      ) : null}

      {state.message && state.status !== "error" ? (
        <Callout.Root
          color={state.messageKind === "error" ? "red" : "green"}
          role="status"
        >
          <Callout.Text>{state.message}</Callout.Text>
        </Callout.Root>
      ) : null}

      {isEmpty ? <p className="history-empty">Nenhum registro ainda.</p> : null}

      {state.items.length > 0 ? (
        <MeasurementHistoryTable
          deletingMeasurementId={state.deletingId}
          measurements={state.items}
          onDeleteMeasurement={setPendingDeleteMeasurement}
          onEditMeasurement={onEditMeasurement}
        />
      ) : null}

      {state.hasMore ? (
        <Button
          disabled={state.status === "loading"}
          fullWidth
          onClick={onLoadMore}
          type="button"
          variant="secondary"
        >
          {state.status === "loading" ? "Carregando..." : "Carregar mais"}
        </Button>
      ) : null}

      <ConfirmationDialog
        confirmLabel="Excluir medida"
        confirmingLabel="Excluindo..."
        description={
          pendingDeleteDisplayDate
            ? `Excluir a medida de ${pendingDeleteDisplayDate}? Esta ação não pode ser desfeita.`
            : ""
        }
        isConfirming={state.deletingId !== null}
        onConfirm={handleConfirmDeleteMeasurement}
        onOpenChange={handleDeleteDialogOpenChange}
        open={pendingDeleteMeasurement !== null}
        title="Excluir medida"
      />
    </section>
  )
}
