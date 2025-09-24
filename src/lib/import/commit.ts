import { importCommitRequestSchema } from "@/lib/import/schema";
import { createUrlKey } from "@/lib/import/utils";
import type { ImportCommitResult, PreparedImportRow } from "@/lib/import/types";
import type { ImportCommitRequest } from "@/lib/import/schema";
import type { ServerClient } from "@/lib/supabase/server";
import type { TablesInsert, TablesUpdate } from "@/lib/supabase/types";

const INSERT_BATCH_SIZE = 500;

function chunkRows<T>(rows: T[], size: number): T[][] {
  const chunks: T[][] = [];
  for (let i = 0; i < rows.length; i += size) {
    chunks.push(rows.slice(i, i + size));
  }
  return chunks;
}

async function requireUserId(client: ServerClient): Promise<string> {
  const {
    data: { user },
    error,
  } = await client.auth.getUser();

  if (error) {
    throw new Error(`Не удалось получить пользователя: ${error.message}`);
  }

  if (!user) {
    throw new Error("Требуется аутентификация");
  }

  return user.id;
}

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

  const existing = data?.map((row) => row.url) ?? [];
  return new Set(existing.map(createUrlKey));
}

async function fetchExistingTags(client: ServerClient, userId: string, names: string[]) {
  if (names.length === 0) {
    return [] as { id: string; name: string }[];
  }

  const { data, error } = await client
    .from("tags")
    .select("id, name")
    .eq("user_id", userId)
    .in("name", names);

  if (error) {
    throw new Error(`Не удалось загрузить теги: ${error.message}`);
  }

  return data ?? [];
}

function normalizeTagName(name: string): string {
  return name.trim();
}

function collectUniqueTagNames(rows: PreparedImportRow[]): string[] {
  const set = new Set<string>();
  rows.forEach((row) => {
    row.tags.forEach((tag) => {
      const normalized = normalizeTagName(tag);
      if (normalized) {
        set.add(normalized);
      }
    });
  });
  return Array.from(set);
}

async function upsertMissingTags(
  client: ServerClient,
  userId: string,
  missing: string[],
): Promise<{ id: string; name: string }[]> {
  if (missing.length === 0) {
    return [];
  }

  const payload: TablesInsert<"tags">[] = missing.map((name) => ({
    user_id: userId,
    name,
  }));

  const { data, error } = await client
    .from("tags")
    .upsert(payload, { onConflict: "user_id,name" })
    .select("id, name");

  if (error) {
    throw new Error(`Не удалось сохранить теги: ${error.message}`);
  }

  return data ?? [];
}

async function insertLinkBatch(
  client: ServerClient,
  userId: string,
  rows: PreparedImportRow[],
): Promise<{ inserted: { id: string; url: string }[]; failed: PreparedImportRow[] }> {
  if (rows.length === 0) {
    return { inserted: [], failed: [] };
  }

  const payload: TablesInsert<"links">[] = rows.map((row) => ({
    user_id: userId,
    url: row.url,
    title: row.title,
    comment: row.comment,
    created_at: row.createdAt ?? undefined,
  }));

  const { data, error } = await client.from("links").insert(payload).select("id, url");

  if (error) {
    return { inserted: [], failed: rows };
  }

  return { inserted: data ?? [], failed: [] };
}

async function insertLinkTags(
  client: ServerClient,
  linkIds: { id: string; tags: string[] }[],
  tagMap: Map<string, string>,
): Promise<void> {
  const payload: TablesInsert<"link_tags">[] = [];

  linkIds.forEach(({ id, tags }) => {
    tags.forEach((tag) => {
      const tagId = tagMap.get(tag.trim().toLowerCase());
      if (tagId) {
        payload.push({ link_id: id, tag_id: tagId });
      }
    });
  });

  if (payload.length === 0) {
    return;
  }

  const { error } = await client.from("link_tags").insert(payload);
  if (error) {
    throw new Error(`Не удалось связать теги с ссылками: ${error.message}`);
  }
}

async function recordImportErrors(
  client: ServerClient,
  importId: string,
  rows: PreparedImportRow[],
  errorCode: string,
  message: string,
) {
  if (rows.length === 0) {
    return;
  }

  const payload: TablesInsert<"import_errors">[] = rows.map((row) => ({
    import_id: importId,
    row_number: row.rowNumber,
    url: row.url,
    error_code: errorCode,
    error_details: { message },
  }));

  await client.from("import_errors").insert(payload);
}

async function recordDuplicateErrors(
  client: ServerClient,
  importId: string,
  duplicates: PreparedImportRow[],
) {
  if (duplicates.length === 0) {
    return;
  }

  const payload: TablesInsert<"import_errors">[] = duplicates.map((row) => ({
    import_id: importId,
    row_number: row.rowNumber,
    url: row.url,
    error_code: "duplicate_url",
    error_details: { message: "URL уже существует" },
  }));

  await client.from("import_errors").insert(payload);
}

function toPreparedRows(input: ImportCommitRequest): PreparedImportRow[] {
  return input.rows.map((row) => ({
    rowNumber: row.rowNumber,
    url: row.url,
    title: row.title,
    comment: row.comment,
    tags: row.tags,
    createdAt: row.createdAt ?? undefined,
  }));
}

function buildTagMap(entries: { id: string; name: string }[]): Map<string, string> {
  const map = new Map<string, string>();
  entries.forEach(({ id, name }) => {
    map.set(name.trim().toLowerCase(), id);
  });
  return map;
}

export async function commitImport(
  client: ServerClient,
  rawInput: unknown,
): Promise<ImportCommitResult> {
  const input = importCommitRequestSchema.parse(rawInput);
  const userId = await requireUserId(client);
  const rows = toPreparedRows(input);

  const importInsert: TablesInsert<"imports"> = {
    user_id: userId,
    source: input.source ?? "csv",
    status: "pending",
    total_rows: rows.length,
  };

  const { data: importRecord, error: importError } = await client
    .from("imports")
    .insert(importInsert)
    .select("id")
    .single();

  if (importError || !importRecord) {
    throw new Error(
      `Не удалось создать задачу импорта: ${importError?.message ?? "неизвестная ошибка"}`,
    );
  }

  const existingSet = await fetchExistingUrls(
    client,
    userId,
    rows.map((row) => row.url),
  );
  const duplicates = rows.filter((row) => existingSet.has(createUrlKey(row.url)));
  const uniqueRows = rows.filter((row) => !existingSet.has(createUrlKey(row.url)));

  await recordDuplicateErrors(client, importRecord.id, duplicates);

  const tagNames = collectUniqueTagNames(uniqueRows);
  const existingTags = await fetchExistingTags(client, userId, tagNames);
  const existingTagMap = buildTagMap(existingTags);

  const missingNames = tagNames.filter((name) => !existingTagMap.has(name.trim().toLowerCase()));
  const createdTags = await upsertMissingTags(client, userId, missingNames);
  const tagMap = buildTagMap([...existingTags, ...createdTags]);

  let importedCount = 0;
  let failedCount = 0;

  for (const chunk of chunkRows(uniqueRows, INSERT_BATCH_SIZE)) {
    const { inserted, failed } = await insertLinkBatch(client, userId, chunk);
    if (failed.length > 0) {
      failedCount += failed.length;
      await recordImportErrors(
        client,
        importRecord.id,
        failed,
        "insert_failed",
        "Не удалось сохранить ссылку",
      );
      continue;
    }

    if (inserted.length > 0) {
      importedCount += inserted.length;
      const linkTags = inserted.map((row, index) => ({
        id: row.id,
        tags: chunk[index]?.tags ?? [],
      }));
      await insertLinkTags(client, linkTags, tagMap);
    }
  }

  const status: TablesUpdate<"imports">["status"] =
    importedCount === 0 && uniqueRows.length > 0 ? "failed" : "completed";

  const updatePayload: TablesUpdate<"imports"> = {
    status,
    imported_rows: importedCount,
    duplicate_rows: duplicates.length,
    failed_rows: failedCount,
  };

  await client.from("imports").update(updatePayload).eq("id", importRecord.id);

  return {
    importId: importRecord.id,
    summary: {
      total: rows.length,
      imported: importedCount,
      duplicates: duplicates.length,
      failed: failedCount,
      status,
    },
  };
}
