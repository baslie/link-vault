import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";

import { TagBar } from "@/components/links/tag-bar";
import type { TagSummary } from "@/lib/tags/types";

const updateMock = vi.fn();
const deleteMock = vi.fn();

vi.mock("@/hooks/use-tag-mutations", () => ({
  useUpdateTagMutation: () => ({
    mutateAsync: updateMock,
    isPending: false,
  }),
  useDeleteTagMutation: () => ({
    mutateAsync: deleteMock,
    isPending: false,
  }),
}));

const tags: TagSummary[] = [
  { id: "11111111-1111-4111-8111-111111111111", name: "Design", color: "#6366f1" },
  { id: "22222222-2222-4222-8222-222222222222", name: "Docs", color: "#14b8a6" },
];

describe("[links] TagBar", () => {
  beforeEach(() => {
    updateMock.mockReset();
    deleteMock.mockReset();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("toggles tags and allows reset", async () => {
    const user = userEvent.setup();
    const onToggleTag = vi.fn();
    const onReset = vi.fn();

    const { rerender } = render(
      <TagBar tags={tags} selectedTagIds={[]} onToggleTag={onToggleTag} onReset={onReset} />,
    );

    await user.click(screen.getByRole("button", { name: "Design" }));
    expect(onToggleTag).toHaveBeenCalledWith("11111111-1111-4111-8111-111111111111");

    rerender(
      <TagBar
        tags={tags}
        selectedTagIds={["11111111-1111-4111-8111-111111111111"]}
        onToggleTag={onToggleTag}
        onReset={onReset}
      />,
    );

    const resetButton = screen.getByRole("button", { name: /сбросить все/i });
    await user.click(resetButton);
    expect(onReset).toHaveBeenCalledTimes(1);
  });

  it("edits tag name and color", async () => {
    const user = userEvent.setup();
    updateMock.mockResolvedValue({
      id: "11111111-1111-4111-8111-111111111111",
      name: "Design Systems",
      color: "#ef4444",
    });

    render(<TagBar tags={tags} selectedTagIds={[]} onToggleTag={vi.fn()} onReset={vi.fn()} />);

    await user.click(screen.getByRole("button", { name: "Изменить тег «Design»" }));

    const nameInput = await screen.findByLabelText("Название тега");
    await user.clear(nameInput);
    await user.type(nameInput, "Design Systems");

    await user.click(screen.getByRole("button", { name: "Выбрать цвет «Красный»" }));
    await user.click(screen.getByRole("button", { name: "Сохранить тег" }));

    await waitFor(() =>
      expect(updateMock).toHaveBeenCalledWith({
        id: "11111111-1111-4111-8111-111111111111",
        name: "Design Systems",
        color: "#ef4444",
      }),
    );
  });

  it("deletes a tag and notifies parent", async () => {
    const user = userEvent.setup();
    deleteMock.mockResolvedValue(undefined);
    const confirmSpy = vi.spyOn(window, "confirm").mockReturnValue(true);
    const onTagDeleted = vi.fn();

    render(
      <TagBar
        tags={tags}
        selectedTagIds={["11111111-1111-4111-8111-111111111111"]}
        onToggleTag={vi.fn()}
        onReset={vi.fn()}
        onTagDeleted={onTagDeleted}
      />,
    );

    await user.click(screen.getByRole("button", { name: "Удалить тег «Design»" }));

    expect(confirmSpy).toHaveBeenCalled();
    await waitFor(() =>
      expect(deleteMock).toHaveBeenCalledWith({ id: "11111111-1111-4111-8111-111111111111" }),
    );
    expect(onTagDeleted).toHaveBeenCalledWith("11111111-1111-4111-8111-111111111111");

    confirmSpy.mockRestore();
  });
});
