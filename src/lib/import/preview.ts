import { importPreviewRequestSchema } from "@/lib/import/schema";
import { buildPreparedRow, createUrlKey, partitionRowsByUrl } from "@/lib/import/utils";
import type {
  ImportDuplicateRow,
  ImportErrorRow,
  ImportFieldMapping,
  ImportPreviewResult,
  PreparedImportRow,
  RawImportRow,
} from "@/lib/import/types";
import type { ImportPreviewRequest } from "@/lib/import/schema";
import type { ServerClient } from "@/lib/supabase/server";

async function fetchExistingUrls(
  client: ServerClient,
  userId: string,
  urls: string[],
): Promise<Set<string>> {
  if (urls.length === 0) {
    return new Set<string>();
  }

  const { data, error } = await client
    .from("links")
    .select("url")
    .eq("user_id", userId)
    .in("url", urls);

  if (error) {
    throw new Error(`Не удалось проверить дубли ссылок: ${error.message}`);
  }

  const existingUrls = data?.map((row) => row.url) ?? [];
  return new Set(existingUrls.map(createUrlKey));
}

function prepareRows(
  rows: RawImportRow[],
  mapping: ImportFieldMapping,
): { prepared: PreparedImportRow[]; errors: ImportErrorRow[] } {
  const prepared: PreparedImportRow[] = [];
  const errors: ImportErrorRow[] = [];

  rows.forEach((row) => {
    const result = buildPreparedRow(row, mapping);
    if (result.success) {
      prepared.push(result.row);
      return;
    }

    errors.push(result.error);
  });

  return { prepared, errors };
}

export async function buildImportPreview(
  client: ServerClient,
  userId: string,
  rawInput: unknown,
): Promise<ImportPreviewResult> {
  const { rows, mapping } = importPreviewRequestSchema.parse(rawInput) as ImportPreviewRequest;
  const { prepared, errors } = prepareRows(rows, mapping);

  const inFilePartition = partitionRowsByUrl(prepared);
  const duplicates: ImportDuplicateRow[] = inFilePartition.duplicates.map((row) => ({
    rowNumber: row.rowNumber,
    url: row.url,
    reason: "duplicate" as const,
  }));

  const uniqueRows = inFilePartition.unique;
  const urlKeys = uniqueRows.map((row) => row.url);
  const existingSet = await fetchExistingUrls(client, userId, urlKeys);

  const ready: PreparedImportRow[] = [];

  uniqueRows.forEach((row) => {
    const key = createUrlKey(row.url);
    if (existingSet.has(key)) {
      duplicates.push({
        rowNumber: row.rowNumber,
        url: row.url,
        reason: "existing",
      });
      return;
    }

    ready.push(row);
  });

  const summary = {
    total: rows.length,
    ready: ready.length,
    duplicates: duplicates.length,
    errors: errors.length,
  };

  return {
    rows: {
      ready,
      duplicates,
      errors,
    },
    summary,
  };
}
