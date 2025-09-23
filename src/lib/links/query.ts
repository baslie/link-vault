import { z } from "zod";

import type { ServerClient } from "@/lib/supabase/server";
import type { Json } from "@/lib/supabase/types";

export const LINKS_PAGE_SIZES = [20, 50, 100, 500] as const;
export const DEFAULT_LINKS_PAGE_SIZE = LINKS_PAGE_SIZES[0];

export const LINK_SORT_FIELDS = ["created_at", "title"] as const;
export const LINK_SORT_ORDERS = ["asc", "desc"] as const;

const sortFieldSet = new Set<string>(LINK_SORT_FIELDS);
const sortOrderSet = new Set<string>(LINK_SORT_ORDERS);
const pageSizeSet = new Set<number>(LINKS_PAGE_SIZES);

export type LinkSortField = (typeof LINK_SORT_FIELDS)[number];
export type LinkSortOrder = (typeof LINK_SORT_ORDERS)[number];

export interface LinkTag {
  id: string;
  name: string;
  color: string;
}

export interface LinkListItem {
  id: string;
  userId: string;
  url: string;
  title: string;
  comment: string | null;
  favIconPath: string | null;
  metadataSource: Json | null;
  createdAt: string;
  updatedAt: string;
  tags: LinkTag[];
}

export interface LinkListPagination {
  total: number;
  page: number;
  perPage: number;
  pageCount: number;
  hasNextPage: boolean;
  hasPreviousPage: boolean;
}

export interface LinkListResult {
  items: LinkListItem[];
  pagination: LinkListPagination;
}

export interface LinkListQueryFilters {
  search?: string;
  tagIds?: string[];
  sort: LinkSortField;
  order: LinkSortOrder;
  page: number;
  perPage: number;
  dateFrom?: string;
  dateTo?: string;
}

const rawQuerySchema = z.object({
  search: z.string().optional(),
  tagIds: z.array(z.string().uuid()).optional(),
  sort: z.string().optional(),
  order: z.string().optional(),
  page: z.coerce.number().int().min(1).optional(),
  perPage: z.coerce.number().int().min(1).optional(),
  dateFrom: z.string().optional(),
  dateTo: z.string().optional(),
});

type RawLinkQuery = z.infer<typeof rawQuerySchema>;

export class LinksQueryValidationError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "LinksQueryValidationError";
  }
}

function normalizeDate(value?: string): string | undefined {
  if (!value) {
    return undefined;
  }

  const trimmed = value.trim();
  if (!trimmed) {
    return undefined;
  }

  const date = new Date(trimmed);
  if (Number.isNaN(date.getTime())) {
    throw new LinksQueryValidationError("Некорректный формат даты");
  }

  return date.toISOString();
}

function normalizeSort(sort?: string): LinkSortField {
  const normalized = (sort ?? "").trim().toLowerCase();
  if (sortFieldSet.has(normalized)) {
    return normalized as LinkSortField;
  }

  return "created_at";
}

function normalizeOrder(order?: string): LinkSortOrder {
  const normalized = (order ?? "").trim().toLowerCase();
  if (sortOrderSet.has(normalized)) {
    return normalized as LinkSortOrder;
  }

  return "desc";
}

function normalizeTagIds(tagIds?: string[]): string[] | undefined {
  if (!tagIds || tagIds.length === 0) {
    return undefined;
  }

  const uniqueIds = Array.from(
    new Set(tagIds.map((id) => id.trim()).filter((id) => id.length > 0)),
  );
  if (uniqueIds.length === 0) {
    return undefined;
  }

  return uniqueIds.sort((a, b) => a.localeCompare(b));
}

function normalizePerPage(perPage?: number): number {
  if (typeof perPage === "number" && pageSizeSet.has(perPage)) {
    return perPage;
  }

  return DEFAULT_LINKS_PAGE_SIZE;
}

function normalizeSearch(search?: string): string | undefined {
  if (!search) {
    return undefined;
  }

  const trimmed = search.trim();
  return trimmed.length > 0 ? trimmed : undefined;
}

function normalizeLinksQuery(raw: RawLinkQuery): LinkListQueryFilters {
  const search = normalizeSearch(raw.search);
  const tagIds = normalizeTagIds(raw.tagIds);
  const sort = normalizeSort(raw.sort);
  const order = normalizeOrder(raw.order);
  const perPage = normalizePerPage(raw.perPage);
  const page = raw.page ?? 1;
  const dateFrom = normalizeDate(raw.dateFrom);
  const dateTo = normalizeDate(raw.dateTo);

  if (dateFrom && dateTo && dateFrom > dateTo) {
    throw new LinksQueryValidationError("Дата начала не может быть позже даты окончания");
  }

  return {
    search,
    tagIds,
    sort,
    order,
    page,
    perPage,
    dateFrom,
    dateTo,
  };
}

export const DEFAULT_LINKS_FILTERS: LinkListQueryFilters = normalizeLinksQuery({});

export function parseLinksSearchParams(searchParams: URLSearchParams): LinkListQueryFilters {
  const raw = rawQuerySchema.parse({
    search: searchParams.get("search") ?? undefined,
    tagIds: searchParams
      .getAll("tagIds")
      .map((value) => value?.trim())
      .filter((value): value is string => Boolean(value)),
    sort: searchParams.get("sort") ?? undefined,
    order: searchParams.get("order") ?? undefined,
    page: searchParams.get("page") ?? undefined,
    perPage: searchParams.get("perPage") ?? undefined,
    dateFrom: searchParams.get("dateFrom") ?? undefined,
    dateTo: searchParams.get("dateTo") ?? undefined,
  });

  return normalizeLinksQuery(raw);
}

export function resolveLinksFilters(
  partial: Partial<LinkListQueryFilters> = {},
): LinkListQueryFilters {
  const raw = rawQuerySchema.parse({
    search: partial.search,
    tagIds: partial.tagIds,
    sort: partial.sort,
    order: partial.order,
    page: partial.page,
    perPage: partial.perPage,
    dateFrom: partial.dateFrom,
    dateTo: partial.dateTo,
  });

  return normalizeLinksQuery(raw);
}

export function buildLinksQueryParams(filters: LinkListQueryFilters): URLSearchParams {
  const params = new URLSearchParams();

  if (filters.search) {
    params.set("search", filters.search);
  }

  filters.tagIds?.forEach((id) => {
    params.append("tagIds", id);
  });

  params.set("sort", filters.sort);
  params.set("order", filters.order);
  params.set("page", String(filters.page));
  params.set("perPage", String(filters.perPage));

  if (filters.dateFrom) {
    params.set("dateFrom", filters.dateFrom);
  }

  if (filters.dateTo) {
    params.set("dateTo", filters.dateTo);
  }

  return params;
}

export function createLinksQueryKey(filters: LinkListQueryFilters) {
  return [
    "links",
    filters.sort,
    filters.order,
    filters.page,
    filters.perPage,
    filters.search ?? "",
    filters.dateFrom ?? "",
    filters.dateTo ?? "",
    filters.tagIds?.join("|") ?? "",
  ] as const;
}

const searchLinksItemSchema = z.object({
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

const searchLinksResultSchema = z.object({
  items: z.array(searchLinksItemSchema),
  total: z.number().int().nonnegative(),
  page: z.number().int().min(1),
  perPage: z.number().int().min(1),
});

function mapTags(row: z.infer<typeof searchLinksItemSchema>): LinkTag[] {
  if (row.tag_ids.length === 0) {
    return [];
  }

  return row.tag_ids.map((id, index) => ({
    id,
    name: row.tag_names[index] ?? "",
    color: row.tag_colors[index] ?? "",
  }));
}

function mapLinkRow(row: z.infer<typeof searchLinksItemSchema>): LinkListItem {
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
    tags: mapTags(row),
  };
}

function buildPagination(result: z.infer<typeof searchLinksResultSchema>): LinkListPagination {
  const { total, page, perPage } = result;
  const pageCount = perPage > 0 ? Math.ceil(total / perPage) : 0;

  return {
    total,
    page,
    perPage,
    pageCount,
    hasNextPage: page < pageCount,
    hasPreviousPage: page > 1,
  };
}

export async function searchLinks(
  client: ServerClient,
  filters: LinkListQueryFilters,
): Promise<LinkListResult> {
  const { data, error } = await client.rpc("search_links", {
    p_search: filters.search ?? null,
    p_tag_ids: filters.tagIds ?? null,
    p_sort: filters.sort,
    p_order: filters.order,
    p_page: filters.page,
    p_page_size: filters.perPage,
    p_date_from: filters.dateFrom ?? null,
    p_date_to: filters.dateTo ?? null,
  });

  if (error) {
    throw new Error(`Не удалось получить список ссылок: ${error.message}`);
  }

  const parsed = searchLinksResultSchema.parse(
    data ?? {
      items: [],
      total: 0,
      page: filters.page,
      perPage: filters.perPage,
    },
  );

  return {
    items: parsed.items.map(mapLinkRow),
    pagination: buildPagination(parsed),
  };
}
