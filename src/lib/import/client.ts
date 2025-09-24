import type { ImportCommitRequest, ImportPreviewRequest } from "@/lib/import/schema";
import type { ImportCommitResult, ImportPreviewResult } from "@/lib/import/types";

async function parseError(response: Response): Promise<Error> {
  try {
    const data = await response.json();
    const message = typeof data?.error === "string" ? data.error : response.statusText;
    return new Error(message);
  } catch {
    return new Error(response.statusText);
  }
}

export async function requestImportPreview(
  payload: ImportPreviewRequest,
): Promise<ImportPreviewResult> {
  const response = await fetch("/api/import/preview", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });

  if (!response.ok) {
    throw await parseError(response);
  }

  return (await response.json()) as ImportPreviewResult;
}

export async function requestImportCommit(
  payload: ImportCommitRequest,
): Promise<ImportCommitResult> {
  const response = await fetch("/api/import/commit", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });

  if (!response.ok) {
    throw await parseError(response);
  }

  return (await response.json()) as ImportCommitResult;
}
