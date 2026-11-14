import { Note } from "@phosphor-icons/react"

import { WEEKLY_TARGET_DAYS } from "../../utils/dashboard-summary"
import { formatRowDate, formatWeekRange } from "../../utils/date-format"
import { formatOneDecimal } from "../../utils/number-format"
import type { HistoryWeek } from "../../../../../types/history"

const MISSING = "—"
const NOTE_ICON_SIZE = 16

function Cell({ unit, value }: { unit: string; value: number | null }) {
  return (
    <span className="n num">
      {value === null ? (
        MISSING
      ) : (
        <>
          {formatOneDecimal(value)}
          <small>{unit}</small>
        </>
      )}
    </span>
  )
}

export function HistoryWeekCard({
  onOpenDate,
  week,
}: {
  onOpenDate: (date: string) => void
  week: HistoryWeek
}) {
  const { averages, measurementCount, weekEndDate, weekStartDate } =
    week.summary
  const titleId = `history-week-${weekStartDate}`

  return (
    <section aria-labelledby={titleId}>
      <div className="week-title">
        <h2 id={titleId}>{formatWeekRange(weekStartDate, weekEndDate)}</h2>
        <span
          aria-label={`${measurementCount} de ${WEEKLY_TARGET_DAYS} dias registrados`}
          className="num"
        >
          {measurementCount}/{WEEKLY_TARGET_DAYS}
        </span>
      </div>
      <div className="card hlist">
        <div className="havg hgrid">
          <span className="d">Média</span>
          <Cell unit="kg" value={averages.weightKg} />
          <Cell unit="%" value={averages.bodyFatPercentage} />
          <Cell unit="%" value={averages.musclePercentage} />
          <span />
        </div>
        {week.measurements.map((measurement) => (
          <button
            className="hrow hgrid"
            key={measurement.id}
            onClick={() => onOpenDate(measurement.date)}
            type="button"
          >
            <span className="d num">{formatRowDate(measurement.date)}</span>
            <Cell unit="kg" value={measurement.weightKg} />
            <Cell unit="%" value={measurement.bodyFatPercentage} />
            <Cell unit="%" value={measurement.musclePercentage} />
            <span className="note">
              {measurement.notes ? (
                <>
                  <Note aria-hidden size={NOTE_ICON_SIZE} />
                  <span className="visually-hidden">Com anotação</span>
                </>
              ) : null}
            </span>
          </button>
        ))}
      </div>
    </section>
  )
}
