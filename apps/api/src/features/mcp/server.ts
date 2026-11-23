import { McpServer } from "@modelcontextprotocol/server"
import * as z from "zod"

import { ValidationError } from "../../../../../infra/errors"
import type { CollectorMeasurementsResponse } from "../../../../../types/measurements"
import { listCollectorMeasurements } from "../collector/list-measurements"

const nullableNumber = z.number().nullable()

/** Mirrors `CollectorMeasurementsResponse`; the type annotation fails to compile when the schema lacks a field of the response. */
export const collectorMeasurementsOutputSchema: z.ZodType<CollectorMeasurementsResponse> =
  z.object({
    count: z.number(),
    filters: z.object({
      from: z.string().nullable(),
      to: z.string().nullable(),
    }),
    heightCm: nullableNumber,
    items: z.array(
      z.object({
        date: z.string(),
        weightKg: z.number(),
        bodyFatPercentage: nullableNumber,
        musclePercentage: nullableNumber,
        restingMetabolismKcal: nullableNumber,
        waistCm: nullableNumber,
        sleepHours: nullableNumber,
        disposition: nullableNumber,
        notes: z.string().nullable(),
        derived: z.object({
          bmi: nullableNumber,
          bodyFatKg: nullableNumber,
          muscleKg: nullableNumber,
        }),
        createdAt: z.string(),
        updatedAt: z.string(),
      }),
    ),
  })

/** Builds the read-only server for one request; the tools only ever see the data of `userId`. */
export function createMcpServer(db: D1Database, userId: string): McpServer {
  const server = new McpServer({
    name: "bodylog",
    title: "BodyLog",
    description:
      "Consulta, somente leitura, das medidas corporais registradas no BodyLog.",
    version: "1.0.0",
  })

  server.registerTool(
    "list_measurements",
    {
      title: "Listar medidas",
      description:
        "Lista as medidas corporais do usuário em ordem crescente de data, com os valores derivados (IMC, gordura e músculo em kg). Sem filtros, devolve todas.",
      inputSchema: z.object({
        from: z
          .string()
          .optional()
          .describe("Data inicial, inclusiva, no formato YYYY-MM-DD."),
        to: z
          .string()
          .optional()
          .describe("Data final, inclusiva, no formato YYYY-MM-DD."),
      }),
      outputSchema: collectorMeasurementsOutputSchema,
      annotations: { readOnlyHint: true },
    },
    async ({ from, to }) => {
      try {
        const body = await listCollectorMeasurements(db, userId, {
          from: from ?? null,
          to: to ?? null,
        })

        return {
          content: [{ type: "text", text: JSON.stringify(body) }],
          structuredContent: body,
        }
      } catch (error) {
        // A bad date is the caller's mistake, so the model gets to read it and retry instead of seeing a protocol error.
        if (error instanceof ValidationError) {
          return {
            content: [
              { type: "text", text: `${error.message} ${error.action}` },
            ],
            isError: true,
          }
        }

        throw error
      }
    },
  )

  return server
}
