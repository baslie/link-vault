import { afterEach, describe, expect, it, vi } from "vitest";

import { createLinksApiUrl, fetchLinks } from "@/lib/links/client";
import { DEFAULT_LINKS_FILTERS, resolveLinksFilters } from "@/lib/links/query";

const sampleLink = {
  id: "33333333-3333-4333-8333-333333333333",
  userId: "44444444-4444-4444-8444-444444444444",
  url: "https://example.com",
  title: "Example",
  comment: null,
  favIconPath: null,
  metadataSource: null,
  createdAt: new Date("2024-01-01T10:00:00Z").toISOString(),
  updatedAt: new Date("2024-01-01T10:00:00Z").toISOString(),
  tags: [],
};

describe("[api] links client helpers", () => {
  afterEach(() => {
    vi.restoreAllMocks();
    vi.unstubAllGlobals();
  });

  it("builds the API url based on filters", () => {
    const filters = resolveLinksFilters({
      search: "react",
      page: 3,
    });

    expect(createLinksApiUrl(filters)).toBe(
      "/api/links?search=react&sort=created_at&order=desc&page=3&perPage=20",
    );
  });

  it("fetches and parses the links response", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn(
        async () =>
          new Response(
            JSON.stringify({
              items: [sampleLink],
              pagination: {
                total: 1,
                page: 1,
                perPage: 20,
                pageCount: 1,
                hasNextPage: false,
                hasPreviousPage: false,
              },
            }),
            {
              status: 200,
              headers: { "Content-Type": "application/json" },
            },
          ),
      ) as unknown as typeof fetch,
    );

    const result = await fetchLinks(DEFAULT_LINKS_FILTERS);

    expect(result.items).toHaveLength(1);
    expect(result.pagination.total).toBe(1);
  });

  it("throws when the API responds with an error status", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn(
        async () => new Response(null, { status: 400, statusText: "Bad Request" }),
      ) as unknown as typeof fetch,
    );

    await expect(fetchLinks(DEFAULT_LINKS_FILTERS)).rejects.toThrow("Bad Request");
  });
});
