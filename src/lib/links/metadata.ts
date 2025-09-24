import { z } from "zod";

import type { Json } from "@/lib/supabase/types";

export const linkMetadataSchema = z.object({
  title: z.string().trim().optional(),
  description: z.string().trim().optional(),
  favIconUrl: z.string().trim().url().optional().nullable(),
  source: z.literal("stub"),
  fetchedAt: z.string(),
});

export type LinkMetadata = z.infer<typeof linkMetadataSchema>;

function toTitleCase(hostname: string) {
  const base = hostname
    .split(".")
    .filter((segment) => segment !== "www")
    .shift();

  if (!base) {
    return hostname;
  }

  return base.charAt(0).toUpperCase() + base.slice(1);
}

function buildFaviconUrl(hostname: string) {
  return `https://www.google.com/s2/favicons?sz=64&domain=${hostname}`;
}

export async function fetchLinkMetadata(rawUrl: string): Promise<LinkMetadata> {
  let parsed: URL;

  try {
    parsed = new URL(rawUrl);
  } catch {
    throw new Error("Не удалось получить метаданные: некорректный URL");
  }

  const title = toTitleCase(parsed.hostname);

  return linkMetadataSchema.parse({
    title,
    favIconUrl: buildFaviconUrl(parsed.hostname),
    source: "stub",
    fetchedAt: new Date().toISOString(),
  });
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
    return buildFaviconUrl(parsed.hostname);
  } catch {
    return null;
  }
}
