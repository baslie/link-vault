import type { LinkListItem, LinkListQueryFilters } from "@/lib/links/query";

export type ExportScope = "all" | "filters" | "selected";

export interface ExportFilters {
  search?: string;
  tagIds?: string[];
  dateFrom?: string;
  dateTo?: string;
  sort?: LinkListQueryFilters["sort"];
  order?: LinkListQueryFilters["order"];
}

export interface ExportRequestPayload {
  scope: ExportScope;
  filters?: ExportFilters;
  ids?: string[];
}

export interface ExportCsvPayload {
  filename: string;
  content: string;
}

export interface ExportDataset {
  items: LinkListItem[];
}
