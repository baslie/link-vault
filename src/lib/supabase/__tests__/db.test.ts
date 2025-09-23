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

  it("exposes the links_with_tags view", () => {
    const viewRow: Database["public"]["Views"]["links_with_tags"]["Row"] = {
      id: "33333333-3333-4333-8333-333333333333",
      user_id: "44444444-4444-4444-8444-444444444444",
      url: "https://example.com",
      title: "Example",
      comment: null,
      fav_icon_path: null,
      metadata_source: null,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
      tag_ids: [],
      tag_names: [],
      tag_colors: [],
      search_vector: null,
    };

    expect(Array.isArray(viewRow.tag_ids)).toBe(true);
  });

  it("describes the search_links rpc payload", () => {
    const args: Database["public"]["Functions"]["search_links"]["Args"] = {
      p_search: "design",
      p_page: 2,
    };

    expect(args.p_search).toBe("design");
    expect(args.p_page).toBe(2);
  });
});
