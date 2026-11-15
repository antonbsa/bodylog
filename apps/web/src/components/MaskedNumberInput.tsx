import { useEffect, useRef, type ClipboardEvent, type Ref } from "react"

import {
  appendDigit,
  deleteDigit,
  digitsFromFieldValue,
  digitsFromPastedText,
  formatMaskedDigits,
} from "../utils/numeric-mask"

type MaskedNumberInputProps = {
  "aria-describedby"?: string
  "aria-invalid"?: boolean
  decimals: number
  digits: string
  id: string
  inputRef?: Ref<HTMLInputElement>
  maxDigits: number
  onBlur?: () => void
  onDigitsChange: (digits: string) => void
}

/** Controlled right-to-left numeric input: typing appends digits, the caret stays at the end. */
export function MaskedNumberInput({
  decimals,
  digits,
  inputRef,
  maxDigits,
  onBlur,
  onDigitsChange,
  ...inputProps
}: MaskedNumberInputProps) {
  const elementRef = useRef<HTMLInputElement | null>(null)
  const latest = useRef({ digits, maxDigits, onDigitsChange })

  latest.current = { digits, maxDigits, onDigitsChange }

  // Typing and deleting are handled before the browser edits the value, so
  // the caret position never changes which digit is affected.
  useEffect(() => {
    const element = elementRef.current

    if (!element) {
      return
    }

    function handleBeforeInput(event: InputEvent) {
      const current = latest.current

      if (event.inputType === "insertText" && event.data) {
        event.preventDefault()
        current.onDigitsChange(
          appendDigit(current.digits, event.data, current.maxDigits),
        )
      } else if (event.inputType.startsWith("delete")) {
        event.preventDefault()
        current.onDigitsChange(
          deleteDigit(
            current.digits,
            element!.selectionStart !== element!.selectionEnd,
          ),
        )
      }
    }

    element.addEventListener("beforeinput", handleBeforeInput)

    return () => element.removeEventListener("beforeinput", handleBeforeInput)
  }, [])

  function setRefs(element: HTMLInputElement | null) {
    elementRef.current = element

    if (typeof inputRef === "function") {
      inputRef(element)
    } else if (inputRef) {
      inputRef.current = element
    }
  }

  function moveCaretToEnd() {
    const element = elementRef.current

    if (element) {
      const end = element.value.length

      element.setSelectionRange(end, end)
    }
  }

  // Keep the caret at the end after every render of a focused field.
  useEffect(() => {
    if (document.activeElement === elementRef.current) {
      moveCaretToEnd()
    }
  }, [digits])

  function handlePaste(event: ClipboardEvent<HTMLInputElement>) {
    event.preventDefault()

    const pasted = digitsFromPastedText(
      event.clipboardData.getData("text"),
      decimals,
      maxDigits,
    )

    if (pasted !== null) {
      onDigitsChange(pasted)
    }
  }

  return (
    <input
      {...inputProps}
      autoComplete="off"
      className="num"
      inputMode="numeric"
      onBlur={onBlur}
      onChange={(event) =>
        onDigitsChange(
          digitsFromFieldValue(event.target.value, digits, maxDigits),
        )
      }
      onClick={() => setTimeout(moveCaretToEnd, 0)}
      onFocus={() => setTimeout(moveCaretToEnd, 0)}
      onPaste={handlePaste}
      placeholder={decimals > 0 ? "0,0" : "0"}
      ref={setRefs}
      type="text"
      value={formatMaskedDigits(digits, decimals)}
    />
  )
}
