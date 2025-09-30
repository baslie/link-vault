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
  dateFrom?: string;
  dateTo?: string;
  isFetching: boolean;
  onSearchChange: (value: string) => void;
  onClearSearch: () => void;
  onSortChange: (value: LinkSortField) => void;
  onOrderChange: (value: LinkSortOrder) => void;
  onDateFromChange: (value: string | undefined) => void;
  onDateToChange: (value: string | undefined) => void;
  onResetDates: () => void;
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

function isoToDateInputValue(value?: string): string {
  if (!value) {
    return "";
  }

  const date = new Date(value);
  if (Number.isNaN(date.getTime())) {
    return "";
  }

  return date.toISOString().slice(0, 10);
}

function dateInputValueToIso(value?: string): string | undefined {
  if (!value) {
    return undefined;
  }

  const trimmed = value.trim();
  if (!trimmed) {
    return undefined;
  }

  const date = new Date(`${trimmed}T00:00:00Z`);
  if (Number.isNaN(date.getTime())) {
    return undefined;
  }

  return date.toISOString();
}

export function LinksSearchControls({
  search,
  sort,
  order,
  dateFrom,
  dateTo,
  isFetching,
  onSearchChange,
  onClearSearch,
  onSortChange,
  onOrderChange,
  onDateFromChange,
  onDateToChange,
  onResetDates,
}: LinksSearchControlsProps) {
  const orderLabel = useMemo(() => resolveOrderButtonLabel(sort, order), [sort, order]);
  const orderHint = useMemo(() => resolveOrderButtonHint(order), [order]);
  const nextOrder = order === "asc" ? "desc" : "asc";

  const dateFromValue = isoToDateInputValue(dateFrom);
  const dateToValue = isoToDateInputValue(dateTo);
  const hasDateFilters = Boolean(dateFromValue || dateToValue);

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

      <div className="grid gap-3 md:grid-cols-[repeat(3,minmax(0,1fr))] md:items-end">
        <div className="space-y-1">
          <Label htmlFor="links-date-from">Дата добавления с</Label>
          <Input
            id="links-date-from"
            type="date"
            value={dateFromValue}
            max={dateToValue || undefined}
            onChange={(event) => onDateFromChange(dateInputValueToIso(event.target.value))}
          />
        </div>
        <div className="space-y-1">
          <Label htmlFor="links-date-to">Дата добавления по</Label>
          <Input
            id="links-date-to"
            type="date"
            value={dateToValue}
            min={dateFromValue || undefined}
            onChange={(event) => onDateToChange(dateInputValueToIso(event.target.value))}
          />
        </div>
        <div className="flex items-end gap-2">
          <Button type="button" variant="ghost" onClick={onResetDates} disabled={!hasDateFilters}>
            Сбросить даты
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

export { dateInputValueToIso, isoToDateInputValue };
