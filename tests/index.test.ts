import { describe, expect, it } from "vitest";

import { app } from "../src/index";

describe("api base", () => {
  it("responds to the health route", async () => {
    const response = await app.request("/api/health");

    expect(response.status).toBe(200);
    expect(await response.json()).toEqual({
      ok: true,
      service: "bodylog-api",
    });
  });

  it("runs middleware for api routes", async () => {
    const response = await app.request("/api/health");

    expect(response.headers.get("x-bodylog-api")).toBe("ok");
  });
});
