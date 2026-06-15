import { AlertDialog } from "radix-ui"

type DeleteConfirmationDialogProps = {
  cancelLabel?: string
  description: string
  isConfirming?: boolean
  onConfirm: () => void
  onOpenChange: (open: boolean) => void
  open: boolean
}

export function DeleteConfirmationDialog({
  cancelLabel = "Cancelar",
  description,
  isConfirming = false,
  onConfirm,
  onOpenChange,
  open,
}: DeleteConfirmationDialogProps) {
  return (
    <AlertDialog.Root open={open} onOpenChange={onOpenChange}>
      <AlertDialog.Portal>
        <AlertDialog.Overlay className="confirmation-dialog-overlay" />
        <AlertDialog.Content className="confirmation-dialog">
          <AlertDialog.Title className="confirmation-dialog-title">
            Excluir medida
          </AlertDialog.Title>
          <AlertDialog.Description className="confirmation-dialog-description">
            {description}
          </AlertDialog.Description>

          <div className="confirmation-dialog-actions">
            <AlertDialog.Cancel asChild>
              <button
                className="secondary-action"
                disabled={isConfirming}
                type="button"
              >
                {cancelLabel}
              </button>
            </AlertDialog.Cancel>
            <AlertDialog.Action asChild>
              <button
                className="danger-action"
                disabled={isConfirming}
                onClick={(event) => {
                  event.preventDefault()
                  onConfirm()
                }}
                type="button"
              >
                {isConfirming ? "Excluindo..." : "Excluir medida"}
              </button>
            </AlertDialog.Action>
          </div>
        </AlertDialog.Content>
      </AlertDialog.Portal>
    </AlertDialog.Root>
  )
}
