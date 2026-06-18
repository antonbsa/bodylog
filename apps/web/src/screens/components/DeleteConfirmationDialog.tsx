import { AlertDialog, Flex } from "@radix-ui/themes"

import { Button } from "../../components/Button"

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
      <AlertDialog.Content maxWidth="420px">
        <AlertDialog.Title>Excluir medida</AlertDialog.Title>
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
              variant="danger"
            >
              {isConfirming ? "Excluindo..." : "Excluir medida"}
            </Button>
          </AlertDialog.Action>
        </Flex>
      </AlertDialog.Content>
    </AlertDialog.Root>
  )
}
