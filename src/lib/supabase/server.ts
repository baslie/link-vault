import { createClient, type SupabaseClient } from "@supabase/supabase-js";

import { getSupabaseBrowserConfig, getSupabaseServerConfig } from "@/lib/env";
import type { Database } from "@/lib/supabase/types";

export type ServerClient = SupabaseClient<Database>;

export function createSupabaseServerClient(accessToken?: string): ServerClient {
  const { url, anonKey } = getSupabaseBrowserConfig();

  return createClient<Database>(url, anonKey, {
    auth: {
      persistSession: false,
      autoRefreshToken: Boolean(accessToken),
    },
    global: {
      headers: accessToken
        ? {
            Authorization: `Bearer ${accessToken}`,
          }
        : undefined,
    },
  });
}

export function createSupabaseServiceRoleClient(): ServerClient {
  const { url, serviceRoleKey } = getSupabaseServerConfig();

  return createClient<Database>(url, serviceRoleKey, {
    auth: {
      persistSession: false,
      autoRefreshToken: false,
    },
  });
}
