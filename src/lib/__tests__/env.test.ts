import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

const ORIGINAL_ENV = process.env;

describe("environment configuration", () => {
  beforeEach(() => {
    vi.resetModules();
    process.env = { ...ORIGINAL_ENV } as NodeJS.ProcessEnv;
  });

  afterEach(() => {
    process.env = ORIGINAL_ENV;
  });

  it("returns Supabase browser configuration", async () => {
    process.env.NEXT_PUBLIC_SUPABASE_URL = "https://example.supabase.co";
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY = "anon";
    process.env.SUPABASE_SERVICE_ROLE_KEY = "service";

    const { getSupabaseBrowserConfig } = await import("../env");

    expect(getSupabaseBrowserConfig()).toEqual({
      url: "https://example.supabase.co",
      anonKey: "anon",
    });
  });

  it("memoizes resolved browser configuration", async () => {
    process.env.NEXT_PUBLIC_SUPABASE_URL = "https://initial.supabase.co";
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY = "initial-anon";
    process.env.SUPABASE_SERVICE_ROLE_KEY = "service";

    const { getSupabaseBrowserConfig } = await import("../env");

    expect(getSupabaseBrowserConfig()).toEqual({
      url: "https://initial.supabase.co",
      anonKey: "initial-anon",
    });

    process.env.NEXT_PUBLIC_SUPABASE_URL = "https://changed.supabase.co";
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY = "changed";

    expect(getSupabaseBrowserConfig()).toEqual({
      url: "https://initial.supabase.co",
      anonKey: "initial-anon",
    });
  });

  it("throws when service role key is missing", async () => {
    process.env.NEXT_PUBLIC_SUPABASE_URL = "https://example.supabase.co";
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY = "anon";
    delete process.env.SUPABASE_SERVICE_ROLE_KEY;

    const { getSupabaseServerConfig } = await import("../env");

    expect(() => getSupabaseServerConfig()).toThrowError(/SUPABASE_SERVICE_ROLE_KEY/);
  });
});
