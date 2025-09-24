import { z } from "zod";

import type { Tables } from "@/lib/supabase/types";

export const themePreferenceSchema = z.enum(["light", "dark", "system"]);

export const profileSettingsSchema = z.object({
  displayName: z.string().trim().max(120, "Имя не должно превышать 120 символов").optional(),
  theme: themePreferenceSchema,
});

export type ProfileSettingsInput = z.infer<typeof profileSettingsSchema>;

export type ProfileRecord = Pick<Tables<"profiles">, "id" | "email" | "display_name" | "theme">;
