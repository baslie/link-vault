import { describe, expect, it } from "vitest";

import { buildCsvContent } from "@/lib/export/csv";
import type { LinkListItem } from "@/lib/links/query";

describe("export csv", () => {
  it("serializes items to CSV", () => {
    const items: LinkListItem[] = [
      {
        id: "1",
        userId: "user",
        url: "https://example.com",
        title: "Example",
        comment: "Note",
        favIconPath: null,
        metadataSource: null,
        createdAt: "2024-01-05T12:00:00.000Z",
        updatedAt: "2024-01-05T12:00:00.000Z",
        tags: [
          { id: "t1", name: "tag-1", color: "#000" },
          { id: "t2", name: "tag-2", color: "#fff" },
        ],
      },
    ];

    const csv = buildCsvContent(items);
    expect(csv).toContain("URL,Title,Comment,Tags,Date");
    expect(csv).toContain("https://example.com");
    expect(csv).toContain('"tag-1, tag-2"');
    expect(csv).toContain("2024-01-05T12:00:00.000Z");
  });
});
