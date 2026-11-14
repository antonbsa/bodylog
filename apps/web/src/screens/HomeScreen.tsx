import { PageTitle } from "./components/PageTitle"
import { TodayCard } from "./components/TodayCard"
import { WeekCard } from "./components/WeekCard"
import { useRefreshOnResume } from "../hooks/useRefreshOnResume"
import { useWeeklyDashboard } from "../hooks/useWeeklyDashboard"
import { getTodayIsoDate } from "../utils/date-format"

export function HomeScreen() {
  const { reload, state } = useWeeklyDashboard()
  const today = getTodayIsoDate()

  useRefreshOnResume(reload)

  return (
    <>
      <PageTitle>Início</PageTitle>
      <TodayCard today={today} />
      <WeekCard
        dashboard={state.dashboard}
        error={state.status === "error" ? state.message : null}
        onRetry={reload}
        today={today}
      />
    </>
  )
}
