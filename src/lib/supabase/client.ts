import { createClient, type SupabaseClient } from "@supabase/supabase-js";

import { getSupabaseBrowserConfig } from "@/lib/env";
import type { Database } from "@/lib/supabase/types";

type BrowserClient = SupabaseClient<Database>;

declare global {
  // eslint-disable-next-line no-var
  var __supabaseBrowserClient: BrowserClient | undefined;
}

export function getSupabaseBrowserClient(): BrowserClient {
  if (!globalThis.__supabaseBrowserClient) {
    const { url, anonKey } = getSupabaseBrowserConfig();

    globalThis.__supabaseBrowserClient = createClient<Database>(url, anonKey, {
      auth: {
        persistSession: true,
        autoRefreshToken: true,
      },
    });
  }

  return globalThis.__supabaseBrowserClient;
}
