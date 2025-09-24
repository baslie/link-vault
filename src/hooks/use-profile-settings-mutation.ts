"use client";

import { useMutation } from "@tanstack/react-query";

import { getSupabaseBrowserClient } from "@/lib/supabase/client";
import { updateProfileSettings } from "@/lib/profile/mutations";
import type { ProfileRecord, ProfileSettingsInput } from "@/lib/profile/schema";

async function mutateSettings(input: ProfileSettingsInput): Promise<ProfileRecord> {
  const supabase = getSupabaseBrowserClient();
  return updateProfileSettings(supabase, input);
}

export function useProfileSettingsMutation() {
  return useMutation<ProfileRecord, Error, ProfileSettingsInput>({
    mutationFn: mutateSettings,
  });
}
