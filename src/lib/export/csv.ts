import type { LinkListItem } from "@/lib/links/query";

const CSV_HEADER = ["URL", "Title", "Comment", "Tags", "Date"] as const;

function escapeCsvValue(value: string): string {
  const needsQuoting = /[",\n\r]/.test(value);
  const escaped = value.replace(/"/g, '""');
  return needsQuoting ? `"${escaped}"` : escaped;
}

function mapRow(item: LinkListItem): string[] {
  const tags = item.tags.map((tag) => tag.name).join(", ");
  const comment = item.comment ?? "";
  const date = new Date(item.createdAt).toISOString();

  return [item.url, item.title, comment, tags, date];
}

export function buildCsvContent(items: LinkListItem[]): string {
  const header = CSV_HEADER.join(",");
  const lines = items.map((item) => mapRow(item).map(escapeCsvValue).join(","));
  return ["\ufeff" + header, ...lines].join("\n");
}
