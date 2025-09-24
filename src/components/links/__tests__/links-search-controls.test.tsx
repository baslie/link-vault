import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";

import { LinksSearchControls } from "@/components/links/links-search-controls";
import type { LinkSortField, LinkSortOrder } from "@/lib/links/query";

const baseProps = {
  search: "",
  sort: "created_at" as LinkSortField,
  order: "desc" as LinkSortOrder,
  isFetching: false,
  onSearchChange: vi.fn(),
  onClearSearch: vi.fn(),
  onSortChange: vi.fn(),
  onOrderChange: vi.fn(),
};

describe("LinksSearchControls", () => {
  it("calls onSearchChange when the query changes", async () => {
    const onSearchChange = vi.fn();
    const user = userEvent.setup();

    render(<LinksSearchControls {...baseProps} onSearchChange={onSearchChange} />);

    const input = screen.getByLabelText("Поиск по ссылкам");
    await user.type(input, "design");

    expect(onSearchChange).toHaveBeenCalled();
    expect(onSearchChange).toHaveBeenLastCalledWith("design");
  });

  it("disables the clear button when the search is empty and triggers onClearSearch otherwise", async () => {
    const onClearSearch = vi.fn();
    const user = userEvent.setup();

    const { rerender } = render(
      <LinksSearchControls {...baseProps} onClearSearch={onClearSearch} />,
    );

    const clearButton = screen.getByRole("button", { name: "Очистить" });
    expect(clearButton).toBeDisabled();

    rerender(<LinksSearchControls {...baseProps} search="ui" onClearSearch={onClearSearch} />);

    expect(screen.getByRole("button", { name: "Очистить" })).toBeEnabled();
    await user.click(screen.getByRole("button", { name: "Очистить" }));

    expect(onClearSearch).toHaveBeenCalledTimes(1);
  });

  it("changes search sort field and toggles order", async () => {
    const onSortChange = vi.fn();
    const onOrderChange = vi.fn();
    const user = userEvent.setup();

    render(
      <LinksSearchControls
        {...baseProps}
        onSortChange={onSortChange}
        onOrderChange={onOrderChange}
      />,
    );

    await user.selectOptions(screen.getByLabelText("Поле сортировки"), "title");
    expect(onSortChange).toHaveBeenCalledWith("title");

    await user.click(screen.getByRole("button", { name: "Переключить порядок сортировки" }));
    expect(onOrderChange).toHaveBeenCalledWith("asc");
  });

  it("shows search fetching status when data is being updated", () => {
    render(<LinksSearchControls {...baseProps} isFetching />);

    expect(screen.getByText("Обновление результатов...")).toBeInTheDocument();
  });
});
