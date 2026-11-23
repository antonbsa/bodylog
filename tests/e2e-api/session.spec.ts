import { expect, signInFreshUser, test } from "./fixtures"

test("opens authenticated and logout ends the session on the server", async ({
  context,
  page,
}) => {
  await signInFreshUser(context)

  await page.goto("/")
  await expect(page.getByText("Sem medida hoje.")).toBeVisible()

  const session = (await context.cookies()).find(
    ({ name }) => name === "bodylog_session",
  )
  expect(session).toBeDefined()

  await page.goto("/ajustes")
  await page.getByRole("button", { name: "Sair" }).click()
  await page
    .getByRole("alertdialog", { name: "Sair do BodyLog" })
    .getByRole("button", { name: "Sair", exact: true })
    .click()

  await expect(page.getByRole("heading", { name: "Entrar" })).toBeVisible()
  // Replaying the old cookie proves the row is gone, not just the browser's copy.
  const replayed = await context.request.get("/api/auth/session", {
    headers: { cookie: `bodylog_session=${session?.value}` },
  })
  expect(replayed.status()).toBe(401)
})
