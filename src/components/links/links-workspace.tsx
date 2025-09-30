"use client";

import { useCallback, useMemo, useState } from "react";

import { useLinksQuery } from "@/hooks/use-links-query";
import { useTagsQuery } from "@/hooks/use-tags-query";
import {
  useCreateLinkMutation,
  useDeleteLinkMutation,
  useUpdateLinkMutation,
} from "@/hooks/use-link-mutations";
import { LinkForm } from "@/components/links/link-form";
import { LinksSearchControls } from "@/components/links/links-search-controls";
import { LinksTable } from "@/components/links/links-table";
import { TagBar } from "@/components/links/tag-bar";
import type { LinkMetadata } from "@/lib/links/metadata";
import type { LinkListQueryFilters, LinkListResult } from "@/lib/links/query";
import type { TagSummary } from "@/lib/tags/types";
import type { LinkFormValues } from "@/lib/links/schema";

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

  const [filters, setFilters] = useState<LinkListQueryFilters>(initialFilters);
  const searchTokens = useMemo(() => {
    if (!filters.search) {
      return [] as string[];
    }

    const unique = new Set<string>();
    filters.search
      .split(/\s+/)
      .map((token) => token.trim().toLowerCase())
      .filter((token) => token.length > 0)
      .forEach((token) => unique.add(token));

    return Array.from(unique);
  }, [filters.search]);

  const linksQuery = useLinksQuery(filters, {
    initialData: initialLinks,
    placeholderData: (previous) => previous,
  });
  const tagsQuery = useTagsQuery({
    initialData: initialTags,
    staleTime: 5 * 60 * 1000,
  });

  const createMutation = useCreateLinkMutation();
  const updateMutation = useUpdateLinkMutation();
  const deleteMutation = useDeleteLinkMutation();

  const [editingLinkId, setEditingLinkId] = useState<string | null>(null);
  const [pendingDeleteId, setPendingDeleteId] = useState<string | null>(null);
  const [deleteError, setDeleteError] = useState<string | null>(null);

  const linksData = linksQuery.data ?? initialLinks;
  const tagsData = tagsQuery.data ?? initialTags;

  const handleCreate = async (values: LinkFormValues & { metadata?: LinkMetadata | null }) => {
    await createMutation.mutateAsync(values);
  };

  const handleUpdate = async (
    linkId: string,
    values: LinkFormValues & { metadata?: LinkMetadata | null },
  ) => {
    await updateMutation.mutateAsync({ ...values, id: linkId });
    setEditingLinkId(null);
  };

  const handleDelete = async (linkId: string, label: string) => {
    if (typeof window !== "undefined") {
      const confirmed = window.confirm(`Удалить ссылку «${label}»?`);
      if (!confirmed) {
        return;
      }
    }

    setDeleteError(null);
    setPendingDeleteId(linkId);

    try {
      await deleteMutation.mutateAsync({ id: linkId });
      if (editingLinkId === linkId) {
        setEditingLinkId(null);
      }
    } catch (error) {
      setDeleteError(
        error instanceof Error ? error.message : "Не удалось удалить ссылку. Попробуйте позже.",
      );
    } finally {
      setPendingDeleteId(null);
    }
  };

  const handleChangePage = useCallback((page: number) => {
    setFilters((previous) => ({ ...previous, page }));
  }, []);

  const handleChangePerPage = useCallback((perPage: number) => {
    setFilters((previous) => ({ ...previous, perPage, page: 1 }));
  }, []);

  const handleSearchChange = useCallback((value: string) => {
    setFilters((previous) => {
      const trimmed = value.trim();

      return {
        ...previous,
        search: trimmed.length > 0 ? value : undefined,
        page: 1,
      } satisfies LinkListQueryFilters;
    });
  }, []);

  const handleClearSearch = useCallback(() => {
    setFilters((previous) => ({ ...previous, search: undefined, page: 1 }));
  }, []);

  const handleSortChange = useCallback((sort: LinkListQueryFilters["sort"]) => {
    setFilters((previous) => ({ ...previous, sort, page: 1 }));
  }, []);

  const handleOrderChange = useCallback((order: LinkListQueryFilters["order"]) => {
    setFilters((previous) => ({ ...previous, order, page: 1 }));
  }, []);

  const handleDateFromChange = useCallback((dateFrom?: string) => {
    setFilters((previous) => {
      const next: LinkListQueryFilters = {
        ...previous,
        dateFrom: dateFrom ?? undefined,
        page: 1,
      };

      if (dateFrom && previous.dateTo && previous.dateTo < dateFrom) {
        next.dateTo = dateFrom;
      }

      return next;
    });
  }, []);

  const handleDateToChange = useCallback((dateTo?: string) => {
    setFilters((previous) => {
      const next: LinkListQueryFilters = {
        ...previous,
        dateTo: dateTo ?? undefined,
        page: 1,
      };

      if (dateTo && previous.dateFrom && previous.dateFrom > dateTo) {
        next.dateFrom = dateTo;
      }

      return next;
    });
  }, []);

  const handleResetDates = useCallback(() => {
    setFilters((previous) => ({ ...previous, dateFrom: undefined, dateTo: undefined, page: 1 }));
  }, []);

  const handleToggleTag = useCallback((tagId: string) => {
    setFilters((previous) => {
      const currentTagIds = previous.tagIds ?? [];
      const hasTag = currentTagIds.includes(tagId);
      const nextTagIds = hasTag
        ? currentTagIds.filter((id) => id !== tagId)
        : [...currentTagIds, tagId];

      return {
        ...previous,
        tagIds: nextTagIds.length > 0 ? nextTagIds : undefined,
        page: 1,
      };
    });
  }, []);

  const handleResetTags = useCallback(() => {
    setFilters((previous) => ({ ...previous, tagIds: undefined, page: 1 }));
  }, []);

  const handleTagDeleted = useCallback((tagId: string) => {
    setFilters((previous) => {
      const currentTagIds = previous.tagIds ?? [];
      if (!currentTagIds.includes(tagId)) {
        return previous;
      }

      const nextTagIds = currentTagIds.filter((id) => id !== tagId);

      return {
        ...previous,
        tagIds: nextTagIds.length > 0 ? nextTagIds : undefined,
        page: 1,
      };
    });
  }, []);

  const formatDateValue = useCallback(
    (value: string) => formatDate(value, dateFormatter),
    [dateFormatter],
  );

  const handleStartEdit = useCallback((linkId: string) => {
    setEditingLinkId((current) => (current === linkId ? current : linkId));
  }, []);

  const handleCancelEdit = useCallback(() => {
    setEditingLinkId(null);
  }, []);

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

      <article className="rounded-xl border border-border bg-card/60 p-5 shadow-sm">
        <div className="mb-4 space-y-1">
          <h2 className="text-lg font-semibold tracking-tight text-foreground">Добавить ссылку</h2>
          <p className="text-sm text-muted-foreground">
            Вставьте URL, получите метаданные и выберите подходящие теги.
          </p>
        </div>
        <LinkForm
          mode="create"
          availableTags={tagsData}
          isSubmitting={createMutation.isPending}
          onSubmit={handleCreate}
        />
      </article>

      <LinksSearchControls
        search={filters.search ?? ""}
        sort={filters.sort}
        order={filters.order}
        dateFrom={filters.dateFrom}
        dateTo={filters.dateTo}
        isFetching={linksQuery.isFetching}
        onSearchChange={handleSearchChange}
        onClearSearch={handleClearSearch}
        onSortChange={handleSortChange}
        onOrderChange={handleOrderChange}
        onDateFromChange={handleDateFromChange}
        onDateToChange={handleDateToChange}
        onResetDates={handleResetDates}
      />

      <TagBar
        tags={tagsData}
        selectedTagIds={filters.tagIds ?? []}
        onToggleTag={handleToggleTag}
        onReset={handleResetTags}
        onTagDeleted={handleTagDeleted}
        isLoading={tagsQuery.isLoading && tagsData.length === 0}
        isRefreshing={tagsQuery.isFetching}
        error={tagsQuery.error?.message}
        onRetry={tagsQuery.error ? () => tagsQuery.refetch() : undefined}
      />

      <LinksTable
        data={linksData}
        filters={filters}
        availableTags={tagsData}
        formatDate={formatDateValue}
        isLoading={linksQuery.isLoading && linksData.items.length === 0}
        isFetching={linksQuery.isFetching}
        editingLinkId={editingLinkId}
        onEditLink={handleStartEdit}
        onCancelEdit={handleCancelEdit}
        onSubmitEdit={handleUpdate}
        isEditPending={updateMutation.isPending}
        onDeleteLink={handleDelete}
        pendingDeleteId={pendingDeleteId}
        isDeletePending={deleteMutation.isPending}
        deleteError={deleteError}
        errorMessage={linksQuery.error?.message}
        onRetry={linksQuery.error ? () => linksQuery.refetch() : undefined}
        onChangePage={handleChangePage}
        onChangePerPage={handleChangePerPage}
        searchTokens={searchTokens}
      />
    </section>
  );
}
