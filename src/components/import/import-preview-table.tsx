"use client";

import type { PreparedImportRow } from "@/lib/import/types";

interface ImportPreviewTableProps {
  rows: PreparedImportRow[];
}

export function ImportPreviewTable({ rows }: ImportPreviewTableProps) {
  if (rows.length === 0) {
    return null;
  }

  const sample = rows.slice(0, 10);

  return (
    <div className="overflow-hidden rounded-lg border border-border">
      <table className="min-w-full divide-y divide-border">
        <thead className="bg-muted/50">
          <tr className="text-left text-sm font-semibold text-muted-foreground">
            <th className="px-4 py-2">#</th>
            <th className="px-4 py-2">URL</th>
            <th className="px-4 py-2">Название</th>
            <th className="px-4 py-2">Комментарий</th>
            <th className="px-4 py-2">Теги</th>
            <th className="px-4 py-2">Дата</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-border bg-card text-sm">
          {sample.map((row) => (
            <tr key={row.rowNumber}>
              <td className="px-4 py-2 text-muted-foreground">{row.rowNumber}</td>
              <td className="px-4 py-2 text-primary underline underline-offset-4">
                <span className="line-clamp-1 break-all">{row.url}</span>
              </td>
              <td className="px-4 py-2">
                <span className="line-clamp-1">{row.title}</span>
              </td>
              <td className="px-4 py-2 text-muted-foreground">
                <span className="line-clamp-2 whitespace-pre-line">{row.comment ?? ""}</span>
              </td>
              <td className="px-4 py-2">
                <span className="line-clamp-2 text-muted-foreground">
                  {row.tags.length > 0 ? row.tags.join(", ") : "—"}
                </span>
              </td>
              <td className="px-4 py-2 text-muted-foreground">
                {row.createdAt ? new Date(row.createdAt).toLocaleString() : "—"}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
      {rows.length > sample.length ? (
        <div className="border-t border-border bg-muted/40 px-4 py-2 text-sm text-muted-foreground">
          Показаны первые {sample.length} из {rows.length} строк для импорта
        </div>
      ) : null}
    </div>
  );
}
