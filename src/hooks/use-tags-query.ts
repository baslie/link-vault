"use client";

import { useQuery, type UseQueryOptions } from "@tanstack/react-query";

import { getSupabaseBrowserClient } from "@/lib/supabase/client";
import type { TagSummary } from "@/lib/tags/types";

async function fetchTags(): Promise<TagSummary[]> {
  const supabase = getSupabaseBrowserClient();
  const { data, error } = await supabase
    .from("tags")
    .select("id, name, color")
    .order("name", { ascending: true });

  if (error) {
    throw new Error(`Не удалось загрузить теги: ${error.message}`);
  }

  return data ?? [];
}

type UseTagsQueryOptions = Omit<
  UseQueryOptions<TagSummary[], Error, TagSummary[], ["tags"]>,
  "queryKey" | "queryFn"
>;

export function useTagsQuery(options?: UseTagsQueryOptions) {
  return useQuery<TagSummary[], Error, TagSummary[], ["tags"]>({
    queryKey: ["tags"],
    queryFn: fetchTags,
    staleTime: 5 * 60 * 1000,
    ...options,
  });
}
