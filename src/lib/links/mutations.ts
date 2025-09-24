import type { SupabaseClient } from "@supabase/supabase-js";

import type { LinkFormValues } from "@/lib/links/schema";
import type { LinkMetadata } from "@/lib/links/metadata";
import type { Database, TablesInsert, TablesUpdate } from "@/lib/supabase/types";

interface AuthenticatedUser {
  id: string;
}

type Client = SupabaseClient<Database>;

const DEFAULT_TAG_COLOR = undefined;

export interface BaseLinkMutationInput extends LinkFormValues {
  metadata?: LinkMetadata | null;
}

export type CreateLinkInput = BaseLinkMutationInput;

export interface UpdateLinkInput extends BaseLinkMutationInput {
  id: string;
}

export interface DeleteLinkInput {
  id: string;
}

export interface LinkMutationResult {
  id: string;
  tagIds: string[];
}

async function requireUser(client: Client): Promise<AuthenticatedUser> {
  const {
    data: { user },
    error,
  } = await client.auth.getUser();

  if (error) {
    throw new Error(`Не удалось получить данные пользователя: ${error.message}`);
  }

  if (!user) {
    throw new Error("Требуется аутентификация");
  }

  return { id: user.id };
}

async function upsertTags(client: Client, userId: string, tagNames: string[]): Promise<string[]> {
  if (tagNames.length === 0) {
    return [];
  }

  const payload = tagNames.map((name) => ({
    user_id: userId,
    name,
    color: DEFAULT_TAG_COLOR,
  }));

  const { data, error } = await client
    .from("tags")
    .upsert(payload, { onConflict: "user_id, name", ignoreDuplicates: false })
    .select("id");

  if (error) {
    throw new Error(`Не удалось сохранить теги: ${error.message}`);
  }

  return (data ?? []).map((tag) => tag.id);
}

function buildLinkInsertPayload(
  userId: string,
  input: CreateLinkInput,
  linkId: string,
): TablesInsert<"links"> {
  return {
    id: linkId,
    user_id: userId,
    url: input.url,
    title: input.title,
    comment: input.comment ?? null,
    fav_icon_path: input.metadata?.favIconUrl ?? null,
    metadata_source: input.metadata ?? null,
  };
}

function buildLinkUpdatePayload(input: UpdateLinkInput): TablesUpdate<"links"> {
  return {
    url: input.url,
    title: input.title,
    comment: input.comment ?? null,
    fav_icon_path: input.metadata?.favIconUrl ?? null,
    metadata_source: input.metadata ?? null,
  };
}

function mergeTagIds(base: string[], additional: string[]): string[] {
  const merged = new Set<string>(base);
  additional.forEach((tagId) => {
    merged.add(tagId);
  });
  return Array.from(merged);
}

async function attachTags(client: Client, linkId: string, tagIds: string[]): Promise<void> {
  if (tagIds.length === 0) {
    return;
  }

  const payload = tagIds.map((tagId) => ({
    link_id: linkId,
    tag_id: tagId,
  }));

  const { error } = await client
    .from("link_tags")
    .upsert(payload, { onConflict: "link_id, tag_id", ignoreDuplicates: true });

  if (error) {
    throw new Error(`Не удалось связать теги со ссылкой: ${error.message}`);
  }
}

export async function createLink(
  client: Client,
  input: CreateLinkInput,
): Promise<LinkMutationResult> {
  const user = await requireUser(client);
  const newTagIds = await upsertTags(client, user.id, input.newTags);
  const tagIds = mergeTagIds(input.tagIds, newTagIds);

  const linkId = crypto.randomUUID();
  const insertPayload = buildLinkInsertPayload(user.id, input, linkId);

  const { error: insertError } = await client.from("links").insert(insertPayload);

  if (insertError) {
    throw new Error(`Не удалось создать ссылку: ${insertError.message}`);
  }

  await attachTags(client, linkId, tagIds);

  return { id: linkId, tagIds };
}

export async function updateLink(
  client: Client,
  input: UpdateLinkInput,
): Promise<LinkMutationResult> {
  const user = await requireUser(client);
  const newTagIds = await upsertTags(client, user.id, input.newTags);
  const tagIds = mergeTagIds(input.tagIds, newTagIds);

  const { error: updateError } = await client
    .from("links")
    .update(buildLinkUpdatePayload(input))
    .eq("id", input.id)
    .eq("user_id", user.id);

  if (updateError) {
    throw new Error(`Не удалось обновить ссылку: ${updateError.message}`);
  }

  const { error: clearError } = await client.from("link_tags").delete().eq("link_id", input.id);

  if (clearError) {
    throw new Error(`Не удалось обновить теги ссылки: ${clearError.message}`);
  }

  await attachTags(client, input.id, tagIds);

  return { id: input.id, tagIds };
}

export async function deleteLink(client: Client, input: DeleteLinkInput): Promise<void> {
  const user = await requireUser(client);

  const { error } = await client.from("links").delete().eq("id", input.id).eq("user_id", user.id);

  if (error) {
    throw new Error(`Не удалось удалить ссылку: ${error.message}`);
  }
}
