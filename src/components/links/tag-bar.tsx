"use client";

import { useMemo, useState } from "react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useDeleteTagMutation, useUpdateTagMutation } from "@/hooks/use-tag-mutations";
import { tagNameSchema } from "@/lib/tags/schema";
import type { TagSummary } from "@/lib/tags/types";
import { cn } from "@/lib/utils";

const DEFAULT_TAG_COLOR = "#6366f1";

const BASE_COLOR_OPTIONS = [
  { value: "#6366f1", label: "Индиго" },
  { value: "#0ea5e9", label: "Голубой" },
  { value: "#22c55e", label: "Зелёный" },
  { value: "#f97316", label: "Оранжевый" },
  { value: "#ef4444", label: "Красный" },
  { value: "#eab308", label: "Жёлтый" },
  { value: "#a855f7", label: "Фиолетовый" },
  { value: "#14b8a6", label: "Бирюзовый" },
  { value: "#64748b", label: "Серый" },
] as const;

interface TagBarProps {
  tags: TagSummary[];
  selectedTagIds: string[];
  onToggleTag: (tagId: string) => void;
  onReset: () => void;
  onTagDeleted?: (tagId: string) => void;
  isLoading?: boolean;
  isRefreshing?: boolean;
  error?: string | null;
  onRetry?: () => void;
}

function resolveTagColor(color?: string | null): string {
  const trimmed = (color ?? "").trim();
  if (/^#[0-9a-f]{6}$/i.test(trimmed)) {
    return trimmed;
  }
  return DEFAULT_TAG_COLOR;
}

function resolveColorOptions(currentColor: string | null): Array<{ value: string; label: string }> {
  const normalized = (currentColor ?? "").toLowerCase();
  const hasCurrent = BASE_COLOR_OPTIONS.some((option) => option.value.toLowerCase() === normalized);

  if (!currentColor || hasCurrent) {
    return [...BASE_COLOR_OPTIONS];
  }

  return [{ value: currentColor, label: "Текущий цвет" }, ...BASE_COLOR_OPTIONS];
}

export function TagBar({
  tags,
  selectedTagIds,
  onToggleTag,
  onReset,
  onTagDeleted,
  isLoading = false,
  isRefreshing = false,
  error,
  onRetry,
}: TagBarProps) {
  const selectedSet = useMemo(() => new Set(selectedTagIds), [selectedTagIds]);
  const selectedCount = selectedSet.size;

  const updateMutation = useUpdateTagMutation();
  const deleteMutation = useDeleteTagMutation();

  const [editingTagId, setEditingTagId] = useState<string | null>(null);
  const [formName, setFormName] = useState("");
  const [formColor, setFormColor] = useState(DEFAULT_TAG_COLOR);
  const [formError, setFormError] = useState<string | null>(null);
  const [actionError, setActionError] = useState<string | null>(null);

  const currentColorOptions = useMemo(() => resolveColorOptions(formColor || null), [formColor]);

  const isUpdatePending = updateMutation.isPending;
  const isDeletePending = deleteMutation.isPending;

  const handleStartEdit = (tag: TagSummary) => {
    setEditingTagId(tag.id);
    setFormName(tag.name);
    setFormColor(resolveTagColor(tag.color));
    setFormError(null);
    setActionError(null);
  };

  const handleCancelEdit = () => {
    setEditingTagId(null);
    setFormName("");
    setFormColor(DEFAULT_TAG_COLOR);
    setFormError(null);
  };

  const handleSubmitEdit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setFormError(null);
    setActionError(null);

    if (!editingTagId) {
      return;
    }

    const parsed = tagNameSchema.safeParse(formName);
    if (!parsed.success) {
      const [issue] = parsed.error.issues;
      setFormError(issue?.message ?? "Введите название тега");
      return;
    }

    const normalizedColor = resolveTagColor(formColor);

    try {
      await updateMutation.mutateAsync({
        id: editingTagId,
        name: parsed.data,
        color: normalizedColor,
      });
      handleCancelEdit();
    } catch (mutationError) {
      setActionError(
        mutationError instanceof Error
          ? mutationError.message
          : "Не удалось обновить тег. Попробуйте позже.",
      );
    }
  };

  const handleDelete = async (tag: TagSummary) => {
    if (typeof window !== "undefined") {
      const confirmed = window.confirm(`Удалить тег «${tag.name}»?`);
      if (!confirmed) {
        return;
      }
    }

    setActionError(null);

    try {
      await deleteMutation.mutateAsync({ id: tag.id });
      if (editingTagId === tag.id) {
        handleCancelEdit();
      }
      if (onTagDeleted) {
        onTagDeleted(tag.id);
      }
    } catch (mutationError) {
      setActionError(
        mutationError instanceof Error
          ? mutationError.message
          : "Не удалось удалить тег. Попробуйте позже.",
      );
    }
  };

  return (
    <section className="space-y-4 rounded-xl border border-border bg-card/60 p-5 shadow-sm">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 className="text-lg font-semibold tracking-tight text-foreground">
            Фильтрация по тегам
          </h2>
          <p className="text-sm text-muted-foreground">
            Выберите несколько тегов, чтобы показать ссылки с пересечением тегов.
          </p>
        </div>
        <div className="flex items-center gap-3">
          {isRefreshing ? (
            <span className="text-xs text-muted-foreground">Обновление тегов...</span>
          ) : null}
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={onReset}
            disabled={selectedCount === 0}
          >
            Сбросить все{selectedCount > 0 ? ` (${selectedCount})` : ""}
          </Button>
        </div>
      </div>

      {actionError ? (
        <div
          className="rounded-lg border border-destructive/40 bg-destructive/10 p-3 text-sm text-destructive"
          role="alert"
        >
          {actionError}
        </div>
      ) : null}

      {error ? (
        <div
          className="flex flex-col gap-3 rounded-lg border border-destructive/40 bg-destructive/10 p-4 text-sm text-destructive"
          role="alert"
        >
          <p>Не удалось загрузить теги: {error}</p>
          {onRetry ? (
            <div>
              <Button type="button" variant="outline" size="sm" onClick={onRetry}>
                Повторить попытку
              </Button>
            </div>
          ) : null}
        </div>
      ) : isLoading ? (
        <p className="text-sm text-muted-foreground">Загрузка тегов...</p>
      ) : tags.length === 0 ? (
        <p className="text-sm text-muted-foreground">
          У вас пока нет тегов. Добавьте теги при создании ссылок.
        </p>
      ) : (
        <div className="flex flex-wrap gap-2">
          {tags.map((tag) => {
            const isSelected = selectedSet.has(tag.id);
            const isDisabled = isUpdatePending || isDeletePending;

            return (
              <div
                key={tag.id}
                className={cn(
                  "flex items-center gap-1 rounded-full border border-border bg-background/80 pr-1",
                  isSelected ? "border-primary bg-primary/10" : "hover:border-primary/40",
                )}
              >
                <button
                  type="button"
                  className={cn(
                    "flex items-center gap-2 rounded-full px-3 py-1 text-sm text-foreground transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary",
                    isSelected ? "font-semibold" : undefined,
                  )}
                  onClick={() => onToggleTag(tag.id)}
                  disabled={isDisabled}
                  aria-pressed={isSelected}
                >
                  <span
                    className="h-2.5 w-2.5 rounded-full border border-border/60"
                    style={{ backgroundColor: resolveTagColor(tag.color) }}
                    aria-hidden
                  />
                  <span className="truncate">{tag.name}</span>
                </button>
                <Button
                  type="button"
                  size="sm"
                  variant="ghost"
                  className="h-8 px-2 text-xs"
                  onClick={() => handleStartEdit(tag)}
                  disabled={isDisabled}
                  aria-label={`Изменить тег «${tag.name}»`}
                >
                  Изм.
                </Button>
                <Button
                  type="button"
                  size="sm"
                  variant="ghost"
                  className="h-8 px-2 text-xs text-destructive hover:text-destructive"
                  onClick={() => handleDelete(tag)}
                  disabled={isDisabled}
                  aria-label={`Удалить тег «${tag.name}»`}
                >
                  ×
                </Button>
              </div>
            );
          })}
        </div>
      )}

      {editingTagId ? (
        <form
          onSubmit={handleSubmitEdit}
          className="space-y-4 rounded-lg border border-border bg-background/80 p-4"
        >
          <div className="space-y-2">
            <Label htmlFor="tag-name-input">Название тега</Label>
            <Input
              id="tag-name-input"
              value={formName}
              onChange={(event) => {
                setFormName(event.target.value);
                setFormError(null);
              }}
              disabled={isUpdatePending}
              placeholder="Название"
            />
            {formError ? <p className="text-xs text-destructive">{formError}</p> : null}
          </div>

          <div className="space-y-2">
            <Label>Цвет</Label>
            <div className="flex flex-wrap gap-2">
              {currentColorOptions.map((option) => {
                const isActive = option.value.toLowerCase() === formColor.toLowerCase();
                return (
                  <button
                    key={option.value}
                    type="button"
                    className={cn(
                      "h-8 w-8 rounded-full border border-border transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary",
                      isActive ? "ring-2 ring-primary" : "hover:border-primary/60",
                    )}
                    style={{ backgroundColor: option.value }}
                    onClick={() => setFormColor(option.value)}
                    disabled={isUpdatePending}
                  >
                    <span className="sr-only">Выбрать цвет «{option.label}»</span>
                  </button>
                );
              })}
            </div>
          </div>

          <div className="flex justify-end gap-2">
            <Button
              type="button"
              variant="ghost"
              onClick={handleCancelEdit}
              disabled={isUpdatePending}
            >
              Отмена
            </Button>
            <Button type="submit" disabled={isUpdatePending}>
              {isUpdatePending ? "Сохранение..." : "Сохранить тег"}
            </Button>
          </div>
        </form>
      ) : null}
    </section>
  );
}
