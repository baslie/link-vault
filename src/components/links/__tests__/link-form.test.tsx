import { afterEach, describe, expect, it, vi, type Mock } from "vitest";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";

import { LinkForm } from "@/components/links/link-form";
import type { TagSummary } from "@/lib/tags/types";
import { fetchLinkMetadata } from "@/lib/links/metadata";

vi.mock("@/lib/links/metadata", async () => {
  const actual =
    await vi.importActual<typeof import("@/lib/links/metadata")>("@/lib/links/metadata");
  return {
    ...actual,
    fetchLinkMetadata: vi.fn(),
  };
});

afterEach(() => {
  vi.clearAllMocks();
});

const sampleTags: TagSummary[] = [
  { id: "11111111-1111-4111-8111-111111111111", name: "Design", color: "#6366f1" },
  { id: "22222222-2222-4222-8222-222222222222", name: "Frontend", color: "#ec4899" },
];

describe("[links] LinkForm", () => {
  it("shows validation errors for empty fields", async () => {
    const user = userEvent.setup();
    const onSubmit = vi.fn().mockResolvedValue(undefined);

    render(
      <LinkForm
        mode="create"
        availableTags={sampleTags}
        onSubmit={onSubmit}
        isSubmitting={false}
      />,
    );

    await user.click(screen.getByRole("button", { name: /добавить ссылку/i }));

    expect(await screen.findByText("Укажите ссылку")).toBeInTheDocument();
    expect(onSubmit).not.toHaveBeenCalled();
  });

  it("submits normalized values", async () => {
    const user = userEvent.setup();
    const onSubmit = vi.fn().mockResolvedValue(undefined);

    render(
      <LinkForm
        mode="create"
        availableTags={sampleTags}
        onSubmit={onSubmit}
        isSubmitting={false}
      />,
    );

    await user.type(screen.getByLabelText("Ссылка"), " https://example.com ");
    await user.type(screen.getByLabelText("Заголовок"), " Example Title ");
    await user.type(screen.getByLabelText("Комментарий"), " Some note ");

    await user.click(screen.getByLabelText("Design"));

    const newTagInput = screen.getByPlaceholderText("Новый тег");
    await user.type(newTagInput, "Docs");
    await user.click(screen.getByRole("button", { name: "Добавить тег" }));

    await user.click(screen.getByRole("button", { name: "Добавить ссылку" }));

    await waitFor(() => expect(onSubmit).toHaveBeenCalledTimes(1));

    expect(onSubmit).toHaveBeenCalledWith({
      url: "https://example.com",
      title: "Example Title",
      comment: "Some note",
      tagIds: ["11111111-1111-4111-8111-111111111111"],
      newTags: ["Docs"],
      metadata: null,
    });

    expect(screen.getByLabelText("Ссылка")).toHaveValue("");
    expect(screen.getByLabelText("Заголовок")).toHaveValue("");
  });

  it("auto fills metadata", async () => {
    const user = userEvent.setup();
    const onSubmit = vi.fn().mockResolvedValue(undefined);
    const metadataMock = fetchLinkMetadata as unknown as Mock;
    metadataMock.mockResolvedValue({
      title: "Docs Guide",
      favIconUrl: "https://example.com/favicon.ico",
      source: "stub",
      fetchedAt: new Date().toISOString(),
    });

    render(
      <LinkForm
        mode="create"
        availableTags={sampleTags}
        onSubmit={onSubmit}
        isSubmitting={false}
      />,
    );

    await user.type(screen.getByLabelText("Ссылка"), "https://example.com/docs");
    await user.click(screen.getByRole("button", { name: "Автозаполнение" }));

    await waitFor(() => expect(metadataMock).toHaveBeenCalled());
    expect(screen.getByLabelText("Заголовок")).toHaveValue("Docs Guide");
  });
});
