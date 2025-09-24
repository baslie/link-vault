import { afterEach, describe, expect, it, vi } from "vitest";

import { trackAnalyticsEvent } from "@/lib/analytics/track";

declare global {
  interface Window {
    linkVaultTrack?: (eventName: string, params?: Record<string, unknown>) => void;
  }
}

describe("analytics tracking", () => {
  afterEach(() => {
    if (typeof window !== "undefined") {
      delete window.linkVaultTrack;
    }
  });

  it("ничего не делает до загрузки в браузере", () => {
    expect(() => trackAnalyticsEvent("link_created", { foo: "bar" })).not.toThrow();
  });

  it("пробрасывает события во внешние счётчики", () => {
    const handler = vi.fn();
    window.linkVaultTrack = handler;

    trackAnalyticsEvent("export_generated", { scope: "all" });

    expect(handler).toHaveBeenCalledWith("export_generated", { scope: "all" });
  });
});
