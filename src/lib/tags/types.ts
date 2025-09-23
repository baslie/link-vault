import type { Tables } from "@/lib/supabase/types";

export type TagSummary = Pick<Tables<"tags">, "id" | "name" | "color">;
