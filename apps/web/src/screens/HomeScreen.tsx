import { Callout } from "@radix-ui/themes"

import { Button } from "../components/Button"
import { PageTitle } from "./components/PageTitle"
import {
  PlaceholderSummary,
  WeeklyDashboardSummary,
} from "./components/WeeklyDashboardSummary"
import { useRefreshOnResume } from "../hooks/useRefreshOnResume"
import { useWeeklyDashboard } from "../hooks/useWeeklyDashboard"

export function HomeScreen() {
  const { reload, state } = useWeeklyDashboard()

  useRefreshOnResume(reload)

  return (
    <>
      <header className="app-header">
        <PageTitle>Resumo da semana</PageTitle>
        <p className="intro">
          Médias da semana atual e comparação com a semana anterior.
        </p>
        <div className="header-actions">
          <Button
            disabled={state.status === "loading"}
            onClick={reload}
            type="button"
            variant="secondary"
          >
            Atualizar dados
          </Button>
        </div>
      </header>

      {state.status === "error" ? (
        <Callout.Root color="red" role="alert">
          <Callout.Text>
            {state.message ?? "Não foi possível carregar o resumo semanal."}
          </Callout.Text>
        </Callout.Root>
      ) : null}

      {state.status === "loading" && !state.dashboard ? (
        <Callout.Root role="status">
          <Callout.Text>Carregando resumo semanal...</Callout.Text>
        </Callout.Root>
      ) : null}

      {state.dashboard ? (
        <WeeklyDashboardSummary dashboard={state.dashboard} />
      ) : (
        <PlaceholderSummary />
      )}
    </>
  )
}
