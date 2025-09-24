import { describe, expect, it } from "vitest";

import { buildMonitoringRecord, monitoringEventSchema } from "@/lib/monitoring/schema";

describe("performance monitoring schema", () => {
  it("валидирует web vital событие", () => {
    const input = {
      eventType: "web_vital" as const,
      details: {
        id: "123",
        name: "LCP",
        value: 1800,
        label: "web-vital",
        rating: "good",
      },
      context: {
        url: "https://example.com",
      },
    };

    const parsed = monitoringEventSchema.parse(input);
    expect(parsed.eventType).toBe("web_vital");
    if (parsed.eventType === "web_vital") {
      expect(parsed.details.name).toBe("LCP");
    }

    const record = buildMonitoringRecord(parsed);
    expect(record.event_type).toBe("web_vital");
    expect(record.payload).toMatchObject({
      details: {
        name: "LCP",
      },
      context: {
        url: "https://example.com",
      },
    });
  });

  it("отклоняет неизвестный тип события", () => {
    expect(() => monitoringEventSchema.parse({ eventType: "other" })).toThrow();
  });
});
