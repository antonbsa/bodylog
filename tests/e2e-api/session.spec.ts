import { expect, signInFreshUser, test } from "./fixtures"

test("opens authenticated and logout ends the session on the server", async ({
  context,
  page,
}) => {
  await signInFreshUser(context)

  await page.goto("/")
  await expect(page.getByText("Sem medida hoje.")).toBeVisible()

  await page.goto("/ajustes")
  await page.getByRole("button", { name: "Sair" }).click()
  await page
    .getByRole("alertdialog", { name: "Sair do BodyLog" })
    .getByRole("button", { name: "Sair", exact: true })
    .click()

  await expect(page.getByRole("heading", { name: "Entrar" })).toBeVisible()
  expect((await context.request.get("/api/auth/session")).status()).toBe(401)
})
