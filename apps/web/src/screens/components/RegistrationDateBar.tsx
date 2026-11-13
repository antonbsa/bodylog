import { CaretLeft, CaretRight } from "@phosphor-icons/react"

import { formatDayLabel, shiftIsoDate } from "../../utils/date-format"

type RegistrationDateBarProps = {
  date: string
  onDateChange: (date: string) => void
  today: string
}

export function RegistrationDateBar({
  date,
  onDateChange,
  today,
}: RegistrationDateBarProps) {
  return (
    <div className="datebar">
      <button
        aria-label="Dia anterior"
        className="arrow"
        onClick={() => onDateChange(shiftIsoDate(date, -1))}
        type="button"
      >
        <CaretLeft aria-hidden="true" size={22} weight="bold" />
      </button>
      <div className="datewrap">
        <span aria-hidden="true">{formatDayLabel(date)}</span>
        <input
          aria-label="Data da medida"
          max={today}
          onChange={(event) => {
            if (event.target.value) {
              onDateChange(event.target.value)
            }
          }}
          type="date"
          value={date}
        />
      </div>
      <button
        aria-label="Próximo dia"
        className="arrow"
        disabled={date >= today}
        onClick={() => onDateChange(shiftIsoDate(date, 1))}
        type="button"
      >
        <CaretRight aria-hidden="true" size={22} weight="bold" />
      </button>
    </div>
  )
}
