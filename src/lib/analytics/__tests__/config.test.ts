import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

const ORIGINAL_ENV = process.env;

describe("analytics config", () => {
  beforeEach(() => {
    vi.resetModules();
    process.env = { ...ORIGINAL_ENV } as NodeJS.ProcessEnv;
  });

  afterEach(() => {
    process.env = ORIGINAL_ENV;
  });

  it("returns undefined identifiers by default", async () => {
    delete process.env.YANDEX_METRIKA_ID;
    delete process.env.GA_TRACKING_ID;

    const { getAnalyticsConfig } = await import("../config");

    expect(getAnalyticsConfig()).toEqual({
      yandexMetrikaId: undefined,
      gaTrackingId: undefined,
    });
  });

  it("trims configured identifiers", async () => {
    process.env.YANDEX_METRIKA_ID = "  12345  ";
    process.env.GA_TRACKING_ID = "  G-TEST  ";

    const { getAnalyticsConfig } = await import("../config");

    expect(getAnalyticsConfig()).toEqual({
      yandexMetrikaId: "12345",
      gaTrackingId: "G-TEST",
    });
  });

  it("returns cached values when env changes", async () => {
    process.env.YANDEX_METRIKA_ID = "123";
    process.env.GA_TRACKING_ID = "G-OLD";

    const { getAnalyticsConfig } = await import("../config");

    expect(getAnalyticsConfig()).toEqual({
      yandexMetrikaId: "123",
      gaTrackingId: "G-OLD",
    });

    process.env.YANDEX_METRIKA_ID = "999";
    process.env.GA_TRACKING_ID = "G-NEW";

    expect(getAnalyticsConfig()).toEqual({
      yandexMetrikaId: "123",
      gaTrackingId: "G-OLD",
    });
  });
});
