import type { Tables } from "@/lib/supabase/types";

export interface RawImportRow {
  rowNumber: number;
  values: Record<string, string | null | undefined>;
}

export type ImportField = "url" | "title" | "comment" | "tags" | "createdAt";

export interface ImportFieldMapping {
  url: string;
  title?: string | null;
  comment?: string | null;
  tags?: string | null;
  createdAt?: string | null;
}

export interface PreparedImportRow {
  rowNumber: number;
  url: string;
  title: string;
  comment: string | null;
  tags: string[];
  createdAt?: string;
}

export type ImportStatus = Tables<"imports">["status"];

export interface ImportDuplicateRow {
  rowNumber: number;
  url: string;
  reason: "existing" | "duplicate";
}

export interface ImportErrorRow {
  rowNumber: number;
  column?: string;
  message: string;
}

export interface ImportPreviewSummary {
  total: number;
  ready: number;
  duplicates: number;
  errors: number;
}

export interface ImportPreviewResult {
  rows: {
    ready: PreparedImportRow[];
    duplicates: ImportDuplicateRow[];
    errors: ImportErrorRow[];
  };
  summary: ImportPreviewSummary;
}

export interface ImportCommitResult {
  importId: string;
  summary: {
    total: number;
    imported: number;
    duplicates: number;
    failed: number;
    status: ImportStatus;
  };
}
