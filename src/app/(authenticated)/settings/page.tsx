import type { Metadata } from "next";

import { SettingsWorkspace } from "@/components/settings/settings-workspace";
import { fetchTagsForUser } from "@/lib/tags/server";
import { getSupabaseServerComponentClient } from "@/lib/supabase/server";

export const metadata: Metadata = {
  title: "Настройки профиля — Link Vault",
  description: "Управление профилем, темой и тегами",
};

export default async function SettingsPage() {
  const supabase = getSupabaseServerComponentClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    throw new Error("Требуется аутентификация");
  }

  const { data: profile, error } = await supabase
    .from("profiles")
    .select("id, email, display_name, theme")
    .eq("id", user.id)
    .single();

  if (error || !profile) {
    throw new Error("Не удалось загрузить профиль пользователя");
  }

  const tagList = await fetchTagsForUser(supabase);

  return <SettingsWorkspace profile={profile} tags={tagList} />;
}
