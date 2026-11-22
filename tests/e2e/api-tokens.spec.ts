import type { ApiTokenSummary } from "../../types/api-tokens"
import {
  expect,
  type Page,
  type Route,
  signedInSession,
  test,
} from "./fixtures"

const NEW_TOKEN = "bl_3q2-7wJm0aK8Zr5yT1uVnB4cD6eF9gH0iJ2kL4mx9Qk"

function json(route: Route, body: unknown, status = 200) {
  return route.fulfill({
    body: JSON.stringify(body),
    contentType: "application/json",
    status,
  })
}

function summary(id: string, name: string): ApiTokenSummary {
  return {
    createdAt: "2026-11-02T12:00:00.000Z",
    id,
    lastFour: id.padStart(4, "x").slice(-4),
    lastUsedAt: null,
    name,
  }
}

/** A stateful `/api/tokens` mock, so creating and revoking update the list. */
async function mockTokensApi(page: Page, initial: ApiTokenSummary[] = []) {
  const tokens = [...initial]

  await page.route("**/api/auth/session", (route) =>
    json(route, signedInSession),
  )
  await page.route("**/api/tokens", async (route) => {
    if (route.request().method() === "GET") {
      return json(route, { items: tokens })
    }

    const { name } = route.request().postDataJSON() as { name: string }
    const item = { ...summary(`t${tokens.length + 1}`, name), lastFour: "x9Qk" }

    tokens.push(item)

    return json(route, { item, token: NEW_TOKEN }, 201)
  })
  await page.route("**/api/tokens/*", (route) => {
    const id = route.request().url().split("/").pop()

    tokens.splice(
      tokens.findIndex((token) => token.id === id),
      1,
    )

    return json(route, { ok: true })
  })
}

const tokenList = (page: Page) =>
  page.getByRole("region", { name: "Tokens de API" }).getByRole("listitem")

test("creating a token shows it once, already copied, and the list shows only its last four", async ({
  context,
  page,
}) => {
  await context.grantPermissions(["clipboard-read", "clipboard-write"])
  await mockTokensApi(page)
  await page.goto("/ajustes")

  await page.getByRole("button", { name: "Criar token" }).click()

  const dialog = page.getByRole("dialog")

  await dialog.getByRole("button", { name: "Criar token" }).click()
  await expect(dialog.getByRole("alert")).toHaveText(
    "Informe um nome para o token.",
  )

  await dialog.getByLabel("Nome").fill("Agente")
  await dialog.getByRole("button", { name: "Criar token" }).click()

  await expect(dialog.getByRole("heading")).toHaveText("Token criado")
  await expect(dialog).toContainText("Ele não será mostrado novamente.")
  await expect(dialog.getByLabel("Token", { exact: true })).toHaveValue(
    NEW_TOKEN,
  )

  await expect(dialog.getByRole("status")).toHaveText("Token copiado.")
  expect(await page.evaluate(() => navigator.clipboard.readText())).toBe(
    NEW_TOKEN,
  )

  await page.evaluate(() => navigator.clipboard.writeText(""))
  await dialog.getByRole("button", { name: "Copiar token" }).click()
  await expect
    .poll(() => page.evaluate(() => navigator.clipboard.readText()))
    .toBe(NEW_TOKEN)

  await dialog.getByRole("button", { name: "Concluir" }).click()
  await expect(dialog).toBeHidden()
  await expect(tokenList(page)).toHaveText([/Agente.*•••• x9Qk.*Nunca usado/])
  await expect(page.getByText(NEW_TOKEN)).toHaveCount(0)

  // Reopening starts a fresh form, never the token shown before.
  await page.getByRole("button", { name: "Criar token" }).click()
  await expect(dialog.getByLabel("Nome")).toHaveValue("")
  await expect(dialog.getByLabel("Token", { exact: true })).toHaveCount(0)
})

test("a name the user already has is flagged while typing and blocks creation", async ({
  page,
}) => {
  await mockTokensApi(page, [summary("t1", "Agente")])
  await page.goto("/ajustes")

  await page.getByRole("button", { name: "Criar token" }).click()

  const dialog = page.getByRole("dialog")
  const submit = dialog.getByRole("button", { name: "Criar token" })

  await dialog.getByLabel("Nome").fill(" Agente ")
  await expect(dialog.getByRole("alert")).toHaveText(
    "Já existe um token com esse nome.",
  )
  await expect(submit).toBeDisabled()

  await dialog.getByLabel("Nome").fill("Agente 2")
  await expect(dialog.getByRole("alert")).toHaveCount(0)
  await expect(submit).toBeEnabled()
})

test("at three tokens creation is replaced by a message until one is revoked", async ({
  page,
}) => {
  await mockTokensApi(page, [
    summary("t1", "Agente"),
    summary("t2", "Planilha"),
    summary("t3", "Script"),
  ])
  await page.goto("/ajustes")

  await expect(tokenList(page)).toHaveCount(3)
  await expect(
    page.getByText("Você já tem 3 tokens. Revogue um para criar outro."),
  ).toBeVisible()
  await expect(page.getByRole("button", { name: "Criar token" })).toHaveCount(0)

  await page.getByRole("button", { name: "Revogar Planilha" }).click()

  const confirmation = page.getByRole("alertdialog")

  await expect(confirmation).toContainText('Clientes que usam "Planilha"')
  await confirmation.getByRole("button", { name: "Revogar" }).click()

  await expect(page.getByRole("status")).toContainText("Token revogado")
  await expect(tokenList(page)).toHaveText([/Agente/, /Script/])
  await expect(page.getByRole("button", { name: "Criar token" })).toBeVisible()
})

test("cancelling a revoke keeps the token", async ({ page }) => {
  await mockTokensApi(page, [summary("t1", "Agente")])
  await page.goto("/ajustes")

  await page.getByRole("button", { name: "Revogar Agente" }).click()
  await page
    .getByRole("alertdialog")
    .getByRole("button", { name: "Cancelar" })
    .click()

  await expect(page.getByRole("alertdialog")).toBeHidden()
  await expect(tokenList(page)).toHaveText([/Agente/])
})
