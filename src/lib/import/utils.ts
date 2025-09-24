import type { ImportFieldMapping, PreparedImportRow, RawImportRow } from "@/lib/import/types";

const TAG_SPLIT_REGEX = /[,;\|]/;

export function normalizeColumnName(value?: string | null): string | undefined {
  if (!value) {
    return undefined;
  }

  const trimmed = value.trim();
  return trimmed.length > 0 ? trimmed : undefined;
}

export function readColumnValue(row: RawImportRow, column?: string | null): string | undefined {
  const columnName = normalizeColumnName(column);
  if (!columnName) {
    return undefined;
  }

  const raw = row.values[columnName];
  if (raw == null) {
    return undefined;
  }

  const value = String(raw).trim();
  return value.length > 0 ? value : undefined;
}

export function parseTags(value?: string): string[] {
  if (!value) {
    return [];
  }

  return value
    .split(TAG_SPLIT_REGEX)
    .map((tag) => tag.trim())
    .filter((tag) => tag.length > 0);
}

export function normalizeUrl(value?: string): string | undefined {
  if (!value) {
    return undefined;
  }

  const trimmed = value.trim();
  if (!trimmed) {
    return undefined;
  }

  try {
    const url = new URL(trimmed);
    if (!["http:", "https:"].includes(url.protocol)) {
      return undefined;
    }

    return url.toString();
  } catch {
    return undefined;
  }
}

export function normalizeDate(value?: string): string | undefined {
  if (!value) {
    return undefined;
  }

  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) {
    return undefined;
  }

  return parsed.toISOString();
}

export function buildPreparedRow(
  row: RawImportRow,
  mapping: ImportFieldMapping,
):
  | { success: true; row: PreparedImportRow }
  | { success: false; error: { rowNumber: number; message: string; column?: string } } {
  const rawUrl = readColumnValue(row, mapping.url);
  const url = normalizeUrl(rawUrl);

  if (!url) {
    return {
      success: false,
      error: {
        rowNumber: row.rowNumber,
        column: mapping.url,
        message: "Некорректный URL",
      },
    };
  }

  const rawTitle = readColumnValue(row, mapping.title);
  const title = rawTitle ?? url;
  const comment = readColumnValue(row, mapping.comment) ?? null;
  const tags = parseTags(readColumnValue(row, mapping.tags));
  const createdAt = normalizeDate(readColumnValue(row, mapping.createdAt));

  if (mapping.createdAt && readColumnValue(row, mapping.createdAt) && !createdAt) {
    return {
      success: false,
      error: {
        rowNumber: row.rowNumber,
        column: mapping.createdAt ?? undefined,
        message: "Некорректная дата",
      },
    };
  }

  return {
    success: true,
    row: {
      rowNumber: row.rowNumber,
      url,
      title,
      comment,
      tags,
      createdAt: createdAt ?? undefined,
    },
  };
}

export function createUrlKey(url: string): string {
  return url.trim().toLowerCase();
}

export function partitionRowsByUrl(rows: PreparedImportRow[]): {
  unique: PreparedImportRow[];
  duplicates: PreparedImportRow[];
} {
  const seen = new Set<string>();
  const unique: PreparedImportRow[] = [];
  const duplicates: PreparedImportRow[] = [];

  rows.forEach((row) => {
    const key = createUrlKey(row.url);
    if (seen.has(key)) {
      duplicates.push(row);
      return;
    }

    seen.add(key);
    unique.push(row);
  });

  return { unique, duplicates };
}
