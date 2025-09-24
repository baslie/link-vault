import { z } from "zod";

import { buildFaviconGeneratorUrl } from "@/lib/metadata/utils";
import type { Json } from "@/lib/supabase/types";

const metadataSourceSchema = z.enum(["stub", "remote", "fallback", "cache"]);

export const linkMetadataSchema = z.object({
  title: z.string().trim().optional(),
  description: z.string().trim().optional(),
  favIconUrl: z.string().trim().url().optional().nullable(),
  favIconStoragePath: z.string().trim().optional().nullable(),
  source: metadataSourceSchema,
  fetchedAt: z.string(),
});

export type LinkMetadata = z.infer<typeof linkMetadataSchema>;
export type LinkMetadataSource = z.infer<typeof metadataSourceSchema>;

const metadataResponseSchema = z.object({
  metadata: linkMetadataSchema,
});

const metadataErrorSchema = z.object({
  error: z.string(),
});

function buildRequestUrl(url: string) {
  const params = new URLSearchParams({ url });
  return `/api/metadata?${params.toString()}`;
}

export async function fetchLinkMetadata(rawUrl: string): Promise<LinkMetadata> {
  let normalizedUrl: URL;

  try {
    normalizedUrl = new URL(rawUrl);
  } catch {
    throw new Error("Не удалось получить метаданные: некорректный URL");
  }

  const endpoint = buildRequestUrl(normalizedUrl.toString());

  let response: Response;
  try {
    response = await fetch(endpoint, { method: "GET" });
  } catch {
    throw new Error("Не удалось обратиться к сервису метаданных");
  }

  let payload: unknown;
  try {
    payload = await response.json();
  } catch {
    throw new Error("Некорректный ответ сервиса метаданных");
  }

  if (!response.ok) {
    const parsedError = metadataErrorSchema.safeParse(payload);
    if (parsedError.success) {
      throw new Error(parsedError.data.error);
    }

    throw new Error("Не удалось получить метаданные");
  }

  const parsed = metadataResponseSchema.safeParse(payload);
  if (!parsed.success) {
    throw new Error("Не удалось обработать ответ сервиса метаданных");
  }

  return parsed.data.metadata;
}

export function parseLinkMetadata(value: Json | null): LinkMetadata | null {
  if (!value || typeof value !== "object") {
    return null;
  }

  const result = linkMetadataSchema.safeParse(value);
  return result.success ? result.data : null;
}

export function resolveMetadataIcon(
  metadata: LinkMetadata | null,
  fallbackUrl: string,
): string | null {
  if (metadata?.favIconUrl) {
    return metadata.favIconUrl;
  }

  try {
    const parsed = new URL(fallbackUrl);
    return buildFaviconGeneratorUrl(parsed.hostname);
  } catch {
    return null;
  }
}

const METADATA_SOURCE_LABELS: Record<LinkMetadataSource, string> = {
  remote: "Страница сайта",
  fallback: "Резервный источник",
  cache: "Кэш Supabase",
  stub: "Служебная заглушка",
};

export function getMetadataSourceLabel(source?: LinkMetadataSource): string {
  if (!source) {
    return "Автозаполнение";
  }

  return METADATA_SOURCE_LABELS[source];
}
