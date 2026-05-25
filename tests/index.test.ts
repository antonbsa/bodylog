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

  it("executes the D1 health query through the api", async () => {
    const response = await app.request(
      "/api/health/d1",
      {},
      {
        DB: {
          prepare: (query: string) => {
            expect(query).toBe("SELECT 1 AS result");

            return {
              first: async () => ({ result: 1 }),
            };
          },
        } as unknown as D1Database,
      },
    );

    expect(response.status).toBe(200);
    expect(await response.json()).toEqual({
      ok: true,
      database: "body_metrics_tracker",
      result: 1,
    });
  });
});
