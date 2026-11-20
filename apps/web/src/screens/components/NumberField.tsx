import type { Ref, SyntheticEvent } from "react"
import { Minus } from "@phosphor-icons/react/dist/csr/Minus"
import { Plus } from "@phosphor-icons/react/dist/csr/Plus"

import { MaskedNumberInput } from "../../components/MaskedNumberInput"
import type { NumericFieldConfig } from "../../utils/measurement-form"

type NumberFieldProps = {
  caption?: string
  config: NumericFieldConfig
  digits: string
  error: string
  hint: string
  id: string
  inputRef: Ref<HTMLInputElement>
  onBlur: () => void
  onDigitsChange: (digits: string) => void
  onStep?: (direction: 1 | -1) => void
}

// iOS closes the keyboard when focus leaves the input, so stop the buttons from taking focus on press.
const keepInputFocus = (event: SyntheticEvent) => event.preventDefault()

/** A labeled masked number row with a previous-value hint and a reserved error slot. */
export function NumberField({
  caption,
  config,
  digits,
  error,
  hint,
  id,
  inputRef,
  onBlur,
  onDigitsChange,
  onStep,
}: NumberFieldProps) {
  const hintId = `${id}-hint`
  const errorId = `${id}-error`

  return (
    <div className="field">
      <div className="frow">
        <div className="flabel-wrap">
          <label className="flabel" htmlFor={id}>
            {config.label}
          </label>
          {caption ? <span className="fhint">{caption}</span> : null}
          <span className="fhint" id={hintId}>
            {hint}
          </span>
        </div>
        <div className={onStep ? "ctl sleep" : "ctl"}>
          {onStep ? (
            <button
              aria-label="Diminuir 0,5 hora"
              className="step"
              onMouseDown={keepInputFocus}
              onPointerDown={keepInputFocus}
              onClick={() => onStep(-1)}
              type="button"
            >
              <Minus aria-hidden="true" size={20} weight="bold" />
            </button>
          ) : null}
          <MaskedNumberInput
            aria-describedby={`${hintId} ${errorId}`}
            aria-invalid={error ? true : undefined}
            decimals={config.decimals}
            digits={digits}
            id={id}
            inputRef={inputRef}
            maxDigits={config.maxDigits}
            onBlur={onBlur}
            onDigitsChange={onDigitsChange}
          />
          {onStep ? (
            <button
              aria-label="Aumentar 0,5 hora"
              className="step"
              onMouseDown={keepInputFocus}
              onPointerDown={keepInputFocus}
              onClick={() => onStep(1)}
              type="button"
            >
              <Plus aria-hidden="true" size={20} weight="bold" />
            </button>
          ) : null}
          <span aria-hidden="true" className="u">
            {config.unit}
          </span>
        </div>
      </div>
      <div className="ferr" id={errorId}>
        {error}
      </div>
    </div>
  )
}
