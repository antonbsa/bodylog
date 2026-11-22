import { expect, signInFreshUser, test } from "./fixtures"

test("creates today's measurement and reopens it for editing", async ({
  context,
  page,
}) => {
  await signInFreshUser(context)
  await page.goto("/")

  // Today comes from the app's own link, so a run crossing midnight can't compare two dates.
  const registerLink = page.getByRole("link", { name: "Registrar medida" })
  const href = (await registerLink.getAttribute("href")) ?? ""
  const today = new URL(href, "http://x").searchParams.get("data") ?? ""
  const [, month, day] = today.split("-")

  await registerLink.click()
  await expect(page).toHaveURL(`/registro?data=${today}`)
  await expect(page.getByText("Nova medida")).toBeVisible()

  await page.getByLabel("Peso", { exact: true }).pressSequentially("724")
  await page.getByLabel("Gordura", { exact: true }).pressSequentially("148")
  await page.getByLabel("Notas").fill("Sem café")
  await page.getByRole("button", { name: "Salvar" }).click()

  await expect(page).toHaveURL("/")
  await expect(page.locator(".toast-region").getByRole("status")).toHaveText(
    `Medida de ${day}/${month} salva`,
  )

  await page.goto(`/registro?data=${today}`)

  await expect(
    page.getByText(`Editando medida de ${day}/${month}`),
  ).toBeVisible()
  await expect(page.getByLabel("Peso", { exact: true })).toHaveValue("72,4")
  await expect(page.getByLabel("Gordura", { exact: true })).toHaveValue("14,8")
  await expect(page.getByLabel("Notas")).toHaveValue("Sem café")
  await expect(page.getByRole("button", { name: "Atualizar" })).toBeVisible()
})
