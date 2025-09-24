import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import {
  fetchLinkMetadata,
  getMetadataSourceLabel,
  parseLinkMetadata,
  resolveMetadataIcon,
  type LinkMetadata,
} from "@/lib/links/metadata";

describe("[links] metadata helpers", () => {
  const originalFetch = global.fetch;

  beforeEach(() => {
    vi.resetAllMocks();
  });

  afterEach(() => {
    global.fetch = originalFetch;
  });

  it("parses metadata payloads from the API", async () => {
    const responsePayload = {
      metadata: {
        title: "Docs",
        description: "API docs",
        favIconUrl: "https://cdn.local/favicons/docs.png",
        favIconStoragePath: "user/hash.png",
        source: "remote" as const,
        fetchedAt: new Date().toISOString(),
      },
    } satisfies { metadata: LinkMetadata };

    global.fetch = vi.fn().mockResolvedValue(
      new Response(JSON.stringify(responsePayload), {
        status: 200,
        headers: { "content-type": "application/json" },
      }),
    );

    const metadata = await fetchLinkMetadata("https://docs.example.com/guide");

    expect(metadata.title).toBe("Docs");
    expect(metadata.favIconUrl).toBe("https://cdn.local/favicons/docs.png");
    expect(metadata.source).toBe("remote");
    expect(getMetadataSourceLabel(metadata.source)).toBe("Страница сайта");
  });

  it("parses metadata objects", () => {
    const payload: LinkMetadata = {
      title: "Example",
      favIconUrl: "https://example.com/favicon.ico",
      favIconStoragePath: "user/file.ico",
      source: "cache",
      fetchedAt: new Date().toISOString(),
    };

    const parsed = parseLinkMetadata(payload);
    expect(parsed?.title).toBe("Example");
  });

  it("throws on API errors", async () => {
    global.fetch = vi.fn().mockResolvedValue(
      new Response(JSON.stringify({ error: "Некорректный URL" }), {
        status: 400,
        headers: { "content-type": "application/json" },
      }),
    );

    await expect(fetchLinkMetadata("https://invalid.example")).rejects.toThrow("Некорректный URL");
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
