import { beforeEach, describe, expect, it, vi } from "vitest";

import { buildImportPreview } from "@/lib/import/preview";
import type { ServerClient } from "@/lib/supabase/server";

describe("import preview", () => {
  const fetchMock = vi.fn();
  let client: Partial<ServerClient>;

  beforeEach(() => {
    fetchMock.mockReset();
    fetchMock.mockResolvedValue({ data: [], error: null });
    client = {
      from: vi.fn(() => ({
        select: vi.fn(() => ({
          eq: vi.fn(() => ({
            in: fetchMock,
          })),
        })),
      })),
    } as unknown as Partial<ServerClient>;
  });

  it("returns ready rows when no duplicates during import", async () => {
    const result = await buildImportPreview(client as ServerClient, "user-1", {
      mapping: { url: "URL", title: "Title" },
      rows: [
        { rowNumber: 2, values: { URL: "https://example.com", Title: "Example" } },
        { rowNumber: 3, values: { URL: "https://example.org", Title: "Example 2" } },
      ],
    });

    expect(result.summary.ready).toBe(2);
    expect(result.rows.duplicates).toHaveLength(0);
    expect(fetchMock).toHaveBeenCalled();
  });

  it("marks duplicates found in existing data", async () => {
    fetchMock.mockResolvedValueOnce({
      data: [{ url: "https://example.com/" }],
      error: null,
    });

    const result = await buildImportPreview(client as ServerClient, "user-1", {
      mapping: { url: "URL" },
      rows: [
        { rowNumber: 2, values: { URL: "https://example.com" } },
        { rowNumber: 3, values: { URL: "https://example.org" } },
      ],
    });

    expect(result.summary.ready).toBe(1);
    expect(result.rows.duplicates).toHaveLength(1);
    expect(result.rows.duplicates[0]?.reason).toBe("existing");
  });

  it("marks duplicates within the same file", async () => {
    const result = await buildImportPreview(client as ServerClient, "user-1", {
      mapping: { url: "URL" },
      rows: [
        { rowNumber: 2, values: { URL: "https://example.com" } },
        { rowNumber: 3, values: { URL: "https://example.com" } },
      ],
    });

    expect(result.summary.ready).toBe(1);
    expect(result.rows.duplicates).toHaveLength(1);
    expect(result.rows.duplicates[0]?.reason).toBe("duplicate");
  });
});
