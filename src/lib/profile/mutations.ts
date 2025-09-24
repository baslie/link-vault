import type { SupabaseClient } from "@supabase/supabase-js";

import {
  profileSettingsSchema,
  type ProfileRecord,
  type ProfileSettingsInput,
} from "@/lib/profile/schema";
import type { Database, TablesUpdate } from "@/lib/supabase/types";

interface AuthUser {
  id: string;
}

type Client = SupabaseClient<Database>;

async function requireUser(client: Client): Promise<AuthUser> {
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

function buildUpdatePayload(input: ProfileSettingsInput): TablesUpdate<"profiles"> {
  const displayName = input.displayName?.trim();
  const payload: TablesUpdate<"profiles"> = {
    theme: input.theme,
    display_name: displayName && displayName.length > 0 ? displayName : null,
  };

  return payload;
}

export async function updateProfileSettings(
  client: Client,
  rawInput: ProfileSettingsInput,
): Promise<ProfileRecord> {
  const parsed = profileSettingsSchema.parse(rawInput);
  const user = await requireUser(client);
  const payload = buildUpdatePayload(parsed);

  const { data, error } = await client
    .from("profiles")
    .update(payload)
    .eq("id", user.id)
    .select("id, email, display_name, theme")
    .single();

  if (error) {
    throw new Error(`Не удалось обновить профиль: ${error.message}`);
  }

  if (!data) {
    throw new Error("Профиль не найден");
  }

  return data;
}
