import { z } from "zod";

const uniqueArray = (values: string[]): string[] => {
  const seen = new Map<string, string>();

  values.forEach((value) => {
    const normalized = value.trim();
    if (!normalized) {
      return;
    }

    const key = normalized.toLowerCase();
    if (!seen.has(key)) {
      seen.set(key, normalized);
    }
  });

  return Array.from(seen.values());
};

const uniqueIds = (values: string[]): string[] => {
  const seen = new Set<string>();
  const result: string[] = [];

  values.forEach((value) => {
    if (seen.has(value)) {
      return;
    }
    seen.add(value);
    result.push(value);
  });

  return result;
};

export const linkFormSchema = z
  .object({
    url: z.string().trim().min(1, "Укажите ссылку").url("Некорректный URL"),
    title: z.string().trim().min(1, "Укажите заголовок"),
    comment: z
      .string()
      .trim()
      .max(2000, "Комментарий не должен превышать 2000 символов")
      .optional(),
    tagIds: z.array(z.string().uuid()).default([]),
    newTags: z.array(z.string()).default([]),
  })
  .transform((value) => {
    const tagIds = uniqueIds(value.tagIds);
    const newTags = uniqueArray(value.newTags);
    const comment = value.comment && value.comment.length > 0 ? value.comment : undefined;

    return {
      url: value.url,
      title: value.title,
      comment,
      tagIds,
      newTags,
    };
  });

export type LinkFormValues = z.infer<typeof linkFormSchema>;
