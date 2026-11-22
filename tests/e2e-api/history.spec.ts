import { expect, signInFreshUser, test } from "./fixtures"

test("lists seeded measurements on fixed past dates by week", async ({
  context,
  page,
}) => {
  await signInFreshUser(context, [
    { date: "2026-06-01", weightKg: 74.2 },
    { bodyFatPercentage: 18.6, date: "2026-06-09", weightKg: 73 },
    { date: "2026-06-11", notes: "Em jejum", weightKg: 72.4 },
  ])

  await page.goto("/historico")

  await expect(page.getByRole("heading", { level: 2 })).toHaveText([
    "8–14 jun",
    "1–7 jun",
  ])

  const weeks = page.locator("section[aria-labelledby]")

  await expect(weeks.first().locator(".hrow")).toHaveText([
    "qui 11/0672,4kg——Com anotação",
    "ter 09/0673,0kg18,6%—",
  ])
  await expect(weeks.nth(1).locator(".hrow")).toHaveText(["seg 01/0674,2kg——"])
})
