import { describe, expect, it, vi } from "vitest";

import {
  fetchAndCacheMetadata,
  MetadataServiceError,
  type MetadataStorageClient,
} from "@/lib/metadata/service";

type StorageMock = ReturnType<MetadataStorageClient["storage"]["from"]>;

describe("[metadata] service", () => {
  function createSupabaseMock(overrides: Partial<StorageMock> = {}) {
    const upload = vi.fn().mockResolvedValue({ data: { path: "user/path" }, error: null });
    const getPublicUrl = vi.fn().mockReturnValue({
      data: { publicUrl: "https://storage.example.com/object/public/favicons/user/path" },
      error: null,
    });

    const storageMock: StorageMock = {
      upload,
      getPublicUrl,
      ...overrides,
    };

    const supabase: MetadataStorageClient = {
      storage: {
        from: vi.fn().mockReturnValue(storageMock),
      },
    };

    return { supabase, upload, getPublicUrl, storageMock };
  }

  it("scrapes metadata and caches the favicon", async () => {
    const { supabase, upload, getPublicUrl } = createSupabaseMock();

    const fetchImpl = vi.fn(async (input: RequestInfo | URL) => {
      const url =
        typeof input === "string" ? input : input instanceof URL ? input.toString() : input.url;

      if (url === "https://example.com/article") {
        const html = `
            <html>
              <head>
                <meta property="og:title" content="Example Article" />
                <meta name="description" content="Article description" />
                <link rel="icon" href="/favicon.ico" />
              </head>
            </html>
          `;
        return new Response(html, { status: 200, headers: { "content-type": "text/html" } });
      }

      if (url === "https://example.com/favicon.ico") {
        return new Response(new Uint8Array([1, 2, 3]), {
          status: 200,
          headers: { "content-type": "image/x-icon" },
        });
      }

      throw new Error(`Unexpected fetch call: ${url}`);
    }) as unknown as typeof fetch;

    const metadata = await fetchAndCacheMetadata({
      supabase,
      userId: "user-1",
      url: "https://example.com/article",
      fetchImpl,
    });

    expect(metadata.title).toBe("Example Article");
    expect(metadata.description).toBe("Article description");
    expect(metadata.source).toBe("remote");
    expect(metadata.favIconUrl).toBe(
      "https://storage.example.com/object/public/favicons/user/path",
    );
    expect(metadata.favIconStoragePath).toMatch(/^user-1\//);
    expect(upload).toHaveBeenCalled();
    expect(getPublicUrl).toHaveBeenCalled();
  });

  it("falls back to generator when page metadata is unavailable", async () => {
    const { supabase } = createSupabaseMock();

    const fetchImpl = vi.fn(async (input: RequestInfo | URL) => {
      const url =
        typeof input === "string" ? input : input instanceof URL ? input.toString() : input.url;

      if (url === "https://fallback.example") {
        return new Response("Server error", { status: 500 });
      }

      if (url.startsWith("https://www.google.com/s2/favicons")) {
        return new Response(new Uint8Array([5, 6, 7]), {
          status: 200,
          headers: { "content-type": "image/png" },
        });
      }

      throw new Error(`Unexpected fetch call: ${url}`);
    }) as unknown as typeof fetch;

    const metadata = await fetchAndCacheMetadata({
      supabase,
      userId: "user-2",
      url: "https://fallback.example",
      fetchImpl,
    });

    expect(metadata.title).toBe("Fallback");
    expect(metadata.source).toBe("fallback");
    expect(metadata.favIconUrl).toContain("storage.example.com");
  });

  it("throws when the favicon cannot be saved", async () => {
    const uploadError = new Error("Bucket missing");
    const { supabase, storageMock } = createSupabaseMock({
      upload: vi.fn().mockResolvedValue({ data: null, error: uploadError }),
    });

    const fetchImpl = vi.fn(async (input: RequestInfo | URL) => {
      const url =
        typeof input === "string" ? input : input instanceof URL ? input.toString() : input.url;

      if (url === "https://example.com/article") {
        const html = `
            <html>
              <head>
                <title>Example</title>
              </head>
            </html>
          `;
        return new Response(html, { status: 200, headers: { "content-type": "text/html" } });
      }

      if (url.startsWith("https://www.google.com/s2/favicons")) {
        return new Response(new Uint8Array([9, 9, 9]), {
          status: 200,
          headers: { "content-type": "image/png" },
        });
      }

      throw new Error(`Unexpected fetch call: ${url}`);
    }) as unknown as typeof fetch;

    await expect(
      fetchAndCacheMetadata({
        supabase,
        userId: "user-3",
        url: "https://example.com/article",
        fetchImpl,
      }),
    ).rejects.toBeInstanceOf(MetadataServiceError);

    expect(storageMock.upload).toHaveBeenCalled();
  });
});
