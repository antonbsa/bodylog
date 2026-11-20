import { CaretLeft } from "@phosphor-icons/react/dist/csr/CaretLeft"
import { CaretRight } from "@phosphor-icons/react/dist/csr/CaretRight"

import { shiftIsoDate } from "../../utils/date-format"
import { DatePickerSheet } from "./DatePickerSheet"

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
      <DatePickerSheet date={date} onDateChange={onDateChange} today={today} />
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
