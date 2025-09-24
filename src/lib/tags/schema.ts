import { z } from "zod";

export const TAG_NAME_MAX_LENGTH = 60;

export const tagNameSchema = z
  .string()
  .trim()
  .min(1, "Введите название тега")
  .max(TAG_NAME_MAX_LENGTH, "Слишком длинное название тега");

const HEX_COLOR_REGEX = /^#[0-9a-f]{6}$/i;

export const tagColorSchema = z
  .string()
  .trim()
  .regex(HEX_COLOR_REGEX, "Некорректный цвет тега")
  .optional();

export const updateTagSchema = z.object({
  id: z.string().uuid(),
  name: tagNameSchema,
  color: tagColorSchema.optional(),
});

export const deleteTagSchema = z.object({
  id: z.string().uuid(),
});

export type UpdateTagInput = z.infer<typeof updateTagSchema>;
export type DeleteTagInput = z.infer<typeof deleteTagSchema>;
