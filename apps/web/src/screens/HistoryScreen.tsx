import { MeasurementHistory } from "./components/MeasurementHistory"
import { PageTitle } from "./components/PageTitle"
import { useMeasurementHistory } from "../hooks/useMeasurementHistory"
import { useTabNavigate } from "../hooks/useTabNavigate"
import { useRefreshOnResume } from "../hooks/useRefreshOnResume"

export function HistoryScreen() {
  const { loadMore, reload, remove, state } = useMeasurementHistory()
  const { navigate } = useTabNavigate()

  useRefreshOnResume(reload)

  return (
    <>
      <header className="app-header">
        <PageTitle>Histórico</PageTitle>
      </header>

      <MeasurementHistory
        onEditMeasurement={(date) =>
          navigate(`/registro?data=${date}`, { from: "/historico" })
        }
        onLoadMore={loadMore}
        onRemove={remove}
        state={state}
      />
    </>
  )
}
