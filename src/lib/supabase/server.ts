import { cookies } from "next/headers";
import type { CookieOptions } from "@supabase/ssr";
import { createServerClient } from "@supabase/ssr";
import { createClient, type SupabaseClient } from "@supabase/supabase-js";

import { getSupabaseBrowserConfig, getSupabaseServerConfig } from "@/lib/env";
import type { Database } from "@/lib/supabase/types";

export type ServerClient = SupabaseClient<Database>;

type CookieStore = ReturnType<typeof cookies>;

type CookiePayload = {
  name: string;
  value: string;
  options: CookieOptions;
};

function mapCookiesToArray(store: CookieStore) {
  return store.getAll().map((cookie) => ({
    name: cookie.name,
    value: cookie.value,
  }));
}

function applyCookies(store: CookieStore, cookiesToSet: CookiePayload[]) {
  cookiesToSet.forEach(({ name, value, options }) => {
    store.set({ name, value, ...options });
  });
}

export function getSupabaseServerComponentClient(): ServerClient {
  const cookieStore = cookies();
  const { url, anonKey } = getSupabaseBrowserConfig();

  return createServerClient<Database>(url, anonKey, {
    cookies: {
      getAll() {
        return mapCookiesToArray(cookieStore);
      },
    },
  });
}

export function createSupabaseServerActionClient(cookieStore: CookieStore): ServerClient {
  const { url, anonKey } = getSupabaseBrowserConfig();

  return createServerClient<Database>(url, anonKey, {
    cookies: {
      getAll() {
        return mapCookiesToArray(cookieStore);
      },
      setAll(cookiesToSet) {
        applyCookies(cookieStore, cookiesToSet);
      },
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
