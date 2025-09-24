"use client";

import { useMemo } from "react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import type { LinkSortField, LinkSortOrder } from "@/lib/links/query";

const SORT_OPTIONS: Array<{ value: LinkSortField; label: string }> = [
  { value: "created_at", label: "По дате добавления" },
  { value: "title", label: "По названию" },
];

interface LinksSearchControlsProps {
  search: string;
  sort: LinkSortField;
  order: LinkSortOrder;
  isFetching: boolean;
  onSearchChange: (value: string) => void;
  onClearSearch: () => void;
  onSortChange: (value: LinkSortField) => void;
  onOrderChange: (value: LinkSortOrder) => void;
}

function resolveOrderButtonLabel(sort: LinkSortField, order: LinkSortOrder): string {
  if (sort === "title") {
    return order === "asc" ? "А → Я" : "Я → А";
  }

  return order === "asc" ? "Сначала старые" : "Сначала новые";
}

function resolveOrderButtonHint(order: LinkSortOrder): string {
  return order === "asc" ? "По возрастанию" : "По убыванию";
}

export function LinksSearchControls({
  search,
  sort,
  order,
  isFetching,
  onSearchChange,
  onClearSearch,
  onSortChange,
  onOrderChange,
}: LinksSearchControlsProps) {
  const orderLabel = useMemo(() => resolveOrderButtonLabel(sort, order), [sort, order]);
  const orderHint = useMemo(() => resolveOrderButtonHint(order), [order]);
  const nextOrder = order === "asc" ? "desc" : "asc";

  return (
    <section className="space-y-4 rounded-xl border border-border bg-card/60 p-5 shadow-sm">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 className="text-lg font-semibold tracking-tight text-foreground">
            Поиск и сортировка
          </h2>
          <p className="text-sm text-muted-foreground">
            Найдите нужную ссылку по названию, URL, комментариям или тегам и настройте порядок
            выдачи.
          </p>
        </div>
        {isFetching ? (
          <span className="text-xs text-muted-foreground">Обновление результатов...</span>
        ) : null}
      </div>

      <div className="flex flex-col gap-3 md:flex-row md:items-end">
        <div className="flex-1 space-y-1">
          <Label htmlFor="links-search">Поиск по ссылкам</Label>
          <Input
            id="links-search"
            placeholder="Введите название, URL или комментарий"
            value={search}
            onChange={(event) => onSearchChange(event.target.value)}
            autoComplete="off"
          />
        </div>
        <div className="flex items-end gap-2">
          <Button
            type="button"
            variant="ghost"
            onClick={onClearSearch}
            disabled={search.length === 0}
          >
            Очистить
          </Button>
        </div>
      </div>

      <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
        <div className="flex flex-wrap items-center gap-3">
          <div className="space-y-1">
            <Label htmlFor="links-sort">Поле сортировки</Label>
            <select
              id="links-sort"
              value={sort}
              onChange={(event) => onSortChange(event.target.value as LinkSortField)}
              className="h-9 rounded-md border border-border bg-background px-2 text-sm text-foreground shadow-sm focus:outline-none focus:ring-2 focus:ring-primary"
            >
              {SORT_OPTIONS.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
          </div>
          <div className="space-y-1">
            <Label className="text-muted-foreground">Порядок</Label>
            <Button
              type="button"
              variant="outline"
              onClick={() => onOrderChange(nextOrder)}
              aria-label="Переключить порядок сортировки"
              title={`Текущий порядок: ${orderHint}`}
            >
              {orderLabel}
            </Button>
          </div>
        </div>
        <p className="text-xs text-muted-foreground md:text-sm">
          Сортировка применяется ко всей таблице и сохраняется при навигации по страницам.
        </p>
      </div>
    </section>
  );
}
