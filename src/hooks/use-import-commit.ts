"use client";

import { useMutation } from "@tanstack/react-query";

import { requestImportCommit } from "@/lib/import/client";
import { trackAnalyticsEvent } from "@/lib/analytics/track";
import type { ImportCommitRequest } from "@/lib/import/schema";
import type { ImportCommitResult } from "@/lib/import/types";

export function useImportCommitMutation() {
  return useMutation<ImportCommitResult, Error, ImportCommitRequest>({
    mutationFn: requestImportCommit,
    onSuccess: (result) => {
      trackAnalyticsEvent("import_completed", {
        imported: result.summary.imported,
        duplicates: result.summary.duplicates,
        failed: result.summary.failed,
      });
    },
  });
}
