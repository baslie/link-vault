import { afterEach, describe, expect, it, vi } from "vitest";

import { logMonitoringEvent } from "@/lib/monitoring/client";

function stubSendBeacon(value: boolean) {
  Object.defineProperty(navigator, "sendBeacon", {
    configurable: true,
    value: vi.fn().mockReturnValue(value),
  });
  return navigator.sendBeacon as unknown as ReturnType<typeof vi.fn>;
}

describe("performance monitoring client", () => {
  afterEach(() => {
    vi.restoreAllMocks();
    Reflect.deleteProperty(navigator, "sendBeacon");
  });

  it("использует sendBeacon при поддержке", async () => {
    const beacon = stubSendBeacon(true);
    const fetchSpy = vi.spyOn(globalThis, "fetch").mockResolvedValue(new Response());

    await logMonitoringEvent({
      eventType: "search_performance",
      details: {
        durationMs: 120,
        status: "success",
      },
    });

    expect(beacon).toHaveBeenCalled();
    expect(fetchSpy).not.toHaveBeenCalled();
  });

  it("использует fetch, если sendBeacon недоступен", async () => {
    const beacon = stubSendBeacon(false);
    const fetchSpy = vi.spyOn(globalThis, "fetch").mockResolvedValue(new Response());

    await logMonitoringEvent({
      eventType: "client_error",
      details: {
        message: "Ошибка",
      },
    });

    expect(beacon).toHaveBeenCalled();
    expect(fetchSpy).toHaveBeenCalled();
  });
});
