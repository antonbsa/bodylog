import { useState, type SubmitEvent } from "react"
import { Dialog, Flex } from "@radix-ui/themes"

import { Button } from "../../components/Button"
import { HEIGHT_FIELD, validateHeightDigits } from "../../utils/height"
import { numberToMaskedDigits } from "../../utils/numeric-mask"
import { NumberField } from "./NumberField"

type HeightDialogProps = {
  heightCm: number | null
  isSaving: boolean
  onOpenChange: (open: boolean) => void
  onSave: (heightCm: number) => void
  open: boolean
}

/** Edits the height BMI is computed from; mounted only while open, so each opening starts from the stored value. */
export function HeightDialog({
  heightCm,
  isSaving,
  onOpenChange,
  onSave,
  open,
}: HeightDialogProps) {
  return (
    <Dialog.Root onOpenChange={onOpenChange} open={open}>
      <Dialog.Content aria-describedby={undefined} maxWidth="420px">
        <Dialog.Title>Altura</Dialog.Title>
        {open ? (
          <HeightForm heightCm={heightCm} isSaving={isSaving} onSave={onSave} />
        ) : null}
      </Dialog.Content>
    </Dialog.Root>
  )
}

function HeightForm({
  heightCm,
  isSaving,
  onSave,
}: Pick<HeightDialogProps, "heightCm" | "isSaving" | "onSave">) {
  const [digits, setDigits] = useState(() =>
    numberToMaskedDigits(heightCm, HEIGHT_FIELD.decimals),
  )
  const [showError, setShowError] = useState(false)
  const error = validateHeightDigits(digits)

  function handleSubmit(event: SubmitEvent<HTMLFormElement>) {
    event.preventDefault()
    setShowError(true)

    if (error === "" && !isSaving) {
      onSave(Number(digits))
    }
  }

  return (
    <form noValidate onSubmit={handleSubmit}>
      <NumberField
        config={HEIGHT_FIELD}
        digits={digits}
        error={showError ? error : ""}
        hint="Usada no cálculo do IMC"
        id="field-height"
        inputRef={null}
        onBlur={() => setShowError(digits !== "")}
        onDigitsChange={setDigits}
      />
      <Flex className="dialog-actions" direction="column" gap="2" mt="4">
        <Dialog.Close>
          <Button
            disabled={isSaving}
            fullWidth
            type="button"
            variant="secondary"
          >
            Cancelar
          </Button>
        </Dialog.Close>
        <Button disabled={isSaving} fullWidth type="submit" variant="primary">
          {isSaving ? "Salvando..." : "Salvar"}
        </Button>
      </Flex>
    </form>
  )
}
