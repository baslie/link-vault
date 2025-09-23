"use client";

import { useMemo } from "react";

import { useLinksQuery } from "@/hooks/use-links-query";
import { useTagsQuery } from "@/hooks/use-tags-query";
import type { LinkListQueryFilters, LinkListResult } from "@/lib/links/query";
import type { TagSummary } from "@/lib/tags/types";

const LINK_PREVIEW_COUNT = 5;

interface LinksWorkspaceProps {
  initialFilters: LinkListQueryFilters;
  initialLinks: LinkListResult;
  initialTags: TagSummary[];
}

function formatDate(date: string, formatter: Intl.DateTimeFormat) {
  try {
    return formatter.format(new Date(date));
  } catch (error) {
    console.warn("Failed to format date", error);
    return date;
  }
}

export function LinksWorkspace({ initialFilters, initialLinks, initialTags }: LinksWorkspaceProps) {
  const dateFormatter = useMemo(
    () =>
      new Intl.DateTimeFormat("ru-RU", {
        dateStyle: "medium",
      }),
    [],
  );

  const linksQuery = useLinksQuery(initialFilters, {
    initialData: initialLinks,
  });
  const tagsQuery = useTagsQuery({
    initialData: initialTags,
    staleTime: 5 * 60 * 1000,
  });

  const linksData = linksQuery.data ?? initialLinks;
  const tagsData = tagsQuery.data ?? initialTags;
  const previewItems = linksData.items.slice(0, LINK_PREVIEW_COUNT);

  return (
    <section className="flex w-full flex-col gap-6">
      <div className="grid gap-4 md:grid-cols-2">
        <article className="rounded-xl border border-border bg-card/60 p-5 shadow-sm">
          <h2 className="text-sm font-medium text-muted-foreground">Всего ссылок</h2>
          <p className="text-2xl font-semibold tracking-tight text-foreground">
            {linksData.pagination.total}
          </p>
          <p className="text-xs text-muted-foreground">
            Страница {linksData.pagination.page} из {Math.max(linksData.pagination.pageCount, 1)}
            {linksQuery.isFetching ? " · обновление..." : ""}
          </p>
        </article>
        <article className="rounded-xl border border-border bg-card/60 p-5 shadow-sm">
          <h2 className="text-sm font-medium text-muted-foreground">Теги</h2>
          <p className="text-2xl font-semibold tracking-tight text-foreground">{tagsData.length}</p>
          <p className="text-xs text-muted-foreground">
            Используются для фильтрации и группировки ссылок.
          </p>
        </article>
      </div>

      <div className="space-y-4">
        <div className="flex items-center justify-between gap-2">
          <div>
            <h2 className="text-lg font-semibold tracking-tight text-foreground">
              Последние ссылки
            </h2>
            <p className="text-sm text-muted-foreground">
              Показаны первые {previewItems.length} из {linksData.pagination.total} записей.
            </p>
          </div>
          {linksQuery.isFetching && !linksQuery.isLoading ? (
            <span className="text-xs text-muted-foreground">Обновление данных...</span>
          ) : null}
        </div>
        <div className="rounded-xl border border-border bg-card/60 p-5 shadow-sm">
          {previewItems.length === 0 ? (
            <p className="text-sm text-muted-foreground">Вы ещё не сохраняли ссылки.</p>
          ) : (
            <ul className="space-y-4">
              {previewItems.map((link) => (
                <li key={link.id} className="space-y-2">
                  <div className="flex flex-col gap-1 sm:flex-row sm:items-start sm:justify-between">
                    <p className="text-base font-medium text-foreground">
                      {link.title || link.url}
                    </p>
                    <span className="text-xs text-muted-foreground">
                      {formatDate(link.createdAt, dateFormatter)}
                    </span>
                  </div>
                  <a
                    href={link.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="block truncate text-sm text-primary hover:underline"
                  >
                    {link.url}
                  </a>
                  {link.comment ? (
                    <p className="text-sm text-muted-foreground">{link.comment}</p>
                  ) : null}
                  {link.tags.length > 0 ? (
                    <div className="flex flex-wrap gap-2">
                      {link.tags.map((tag) => (
                        <span
                          key={tag.id}
                          className="rounded-full border border-border px-2 py-0.5 text-xs text-muted-foreground"
                        >
                          {tag.name}
                        </span>
                      ))}
                    </div>
                  ) : null}
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>
    </section>
  );
}
