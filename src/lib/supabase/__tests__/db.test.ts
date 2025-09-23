import { describe, expect, it } from "vitest";

import type { Database } from "@/lib/supabase/types";

describe("db schema", () => {
  it("provides a strongly typed links row", () => {
    const now = new Date().toISOString();

    const linkRow: Database["public"]["Tables"]["links"]["Row"] = {
      id: "11111111-1111-4111-8111-111111111111",
      user_id: "22222222-2222-4222-8222-222222222222",
      url: "https://example.com",
      title: "Example",
      comment: "demo entry",
      fav_icon_path: null,
      metadata_source: null,
      created_at: now,
      updated_at: now,
    };

    expect(linkRow.url).toBe("https://example.com");
  });

  it("matches optional fields for link insert payloads", () => {
    const insertPayload: Database["public"]["Tables"]["links"]["Insert"] = {
      user_id: "22222222-2222-4222-8222-222222222222",
      url: "https://supabase.com/docs",
    };

    expect(insertPayload.title).toBeUndefined();
    expect(insertPayload.metadata_source).toBeUndefined();
  });

  it("captures enum values for imports", () => {
    const status: Database["public"]["Enums"]["import_status"] = "pending";

    expect(status).toBe("pending");
  });
});
