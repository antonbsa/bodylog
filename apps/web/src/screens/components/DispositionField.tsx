const DISPOSITION_VALUES = [1, 2, 3, 4, 5]

type DispositionFieldProps = {
  hint: string
  onChange: (value: number | null) => void
  value: number | null
}

/** Segmented 1-5 control; tapping the selected value clears it. */
export function DispositionField({
  hint,
  onChange,
  value,
}: DispositionFieldProps) {
  return (
    <div className="field">
      <div className="frow">
        <div className="flabel-wrap">
          <span className="flabel" id="disposition-label">
            Disposição
          </span>
          <span className="fhint">{hint}</span>
        </div>
      </div>
      <div
        aria-labelledby="disposition-label"
        className="dseg"
        role="radiogroup"
      >
        {DISPOSITION_VALUES.map((option) => (
          <button
            aria-checked={value === option}
            key={option}
            onClick={() => onChange(value === option ? null : option)}
            role="radio"
            type="button"
          >
            {option}
          </button>
        ))}
      </div>
      <div aria-hidden="true" className="dcap">
        <span>Indisposto</span>
        <span>Disposto</span>
      </div>
      <div className="dcap-pad" />
    </div>
  )
}
