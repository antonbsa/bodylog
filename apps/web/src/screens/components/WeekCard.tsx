import { ArrowDown } from "@phosphor-icons/react/dist/csr/ArrowDown"
import { ArrowUp } from "@phosphor-icons/react/dist/csr/ArrowUp"
import { Equals } from "@phosphor-icons/react/dist/csr/Equals"

import {
  WEEKLY_METRICS,
  WEEKLY_TARGET_DAYS,
  getVariationChip,
  getWeekDays,
  type VariationChip,
} from "../../utils/dashboard-summary"
import { formatWeekRange } from "../../utils/date-format"
import { formatOneDecimal } from "../../utils/number-format"
import type { WeeklyDashboard } from "../../../../../types/dashboard"

const MISSING = "—"
const CHIP_ICON_SIZE = 14

// Shown while loading so the dots row keeps its size.
const PLACEHOLDER_DAYS = ["S", "T", "Q", "Q", "S", "S", "D"].map((letter) => ({
  isToday: false,
  letter,
  status: "missing" as const,
}))

export function ChipIcon({
  direction,
}: {
  direction: VariationChip["direction"]
}) {
  const props = {
    "aria-hidden": true,
    size: CHIP_ICON_SIZE,
    weight: "bold",
  } as const

  if (direction === "up") {
    return <ArrowUp {...props} />
  }

  if (direction === "down") {
    return <ArrowDown {...props} />
  }

  return direction === "stable" ? <Equals {...props} /> : null
}

function WeekRows({ dashboard }: { dashboard: WeeklyDashboard | null }) {
  return (
    <>
      {WEEKLY_METRICS.map((metric) => {
        const average = dashboard?.current.averages[metric.key] ?? null
        const chip = dashboard
          ? getVariationChip(
              average,
              dashboard.previous.averages[metric.key],
              metric.changeUnit,
            )
          : null

        return (
          <div className="mrow" key={metric.key}>
            <div>
              <span className="mrow-label">{metric.label}</span>
              <span className="mrow-value">
                {average === null ? (
                  <span className="num">{MISSING}</span>
                ) : (
                  <>
                    <span className="num">{formatOneDecimal(average)}</span>
                    <span className="unit">{metric.unit}</span>
                  </>
                )}
              </span>
            </div>
            {chip ? (
              <span className="chip">
                <ChipIcon direction={chip.direction} />
                {chip.text}
              </span>
            ) : null}
          </div>
        )
      })}
    </>
  )
}

export function WeekCard({
  dashboard,
  error,
  onRetry,
  today,
}: {
  dashboard: WeeklyDashboard | null
  error: string | null
  onRetry: () => void
  today: string
}) {
  const days = dashboard ? getWeekDays(dashboard.current, today) : null
  const count = dashboard?.current.measurementCount

  return (
    <section
      aria-busy={dashboard === null && error === null}
      aria-labelledby="week-title"
      className="card"
    >
      <div className="week-head">
        <h2 id="week-title">Esta semana</h2>
        <span className="count num">
          {count ?? MISSING}/{WEEKLY_TARGET_DAYS}
        </span>
      </div>

      <div
        aria-label={
          count === undefined
            ? undefined
            : `${count} de ${WEEKLY_TARGET_DAYS} dias registrados`
        }
        className="days"
        role="img"
      >
        {(days ?? PLACEHOLDER_DAYS).map((day, index) => (
          <div
            className={day.isToday ? "day is-today" : "day"}
            data-status={day.status}
            key={index}
          >
            <span className="day-letter">{day.letter}</span>
            <span className="dot" />
          </div>
        ))}
      </div>

      <p className="vs">
        {dashboard
          ? `vs ${formatWeekRange(
              dashboard.previous.weekStartDate,
              dashboard.previous.weekEndDate,
            )} · ${dashboard.previous.measurementCount}/${WEEKLY_TARGET_DAYS}`
          : "vs —"}
      </p>

      {error !== null && dashboard === null ? (
        <div className="home-error week-rows-reserved" role="alert">
          <p>{error}</p>
          <button className="btn ghost" onClick={onRetry} type="button">
            Tentar de novo
          </button>
        </div>
      ) : (
        <WeekRows dashboard={dashboard} />
      )}
    </section>
  )
}
