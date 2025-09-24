import { describe, expect, it } from "vitest";

import {
  fetchLinkMetadata,
  parseLinkMetadata,
  resolveMetadataIcon,
  type LinkMetadata,
} from "@/lib/links/metadata";

describe("[links] metadata helpers", () => {
  it("returns a stub metadata payload", async () => {
    const metadata = await fetchLinkMetadata("https://docs.example.com/guide");

    expect(metadata.title).toBe("Docs");
    expect(metadata.favIconUrl).toContain("docs.example.com");
    expect(metadata.source).toBe("stub");
    expect(new Date(metadata.fetchedAt).toString()).not.toBe("Invalid Date");
  });

  it("parses metadata objects", () => {
    const payload: LinkMetadata = {
      title: "Example",
      favIconUrl: "https://example.com/favicon.ico",
      source: "stub",
      fetchedAt: new Date().toISOString(),
    };

    const parsed = parseLinkMetadata(payload);
    expect(parsed?.title).toBe("Example");
  });

  it("throws on invalid URLs", async () => {
    await expect(fetchLinkMetadata("not-a-url")).rejects.toThrow(
      "Не удалось получить метаданные: некорректный URL",
    );
  });

  it("resolves favicon fallback", () => {
    const icon = resolveMetadataIcon(null, "https://example.com/about");
    expect(icon).toContain("example.com");
  });
});
