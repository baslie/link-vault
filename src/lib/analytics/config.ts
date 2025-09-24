import { z } from "zod";

export interface AnalyticsConfig {
  yandexMetrikaId?: string;
  gaTrackingId?: string;
}

const analyticsEnvSchema = z.object({
  YANDEX_METRIKA_ID: z
    .string()
    .optional()
    .transform((value) => (value ? value.trim() : undefined))
    .transform((value) => (value && value.length > 0 ? value : undefined)),
  GA_TRACKING_ID: z
    .string()
    .optional()
    .transform((value) => (value ? value.trim() : undefined))
    .transform((value) => (value && value.length > 0 ? value : undefined)),
});

let cache: AnalyticsConfig | null = null;

export function getAnalyticsConfig(): AnalyticsConfig {
  if (!cache) {
    const parsed = analyticsEnvSchema.parse(process.env);
    cache = {
      yandexMetrikaId: parsed.YANDEX_METRIKA_ID,
      gaTrackingId: parsed.GA_TRACKING_ID,
    } satisfies AnalyticsConfig;
  }

  return cache;
}
