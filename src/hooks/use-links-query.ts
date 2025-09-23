"use client";

import { useMemo } from "react";
import { useQuery, type UseQueryOptions } from "@tanstack/react-query";

import type { LinkListQueryFilters, LinkListResult } from "@/lib/links/query";
import { createLinksQueryKey, resolveLinksFilters } from "@/lib/links/query";
import { fetchLinks } from "@/lib/links/client";

type LinksQueryKey = ReturnType<typeof createLinksQueryKey>;

type UseLinksQueryOptions = Omit<
  UseQueryOptions<LinkListResult, Error, LinkListResult, LinksQueryKey>,
  "queryKey" | "queryFn"
>;

export function useLinksQuery(
  filters: Partial<LinkListQueryFilters>,
  options?: UseLinksQueryOptions,
) {
  const resolvedFilters = useMemo(() => resolveLinksFilters(filters), [filters]);

  return useQuery<LinkListResult, Error, LinkListResult, LinksQueryKey>({
    queryKey: createLinksQueryKey(resolvedFilters),
    queryFn: () => fetchLinks(resolvedFilters),
    placeholderData: (previous) => previous,
    ...options,
  });
}
