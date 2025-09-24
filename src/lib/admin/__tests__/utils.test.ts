import { describe, expect, it } from "vitest";

import { isAdminSession } from "@/lib/admin/utils";

describe("isAdminSession", () => {
  function buildSession(
    metadata: Record<string, unknown> = {},
    userMetadata: Record<string, unknown> = {},
  ) {
    return {
      user: {
        id: "user-id",
        app_metadata: metadata,
        user_metadata: userMetadata,
      },
    } as unknown as Parameters<typeof isAdminSession>[0];
  }

  it("распознаёт роль admin в app_metadata", () => {
    expect(isAdminSession(buildSession({ role: "admin" }))).toBe(true);
  });

  it("распознаёт массив ролей", () => {
    expect(isAdminSession(buildSession({ roles: ["editor", "admin"] }))).toBe(true);
  });

  it("учитывает пользовательские метаданные", () => {
    expect(isAdminSession(buildSession({}, { roles: ["viewer", "ADMIN"] }))).toBe(true);
  });

  it("поддерживает явный флаг is_admin", () => {
    expect(isAdminSession(buildSession({ is_admin: true }))).toBe(true);
  });

  it("возвращает false для обычного пользователя", () => {
    expect(isAdminSession(buildSession({ role: "user" }))).toBe(false);
  });
});
