import { describe, expect, it } from "vitest";

import { buildPreparedRow, normalizeUrl, parseTags, partitionRowsByUrl } from "@/lib/import/utils";

const baseRow = {
  rowNumber: 1,
  values: {
    URL: "https://example.com",
    Title: "Example",
    Comment: "Test",
    Tags: "alpha, beta",
    Date: "2024-01-05",
  },
};

describe("import utils", () => {
  it("normalizes URLs and rejects invalid ones", () => {
    expect(normalizeUrl("https://example.com")).toBe("https://example.com/");
    expect(normalizeUrl("ftp://invalid")).toBeUndefined();
    expect(normalizeUrl("not a url")).toBeUndefined();
  });

  it("splits tags by supported delimiters", () => {
    expect(parseTags("alpha, beta;gamma|delta")).toEqual(["alpha", "beta", "gamma", "delta"]);
    expect(parseTags(undefined)).toEqual([]);
  });

  it("builds prepared row with defaults", () => {
    const result = buildPreparedRow(baseRow, {
      url: "URL",
      title: "Title",
      comment: "Comment",
      tags: "Tags",
      createdAt: "Date",
    });

    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.row.url).toBe("https://example.com/");
      expect(result.row.title).toBe("Example");
      expect(result.row.comment).toBe("Test");
      expect(result.row.tags).toEqual(["alpha", "beta"]);
      expect(result.row.createdAt).toBe("2024-01-05T00:00:00.000Z");
    }
  });

  it("reports invalid URLs", () => {
    const result = buildPreparedRow(
      { ...baseRow, values: { ...baseRow.values, URL: "invalid" } },
      { url: "URL" },
    );

    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.message).toContain("Некорректный URL");
    }
  });

  it("partitionRowsByUrl identifies duplicates", () => {
    const rows = [
      {
        rowNumber: 1,
        url: "https://a.com/",
        title: "a",
        comment: null,
        tags: [],
        createdAt: undefined,
      },
      {
        rowNumber: 2,
        url: "https://b.com/",
        title: "b",
        comment: null,
        tags: [],
        createdAt: undefined,
      },
      {
        rowNumber: 3,
        url: "https://a.com/",
        title: "a2",
        comment: null,
        tags: [],
        createdAt: undefined,
      },
    ];

    const { unique, duplicates } = partitionRowsByUrl(rows);
    expect(unique).toHaveLength(2);
    expect(duplicates).toHaveLength(1);
    expect(duplicates[0]?.rowNumber).toBe(3);
  });
});
