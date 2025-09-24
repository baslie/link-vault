"use client";

import { useMutation } from "@tanstack/react-query";

import { requestImportPreview } from "@/lib/import/client";
import type { ImportPreviewRequest } from "@/lib/import/schema";
import type { ImportPreviewResult } from "@/lib/import/types";

export function useImportPreviewMutation() {
  return useMutation<ImportPreviewResult, Error, ImportPreviewRequest>({
    mutationFn: requestImportPreview,
  });
}
