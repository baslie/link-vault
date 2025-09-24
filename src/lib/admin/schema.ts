import { z } from "zod";

import type { AdminDashboardMetrics } from "@/lib/admin/types";

const nullableEmailSchema = z
  .union([
    z.string().email(),
    z
      .string()
      .length(0)
      .transform(() => null),
    z.null(),
  ])
  .transform((value) => (value === "" ? null : value));

const userStatSchema = z.object({
  userId: z.string().uuid(),
  displayName: z.string().min(1),
  email: nullableEmailSchema,
  linksCount: z.coerce.number().int().nonnegative(),
});

const activityPointSchema = z.object({
  date: z.string().min(1),
  linksCount: z.coerce.number().int().nonnegative(),
});

const tagStatSchema = z.object({
  tagName: z.string().min(1),
  color: z.string().min(1),
  usageCount: z.coerce.number().int().nonnegative(),
});

const rawDashboardSchema = z.object({
  totalUsers: z.coerce.number().int().nonnegative(),
  totalLinks: z.coerce.number().int().nonnegative(),
  averageLinksPerUser: z.coerce.number().nonnegative(),
  linksByUser: z.array(userStatSchema),
  activityByDay: z.array(activityPointSchema),
  popularTags: z.array(tagStatSchema),
});

export type RawAdminDashboard = z.infer<typeof rawDashboardSchema>;

function roundShare(value: number) {
  return Math.round(value * 100) / 100;
}

export function normalizeAdminDashboard(input: unknown): AdminDashboardMetrics {
  const parsed = rawDashboardSchema.parse(input);
  const totalLinks = parsed.totalLinks;
  const denominator = totalLinks > 0 ? totalLinks : 1;

  const linksByUser = parsed.linksByUser.map((item) => ({
    userId: item.userId,
    displayName: item.displayName,
    email: item.email,
    linksCount: item.linksCount,
    linksShare: totalLinks === 0 ? 0 : roundShare((item.linksCount / denominator) * 100),
  }));

  const activityByDay = [...parsed.activityByDay].sort((a, b) => a.date.localeCompare(b.date));
  const popularTags = [...parsed.popularTags].sort((a, b) => {
    if (b.usageCount === a.usageCount) {
      return a.tagName.localeCompare(b.tagName);
    }

    return b.usageCount - a.usageCount;
  });

  return {
    totalUsers: parsed.totalUsers,
    totalLinks: parsed.totalLinks,
    averageLinksPerUser: Math.round(parsed.averageLinksPerUser * 100) / 100,
    linksByUser,
    activityByDay,
    popularTags,
  } satisfies AdminDashboardMetrics;
}

export const __testables = {
  rawDashboardSchema,
  roundShare,
};
