import { z } from "zod";

const contextSchema = z
  .object({
    userAgent: z.string().optional(),
    url: z.string().optional(),
  })
  .optional();

const webVitalEventSchema = z.object({
  eventType: z.literal("web_vital"),
  details: z.object({
    id: z.string(),
    name: z.string(),
    value: z.number(),
    rating: z.string().optional(),
    label: z.string(),
  }),
  context: contextSchema,
});

const clientErrorEventSchema = z.object({
  eventType: z.literal("client_error"),
  details: z.object({
    message: z.string(),
    stack: z.string().optional(),
    source: z.string().optional(),
    line: z.number().optional(),
    column: z.number().optional(),
  }),
  context: contextSchema,
});

const searchPerformanceEventSchema = z.object({
  eventType: z.literal("search_performance"),
  details: z.object({
    durationMs: z.number().nonnegative(),
    status: z.enum(["success", "error"]),
    query: z.string().optional(),
  }),
  context: contextSchema,
});

export const monitoringEventSchema = z.discriminatedUnion("eventType", [
  webVitalEventSchema,
  clientErrorEventSchema,
  searchPerformanceEventSchema,
]);

export type MonitoringEvent = z.infer<typeof monitoringEventSchema>;

export function buildMonitoringRecord(event: MonitoringEvent) {
  const payload = {
    details: event.details,
    ...(event.context ? { context: event.context } : {}),
  };

  return {
    event_type: event.eventType,
    payload,
  };
}
