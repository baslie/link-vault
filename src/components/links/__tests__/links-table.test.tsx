import { useState } from "react";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";

import { LinksTable } from "@/components/links/links-table";
import type { LinksTableProps } from "@/components/links/links-table";
import type { LinkListItem, LinkListResult } from "@/lib/links/query";
import type { TagSummary } from "@/lib/tags/types";

const baseLink: LinkListItem = {
  id: "11111111-1111-4111-8111-111111111111",
  userId: "22222222-2222-4222-8222-222222222222",
  url: "https://example.com",
  title: "Example site",
  comment: "Полезная заметка",
  favIconPath: "https://example.com/favicon.ico",
  metadataSource: null,
  createdAt: new Date("2024-01-05T10:00:00Z").toISOString(),
  updatedAt: new Date("2024-01-05T10:00:00Z").toISOString(),
  tags: [
    { id: "aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa", name: "Design", color: "#ff6f61" },
    { id: "bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb", name: "UI", color: "#1d4ed8" },
  ],
};

const baseResult: LinkListResult = {
  items: [baseLink],
  pagination: {
    total: 1,
    page: 1,
    perPage: 20,
    pageCount: 1,
    hasNextPage: false,
    hasPreviousPage: false,
  },
};

const tags: TagSummary[] = baseLink.tags.map((tag) => ({
  id: tag.id,
  name: tag.name,
  color: tag.color,
}));

const dateFormatter = new Intl.DateTimeFormat("ru-RU", { dateStyle: "medium" });

const baseProps: Omit<LinksTableProps, "editingLinkId" | "onEditLink" | "onCancelEdit"> = {
  data: baseResult,
  filters: {
    search: undefined,
    tagIds: undefined,
    sort: "created_at",
    order: "desc",
    page: 1,
    perPage: 20,
    dateFrom: undefined,
    dateTo: undefined,
  },
  availableTags: tags,
  formatDate: (value) => dateFormatter.format(new Date(value)),
  isLoading: false,
  isFetching: false,
  onSubmitEdit: vi.fn(),
  isEditPending: false,
  onDeleteLink: vi.fn(),
  pendingDeleteId: null,
  isDeletePending: false,
  deleteError: null,
  errorMessage: undefined,
  onRetry: undefined,
  onChangePage: vi.fn(),
  onChangePerPage: vi.fn(),
};

type RenderOverrides = Partial<
  Omit<LinksTableProps, "editingLinkId" | "onEditLink" | "onCancelEdit">
>;

function renderLinksTable(overrides: RenderOverrides = {}) {
  const onSubmitEdit = overrides.onSubmitEdit ?? vi.fn().mockResolvedValue(undefined);
  const onDeleteLink = overrides.onDeleteLink ?? vi.fn();
  const onChangePage = overrides.onChangePage ?? vi.fn();
  const onChangePerPage = overrides.onChangePerPage ?? vi.fn();

  const mergedProps: Omit<LinksTableProps, "editingLinkId" | "onEditLink" | "onCancelEdit"> = {
    ...baseProps,
    ...overrides,
    onSubmitEdit,
    onDeleteLink,
    onChangePage,
    onChangePerPage,
  };

  const Wrapper = () => {
    const [editingId, setEditingId] = useState<string | null>(null);

    return (
      <LinksTable
        {...mergedProps}
        editingLinkId={editingId}
        onEditLink={setEditingId}
        onCancelEdit={() => setEditingId(null)}
      />
    );
  };

  const user = userEvent.setup();
  const result = render(<Wrapper />);

  return { user, onSubmitEdit, onDeleteLink, onChangePage, onChangePerPage, ...result };
}

describe("LinksTable", () => {
  it("renders link rows with details", () => {
    renderLinksTable();

    expect(screen.getByText("Example site")).toBeInTheDocument();
    expect(screen.getByRole("link", { name: baseLink.url })).toHaveAttribute("href", baseLink.url);
    expect(screen.getByText("Design")).toBeInTheDocument();
    expect(screen.getByText(/Показано 1–1 из 1 записей/)).toBeInTheDocument();
  });

  it("allows inline editing via the link form", async () => {
    const { user, onSubmitEdit } = renderLinksTable();

    await user.click(screen.getByRole("button", { name: "Редактировать" }));

    expect(screen.getByLabelText("Ссылка")).toHaveValue(baseLink.url);

    await user.click(screen.getByRole("button", { name: "Сохранить изменения" }));

    await waitFor(() => {
      expect(onSubmitEdit).toHaveBeenCalledTimes(1);
      expect(onSubmitEdit).toHaveBeenCalledWith(
        baseLink.id,
        expect.objectContaining({
          url: baseLink.url,
          title: baseLink.title,
        }),
      );
    });
  });

  it("forwards delete requests", async () => {
    const { user, onDeleteLink } = renderLinksTable();

    await user.click(screen.getByRole("button", { name: "Удалить" }));

    expect(onDeleteLink).toHaveBeenCalledWith(baseLink.id, baseLink.title);
  });

  it("invokes pagination callbacks", async () => {
    const paginationData: LinkListResult = {
      ...baseResult,
      pagination: {
        total: 60,
        page: 1,
        perPage: 20,
        pageCount: 3,
        hasNextPage: true,
        hasPreviousPage: false,
      },
    };

    const { user, onChangePage } = renderLinksTable({
      data: paginationData,
      filters: { ...baseProps.filters, page: 1, perPage: 20 },
    });

    await user.click(screen.getByRole("button", { name: "Вперёд" }));

    expect(onChangePage).toHaveBeenCalledWith(2);
  });
});
