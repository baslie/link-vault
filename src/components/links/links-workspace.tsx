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
import { LinksTable } from "@/components/links/links-table";
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
      />
    </section>
  );
}
