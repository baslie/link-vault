import { z } from "zod";

import type { LinkListQueryFilters, LinkListResult } from "@/lib/links/query";
import { buildLinksQueryParams } from "@/lib/links/query";
import { logMonitoringEvent } from "@/lib/monitoring/client";
import type { Json } from "@/lib/supabase/types";

const linkTagSchema = z.object({
  id: z.string().uuid(),
  name: z.string(),
  color: z.string(),
});

const linkItemSchema = z.object({
  id: z.string().uuid(),
  userId: z.string().uuid(),
  url: z.string(),
  title: z.string(),
  comment: z.string().nullable(),
  favIconPath: z.string().nullable(),
  metadataSource: z.nullable(z.unknown()),
  createdAt: z.string(),
  updatedAt: z.string(),
  tags: z.array(linkTagSchema),
});

const paginationSchema = z.object({
  total: z.number().int().nonnegative(),
  page: z.number().int().min(1),
  perPage: z.number().int().min(1),
  pageCount: z.number().int().nonnegative(),
  hasNextPage: z.boolean(),
  hasPreviousPage: z.boolean(),
});

const linksResponseSchema = z.object({
  items: z.array(linkItemSchema),
  pagination: paginationSchema,
});

export function createLinksApiUrl(filters: LinkListQueryFilters): string {
  const params = buildLinksQueryParams(filters);
  const query = params.toString();
  return query.length > 0 ? `/api/links?${query}` : "/api/links";
}

export async function fetchLinks(
  filters: LinkListQueryFilters,
  init?: RequestInit,
): Promise<LinkListResult> {
  const startedAt = typeof performance !== "undefined" ? performance.now() : null;
  const response = await fetch(createLinksApiUrl(filters), {
    method: "GET",
    credentials: "include",
    ...init,
  });

  if (!response.ok) {
    if (typeof window !== "undefined" && startedAt !== null) {
      void logMonitoringEvent({
        eventType: "search_performance",
        details: {
          durationMs: Math.round(performance.now() - startedAt),
          status: "error",
          query: filters.search,
        },
        context: {
          url: window.location.href,
        },
      });
    }

    throw new Error(`Не удалось загрузить ссылки: ${response.statusText}`);
  }

  const payload = await response.json();
  const parsed = linksResponseSchema.parse(payload);

  const result: LinkListResult = {
    items: parsed.items.map((item) => ({
      ...item,
      metadataSource: item.metadataSource as Json | null,
    })),
    pagination: parsed.pagination,
  };

  if (typeof window !== "undefined" && startedAt !== null) {
    void logMonitoringEvent({
      eventType: "search_performance",
      details: {
        durationMs: Math.round(performance.now() - startedAt),
        status: "success",
        query: filters.search,
      },
      context: {
        url: window.location.href,
      },
    });
  }

  return result;
}
