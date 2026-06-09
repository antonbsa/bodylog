import { expect, test } from "@playwright/test"

test("initial frontend page renders", async ({ page }) => {
  await page.goto("/")

  await expect(
    page.getByRole("heading", { name: "Registro diário de medidas corporais" }),
  ).toBeVisible()
  await expect(page.getByText("Peso médio")).toBeVisible()
})
