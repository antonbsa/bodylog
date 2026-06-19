import { AlertDialog, Flex } from "@radix-ui/themes"

import { Button } from "../../components/Button"

type ConfirmationDialogVariant = "primary" | "secondary" | "danger"

type ConfirmationDialogProps = {
  cancelLabel?: string
  confirmLabel: string
  confirmVariant?: ConfirmationDialogVariant
  confirmingLabel?: string
  description: string
  isConfirming?: boolean
  onConfirm: () => void
  onOpenChange: (open: boolean) => void
  open: boolean
  title: string
}

export function ConfirmationDialog({
  cancelLabel = "Cancelar",
  confirmLabel,
  confirmVariant = "danger",
  confirmingLabel,
  description,
  isConfirming = false,
  onConfirm,
  onOpenChange,
  open,
  title,
}: ConfirmationDialogProps) {
  return (
    <AlertDialog.Root open={open} onOpenChange={onOpenChange}>
      <AlertDialog.Content maxWidth="420px">
        <AlertDialog.Title>{title}</AlertDialog.Title>
        <AlertDialog.Description>{description}</AlertDialog.Description>

        <Flex gap="3" justify="end" mt="4">
          <AlertDialog.Cancel>
            <Button disabled={isConfirming} type="button" variant="secondary">
              {cancelLabel}
            </Button>
          </AlertDialog.Cancel>
          <AlertDialog.Action>
            <Button
              disabled={isConfirming}
              onClick={(event) => {
                event.preventDefault()
                onConfirm()
              }}
              type="button"
              variant={confirmVariant}
            >
              {isConfirming && confirmingLabel ? confirmingLabel : confirmLabel}
            </Button>
          </AlertDialog.Action>
        </Flex>
      </AlertDialog.Content>
    </AlertDialog.Root>
  )
}
