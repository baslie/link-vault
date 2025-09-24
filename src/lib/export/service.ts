import { z } from "zod";

import {
  DEFAULT_LINKS_FILTERS,
  resolveLinksFilters,
  searchLinks,
  type LinkListItem,
  type LinkListQueryFilters,
} from "@/lib/links/query";
import type { ServerClient } from "@/lib/supabase/server";
import type { Json } from "@/lib/supabase/types";

import { buildCsvContent } from "@/lib/export/csv";
import { exportRequestSchema } from "@/lib/export/schema";
import type {
  ExportCsvPayload,
  ExportFilters,
  ExportRequestPayload,
  ExportScope,
} from "@/lib/export/types";

const EXPORT_BATCH_SIZE = 500;

const selectedRowSchema = z.object({
  id: z.string().uuid(),
  user_id: z.string().uuid(),
  url: z.string(),
  title: z.string(),
  comment: z.string().nullable(),
  fav_icon_path: z.string().nullable(),
  metadata_source: z.nullable(z.unknown()),
  created_at: z.string(),
  updated_at: z.string(),
  tag_ids: z.array(z.string().uuid()),
  tag_names: z.array(z.string()),
  tag_colors: z.array(z.string()),
});

function mapSelectedRow(row: z.infer<typeof selectedRowSchema>): LinkListItem {
  return {
    id: row.id,
    userId: row.user_id,
    url: row.url,
    title: row.title,
    comment: row.comment,
    favIconPath: row.fav_icon_path,
    metadataSource: row.metadata_source as Json | null,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
    tags: row.tag_ids.map((id, index) => ({
      id,
      name: row.tag_names[index] ?? "",
      color: row.tag_colors[index] ?? "",
    })),
  };
}

function normalizeFilters(filters?: ExportFilters): Partial<LinkListQueryFilters> {
  if (!filters) {
    return {};
  }

  return {
    search: filters.search,
    tagIds: filters.tagIds,
    dateFrom: filters.dateFrom,
    dateTo: filters.dateTo,
    sort: filters.sort,
    order: filters.order,
  };
}

async function collectLinksWithFilters(
  client: ServerClient,
  filters: Partial<LinkListQueryFilters>,
): Promise<LinkListItem[]> {
  const items: LinkListItem[] = [];
  let page = 1;

  while (true) {
    const resolved = resolveLinksFilters({
      ...filters,
      page,
      perPage: EXPORT_BATCH_SIZE,
    });

    const result = await searchLinks(client, resolved);
    items.push(...result.items);

    if (!result.pagination.hasNextPage) {
      break;
    }

    page += 1;
  }

  return items;
}

async function fetchSelectedLinks(client: ServerClient, ids: string[]): Promise<LinkListItem[]> {
  if (ids.length === 0) {
    return [];
  }

  const { data, error } = await client
    .from("links_with_tags" as never)
    .select(
      "id, user_id, url, title, comment, fav_icon_path, metadata_source, created_at, updated_at, tag_ids, tag_names, tag_colors",
    )
    .in("id", ids);

  if (error) {
    throw new Error(`Не удалось загрузить выбранные ссылки: ${error.message}`);
  }

  const parsed = z.array(selectedRowSchema).parse(data ?? []);
  return parsed.map(mapSelectedRow);
}

function buildFilename(scope: ExportScope): string {
  const suffix = scope === "all" ? "all" : scope === "filters" ? "filtered" : "selected";
  const now = new Date();
  const date = now.toISOString().slice(0, 10);
  return `link-vault-${suffix}-${date}.csv`;
}

export async function generateExportCsv(
  client: ServerClient,
  payload: ExportRequestPayload,
): Promise<ExportCsvPayload> {
  const parsed = exportRequestSchema.parse(payload);

  let items: LinkListItem[] = [];

  if (parsed.scope === "selected") {
    const ids = parsed.ids ?? [];
    if (ids.length === 0) {
      throw new Error("Выберите хотя бы одну ссылку для экспорта");
    }

    items = await fetchSelectedLinks(client, ids);
  } else {
    const baseFilters = parsed.scope === "all" ? DEFAULT_LINKS_FILTERS : DEFAULT_LINKS_FILTERS;
    const overrides = parsed.scope === "filters" ? normalizeFilters(parsed.filters) : {};
    const filters = { ...baseFilters, ...overrides };
    items = await collectLinksWithFilters(client, filters);
  }

  if (items.length === 0) {
    throw new Error("Нет данных для экспорта с выбранными параметрами");
  }

  return {
    filename: buildFilename(parsed.scope),
    content: buildCsvContent(items),
  };
}
