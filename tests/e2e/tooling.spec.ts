import { expect, test } from "@playwright/test"

test("initial frontend page renders", async ({ page }) => {
  await page.goto("/")

  await expect(
    page.getByRole("heading", { name: "Registro diário de medidas corporais" }),
  ).toBeVisible()
  await expect(page.getByText("Peso médio")).toBeVisible()
})

test("basic PWA manifest and icons are reachable", async ({
  page,
  request,
}) => {
  await page.goto("/")

  const manifestPath = await page
    .locator('link[rel="manifest"]')
    .getAttribute("href")
  const appleTouchIconPath = await page
    .locator('link[rel="apple-touch-icon"]')
    .getAttribute("href")

  expect(manifestPath).toBe("/manifest.webmanifest")
  expect(appleTouchIconPath).toBe("/icons/icon-192.png")

  if (!manifestPath) {
    throw new Error("Manifest link is missing")
  }

  if (!appleTouchIconPath) {
    throw new Error("Apple touch icon link is missing")
  }

  const manifestResponse = await request.get(manifestPath)
  expect(manifestResponse.ok()).toBe(true)

  const manifest = (await manifestResponse.json()) as {
    display?: string
    id?: string
    icons?: Array<{ sizes?: string; src?: string; type?: string }>
    name?: string
    start_url?: string
    theme_color?: string
  }

  expect(manifest.name).toBe("BodyLog")
  expect(manifest.id).toBe("/")
  expect(manifest.start_url).toBe("/")
  expect(manifest.display).toBe("standalone")
  expect(manifest.theme_color).toBe("#0d1117")

  const icons = manifest.icons ?? []
  expect(icons).toEqual(
    expect.arrayContaining([
      expect.objectContaining({
        sizes: "192x192",
        src: "/icons/icon-192.png",
        type: "image/png",
      }),
      expect.objectContaining({
        sizes: "512x512",
        src: "/icons/icon-512.png",
        type: "image/png",
      }),
    ]),
  )

  for (const icon of icons) {
    expect(icon.src).toBeTruthy()

    if (!icon.src) {
      throw new Error("Manifest icon src is missing")
    }

    const iconResponse = await request.get(icon.src)
    expect(iconResponse.ok()).toBe(true)
    expect(iconResponse.headers()["content-type"]).toContain("image/png")
  }

  const appleTouchIconResponse = await request.get(appleTouchIconPath)
  expect(appleTouchIconResponse.ok()).toBe(true)
  expect(appleTouchIconResponse.headers()["content-type"]).toContain(
    "image/png",
  )

  const session = await page.context().newCDPSession(page)
  const installability = (await session.send(
    "Page.getInstallabilityErrors",
  )) as {
    installabilityErrors: unknown[]
  }

  expect(installability.installabilityErrors).toEqual([])
})
