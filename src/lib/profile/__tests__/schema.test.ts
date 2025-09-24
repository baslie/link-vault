import { describe, expect, it } from "vitest";

import { profileSettingsSchema } from "@/lib/profile/schema";

describe("profile settings schema", () => {
  it("allows trimming and limiting display name", () => {
    const parsed = profileSettingsSchema.parse({ displayName: "  Анна  ", theme: "light" });
    expect(parsed.displayName).toBe("Анна");
  });

  it("rejects long names", () => {
    const longName = "a".repeat(200);
    expect(() => profileSettingsSchema.parse({ displayName: longName, theme: "light" })).toThrow();
  });
});
