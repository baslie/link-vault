"use client";

import { useEffect } from "react";

import { logMonitoringEvent } from "@/lib/monitoring/client";

export function MonitoringProvider() {
  useEffect(() => {
    function handleError(event: ErrorEvent) {
      void logMonitoringEvent({
        eventType: "client_error",
        details: {
          message: event.message,
          stack: event.error instanceof Error ? (event.error.stack ?? undefined) : undefined,
          source: event.filename ?? undefined,
          line: event.lineno ?? undefined,
          column: event.colno ?? undefined,
        },
        context: {
          userAgent: typeof navigator !== "undefined" ? navigator.userAgent : undefined,
          url: typeof window !== "undefined" ? window.location.href : undefined,
        },
      });
    }

    function handleRejection(event: PromiseRejectionEvent) {
      const reason = event.reason;
      const message = reason instanceof Error ? reason.message : String(reason);
      const stack = reason instanceof Error ? (reason.stack ?? undefined) : undefined;

      void logMonitoringEvent({
        eventType: "client_error",
        details: {
          message,
          stack,
        },
        context: {
          userAgent: typeof navigator !== "undefined" ? navigator.userAgent : undefined,
          url: typeof window !== "undefined" ? window.location.href : undefined,
        },
      });
    }

    window.addEventListener("error", handleError);
    window.addEventListener("unhandledrejection", handleRejection);

    return () => {
      window.removeEventListener("error", handleError);
      window.removeEventListener("unhandledrejection", handleRejection);
    };
  }, []);

  return null;
}
