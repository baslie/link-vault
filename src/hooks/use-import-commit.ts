"use client";

import { useMutation } from "@tanstack/react-query";

import { requestImportCommit } from "@/lib/import/client";
import type { ImportCommitRequest } from "@/lib/import/schema";
import type { ImportCommitResult } from "@/lib/import/types";

export function useImportCommitMutation() {
  return useMutation<ImportCommitResult, Error, ImportCommitRequest>({
    mutationFn: requestImportCommit,
  });
}
