import { describe, expect, it } from "vitest";

import { DEFAULT_AUTH_REDIRECT_PATH, emailSchema, sanitizeRedirectPath } from "@/app/auth/shared";

describe("auth shared helpers", () => {
  it("validates email addresses", () => {
    expect(emailSchema.parse({ email: "user@example.com" })).toEqual({ email: "user@example.com" });
  });

  it("rejects invalid email format", () => {
    const result = emailSchema.safeParse({ email: "invalid" });

    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.issues[0]?.message).toBe("Введите корректный e-mail");
    }
  });

  it("normalizes redirect paths", () => {
    expect(sanitizeRedirectPath("/app")).toBe("/app");
    expect(sanitizeRedirectPath("/settings/profile")).toBe("/settings/profile");
  });

  it("falls back to default for unsafe redirect", () => {
    expect(sanitizeRedirectPath("https://example.com")).toBe(DEFAULT_AUTH_REDIRECT_PATH);
    expect(sanitizeRedirectPath("//evil")).toBe(DEFAULT_AUTH_REDIRECT_PATH);
    expect(sanitizeRedirectPath("../other")).toBe(DEFAULT_AUTH_REDIRECT_PATH);
  });
});
