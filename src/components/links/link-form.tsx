"use client";

import { useCallback, useEffect, useMemo, useState } from "react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  fetchLinkMetadata,
  getMetadataSourceLabel,
  resolveMetadataIcon,
  type LinkMetadata,
} from "@/lib/links/metadata";
import { linkFormSchema, type LinkFormValues } from "@/lib/links/schema";
import type { TagSummary } from "@/lib/tags/types";

interface LinkFormProps {
  mode: "create" | "edit";
  availableTags: TagSummary[];
  initialValues?: LinkFormValues;
  initialMetadata?: LinkMetadata | null;
  isSubmitting?: boolean;
  onSubmit: (input: LinkFormValues & { metadata?: LinkMetadata | null }) => Promise<void>;
  onCancel?: () => void;
  onSuccess?: () => void;
}

interface FormErrors {
  url?: string;
  title?: string;
  comment?: string;
  newTag?: string;
  form?: string;
}

const DEFAULT_VALUES: LinkFormValues = {
  url: "",
  title: "",
  comment: undefined,
  tagIds: [],
  newTags: [],
};

function normalizeInitialValues(values?: LinkFormValues) {
  const merged = values ?? DEFAULT_VALUES;
  return {
    url: merged.url ?? "",
    title: merged.title ?? "",
    comment: merged.comment ?? "",
    tagIds: merged.tagIds ?? [],
    newTags: merged.newTags ?? [],
  };
}

function extractErrors(error: unknown): FormErrors {
  if (!(error instanceof Error)) {
    return { form: "Произошла неизвестная ошибка" };
  }

  return { form: error.message };
}

function buildFieldErrors(result: ReturnType<typeof linkFormSchema.safeParse>): FormErrors {
  if (result.success) {
    return {};
  }

  const errors: FormErrors = {};

  result.error.issues.forEach((issue) => {
    const [field] = issue.path;

    if (field === "url" || field === "title" || field === "comment") {
      if (!errors[field]) {
        errors[field] = issue.message;
      }
      return;
    }

    if (field === "newTags") {
      errors.newTag = issue.message;
    }
  });

  return errors;
}

export function LinkForm({
  mode,
  availableTags,
  initialValues,
  initialMetadata,
  isSubmitting = false,
  onSubmit,
  onCancel,
  onSuccess,
}: LinkFormProps) {
  const normalized = useMemo(() => normalizeInitialValues(initialValues), [initialValues]);
  const initialValuesKey = useMemo(() => JSON.stringify(normalized), [normalized]);
  const initialMetadataKey = useMemo(
    () => (initialMetadata ? JSON.stringify(initialMetadata) : "null"),
    [initialMetadata],
  );

  const [url, setUrl] = useState(normalized.url);
  const [title, setTitle] = useState(normalized.title);
  const [comment, setComment] = useState(normalized.comment ?? "");
  const [selectedTagIds, setSelectedTagIds] = useState<Set<string>>(new Set(normalized.tagIds));
  const [newTags, setNewTags] = useState<string[]>(normalized.newTags);
  const [newTagInput, setNewTagInput] = useState("");
  const [errors, setErrors] = useState<FormErrors>({});
  const [metadata, setMetadata] = useState<LinkMetadata | null>(initialMetadata ?? null);
  const [metadataError, setMetadataError] = useState<string | null>(null);
  const [isMetadataLoading, setIsMetadataLoading] = useState(false);
  const [isTitleDirty, setIsTitleDirty] = useState(mode === "edit");

  const availableTagByName = useMemo(() => {
    const map = new Map<string, TagSummary>();
    availableTags.forEach((tag) => {
      map.set(tag.name.toLowerCase(), tag);
    });
    return map;
  }, [availableTags]);

  useEffect(() => {
    const nextValues = JSON.parse(initialValuesKey) as ReturnType<typeof normalizeInitialValues>;
    setUrl(nextValues.url);
    setTitle(nextValues.title);
    setComment(nextValues.comment ?? "");
    setSelectedTagIds(new Set(nextValues.tagIds));
    setNewTags(nextValues.newTags);
    setNewTagInput("");
    setErrors({});
    setMetadataError(null);
    setMetadata(initialMetadata ?? null);
    setIsMetadataLoading(false);
    setIsTitleDirty(mode === "edit");
  }, [initialValuesKey, initialMetadataKey, mode, initialMetadata]);

  const metadataIcon = resolveMetadataIcon(metadata, url);

  const toggleTag = useCallback((tagId: string) => {
    setSelectedTagIds((previous) => {
      const next = new Set(previous);
      if (next.has(tagId)) {
        next.delete(tagId);
      } else {
        next.add(tagId);
      }
      return next;
    });
  }, []);

  const handleAddNewTag = useCallback(() => {
    const trimmed = newTagInput.trim();
    if (!trimmed) {
      setErrors((prev) => ({ ...prev, newTag: "Введите название тега" }));
      return;
    }

    const normalizedName = trimmed.toLowerCase();

    if (newTags.some((tag) => tag.toLowerCase() === normalizedName)) {
      setErrors((prev) => ({ ...prev, newTag: "Такой тег уже добавлен" }));
      return;
    }

    const existing = availableTagByName.get(normalizedName);
    if (existing) {
      toggleTag(existing.id);
      setNewTagInput("");
      setErrors((prev) => ({ ...prev, newTag: undefined }));
      return;
    }

    setNewTags((prev) => [...prev, trimmed]);
    setNewTagInput("");
    setErrors((prev) => ({ ...prev, newTag: undefined }));
  }, [availableTagByName, newTagInput, newTags, toggleTag]);

  const handleRemoveNewTag = useCallback((tagName: string) => {
    setNewTags((prev) => prev.filter((tag) => tag !== tagName));
  }, []);

  const handleFetchMetadata = useCallback(async () => {
    const trimmedUrl = url.trim();
    if (!trimmedUrl) {
      setErrors((prev) => ({ ...prev, url: "Укажите ссылку" }));
      return;
    }

    setIsMetadataLoading(true);
    setMetadataError(null);

    try {
      const result = await fetchLinkMetadata(trimmedUrl);
      setMetadata(result);
      if (!isTitleDirty || title.trim().length === 0) {
        setTitle(result.title ?? title);
        setIsTitleDirty(false);
      }
    } catch (error) {
      setMetadataError(error instanceof Error ? error.message : "Не удалось получить метаданные");
    } finally {
      setIsMetadataLoading(false);
    }
  }, [isTitleDirty, title, url]);

  const resetForm = useCallback(() => {
    setUrl("");
    setTitle("");
    setComment("");
    setSelectedTagIds(new Set());
    setNewTags([]);
    setNewTagInput("");
    setMetadata(null);
    setMetadataError(null);
    setErrors({});
    setIsTitleDirty(false);
  }, []);

  const handleSubmit = useCallback(
    async (event: React.FormEvent<HTMLFormElement>) => {
      event.preventDefault();
      setErrors({});

      const parsed = linkFormSchema.safeParse({
        url,
        title,
        comment,
        tagIds: Array.from(selectedTagIds),
        newTags,
      });

      if (!parsed.success) {
        setErrors(buildFieldErrors(parsed));
        return;
      }

      try {
        await onSubmit({ ...parsed.data, metadata });
        if (mode === "create") {
          resetForm();
        }
        if (onSuccess) {
          onSuccess();
        }
      } catch (error) {
        setErrors(extractErrors(error));
      }
    },
    [comment, metadata, mode, newTags, onSubmit, onSuccess, resetForm, selectedTagIds, title, url],
  );

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div className="space-y-2">
        <Label htmlFor="link-url">Ссылка</Label>
        <div className="flex flex-col gap-2 sm:flex-row">
          <Input
            id="link-url"
            value={url}
            onChange={(event) => {
              setUrl(event.target.value);
              setErrors((prev) => ({ ...prev, url: undefined }));
            }}
            placeholder="https://example.com"
            autoComplete="url"
            disabled={isSubmitting}
          />
          <Button
            type="button"
            variant="secondary"
            onClick={handleFetchMetadata}
            disabled={isSubmitting || isMetadataLoading}
          >
            {isMetadataLoading ? "Загрузка..." : "Автозаполнение"}
          </Button>
        </div>
        {errors.url ? <p className="text-xs text-destructive">{errors.url}</p> : null}
        {metadataError ? <p className="text-xs text-destructive">{metadataError}</p> : null}
        {metadata || metadataIcon ? (
          <div className="flex items-center gap-3 rounded-md border border-dashed border-border bg-muted/40 p-3">
            {metadataIcon ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={metadataIcon}
                alt="Иконка сайта"
                className="h-8 w-8 rounded"
                loading="lazy"
              />
            ) : null}
            <div className="min-w-0">
              <p className="truncate text-sm font-medium text-foreground">
                {metadata?.title || title || url || "Без названия"}
              </p>
              <p className="text-xs text-muted-foreground">
                Источник: {getMetadataSourceLabel(metadata?.source)}
              </p>
            </div>
          </div>
        ) : null}
      </div>

      <div className="space-y-2">
        <Label htmlFor="link-title">Заголовок</Label>
        <Input
          id="link-title"
          value={title}
          onChange={(event) => {
            setTitle(event.target.value);
            setIsTitleDirty(true);
            setErrors((prev) => ({ ...prev, title: undefined }));
          }}
          placeholder="Краткое описание"
          autoComplete="off"
          disabled={isSubmitting}
        />
        {errors.title ? <p className="text-xs text-destructive">{errors.title}</p> : null}
      </div>

      <div className="space-y-2">
        <Label htmlFor="link-comment">Комментарий</Label>
        <Textarea
          id="link-comment"
          value={comment}
          onChange={(event) => {
            setComment(event.target.value);
            setErrors((prev) => ({ ...prev, comment: undefined }));
          }}
          placeholder="Заметка к ссылке"
          disabled={isSubmitting}
        />
        {errors.comment ? <p className="text-xs text-destructive">{errors.comment}</p> : null}
      </div>

      <div className="space-y-3">
        <div className="space-y-1">
          <Label>Теги</Label>
          <p className="text-xs text-muted-foreground">
            Выберите существующие теги или добавьте новый.
          </p>
        </div>
        {availableTags.length === 0 ? (
          <p className="text-sm text-muted-foreground">У вас пока нет сохранённых тегов.</p>
        ) : (
          <div className="grid gap-2 sm:grid-cols-2">
            {availableTags.map((tag) => {
              const checked = selectedTagIds.has(tag.id);
              return (
                <label
                  key={tag.id}
                  className="flex cursor-pointer items-center gap-2 rounded-md border border-border bg-card/60 px-3 py-2 text-sm text-foreground"
                >
                  <input
                    type="checkbox"
                    className="h-4 w-4"
                    checked={checked}
                    onChange={() => toggleTag(tag.id)}
                    disabled={isSubmitting}
                  />
                  <span className="truncate">{tag.name}</span>
                </label>
              );
            })}
          </div>
        )}
        <div className="flex flex-col gap-2 sm:flex-row">
          <Input
            value={newTagInput}
            onChange={(event) => {
              setNewTagInput(event.target.value);
              setErrors((prev) => ({ ...prev, newTag: undefined }));
            }}
            onKeyDown={(event) => {
              if (event.key === "Enter") {
                event.preventDefault();
                handleAddNewTag();
              }
            }}
            placeholder="Новый тег"
            disabled={isSubmitting}
          />
          <Button type="button" variant="outline" onClick={handleAddNewTag} disabled={isSubmitting}>
            Добавить тег
          </Button>
        </div>
        {errors.newTag ? <p className="text-xs text-destructive">{errors.newTag}</p> : null}
        {newTags.length > 0 ? (
          <ul className="flex flex-wrap gap-2">
            {newTags.map((tag) => (
              <li
                key={tag}
                className="flex items-center gap-1 rounded-full border border-border bg-secondary/60 px-3 py-1 text-xs text-foreground"
              >
                <span>{tag}</span>
                <button
                  type="button"
                  onClick={() => handleRemoveNewTag(tag)}
                  className="rounded-full p-1 text-muted-foreground transition hover:text-destructive"
                  aria-label={`Удалить тег ${tag}`}
                  disabled={isSubmitting}
                >
                  ×
                </button>
              </li>
            ))}
          </ul>
        ) : null}
      </div>

      {errors.form ? <p className="text-sm text-destructive">{errors.form}</p> : null}

      <div className="flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
        {onCancel ? (
          <Button type="button" variant="ghost" onClick={onCancel} disabled={isSubmitting}>
            Отмена
          </Button>
        ) : null}
        <Button type="submit" disabled={isSubmitting}>
          {mode === "create" ? "Добавить ссылку" : "Сохранить изменения"}
        </Button>
      </div>
    </form>
  );
}
