import { useNavigate } from "react-router"

import { Button } from "../components/Button"

export function NotFoundScreen() {
  const navigate = useNavigate()

  return (
    <main className="app-shell not-found-shell">
      <section className="not-found-panel" aria-labelledby="not-found-title">
        <p className="eyebrow">BodyLog</p>
        <h1 id="not-found-title">404 Not Found</h1>
        <Button onClick={() => navigate("/")} type="button">
          Voltar ao início
        </Button>
      </section>
    </main>
  )
}
