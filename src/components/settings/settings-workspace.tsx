"use client";

import { useEffect, useMemo, useState } from "react";
import { useTheme } from "next-themes";
import { Palette, Save, Trash2, UserCog } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useProfileSettingsMutation } from "@/hooks/use-profile-settings-mutation";
import { useDeleteTagMutation, useUpdateTagMutation } from "@/hooks/use-tag-mutations";
import { useTagsQuery } from "@/hooks/use-tags-query";
import type { ProfileRecord } from "@/lib/profile/schema";
import type { TagSummary } from "@/lib/tags/types";

interface SettingsWorkspaceProps {
  profile: ProfileRecord;
  tags: TagSummary[];
}

type ThemeOption = ProfileRecord["theme"];

type TagDraft = Record<string, { name: string; color: string }>;

function buildDrafts(tags: TagSummary[]): TagDraft {
  return tags.reduce<TagDraft>((acc, tag) => {
    acc[tag.id] = { name: tag.name, color: tag.color };
    return acc;
  }, {});
}

export function SettingsWorkspace({ profile, tags }: SettingsWorkspaceProps) {
  const [displayName, setDisplayName] = useState(profile.display_name ?? "");
  const [theme, setThemePreference] = useState<ThemeOption>(profile.theme);
  const [profileMessage, setProfileMessage] = useState<string | null>(null);
  const [tagMessage, setTagMessage] = useState<string | null>(null);
  const [tagDrafts, setTagDrafts] = useState<TagDraft>(() => buildDrafts(tags));
  const { setTheme } = useTheme();

  const updateProfile = useProfileSettingsMutation();
  const updateTagMutation = useUpdateTagMutation();
  const deleteTagMutation = useDeleteTagMutation();
  const tagsQuery = useTagsQuery({ initialData: tags });

  useEffect(() => {
    if (tagsQuery.data) {
      setTagDrafts(buildDrafts(tagsQuery.data));
    }
  }, [tagsQuery.data]);

  const themeOptions: Array<{ value: ThemeOption; label: string }> = useMemo(
    () => [
      { value: "light", label: "Светлая" },
      { value: "dark", label: "Тёмная" },
      { value: "system", label: "Системная" },
    ],
    [],
  );

  async function handleProfileSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setProfileMessage(null);

    try {
      const result = await updateProfile.mutateAsync({
        displayName,
        theme,
      });
      setProfileMessage("Настройки профиля обновлены");
      setTheme(result.theme);
    } catch (error) {
      setProfileMessage(error instanceof Error ? error.message : "Не удалось сохранить профиль");
    }
  }

  function handleDraftChange(id: string, updates: Partial<{ name: string; color: string }>) {
    setTagDrafts((prev) => ({
      ...prev,
      [id]: {
        name: updates.name ?? prev[id]?.name ?? "",
        color: updates.color ?? prev[id]?.color ?? "#6366f1",
      },
    }));
  }

  async function handleTagSave(id: string) {
    const draft = tagDrafts[id];
    if (!draft) {
      return;
    }

    setTagMessage(null);
    try {
      await updateTagMutation.mutateAsync({
        id,
        name: draft.name.trim(),
        color: draft.color,
      });
      setTagMessage("Теги обновлены");
    } catch (error) {
      setTagMessage(error instanceof Error ? error.message : "Не удалось обновить тег");
    }
  }

  async function handleTagDelete(id: string) {
    setTagMessage(null);
    try {
      await deleteTagMutation.mutateAsync({ id });
      setTagMessage("Тег удален");
    } catch (error) {
      setTagMessage(error instanceof Error ? error.message : "Не удалось удалить тег");
    }
  }

  return (
    <div className="flex w-full flex-col gap-8">
      <form
        onSubmit={handleProfileSubmit}
        className="rounded-lg border border-border bg-card p-6 shadow-sm"
      >
        <div className="flex flex-col gap-4">
          <div className="flex items-center gap-2 text-sm font-medium text-muted-foreground">
            <UserCog className="h-4 w-4" aria-hidden />
            <span>Профиль</span>
          </div>
          <div className="grid gap-4 md:grid-cols-2">
            <div className="flex flex-col gap-2">
              <Label htmlFor="display-name">Отображаемое имя</Label>
              <Input
                id="display-name"
                value={displayName}
                onChange={(event) => setDisplayName(event.target.value)}
                placeholder="Например, Анна"
              />
            </div>
            <div className="flex flex-col gap-2">
              <Label>Email</Label>
              <Input value={profile.email ?? "Не указан"} disabled />
            </div>
          </div>
          <div className="flex flex-col gap-2">
            <Label>Тема интерфейса</Label>
            <div className="flex flex-wrap gap-3">
              {themeOptions.map((option) => (
                <label
                  key={option.value}
                  className={`flex cursor-pointer items-center gap-2 rounded-full border px-4 py-2 text-sm transition ${
                    theme === option.value
                      ? "border-primary bg-primary/10 text-primary"
                      : "border-border text-muted-foreground"
                  }`}
                >
                  <input
                    type="radio"
                    className="h-3.5 w-3.5"
                    name="theme"
                    value={option.value}
                    checked={theme === option.value}
                    onChange={() => setThemePreference(option.value)}
                  />
                  <span>{option.label}</span>
                </label>
              ))}
            </div>
          </div>
          <div className="flex items-center gap-3">
            <Button type="submit" disabled={updateProfile.isPending}>
              <Save className="mr-2 h-4 w-4" aria-hidden />
              Сохранить профиль
            </Button>
            {profileMessage ? (
              <span className="text-sm text-muted-foreground">{profileMessage}</span>
            ) : null}
          </div>
        </div>
      </form>

      <section className="rounded-lg border border-border bg-card p-6 shadow-sm">
        <div className="flex flex-col gap-4">
          <div className="flex items-center gap-2 text-sm font-medium text-muted-foreground">
            <Palette className="h-4 w-4" aria-hidden />
            <span>Теги</span>
          </div>
          <p className="text-sm text-muted-foreground">
            Изменяйте названия и цвета тегов. Цвет используется в таблице и фильтрах.
          </p>
          <div className="overflow-hidden rounded-lg border border-border">
            <table className="min-w-full divide-y divide-border text-sm">
              <thead className="bg-muted/40">
                <tr>
                  <th className="px-4 py-2 text-left font-medium text-muted-foreground">Тег</th>
                  <th className="px-4 py-2 text-left font-medium text-muted-foreground">Цвет</th>
                  <th className="px-4 py-2 text-left font-medium text-muted-foreground">
                    Действия
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border bg-card">
                {tagsQuery.data?.map((tag) => {
                  const draft = tagDrafts[tag.id] ?? { name: tag.name, color: tag.color };
                  return (
                    <tr key={tag.id}>
                      <td className="px-4 py-3">
                        <Input
                          value={draft.name}
                          onChange={(event) =>
                            handleDraftChange(tag.id, { name: event.target.value })
                          }
                        />
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-2">
                          <input
                            type="color"
                            className="h-10 w-14 cursor-pointer rounded border border-border"
                            value={draft.color ?? "#6366f1"}
                            onChange={(event) =>
                              handleDraftChange(tag.id, { color: event.target.value })
                            }
                          />
                          <span className="text-xs text-muted-foreground">{draft.color}</span>
                        </div>
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex gap-2">
                          <Button
                            type="button"
                            size="sm"
                            variant="secondary"
                            onClick={() => handleTagSave(tag.id)}
                            disabled={updateTagMutation.isPending}
                          >
                            Сохранить
                          </Button>
                          <Button
                            type="button"
                            size="sm"
                            variant="ghost"
                            onClick={() => handleTagDelete(tag.id)}
                            disabled={deleteTagMutation.isPending}
                          >
                            <Trash2 className="mr-1 h-4 w-4" aria-hidden />
                            Удалить
                          </Button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
                {tagsQuery.data && tagsQuery.data.length === 0 ? (
                  <tr>
                    <td colSpan={3} className="px-4 py-6 text-center text-sm text-muted-foreground">
                      У вас пока нет тегов. Добавьте их при создании ссылок.
                    </td>
                  </tr>
                ) : null}
              </tbody>
            </table>
          </div>
          {tagMessage ? <span className="text-sm text-muted-foreground">{tagMessage}</span> : null}
        </div>
      </section>
    </div>
  );
}
