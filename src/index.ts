import { Hono } from "hono";

type Bindings = Record<string, never>;

export const app = new Hono<{ Bindings: Bindings }>();

app.use("/api/*", async (c, next) => {
  await next();
  c.header("x-bodylog-api", "ok");
});

app.get("/api/health", (c) => {
  return c.json({
    ok: true,
    service: "bodylog-api",
  });
});

export default app;
