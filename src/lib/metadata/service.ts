import { createHash } from "node:crypto";
import { extname } from "node:path";

import { extractMetadataFromHtml } from "@/lib/metadata/extract";
import { buildFaviconGeneratorUrl, toTitleCase } from "@/lib/metadata/utils";
import { linkMetadataSchema, type LinkMetadata } from "@/lib/links/metadata";

interface StorageBucketApiLike {
  upload(
    path: string,
    data: Uint8Array,
    options: { contentType?: string | null; cacheControl?: string; upsert?: boolean },
  ): Promise<{ data: { path: string } | null; error: { message: string } | null }>;
  getPublicUrl(path: string): {
    data: { publicUrl: string } | null;
    error: { message: string } | null;
  };
}

interface StorageClientLike {
  from(bucket: string): StorageBucketApiLike;
}

export interface MetadataStorageClient {
  storage: StorageClientLike;
}

const FAVICON_BUCKET = "favicons";
const CACHE_CONTROL_SECONDS = 60 * 60 * 24 * 7; // 1 неделя
const PAGE_FETCH_TIMEOUT = 8000;
const ICON_FETCH_TIMEOUT = 8000;

interface FetchMetadataOptions {
  supabase: MetadataStorageClient;
  userId: string;
  url: string;
  fetchImpl?: typeof fetch;
}

interface HtmlFetchResult {
  html: string;
  finalUrl: URL;
}

interface IconFetchResult {
  data: Uint8Array;
  contentType: string | null;
  url: string;
  isFallback: boolean;
}

export class MetadataServiceError extends Error {
  status: number;

  constructor(message: string, status = 500) {
    super(message);
    this.name = "MetadataServiceError";
    this.status = status;
  }
}

async function fetchWithAbort(
  input: Parameters<typeof fetch>[0],
  init: Parameters<typeof fetch>[1],
  timeout: number,
  fetchImpl: typeof fetch,
): Promise<Response> {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeout);

  try {
    return await fetchImpl(input, { ...init, signal: controller.signal });
  } finally {
    clearTimeout(timer);
  }
}

async function fetchPageHtml(
  target: URL,
  fetchImpl: typeof fetch,
): Promise<HtmlFetchResult | null> {
  try {
    const response = await fetchWithAbort(
      target.toString(),
      {
        headers: {
          accept: "text/html,application/xhtml+xml",
          "user-agent": "LinkVaultMetadataBot/1.0",
        },
        redirect: "follow",
      },
      PAGE_FETCH_TIMEOUT,
      fetchImpl,
    );

    if (!response.ok) {
      return null;
    }

    const contentType = response.headers.get("content-type");
    if (
      contentType &&
      !contentType.includes("text/html") &&
      !contentType.includes("application/xhtml+xml")
    ) {
      return null;
    }

    const html = await response.text();
    const finalUrl = response.url ? new URL(response.url) : target;

    return { html, finalUrl };
  } catch {
    return null;
  }
}

async function fetchIconCandidate(
  url: string,
  fetchImpl: typeof fetch,
): Promise<{ data: Uint8Array; contentType: string | null } | null> {
  try {
    const response = await fetchWithAbort(
      url,
      { redirect: "follow" },
      ICON_FETCH_TIMEOUT,
      fetchImpl,
    );
    if (!response.ok) {
      return null;
    }

    const payload = await response.arrayBuffer();
    if (payload.byteLength === 0) {
      return null;
    }

    return { data: new Uint8Array(payload), contentType: response.headers.get("content-type") };
  } catch {
    return null;
  }
}

function buildIconCandidates(
  iconHref: string | null | undefined,
  baseUrl: URL,
): { candidates: string[]; fallback: string } {
  const fallback = buildFaviconGeneratorUrl(baseUrl.hostname);
  const set = new Set<string>();

  if (iconHref) {
    try {
      set.add(new URL(iconHref, baseUrl).toString());
    } catch {
      // ignore malformed href values
    }
  }

  set.add(fallback);

  return { candidates: Array.from(set), fallback };
}

async function resolveIcon(
  iconHref: string | null | undefined,
  baseUrl: URL,
  fetchImpl: typeof fetch,
): Promise<IconFetchResult | null> {
  const { candidates, fallback } = buildIconCandidates(iconHref, baseUrl);

  for (const candidate of candidates) {
    const result = await fetchIconCandidate(candidate, fetchImpl);
    if (result) {
      return {
        data: result.data,
        contentType: result.contentType,
        url: candidate,
        isFallback: candidate === fallback,
      };
    }
  }

  return null;
}

function deriveFileExtension(contentType: string | null, iconUrl: string): string {
  if (contentType) {
    const normalized = contentType.split(";")[0].trim().toLowerCase();
    switch (normalized) {
      case "image/png":
        return ".png";
      case "image/jpeg":
      case "image/jpg":
        return ".jpg";
      case "image/svg+xml":
        return ".svg";
      case "image/webp":
        return ".webp";
      case "image/gif":
        return ".gif";
      case "image/x-icon":
      case "image/vnd.microsoft.icon":
        return ".ico";
      default:
        break;
    }
  }

  try {
    const ext = extname(new URL(iconUrl).pathname).toLowerCase();
    if (ext) {
      return ext;
    }
  } catch {
    // ignore path parsing issues
  }

  return ".png";
}

function createStoragePath(userId: string, pageUrl: string, extension: string): string {
  const hash = createHash("sha256").update(pageUrl).digest("hex");
  return `${userId}/${hash}${extension}`;
}

async function uploadIconToStorage(
  supabase: MetadataStorageClient,
  path: string,
  data: Uint8Array,
  contentType: string | null,
): Promise<void> {
  const bucket = supabase.storage.from(FAVICON_BUCKET);
  const { error } = await bucket.upload(path, data, {
    contentType: contentType ?? "image/png",
    cacheControl: CACHE_CONTROL_SECONDS.toString(),
    upsert: true,
  });

  if (error) {
    throw new MetadataServiceError(`Не удалось сохранить фавиконку: ${error.message}`, 502);
  }
}

function resolvePublicUrl(supabase: MetadataStorageClient, path: string): string {
  const bucket = supabase.storage.from(FAVICON_BUCKET);
  const { data, error } = bucket.getPublicUrl(path);

  if (error || !data?.publicUrl) {
    throw new MetadataServiceError("Не удалось получить публичную ссылку фавиконки", 502);
  }

  return data.publicUrl;
}

export async function fetchAndCacheMetadata({
  supabase,
  userId,
  url,
  fetchImpl = fetch,
}: FetchMetadataOptions): Promise<LinkMetadata> {
  let parsedUrl: URL;

  try {
    parsedUrl = new URL(url);
  } catch {
    throw new MetadataServiceError("Некорректный URL", 400);
  }

  const pageResult = await fetchPageHtml(parsedUrl, fetchImpl);
  const effectiveUrl = pageResult?.finalUrl ?? parsedUrl;
  const extracted = pageResult ? extractMetadataFromHtml(pageResult.html) : null;
  const resolvedTitle = extracted?.title?.trim() || toTitleCase(effectiveUrl.hostname);
  const resolvedDescription = extracted?.description?.trim();

  const iconResult = await resolveIcon(extracted?.iconHref ?? null, effectiveUrl, fetchImpl);

  let favIconUrl: string | null = null;
  let favIconStoragePath: string | null = null;
  let metadataSource: LinkMetadata["source"] = pageResult ? "remote" : "fallback";

  if (iconResult) {
    const extension = deriveFileExtension(iconResult.contentType, iconResult.url);
    const storagePath = createStoragePath(userId, effectiveUrl.toString(), extension);

    await uploadIconToStorage(supabase, storagePath, iconResult.data, iconResult.contentType);
    favIconStoragePath = storagePath;
    favIconUrl = resolvePublicUrl(supabase, storagePath);

    if (iconResult.isFallback) {
      metadataSource = "fallback";
    }
  } else {
    favIconUrl = buildFaviconGeneratorUrl(effectiveUrl.hostname);
    metadataSource = "fallback";
  }

  const metadata = linkMetadataSchema.parse({
    title: resolvedTitle,
    description: resolvedDescription,
    favIconUrl,
    favIconStoragePath,
    source: metadataSource,
    fetchedAt: new Date().toISOString(),
  });

  return metadata;
}
