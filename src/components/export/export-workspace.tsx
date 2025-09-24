"use client";

import { type FormEvent, useMemo, useState } from "react";
import { Download, ListFilter, Settings2 } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useTagsQuery } from "@/hooks/use-tags-query";
import { requestExport } from "@/lib/export/client";
import type { ExportRequestPayload, ExportScope } from "@/lib/export/types";
import { LINK_SORT_FIELDS, LINK_SORT_ORDERS } from "@/lib/links/query";

const DEFAULT_SCOPE: ExportScope = "all";

function parseIds(value: string): string[] {
  return value
    .split(/[,\n\s]+/)
    .map((id) => id.trim())
    .filter((id) => id.length > 0);
}

export function ExportWorkspace() {
  const [scope, setScope] = useState<ExportScope>(DEFAULT_SCOPE);
  const [search, setSearch] = useState("");
  const [selectedTags, setSelectedTags] = useState<string[]>([]);
  const [dateFrom, setDateFrom] = useState("");
  const [dateTo, setDateTo] = useState("");
  const [sort, setSort] = useState<(typeof LINK_SORT_FIELDS)[number]>("created_at");
  const [order, setOrder] = useState<(typeof LINK_SORT_ORDERS)[number]>("desc");
  const [selectedIds, setSelectedIds] = useState("");
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const { data: tags } = useTagsQuery();

  const payload = useMemo<ExportRequestPayload>(() => {
    if (scope === "selected") {
      return {
        scope,
        ids: parseIds(selectedIds),
      };
    }

    if (scope === "filters") {
      return {
        scope,
        filters: {
          search: search.trim() || undefined,
          tagIds: selectedTags.length > 0 ? selectedTags : undefined,
          dateFrom: dateFrom || undefined,
          dateTo: dateTo || undefined,
          sort,
          order,
        },
      };
    }

    return { scope };
  }, [scope, selectedIds, search, selectedTags, dateFrom, dateTo, sort, order]);

  function handleToggleTag(id: string) {
    setSelectedTags((prev) =>
      prev.includes(id) ? prev.filter((value) => value !== id) : [...prev, id],
    );
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setErrorMessage(null);
    setSuccessMessage(null);

    if (scope === "selected") {
      const ids = parseIds(selectedIds);
      if (ids.length === 0) {
        setErrorMessage("Укажите хотя бы один идентификатор ссылки");
        return;
      }
    }

    try {
      setIsLoading(true);
      const result = await requestExport(payload);
      const blobUrl = URL.createObjectURL(result.blob);
      const anchor = document.createElement("a");
      anchor.href = blobUrl;
      anchor.download = result.filename;
      anchor.style.display = "none";
      document.body.appendChild(anchor);
      anchor.click();
      anchor.remove();
      URL.revokeObjectURL(blobUrl);
      setSuccessMessage(`Экспорт сформирован: ${result.filename}`);
    } catch (error) {
      setErrorMessage(error instanceof Error ? error.message : "Не удалось выполнить экспорт");
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="flex w-full flex-col gap-8">
      <section className="rounded-lg border border-border bg-card p-6 shadow-sm">
        <div className="flex flex-col gap-4">
          <div className="flex items-center gap-3">
            <Download className="h-5 w-5 text-primary" aria-hidden />
            <div>
              <h1 className="text-xl font-semibold tracking-tight">Экспорт ссылок в CSV</h1>
              <p className="text-sm text-muted-foreground">
                Выберите охват данных и, при необходимости, уточните фильтры.
              </p>
            </div>
          </div>

          <div className="grid gap-4 md:grid-cols-3">
            <label className="flex cursor-pointer flex-col gap-2 rounded-md border border-border/60 bg-muted/30 p-4 text-sm shadow-sm transition focus-within:border-primary hover:border-primary">
              <div className="flex items-center justify-between">
                <span className="font-medium">Все данные</span>
                <input
                  type="radio"
                  className="h-4 w-4"
                  name="scope"
                  value="all"
                  checked={scope === "all"}
                  onChange={() => setScope("all")}
                />
              </div>
              <p className="text-muted-foreground">Экспортирует весь список ссылок пользователя.</p>
            </label>

            <label className="flex cursor-pointer flex-col gap-2 rounded-md border border-border/60 bg-muted/30 p-4 text-sm shadow-sm transition focus-within:border-primary hover:border-primary">
              <div className="flex items-center justify-between">
                <span className="font-medium">Текущая выборка</span>
                <input
                  type="radio"
                  className="h-4 w-4"
                  name="scope"
                  value="filters"
                  checked={scope === "filters"}
                  onChange={() => setScope("filters")}
                />
              </div>
              <p className="text-muted-foreground">
                Используйте фильтры ниже для настройки выгрузки.
              </p>
            </label>

            <label className="flex cursor-pointer flex-col gap-2 rounded-md border border-border/60 bg-muted/30 p-4 text-sm shadow-sm transition focus-within:border-primary hover:border-primary">
              <div className="flex items-center justify-between">
                <span className="font-medium">Выбранные записи</span>
                <input
                  type="radio"
                  className="h-4 w-4"
                  name="scope"
                  value="selected"
                  checked={scope === "selected"}
                  onChange={() => setScope("selected")}
                />
              </div>
              <p className="text-muted-foreground">
                Укажите идентификаторы ссылок через запятую или с новой строки.
              </p>
            </label>
          </div>
        </div>
      </section>

      {scope === "filters" ? (
        <section className="rounded-lg border border-border bg-card p-6 shadow-sm">
          <div className="flex flex-col gap-4">
            <div className="flex items-center gap-2 text-sm font-medium text-muted-foreground">
              <ListFilter className="h-4 w-4" aria-hidden />
              <span>Фильтры экспорта</span>
            </div>

            <div className="grid gap-4 md:grid-cols-2">
              <div className="flex flex-col gap-2">
                <Label htmlFor="export-search">Поисковый запрос</Label>
                <Input
                  id="export-search"
                  value={search}
                  onChange={(event) => setSearch(event.target.value)}
                  placeholder="Например, дизайн"
                />
              </div>
              <div className="flex flex-col gap-2">
                <Label>Период</Label>
                <div className="grid grid-cols-2 gap-3">
                  <Input
                    type="date"
                    value={dateFrom}
                    onChange={(event) => setDateFrom(event.target.value)}
                  />
                  <Input
                    type="date"
                    value={dateTo}
                    onChange={(event) => setDateTo(event.target.value)}
                  />
                </div>
              </div>
              <div className="flex flex-col gap-2">
                <Label>Теги</Label>
                <div className="flex flex-wrap gap-2">
                  {tags?.map((tag) => (
                    <label
                      key={tag.id}
                      className={`flex items-center gap-2 rounded-full border px-3 py-1 text-xs ${selectedTags.includes(tag.id) ? "border-primary bg-primary/10 text-primary" : "border-border text-muted-foreground"}`}
                    >
                      <input
                        type="checkbox"
                        className="h-3.5 w-3.5"
                        checked={selectedTags.includes(tag.id)}
                        onChange={() => handleToggleTag(tag.id)}
                      />
                      <span>{tag.name}</span>
                    </label>
                  ))}
                  {tags && tags.length === 0 ? (
                    <p className="text-xs text-muted-foreground">У вас пока нет тегов</p>
                  ) : null}
                </div>
              </div>
              <div className="flex flex-col gap-2">
                <Label>Сортировка</Label>
                <div className="grid grid-cols-2 gap-3">
                  <select
                    className="h-10 rounded-md border border-border bg-background px-3 text-sm shadow-sm focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/30"
                    value={sort}
                    onChange={(event) =>
                      setSort(event.target.value as (typeof LINK_SORT_FIELDS)[number])
                    }
                  >
                    <option value="created_at">По дате создания</option>
                    <option value="title">По названию</option>
                  </select>
                  <select
                    className="h-10 rounded-md border border-border bg-background px-3 text-sm shadow-sm focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/30"
                    value={order}
                    onChange={(event) =>
                      setOrder(event.target.value as (typeof LINK_SORT_ORDERS)[number])
                    }
                  >
                    <option value="desc">По убыванию</option>
                    <option value="asc">По возрастанию</option>
                  </select>
                </div>
              </div>
            </div>
          </div>
        </section>
      ) : null}

      {scope === "selected" ? (
        <section className="rounded-lg border border-border bg-card p-6 shadow-sm">
          <div className="flex flex-col gap-4">
            <div className="flex items-center gap-2 text-sm font-medium text-muted-foreground">
              <Settings2 className="h-4 w-4" aria-hidden />
              <span>Идентификаторы ссылок</span>
            </div>
            <div className="flex flex-col gap-2">
              <Label htmlFor="export-ids">Укажите список UUID ссылок</Label>
              <textarea
                id="export-ids"
                className="min-h-[120px] rounded-md border border-border bg-background px-3 py-2 text-sm shadow-sm focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/30"
                placeholder="uuid-1, uuid-2, uuid-3"
                value={selectedIds}
                onChange={(event) => setSelectedIds(event.target.value)}
              />
              <p className="text-xs text-muted-foreground">
                Можно вводить через запятую или с новой строки.
              </p>
            </div>
          </div>
        </section>
      ) : null}

      <div className="flex flex-col gap-3">
        <Button type="submit" disabled={isLoading}>
          <Download className="mr-2 h-4 w-4" aria-hidden />
          Скачать CSV
        </Button>
        {errorMessage ? <p className="text-sm text-destructive">{errorMessage}</p> : null}
        {successMessage ? <p className="text-sm text-muted-foreground">{successMessage}</p> : null}
      </div>
    </form>
  );
}
