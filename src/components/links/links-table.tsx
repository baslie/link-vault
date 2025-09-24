"use client";

import { Fragment, useMemo } from "react";
import type { CSSProperties } from "react";

import { Button } from "@/components/ui/button";
import { LinkForm } from "@/components/links/link-form";
import {
  LINKS_PAGE_SIZES,
  type LinkListItem,
  type LinkListQueryFilters,
  type LinkListResult,
} from "@/lib/links/query";
import { parseLinkMetadata, resolveMetadataIcon, type LinkMetadata } from "@/lib/links/metadata";
import type { LinkFormValues } from "@/lib/links/schema";
import type { TagSummary } from "@/lib/tags/types";
import { cn } from "@/lib/utils";

export interface LinksTableProps {
  data: LinkListResult;
  filters: LinkListQueryFilters;
  availableTags: TagSummary[];
  formatDate: (value: string) => string;
  isLoading: boolean;
  isFetching: boolean;
  editingLinkId: string | null;
  onEditLink: (linkId: string) => void;
  onCancelEdit: () => void;
  onSubmitEdit: (
    linkId: string,
    values: LinkFormValues & { metadata?: LinkMetadata | null },
  ) => Promise<void>;
  isEditPending: boolean;
  onDeleteLink: (linkId: string, label: string) => Promise<void> | void;
  pendingDeleteId: string | null;
  isDeletePending: boolean;
  deleteError?: string | null;
  errorMessage?: string | null;
  onRetry?: () => void;
  onChangePage: (page: number) => void;
  onChangePerPage: (perPage: number) => void;
}

type PageControlItem = number | "ellipsis";

type TagColorStyle = CSSProperties | undefined;

function buildInitialValues(link: LinkListItem): LinkFormValues {
  return {
    url: link.url,
    title: link.title,
    comment: link.comment ?? undefined,
    tagIds: link.tags.map((tag) => tag.id),
    newTags: [],
  };
}

function buildInitialMetadata(link: LinkListItem): LinkMetadata | null {
  const parsed = parseLinkMetadata(link.metadataSource);
  if (parsed) {
    return parsed;
  }

  if (link.favIconPath) {
    return {
      title: link.title,
      favIconUrl: link.favIconPath,
      source: "stub",
      fetchedAt: link.updatedAt,
    } satisfies LinkMetadata;
  }

  return null;
}

function resolveIconUrl(link: LinkListItem, metadata: LinkMetadata | null): string | null {
  if (link.favIconPath) {
    return link.favIconPath;
  }

  return resolveMetadataIcon(metadata, link.url);
}

function resolveTagDotStyle(tagColor?: string | null): TagColorStyle {
  if (!tagColor) {
    return undefined;
  }

  const trimmed = tagColor.trim();
  if (!trimmed) {
    return undefined;
  }

  return { backgroundColor: trimmed } satisfies CSSProperties;
}

function buildPageItems(current: number, total: number): PageControlItem[] {
  if (total <= 7) {
    return Array.from({ length: total }, (_, index) => index + 1);
  }

  const pages = new Set<number>([1, total]);

  for (let offset = -1; offset <= 1; offset += 1) {
    const value = current + offset;
    if (value > 1 && value < total) {
      pages.add(value);
    }
  }

  if (current - 2 > 1) {
    pages.add(current - 2);
  }

  if (current + 2 < total) {
    pages.add(current + 2);
  }

  const sorted = Array.from(pages).sort((a, b) => a - b);
  const result: PageControlItem[] = [];

  sorted.forEach((page, index) => {
    if (index === 0) {
      result.push(page);
      return;
    }

    const previous = sorted[index - 1];
    if (page - previous === 1) {
      result.push(page);
      return;
    }

    result.push("ellipsis", page);
  });

  return result;
}

function formatRange(
  pagination: LinkListResult["pagination"],
  itemCount: number,
  numberFormatter: Intl.NumberFormat,
): string {
  if (pagination.total === 0) {
    return "Нет сохранённых ссылок";
  }

  const startIndex = (pagination.page - 1) * pagination.perPage + 1;
  const safeStart = Math.max(1, Math.min(startIndex, pagination.total));
  const available = Math.max(pagination.total - safeStart + 1, 0);
  const count = itemCount > 0 ? itemCount : Math.min(pagination.perPage, available);
  const endIndex = count > 0 ? safeStart + count - 1 : safeStart;

  return `Показано ${numberFormatter.format(safeStart)}–${numberFormatter.format(endIndex)} из ${numberFormatter.format(
    pagination.total,
  )} записей`;
}

function LinksTableTag({ name, color }: { name: string; color: string }) {
  const dotStyle = resolveTagDotStyle(color);

  return (
    <span className="inline-flex max-w-[10rem] items-center gap-1 rounded-full border border-border bg-background/70 px-2 py-0.5 text-xs text-foreground">
      <span
        className="h-2 w-2 flex-shrink-0 rounded-full border border-border/60"
        style={dotStyle}
        aria-hidden
      />
      <span className="truncate" title={name}>
        {name}
      </span>
    </span>
  );
}

export function LinksTable({
  data,
  filters,
  availableTags,
  formatDate,
  isLoading,
  isFetching,
  editingLinkId,
  onEditLink,
  onCancelEdit,
  onSubmitEdit,
  isEditPending,
  onDeleteLink,
  pendingDeleteId,
  isDeletePending,
  deleteError,
  errorMessage,
  onRetry,
  onChangePage,
  onChangePerPage,
}: LinksTableProps) {
  const numberFormatter = useMemo(() => new Intl.NumberFormat("ru-RU"), []);
  const { items, pagination } = data;

  const totalPages = Math.max(pagination.pageCount, 1);
  const previousPage = Math.max(1, filters.page - 1);
  const nextPage = Math.min(totalPages, filters.page + 1);

  const pageItems = useMemo(
    () => buildPageItems(pagination.page, totalPages),
    [pagination.page, totalPages],
  );

  const rangeSummary = useMemo(
    () => formatRange(pagination, items.length, numberFormatter),
    [items.length, numberFormatter, pagination],
  );

  return (
    <section className="space-y-4">
      <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="text-lg font-semibold tracking-tight text-foreground">Таблица ссылок</h2>
          <p className="text-sm text-muted-foreground">
            Кликайте по URL, редактируйте и управляйте тегами прямо в строке.
          </p>
        </div>
        {isFetching ? (
          <span className="text-xs text-muted-foreground">Обновление данных...</span>
        ) : null}
      </div>

      {deleteError ? (
        <div
          className="rounded-lg border border-destructive/40 bg-destructive/10 p-3 text-sm text-destructive"
          role="alert"
        >
          {deleteError}
        </div>
      ) : null}

      {errorMessage ? (
        <div
          className="flex flex-col gap-3 rounded-lg border border-destructive/40 bg-destructive/10 p-4 text-sm text-destructive"
          role="alert"
        >
          <p>Не удалось обновить таблицу: {errorMessage}</p>
          {onRetry ? (
            <div>
              <Button type="button" variant="outline" size="sm" onClick={onRetry}>
                Повторить загрузку
              </Button>
            </div>
          ) : null}
        </div>
      ) : null}

      <div className="overflow-hidden rounded-xl border border-border bg-card/60 shadow-sm">
        <div className="overflow-x-auto">
          <table className="min-w-full table-fixed border-collapse">
            <thead className="bg-muted/50 text-left text-xs uppercase tracking-wide text-muted-foreground">
              <tr>
                <th scope="col" className="w-14 px-4 py-3">
                  Сайт
                </th>
                <th scope="col" className="w-[20%] px-4 py-3">
                  Название
                </th>
                <th scope="col" className="w-[24%] px-4 py-3">
                  URL
                </th>
                <th scope="col" className="w-[20%] px-4 py-3">
                  Комментарий
                </th>
                <th scope="col" className="w-[16%] px-4 py-3">
                  Теги
                </th>
                <th scope="col" className="w-28 px-4 py-3">
                  Дата
                </th>
                <th scope="col" className="w-32 px-4 py-3 text-right">
                  Действия
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {isLoading ? (
                <tr>
                  <td colSpan={7} className="px-4 py-10 text-center text-sm text-muted-foreground">
                    Загрузка ссылок...
                  </td>
                </tr>
              ) : items.length === 0 ? (
                <tr>
                  <td colSpan={7} className="px-4 py-10 text-center text-sm text-muted-foreground">
                    Ссылок пока нет. Добавьте первую запись с помощью формы выше.
                  </td>
                </tr>
              ) : (
                items.map((link) => {
                  const metadata = buildInitialMetadata(link);
                  const iconUrl = resolveIconUrl(link, metadata);
                  const isEditing = editingLinkId === link.id;

                  return (
                    <Fragment key={link.id}>
                      <tr
                        className={cn(
                          "bg-background/40 transition hover:bg-muted/40",
                          isEditing ? "ring-1 ring-primary/40" : undefined,
                        )}
                      >
                        <td className="px-4 py-4">
                          {iconUrl ? (
                            // eslint-disable-next-line @next/next/no-img-element
                            <img
                              src={iconUrl}
                              alt="Фавиконка сайта"
                              className="h-8 w-8 rounded"
                              loading="lazy"
                            />
                          ) : (
                            <span className="flex h-8 w-8 items-center justify-center rounded bg-muted text-xs text-muted-foreground">
                              ∅
                            </span>
                          )}
                        </td>
                        <td className="px-4 py-4 align-top text-sm font-medium text-foreground">
                          <p className="break-words" title={link.title || link.url}>
                            {link.title || link.url}
                          </p>
                        </td>
                        <td className="px-4 py-4 align-top text-sm">
                          <a
                            href={link.url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="block truncate text-primary hover:underline"
                          >
                            {link.url}
                          </a>
                        </td>
                        <td className="px-4 py-4 align-top text-sm text-muted-foreground">
                          {link.comment ? (
                            <p className="whitespace-pre-wrap break-words" title={link.comment}>
                              {link.comment}
                            </p>
                          ) : (
                            <span>—</span>
                          )}
                        </td>
                        <td className="px-4 py-4 align-top">
                          {link.tags.length === 0 ? (
                            <span className="text-xs text-muted-foreground">—</span>
                          ) : (
                            <div className="flex flex-wrap gap-2">
                              {link.tags.map((tag) => (
                                <LinksTableTag key={tag.id} name={tag.name} color={tag.color} />
                              ))}
                            </div>
                          )}
                        </td>
                        <td className="px-4 py-4 align-top text-sm text-muted-foreground">
                          {formatDate(link.createdAt)}
                        </td>
                        <td className="px-4 py-4 text-right align-top text-sm">
                          <div className="flex flex-wrap justify-end gap-2">
                            <Button
                              type="button"
                              size="sm"
                              variant={isEditing ? "secondary" : "outline"}
                              onClick={() => onEditLink(link.id)}
                              disabled={isEditPending && isEditing}
                            >
                              {isEditing ? "Редактирование" : "Редактировать"}
                            </Button>
                            <Button
                              type="button"
                              size="sm"
                              variant="ghost"
                              onClick={() => onDeleteLink(link.id, link.title || link.url)}
                              disabled={isDeletePending || pendingDeleteId === link.id}
                            >
                              {pendingDeleteId === link.id ? "Удаление..." : "Удалить"}
                            </Button>
                          </div>
                        </td>
                      </tr>
                      {isEditing ? (
                        <tr className="bg-muted/20">
                          <td colSpan={7} className="px-4 pb-6 pt-2">
                            <div className="rounded-lg border border-border bg-background/80 p-4">
                              <LinkForm
                                mode="edit"
                                availableTags={availableTags}
                                initialValues={buildInitialValues(link)}
                                initialMetadata={metadata}
                                isSubmitting={isEditPending}
                                onSubmit={(values) => onSubmitEdit(link.id, values)}
                                onCancel={onCancelEdit}
                                onSuccess={onCancelEdit}
                              />
                            </div>
                          </td>
                        </tr>
                      ) : null}
                    </Fragment>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      <div className="flex flex-col gap-3 border-t border-border pt-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:gap-3">
          <label
            className="flex items-center gap-2 text-sm text-muted-foreground"
            htmlFor="links-per-page"
          >
            На странице
            <select
              id="links-per-page"
              value={filters.perPage}
              onChange={(event) => onChangePerPage(Number(event.target.value))}
              className="h-9 rounded-md border border-border bg-background px-2 text-sm text-foreground shadow-sm focus:outline-none focus:ring-2 focus:ring-primary"
              disabled={isLoading}
            >
              {LINKS_PAGE_SIZES.map((size) => (
                <option key={size} value={size}>
                  {size}
                </option>
              ))}
            </select>
          </label>
          <p className="text-xs text-muted-foreground sm:text-sm">{rangeSummary}</p>
        </div>
        <div className="flex flex-wrap items-center justify-end gap-2">
          <Button
            type="button"
            size="sm"
            variant="outline"
            onClick={() => onChangePage(previousPage)}
            disabled={isLoading || !pagination.hasPreviousPage}
          >
            Назад
          </Button>
          {pageItems.map((item, index) => {
            if (item === "ellipsis") {
              return (
                <span key={`ellipsis-${index}`} className="px-2 text-sm text-muted-foreground">
                  …
                </span>
              );
            }

            const isActive = item === filters.page;
            return (
              <Button
                key={item}
                type="button"
                size="sm"
                variant={isActive ? "default" : "outline"}
                onClick={() => onChangePage(item)}
                aria-current={isActive ? "page" : undefined}
                disabled={isLoading || item === filters.page}
              >
                {item}
              </Button>
            );
          })}
          <Button
            type="button"
            size="sm"
            variant="outline"
            onClick={() => onChangePage(nextPage)}
            disabled={isLoading || !pagination.hasNextPage}
          >
            Вперёд
          </Button>
        </div>
      </div>
    </section>
  );
}
