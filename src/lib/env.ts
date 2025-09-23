import { z } from "zod";

const browserEnvSchema = z.object({
  NEXT_PUBLIC_SUPABASE_URL: z.string().url(),
  NEXT_PUBLIC_SUPABASE_ANON_KEY: z.string().min(1, "NEXT_PUBLIC_SUPABASE_ANON_KEY is required"),
});

const serverEnvSchema = browserEnvSchema.extend({
  SUPABASE_SERVICE_ROLE_KEY: z.string().min(1, "SUPABASE_SERVICE_ROLE_KEY is required"),
});

type BrowserEnv = z.infer<typeof browserEnvSchema>;
type ServerEnv = z.infer<typeof serverEnvSchema>;

let browserEnvCache: BrowserEnv | null = null;
let serverEnvCache: ServerEnv | null = null;

function loadBrowserEnv(): BrowserEnv {
  if (!browserEnvCache) {
    browserEnvCache = browserEnvSchema.parse(process.env);
  }

  return browserEnvCache;
}

function loadServerEnv(): ServerEnv {
  if (!serverEnvCache) {
    serverEnvCache = serverEnvSchema.parse(process.env);
  }

  return serverEnvCache;
}

export function getSupabaseBrowserConfig() {
  const env = loadBrowserEnv();

  return {
    url: env.NEXT_PUBLIC_SUPABASE_URL,
    anonKey: env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
  } as const;
}

export function getSupabaseServerConfig() {
  const env = loadServerEnv();

  return {
    url: env.NEXT_PUBLIC_SUPABASE_URL,
    anonKey: env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
    serviceRoleKey: env.SUPABASE_SERVICE_ROLE_KEY,
  } as const;
}
