import type { ServerClient } from "@/lib/supabase/server";
import type { TagSummary } from "@/lib/tags/types";

export async function fetchTagsForUser(client: ServerClient): Promise<TagSummary[]> {
  const { data, error } = await client
    .from("tags")
    .select("id, name, color")
    .order("name", { ascending: true });

  if (error) {
    throw new Error(`Не удалось загрузить теги: ${error.message}`);
  }

  return data ?? [];
}
