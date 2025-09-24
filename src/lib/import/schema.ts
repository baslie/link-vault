import { z } from "zod";

export const rawImportRowSchema = z.object({
  rowNumber: z.number().int().min(1),
  values: z.record(z.union([z.string(), z.null(), z.undefined()])).default({}),
});

export const importFieldMappingSchema = z.object({
  url: z.string().min(1, "Укажите колонку с URL"),
  title: z.string().min(1).optional().nullable(),
  comment: z.string().min(1).optional().nullable(),
  tags: z.string().min(1).optional().nullable(),
  createdAt: z.string().min(1).optional().nullable(),
});

export const importPreviewRequestSchema = z.object({
  rows: z.array(rawImportRowSchema).min(1, "Нет строк для импорта"),
  mapping: importFieldMappingSchema,
});

export const importCommitRequestSchema = z.object({
  rows: z
    .array(
      z.object({
        rowNumber: z.number().int().min(1),
        url: z.string().url(),
        title: z.string().min(1),
        comment: z.string().nullable(),
        tags: z.array(z.string().min(1)),
        createdAt: z.string().datetime().optional(),
      }),
    )
    .min(1, "Нет данных для импорта"),
  source: z.string().min(1).max(120).optional(),
});

export type ImportPreviewRequest = z.infer<typeof importPreviewRequestSchema>;
export type ImportCommitRequest = z.infer<typeof importCommitRequestSchema>;
