import { monitoringEventSchema, type MonitoringEvent } from "@/lib/monitoring/schema";

const ENDPOINT = "/api/monitoring/log";

function toJson(event: MonitoringEvent) {
  const parsed = monitoringEventSchema.parse(event);
  return JSON.stringify(parsed);
}

export async function logMonitoringEvent(event: MonitoringEvent): Promise<void> {
  try {
    const body = toJson(event);

    if (typeof navigator !== "undefined" && typeof navigator.sendBeacon === "function") {
      const beaconPayload = new Blob([body], { type: "application/json" });
      const delivered = navigator.sendBeacon(ENDPOINT, beaconPayload);
      if (delivered) {
        return;
      }
    }

    await fetch(ENDPOINT, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body,
      keepalive: true,
    });
  } catch (error) {
    console.warn("Не удалось отправить событие мониторинга", error);
  }
}
