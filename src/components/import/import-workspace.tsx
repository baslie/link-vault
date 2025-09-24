"use client";

import { type ChangeEvent, useState } from "react";
import Papa, { type ParseResult } from "papaparse";
import { AlertCircle, Check, FileWarning, RefreshCcw, Upload } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useImportCommitMutation } from "@/hooks/use-import-commit";
import { useImportPreviewMutation } from "@/hooks/use-import-preview";
import type {
  ImportField,
  ImportFieldMapping,
  PreparedImportRow,
  RawImportRow,
} from "@/lib/import/types";
import { normalizeColumnName } from "@/lib/import/utils";

import { ImportPreviewTable } from "@/components/import/import-preview-table";

interface ParsedCsvData {
  fileName: string;
  columns: string[];
  rows: RawImportRow[];
}

const FIELD_CONFIG: Array<{
  field: ImportField;
  label: string;
  required: boolean;
  description?: string;
}> = [
  {
    field: "url",
    label: "URL",
    required: true,
    description: "Колонка со ссылкой обязательна",
  },
  {
    field: "title",
    label: "Название",
    required: false,
  },
  {
    field: "comment",
    label: "Комментарий",
    required: false,
  },
  {
    field: "tags",
    label: "Теги",
    required: false,
    description: "Несколько тегов разделяйте запятой, точкой с запятой или вертикальной чертой",
  },
  {
    field: "createdAt",
    label: "Дата",
    required: false,
    description: "Будет использоваться как дата добавления ссылки",
  },
];

function buildRawRows(data: ParseResult<Record<string, string | null>>): RawImportRow[] {
  return data.data
    .map((entry, index) => ({
      rowNumber: index + 2,
      values: Object.fromEntries(
        Object.entries(entry ?? {}).map(([key, value]) => [
          key,
          value == null ? null : String(value),
        ]),
      ),
    }))
    .filter((row) =>
      Object.values(row.values).some((value) => value != null && String(value).trim().length > 0),
    );
}

function autoDetectColumn(columns: string[], aliases: string[]): string | undefined {
  const normalizedColumns = columns.map((column) => column.trim().toLowerCase());

  for (const alias of aliases) {
    const index = normalizedColumns.findIndex((column) => column === alias);
    if (index !== -1) {
      return columns[index];
    }
  }

  return undefined;
}

function buildInitialMapping(columns: string[]): ImportFieldMapping {
  const urlColumn = autoDetectColumn(columns, ["url", "link", "href"]);
  const titleColumn = autoDetectColumn(columns, ["title", "name", "label"]);
  const commentColumn = autoDetectColumn(columns, ["comment", "description", "notes"]);
  const tagsColumn = autoDetectColumn(columns, ["tags", "tag", "labels"]);
  const dateColumn = autoDetectColumn(columns, [
    "created_at",
    "created",
    "date",
    "added_at",
    "timestamp",
  ]);

  const mapping: ImportFieldMapping = {
    url: urlColumn ?? columns[0] ?? "",
    title: titleColumn,
    comment: commentColumn,
    tags: tagsColumn,
    createdAt: dateColumn,
  };

  return mapping;
}

function buildPreviewPayload(rows: RawImportRow[], mapping: ImportFieldMapping) {
  return {
    rows,
    mapping,
  };
}

function formatCountLabel(count: number, label: string) {
  return `${count} ${label}`;
}

function buildCommitPayload(rows: PreparedImportRow[], source: string) {
  return {
    rows,
    source,
  };
}

export function ImportWorkspace() {
  const [parsed, setParsed] = useState<ParsedCsvData | null>(null);
  const [mapping, setMapping] = useState<ImportFieldMapping | null>(null);
  const [parseError, setParseError] = useState<string | null>(null);
  const previewMutation = useImportPreviewMutation();
  const commitMutation = useImportCommitMutation();

  const previewResult = previewMutation.data;
  const readyRows = previewResult?.rows.ready ?? [];
  const duplicateRows = previewResult?.rows.duplicates ?? [];
  const errorRows = previewResult?.rows.errors ?? [];

  function resetState() {
    setParsed(null);
    setMapping(null);
    setParseError(null);
    previewMutation.reset();
    commitMutation.reset();
  }

  function handleFileChange(event: ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    if (!file) {
      resetState();
      return;
    }

    Papa.parse<Record<string, string | null>>(file, {
      header: true,
      skipEmptyLines: "greedy",
      transformHeader(header: string) {
        return header.trim();
      },
      complete(results: ParseResult<Record<string, string | null>>) {
        if (results.errors.length > 0) {
          setParseError(
            `Ошибка чтения CSV: ${results.errors[0]?.message ?? "не удалось обработать файл"}`,
          );
          setParsed(null);
          setMapping(null);
          return;
        }

        const columns = results.meta.fields ?? [];
        if (!columns || columns.length === 0) {
          setParseError("Файл не содержит заголовок с названиями колонок");
          setParsed(null);
          setMapping(null);
          return;
        }

        const rows = buildRawRows(results);
        if (rows.length === 0) {
          setParseError("Не найдено данных для импорта");
          setParsed(null);
          setMapping(null);
          return;
        }

        setParseError(null);
        setParsed({
          fileName: file.name,
          columns,
          rows,
        });
        setMapping(buildInitialMapping(columns));
        previewMutation.reset();
        commitMutation.reset();
      },
      error(error: Error) {
        setParseError(`Не удалось прочитать CSV: ${error.message}`);
        setParsed(null);
        setMapping(null);
      },
    });
  }

  function handleMappingChange(field: ImportField, value: string) {
    setMapping((current) => {
      if (!current) {
        return current;
      }

      const normalized = normalizeColumnName(value) ?? null;
      return {
        ...current,
        [field]: field === "url" ? value : normalized,
      };
    });
  }

  async function handlePreview() {
    if (!parsed || !mapping) {
      return;
    }

    if (!mapping.url || mapping.url.trim().length === 0) {
      setParseError("Выберите колонку с URL");
      return;
    }

    try {
      setParseError(null);
      await previewMutation.mutateAsync(buildPreviewPayload(parsed.rows, mapping));
    } catch (error) {
      if (error instanceof Error) {
        setParseError(error.message);
      } else {
        setParseError("Не удалось построить предпросмотр");
      }
    }
  }

  async function handleCommit() {
    if (!parsed || !mapping || !previewResult) {
      return;
    }

    if (readyRows.length === 0) {
      setParseError("Нет строк, готовых к импорту");
      return;
    }

    try {
      setParseError(null);
      await commitMutation.mutateAsync(
        buildCommitPayload(readyRows, `csv:${parsed.fileName ?? "upload"}`),
      );
    } catch (error) {
      if (error instanceof Error) {
        setParseError(error.message);
      } else {
        setParseError("Не удалось выполнить импорт");
      }
    }
  }

  const isProcessing = previewMutation.isPending || commitMutation.isPending;
  const summary = previewResult?.summary;
  const commitSummary = commitMutation.data?.summary;

  return (
    <div className="flex w-full flex-col gap-8">
      <section className="rounded-lg border border-border bg-card p-6 shadow-sm">
        <div className="flex flex-col gap-4">
          <div>
            <h1 className="text-xl font-semibold tracking-tight">Импорт ссылок из CSV</h1>
            <p className="mt-1 text-sm text-muted-foreground">
              Загрузите CSV-файл, сопоставьте колонки и проверьте результат перед импортом.
            </p>
          </div>
          <div className="flex flex-col gap-3">
            <Label htmlFor="csv-file">CSV-файл</Label>
            <Input
              id="csv-file"
              type="file"
              accept=".csv"
              onChange={handleFileChange}
              disabled={isProcessing}
            />
            {parsed ? (
              <p className="text-sm text-muted-foreground">
                Загружено строк: {parsed.rows.length}. Колонки: {parsed.columns.join(", ")}
              </p>
            ) : (
              <p className="text-sm text-muted-foreground">
                Поддерживается UTF-8 CSV с заголовком. Разделитель — запятая или точка с запятой.
              </p>
            )}
          </div>
          {parsed && mapping ? (
            <div className="mt-2 grid gap-4 rounded-md border border-dashed border-border/80 bg-muted/30 p-4 sm:grid-cols-2">
              {FIELD_CONFIG.map((config) => (
                <div key={config.field} className="flex flex-col gap-2">
                  <Label className="text-sm font-medium">
                    {config.label}
                    {config.required ? <span className="ml-1 text-destructive">*</span> : null}
                  </Label>
                  <select
                    className="h-10 rounded-md border border-border bg-background px-3 text-sm shadow-sm focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/30"
                    value={mapping[config.field] ?? ""}
                    onChange={(event) => handleMappingChange(config.field, event.target.value)}
                    disabled={isProcessing}
                  >
                    <option value="">Не использовать</option>
                    {parsed.columns.map((column) => (
                      <option key={column} value={column}>
                        {column}
                      </option>
                    ))}
                  </select>
                  {config.description ? (
                    <p className="text-xs text-muted-foreground">{config.description}</p>
                  ) : null}
                </div>
              ))}
            </div>
          ) : null}
          <div className="flex flex-wrap items-center gap-3">
            <Button
              type="button"
              onClick={handlePreview}
              disabled={!parsed || !mapping || isProcessing}
            >
              <Upload className="mr-2 h-4 w-4" aria-hidden />
              Построить предпросмотр
            </Button>
            <Button
              type="button"
              variant="secondary"
              onClick={resetState}
              disabled={isProcessing && !parsed}
            >
              <RefreshCcw className="mr-2 h-4 w-4" aria-hidden />
              Сбросить
            </Button>
          </div>
          {parseError ? (
            <div className="flex items-start gap-2 rounded-md border border-destructive/30 bg-destructive/10 p-3 text-sm text-destructive">
              <AlertCircle className="mt-0.5 h-4 w-4" aria-hidden />
              <span>{parseError}</span>
            </div>
          ) : null}
        </div>
      </section>

      {previewResult ? (
        <section className="rounded-lg border border-border bg-card p-6 shadow-sm">
          <div className="flex flex-col gap-4">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div>
                <h2 className="text-lg font-semibold">Предпросмотр импорта</h2>
                <p className="text-sm text-muted-foreground">
                  Проверьте подготовленные строки, дубли и ошибки перед подтверждением.
                </p>
              </div>
              {summary ? (
                <div className="flex flex-wrap gap-2 text-xs font-medium">
                  <span className="rounded-full bg-primary/10 px-3 py-1 text-primary">
                    {formatCountLabel(summary.ready, "готово")}
                  </span>
                  <span className="rounded-full bg-amber-500/10 px-3 py-1 text-amber-600">
                    {formatCountLabel(summary.duplicates, "дублей")}
                  </span>
                  <span className="rounded-full bg-destructive/10 px-3 py-1 text-destructive">
                    {formatCountLabel(summary.errors, "ошибок")}
                  </span>
                </div>
              ) : null}
            </div>

            <ImportPreviewTable rows={readyRows} />

            {duplicateRows.length > 0 ? (
              <div className="rounded-md border border-amber-500/40 bg-amber-50/60 p-4 text-sm text-amber-700">
                <div className="flex items-start gap-2">
                  <FileWarning className="mt-0.5 h-4 w-4" aria-hidden />
                  <div className="space-y-1">
                    <p className="font-medium">Найдены дубли ({duplicateRows.length})</p>
                    <p>
                      Эти строки будут пропущены. Убедитесь, что в файле нет повторяющихся ссылок и
                      что они отсутствуют в базе.
                    </p>
                    <ul className="mt-2 list-disc space-y-1 pl-5">
                      {duplicateRows.slice(0, 5).map((item) => (
                        <li key={`${item.rowNumber}-${item.url}`}>
                          Строка {item.rowNumber}: {item.url} (
                          {item.reason === "existing" ? "уже в базе" : "повтор в файле"})
                        </li>
                      ))}
                    </ul>
                    {duplicateRows.length > 5 ? (
                      <p>И еще {duplicateRows.length - 5} строк.</p>
                    ) : null}
                  </div>
                </div>
              </div>
            ) : null}

            {errorRows.length > 0 ? (
              <div className="rounded-md border border-destructive/30 bg-destructive/10 p-4 text-sm text-destructive">
                <div className="flex items-start gap-2">
                  <AlertCircle className="mt-0.5 h-4 w-4" aria-hidden />
                  <div className="space-y-1">
                    <p className="font-medium">Строки с ошибками ({errorRows.length})</p>
                    <ul className="mt-2 list-disc space-y-1 pl-5">
                      {errorRows.slice(0, 5).map((item) => (
                        <li key={`${item.rowNumber}-${item.column ?? "error"}`}>
                          Строка {item.rowNumber}: {item.message}
                          {item.column ? ` (колонка: ${item.column})` : null}
                        </li>
                      ))}
                    </ul>
                    {errorRows.length > 5 ? <p>И еще {errorRows.length - 5} строк.</p> : null}
                  </div>
                </div>
              </div>
            ) : null}

            <div className="flex flex-wrap items-center gap-3">
              <Button
                type="button"
                onClick={handleCommit}
                disabled={readyRows.length === 0 || commitMutation.isPending}
              >
                <Check className="mr-2 h-4 w-4" aria-hidden />
                Импортировать {readyRows.length} строк
              </Button>
              {commitMutation.isSuccess && commitSummary ? (
                <span className="text-sm text-muted-foreground">
                  Импорт завершен: {commitSummary.imported} добавлено, {commitSummary.duplicates}{" "}
                  дублей, ошибок: {commitSummary.failed}
                </span>
              ) : null}
            </div>
          </div>
        </section>
      ) : null}
    </div>
  );
}
