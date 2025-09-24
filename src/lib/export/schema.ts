import { z } from "zod";

import { LINK_SORT_FIELDS, LINK_SORT_ORDERS } from "@/lib/links/query";

export const exportRequestSchema = z.object({
  scope: z.enum(["all", "filters", "selected"]),
  filters: z
    .object({
      search: z.string().optional(),
      tagIds: z.array(z.string().uuid()).optional(),
      dateFrom: z.string().optional(),
      dateTo: z.string().optional(),
      sort: z.enum(LINK_SORT_FIELDS).optional(),
      order: z.enum(LINK_SORT_ORDERS).optional(),
    })
    .optional(),
  ids: z.array(z.string().uuid()).optional(),
});

export type ExportRequestSchema = z.infer<typeof exportRequestSchema>;
