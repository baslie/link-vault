import type { SupabaseClient } from "@supabase/supabase-js";

import {
  deleteTagSchema,
  updateTagSchema,
  type DeleteTagInput,
  type UpdateTagInput,
} from "@/lib/tags/schema";
import type { TagSummary } from "@/lib/tags/types";
import type { Database, TablesUpdate } from "@/lib/supabase/types";

interface AuthenticatedUser {
  id: string;
}

type Client = SupabaseClient<Database>;

async function requireUser(client: Client): Promise<AuthenticatedUser> {
  const {
    data: { user },
    error,
  } = await client.auth.getUser();

  if (error) {
    throw new Error(`Не удалось получить пользователя: ${error.message}`);
  }

  if (!user) {
    throw new Error("Требуется аутентификация");
  }

  return { id: user.id };
}

function buildUpdatePayload(input: UpdateTagInput): TablesUpdate<"tags"> {
  const payload: TablesUpdate<"tags"> = {
    name: input.name,
  };

  if (input.color) {
    payload.color = input.color;
  }

  return payload;
}

function normalizeTagColor(color?: string): string | undefined {
  if (!color) {
    return undefined;
  }

  const trimmed = color.trim();
  return trimmed.length > 0 ? trimmed : undefined;
}

function mapSupabaseError(prefix: string, error: { code?: string; message: string }): Error {
  if (error.code === "23505" || error.message.includes("tags_user_name_unique")) {
    return new Error("Тег с таким названием уже существует");
  }

  return new Error(`${prefix}: ${error.message}`);
}

export async function updateTag(client: Client, rawInput: UpdateTagInput): Promise<TagSummary> {
  const parsed = updateTagSchema.parse({
    ...rawInput,
    color: normalizeTagColor(rawInput.color),
  });

  const user = await requireUser(client);
  const updatePayload = buildUpdatePayload(parsed);

  const { data, error } = await client
    .from("tags")
    .update(updatePayload)
    .eq("id", parsed.id)
    .eq("user_id", user.id)
    .select("id, name, color")
    .single();

  if (error) {
    throw mapSupabaseError("Не удалось обновить тег", error);
  }

  if (!data) {
    throw new Error("Тег не найден");
  }

  return data;
}

export async function deleteTag(client: Client, rawInput: DeleteTagInput): Promise<void> {
  const parsed = deleteTagSchema.parse(rawInput);
  const user = await requireUser(client);

  const { error } = await client.from("tags").delete().eq("id", parsed.id).eq("user_id", user.id);

  if (error) {
    throw mapSupabaseError("Не удалось удалить тег", error);
  }
}
