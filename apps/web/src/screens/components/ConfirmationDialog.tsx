import { useLayoutEffect, useRef, type ReactNode } from "react"
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
  title: ReactNode
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
  const openerRef = useRef<HTMLElement | null>(null)

  // The dialog is opened from state, not a Trigger, so Radix has no element to
  // return focus to; remember the opener before the dialog moves focus.
  useLayoutEffect(() => {
    if (open && document.activeElement instanceof HTMLElement) {
      openerRef.current = document.activeElement
    }
  }, [open])

  return (
    <AlertDialog.Root open={open} onOpenChange={onOpenChange}>
      <AlertDialog.Content
        maxWidth="420px"
        onCloseAutoFocus={(event) => {
          event.preventDefault()
          openerRef.current?.focus()
        }}
      >
        <AlertDialog.Title>{title}</AlertDialog.Title>
        <AlertDialog.Description>{description}</AlertDialog.Description>

        <Flex className="dialog-actions" direction="column" gap="2" mt="4">
          <AlertDialog.Cancel>
            <Button
              disabled={isConfirming}
              fullWidth
              type="button"
              variant="secondary"
            >
              {cancelLabel}
            </Button>
          </AlertDialog.Cancel>
          <AlertDialog.Action>
            <Button
              disabled={isConfirming}
              fullWidth
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
