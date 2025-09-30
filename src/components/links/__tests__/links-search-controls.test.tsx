import { fireEvent, render, screen } from "@testing-library/react";
import { useState } from "react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";

import { LinksSearchControls } from "@/components/links/links-search-controls";
import type { LinkSortField, LinkSortOrder } from "@/lib/links/query";

const baseProps = {
  search: "",
  sort: "created_at" as LinkSortField,
  order: "desc" as LinkSortOrder,
  dateFrom: undefined as string | undefined,
  dateTo: undefined as string | undefined,
  isFetching: false,
  onSearchChange: vi.fn(),
  onClearSearch: vi.fn(),
  onSortChange: vi.fn(),
  onOrderChange: vi.fn(),
  onDateFromChange: vi.fn(),
  onDateToChange: vi.fn(),
  onResetDates: vi.fn(),
};

describe("LinksSearchControls", () => {
  it("calls onSearchChange when the query changes", async () => {
    const onSearchChange = vi.fn();
    const user = userEvent.setup();

    function Wrapper() {
      const [value, setValue] = useState("");

      return (
        <LinksSearchControls
          {...baseProps}
          search={value}
          onSearchChange={(next) => {
            setValue(next);
            onSearchChange(next);
          }}
        />
      );
    }

    render(<Wrapper />);

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

  it("renders date filters, propagates changes and resets", async () => {
    const onDateFromChange = vi.fn();
    const onDateToChange = vi.fn();
    const onResetDates = vi.fn();
    const user = userEvent.setup();

    render(
      <LinksSearchControls
        {...baseProps}
        dateFrom="2024-05-01T00:00:00.000Z"
        dateTo="2024-05-10T00:00:00.000Z"
        onDateFromChange={onDateFromChange}
        onDateToChange={onDateToChange}
        onResetDates={onResetDates}
      />,
    );

    const fromInput = screen.getByLabelText("Дата добавления с") as HTMLInputElement;
    const toInput = screen.getByLabelText("Дата добавления по") as HTMLInputElement;

    expect(fromInput.value).toBe("2024-05-01");
    expect(toInput.value).toBe("2024-05-10");

    await user.clear(fromInput);
    onDateFromChange.mockClear();
    fireEvent.input(fromInput, { target: { value: "2024-05-03" } });
    expect(onDateFromChange).toHaveBeenCalledWith("2024-05-03T00:00:00.000Z");

    await user.clear(toInput);
    onDateToChange.mockClear();
    fireEvent.input(toInput, { target: { value: "2024-05-12" } });
    expect(onDateToChange).toHaveBeenCalledWith("2024-05-12T00:00:00.000Z");

    const resetButton = screen.getByRole("button", { name: "Сбросить даты" });
    expect(resetButton).toBeEnabled();
    await user.click(resetButton);
    expect(onResetDates).toHaveBeenCalledTimes(1);
  });
});
