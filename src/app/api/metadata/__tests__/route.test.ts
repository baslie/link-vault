import { beforeEach, describe, expect, it, vi } from "vitest";
import { NextRequest } from "next/server";

import { type MetadataStorageClient } from "@/lib/metadata/service";

const originalFetch = global.fetch;

const cookiesMock = vi.fn(() => ({
  getAll: () => [],
  set: vi.fn(),
}));

vi.mock("next/headers", () => ({
  cookies: cookiesMock,
}));

const createSupabaseServerActionClient = vi.fn();

vi.mock("@/lib/supabase/server", () => ({
  createSupabaseServerActionClient,
}));

type StorageMock = ReturnType<MetadataStorageClient["storage"]["from"]>;

type SupabaseMock = MetadataStorageClient & {
  auth: {
    getUser: ReturnType<typeof vi.fn>;
  };
};

function createSupabaseMock(overrides: Partial<StorageMock> = {}): {
  supabase: SupabaseMock;
  storageMock: StorageMock;
  upload: StorageMock["upload"];
  getPublicUrl: StorageMock["getPublicUrl"];
} {
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

  const supabase: SupabaseMock = {
    auth: {
      getUser: vi.fn().mockResolvedValue({ data: { user: { id: "user-1" } }, error: null }),
    },
    storage: {
      from: vi.fn().mockReturnValue(storageMock),
    },
  };

  return { supabase, storageMock, upload, getPublicUrl };
}

describe("[api] /api/metadata", () => {
  beforeEach(() => {
    vi.resetModules();
    createSupabaseServerActionClient.mockReset();
    cookiesMock.mockClear();
    global.fetch = originalFetch;
  });

  it("returns metadata for an authenticated user", async () => {
    const { supabase } = createSupabaseMock();
    createSupabaseServerActionClient.mockReturnValue(supabase);

    global.fetch = vi.fn(async (input: RequestInfo | URL) => {
      const url =
        typeof input === "string" ? input : input instanceof URL ? input.toString() : input.url;

      if (url === "https://example.com/article") {
        const html = `
            <html>
              <head>
                <meta property="og:title" content="Example Article" />
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

    const { GET } = await import("../route");
    const request = new NextRequest(
      "http://localhost/api/metadata?url=https://example.com/article",
    );
    const response = await GET(request);

    expect(response.status).toBe(200);
    const body = await response.json();
    expect(body.metadata.title).toBe("Example Article");
    expect(body.metadata.favIconUrl).toContain("storage.example.com");
  });

  it("rejects unauthenticated requests", async () => {
    const { supabase } = createSupabaseMock();
    supabase.auth.getUser = vi.fn().mockResolvedValue({ data: { user: null }, error: null });
    createSupabaseServerActionClient.mockReturnValue(supabase);

    const { GET } = await import("../route");
    const request = new NextRequest("http://localhost/api/metadata?url=https://example.com");
    const response = await GET(request);

    expect(response.status).toBe(401);
  });

  it("handles service errors", async () => {
    const uploadError = new Error("bucket missing");
    const { supabase, storageMock } = createSupabaseMock({
      upload: vi.fn().mockResolvedValue({ data: null, error: uploadError }),
    });
    createSupabaseServerActionClient.mockReturnValue(supabase);

    global.fetch = vi.fn(async (input: RequestInfo | URL) => {
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
        return new Response(new Uint8Array([1, 1, 1]), {
          status: 200,
          headers: { "content-type": "image/png" },
        });
      }

      throw new Error(`Unexpected fetch call: ${url}`);
    }) as unknown as typeof fetch;

    const { GET } = await import("../route");
    const request = new NextRequest(
      "http://localhost/api/metadata?url=https://example.com/article",
    );
    const response = await GET(request);

    expect(response.status).toBe(502);
    const body = await response.json();
    expect(body.error).toContain("Не удалось сохранить фавиконку");
    expect(storageMock.upload).toHaveBeenCalled();
  });

  it("validates incoming URLs", async () => {
    const { supabase } = createSupabaseMock();
    createSupabaseServerActionClient.mockReturnValue(supabase);

    const { GET } = await import("../route");
    const request = new NextRequest("http://localhost/api/metadata?url=not-a-url");
    const response = await GET(request);

    expect(response.status).toBe(400);
    const body = await response.json();
    expect(body.error).toBe("Некорректный URL");
  });
});

afterAll(() => {
  global.fetch = originalFetch;
});
