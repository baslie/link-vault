import type { ExportRequestPayload } from "@/lib/export/types";

interface ExportResponsePayload {
  filename: string;
  blob: Blob;
}

async function parseError(response: Response): Promise<Error> {
  try {
    const data = await response.json();
    const message = typeof data?.error === "string" ? data.error : response.statusText;
    return new Error(message);
  } catch {
    return new Error(response.statusText);
  }
}

export async function requestExport(payload: ExportRequestPayload): Promise<ExportResponsePayload> {
  const response = await fetch("/api/export", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });

  if (!response.ok) {
    throw await parseError(response);
  }

  const disposition = response.headers.get("Content-Disposition") ?? "";
  const filenameMatch = disposition.match(/filename="?([^";]+)"?/i);
  const filename = filenameMatch?.[1] ?? "links.csv";
  const blob = await response.blob();

  return { filename, blob };
}
