import type { NextWebVitalsMetric } from "next/app";

import { logMonitoringEvent } from "@/lib/monitoring/client";

export function reportWebVitals(metric: NextWebVitalsMetric) {
  const rating = (metric as Partial<NextWebVitalsMetric> & { rating?: string }).rating;

  void logMonitoringEvent({
    eventType: "web_vital",
    details: {
      id: metric.id,
      name: metric.name,
      value: metric.value,
      rating,
      label: metric.label,
    },
    context: {
      userAgent: typeof navigator !== "undefined" ? navigator.userAgent : undefined,
      url: typeof window !== "undefined" ? window.location.href : undefined,
    },
  });
}
