import { describe, expect, it } from "vitest";

import { normalizeAdminDashboard, __testables } from "@/lib/admin/schema";

const { rawDashboardSchema, roundShare } = __testables;

describe("admin dashboard schema", () => {
  it("нормализует ответ функции Supabase", () => {
    const input = {
      totalUsers: "5",
      totalLinks: 20,
      averageLinksPerUser: "4",
      linksByUser: [
        {
          userId: "aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa",
          displayName: "Анна",
          email: "anna@example.com",
          linksCount: 8,
        },
        {
          userId: "bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb",
          displayName: "Борис",
          email: null,
          linksCount: 12,
        },
      ],
      activityByDay: [
        { date: "2024-11-01", linksCount: 4 },
        { date: "2024-11-02", linksCount: 6 },
      ],
      popularTags: [
        { tagName: "Next.js", color: "#000000", usageCount: 5 },
        { tagName: "Supabase", color: "#10b981", usageCount: 3 },
      ],
    };

    const parsed = normalizeAdminDashboard(input);

    expect(parsed.totalUsers).toBe(5);
    expect(parsed.totalLinks).toBe(20);
    expect(parsed.averageLinksPerUser).toBe(4);
    expect(parsed.linksByUser).toHaveLength(2);
    expect(parsed.linksByUser[0]).toMatchObject({
      userId: "aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa",
      linksShare: 40,
    });
    expect(parsed.linksByUser[1]).toMatchObject({
      userId: "bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb",
      linksShare: 60,
    });
    expect(parsed.activityByDay.map((item) => item.date)).toEqual(["2024-11-01", "2024-11-02"]);
    expect(parsed.popularTags[0].tagName).toBe("Next.js");
  });

  it("возвращает нулевые доли при отсутствии ссылок", () => {
    const parsed = normalizeAdminDashboard({
      totalUsers: 0,
      totalLinks: 0,
      averageLinksPerUser: 0,
      linksByUser: [
        {
          userId: "cccccccc-cccc-cccc-cccc-cccccccccccc",
          displayName: "Мария",
          email: "",
          linksCount: 0,
        },
      ],
      activityByDay: [],
      popularTags: [],
    });

    expect(parsed.linksByUser[0].linksShare).toBe(0);
  });

  it("валидирует структуру JSON", () => {
    expect(() => rawDashboardSchema.parse({})).toThrow();
  });
});

describe("roundShare", () => {
  it("ограничивает значение двумя знаками после запятой", () => {
    expect(roundShare(12.3456)).toBe(12.35);
  });
});
