import { beforeEach, describe, expect, it, vi } from "vitest";

import { generateExportCsv } from "@/lib/export/service";
import type { ServerClient } from "@/lib/supabase/server";

vi.mock("@/lib/links/query", async () => {
  const actual = await vi.importActual<typeof import("@/lib/links/query")>("@/lib/links/query");
  return {
    ...actual,
    DEFAULT_LINKS_FILTERS: {
      search: undefined,
      tagIds: undefined,
      sort: "created_at",
      order: "desc",
      page: 1,
      perPage: 20,
      dateFrom: undefined,
      dateTo: undefined,
    },
    resolveLinksFilters: vi.fn((filters: Partial<typeof actual.DEFAULT_LINKS_FILTERS>) => ({
      ...actual.DEFAULT_LINKS_FILTERS,
      ...filters,
      page: filters.page ?? 1,
      perPage: filters.perPage ?? 20,
    })),
    searchLinks: vi.fn(async () => ({
      items: [
        {
          id: "00000000-0000-0000-0000-000000000001",
          userId: "11111111-1111-1111-1111-111111111111",
          url: "https://example.com",
          title: "Example",
          comment: null,
          favIconPath: null,
          metadataSource: null,
          createdAt: "2024-01-05T00:00:00.000Z",
          updatedAt: "2024-01-05T00:00:00.000Z",
          tags: [],
        },
      ],
      pagination: {
        total: 1,
        page: 1,
        perPage: 20,
        pageCount: 1,
        hasNextPage: false,
        hasPreviousPage: false,
      },
    })),
  };
});

const { searchLinks } = await import("@/lib/links/query");

describe("export service", () => {
  const fromMock = vi.fn();
  let client: Partial<ServerClient>;

  beforeEach(() => {
    fromMock.mockReturnValue({
      select: vi.fn(() => ({
        in: vi.fn().mockResolvedValue({ data: [], error: null }),
      })),
    });

    client = {
      from: fromMock,
    } as unknown as Partial<ServerClient>;
  });

  it("creates CSV for full export", async () => {
    const result = await generateExportCsv(client as ServerClient, { scope: "all" });
    expect(result.filename).toMatch(/link-vault-all/);
    expect(result.content).toContain("https://example.com");
    expect(searchLinks).toHaveBeenCalled();
  });

  it("throws when selected scope has no ids", async () => {
    await expect(
      generateExportCsv(client as ServerClient, { scope: "selected", ids: [] }),
    ).rejects.toThrow(/Выберите хотя бы одну ссылку/);
  });

  it("loads selected links when ids provided", async () => {
    fromMock.mockReturnValueOnce({
      select: vi.fn(() => ({
        in: vi.fn().mockResolvedValue({
          data: [
            {
              id: "00000000-0000-0000-0000-000000000001",
              user_id: "11111111-1111-1111-1111-111111111111",
              url: "https://example.com",
              title: "Example",
              comment: null,
              fav_icon_path: null,
              metadata_source: null,
              created_at: "2024-01-05T00:00:00.000Z",
              updated_at: "2024-01-05T00:00:00.000Z",
              tag_ids: [],
              tag_names: [],
              tag_colors: [],
            },
          ],
          error: null,
        }),
      })),
    });

    const result = await generateExportCsv(client as ServerClient, {
      scope: "selected",
      ids: ["00000000-0000-0000-0000-000000000001"],
    });
    expect(result.content).toContain("https://example.com");
  });
});
