import { useState } from "react"
import { CaretLeft } from "@phosphor-icons/react/dist/csr/CaretLeft"
import { CaretRight } from "@phosphor-icons/react/dist/csr/CaretRight"
import { Dialog } from "@radix-ui/themes"
import { DayPicker, labelDayButton } from "react-day-picker"
import { ptBR } from "react-day-picker/locale/pt-BR"

import { useRecordedDays } from "../../hooks/useRecordedDays"
import {
  formatDayLabel,
  getMonthRange,
  parseIsoDate,
  toIsoDate,
} from "../../utils/date-format"

type DatePickerSheetProps = {
  date: string
  onDateChange: (date: string) => void
  today: string
}

/** The date label as a button that opens a bottom-sheet calendar marking the days with a record. */
export function DatePickerSheet({
  date,
  onDateChange,
  today,
}: DatePickerSheetProps) {
  const [open, setOpen] = useState(false)

  return (
    <Dialog.Root open={open} onOpenChange={setOpen}>
      <Dialog.Trigger>
        <button
          aria-haspopup="dialog"
          aria-label={`Data da medida, ${formatDayLabel(date)}`}
          className="datewrap"
          type="button"
        >
          {formatDayLabel(date)}
        </button>
      </Dialog.Trigger>
      <Dialog.Content aria-describedby={undefined} className="date-sheet">
        <Dialog.Title className="date-sheet-title">Escolher data</Dialog.Title>
        <Calendar
          date={date}
          onSelect={(next) => {
            setOpen(false)
            onDateChange(next)
          }}
          today={today}
        />
      </Dialog.Content>
    </Dialog.Root>
  )
}

function Calendar({
  date,
  onSelect,
  today,
}: {
  date: string
  onSelect: (date: string) => void
  today: string
}) {
  const [month, setMonth] = useState(() => parseIsoDate(date))
  const recorded = useRecordedDays(getMonthRange(month).from)
  const todayDate = parseIsoDate(today)

  return (
    <DayPicker
      classNames={{
        button_next: "cal-nav-btn",
        button_previous: "cal-nav-btn",
        caption_label: "cal-title",
        day: "cal-day",
        day_button: "cal-day-btn",
        disabled: "cal-disabled",
        month: "cal-month",
        month_caption: "cal-caption",
        month_grid: "cal-grid",
        months: "cal-months",
        nav: "cal-nav",
        outside: "cal-outside",
        root: "cal-root",
        selected: "cal-selected",
        today: "cal-today",
        week: "cal-week",
        weekday: "cal-weekday",
        weekdays: "cal-weekdays",
      }}
      components={{
        Chevron: ({ orientation }) =>
          orientation === "left" ? (
            <CaretLeft aria-hidden="true" size={20} weight="bold" />
          ) : (
            <CaretRight aria-hidden="true" size={20} weight="bold" />
          ),
      }}
      disabled={{ after: todayDate }}
      endMonth={todayDate}
      labels={{
        // The default label prefixes English "Today, " and "selected" that the locale does not translate.
        labelDayButton: (day, modifiers, options, dateLib) =>
          `${labelDayButton(day, modifiers, options, dateLib)
            .replace("Today, ", "Hoje, ")
            .replace(", selected", ", selecionado")}${
            modifiers.recorded ? ", com medida" : ""
          }`,
      }}
      locale={ptBR}
      mode="single"
      modifiers={{ recorded: (day) => recorded.has(toIsoDate(day)) }}
      modifiersClassNames={{ recorded: "cal-recorded" }}
      month={month}
      onMonthChange={setMonth}
      onSelect={(day) => {
        if (day) {
          onSelect(toIsoDate(day))
        }
      }}
      selected={parseIsoDate(date)}
      weekStartsOn={1}
    />
  )
}
