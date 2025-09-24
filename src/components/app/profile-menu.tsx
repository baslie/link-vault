"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { LogOut, Settings, ShieldCheck, Upload } from "lucide-react";

import { ThemeToggle } from "@/components/app/theme-toggle";
import { SignOutButton } from "@/components/app/sign-out-button";
import type { ProfileRecord } from "@/lib/profile/schema";

interface ProfileMenuProps {
  profile: ProfileRecord | null;
  isAdmin?: boolean;
}

function buildInitials(name?: string | null, email?: string | null) {
  const source = name?.trim() || email?.trim() || "";
  if (!source) {
    return "?";
  }

  const [first] = source.split(" ");
  return first.slice(0, 2).toUpperCase();
}

export function ProfileMenu({ profile, isAdmin = false }: ProfileMenuProps) {
  const [isOpen, setIsOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    function handleClick(event: MouseEvent) {
      if (!containerRef.current?.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }

    function handleKey(event: KeyboardEvent) {
      if (event.key === "Escape") {
        setIsOpen(false);
      }
    }

    document.addEventListener("click", handleClick);
    document.addEventListener("keydown", handleKey);
    return () => {
      document.removeEventListener("click", handleClick);
      document.removeEventListener("keydown", handleKey);
    };
  }, []);

  const initials = buildInitials(profile?.display_name, profile?.email);

  return (
    <div className="relative" ref={containerRef}>
      <button
        type="button"
        className="flex h-10 w-10 items-center justify-center rounded-full bg-primary/10 text-sm font-medium text-primary shadow-sm transition hover:bg-primary/20"
        onClick={() => setIsOpen((prev) => !prev)}
        aria-haspopup="menu"
        aria-expanded={isOpen}
      >
        {initials}
      </button>
      {isOpen ? (
        <div className="absolute right-0 z-50 mt-3 w-56 rounded-lg border border-border bg-popover shadow-lg">
          <div className="flex flex-col gap-1 p-3 text-sm">
            <div className="mb-2 border-b border-border pb-2">
              <p className="font-medium text-foreground">{profile?.display_name ?? "Профиль"}</p>
              <p className="text-xs text-muted-foreground">{profile?.email ?? "Email не указан"}</p>
            </div>
            <Link
              href="/app/settings"
              className="flex items-center gap-2 rounded-md px-2 py-2 text-sm text-foreground transition hover:bg-muted"
              onClick={() => setIsOpen(false)}
            >
              <Settings className="h-4 w-4" aria-hidden />
              Настройки профиля
            </Link>
            {isAdmin ? (
              <Link
                href="/admin"
                className="flex items-center gap-2 rounded-md px-2 py-2 text-sm text-foreground transition hover:bg-muted"
                onClick={() => setIsOpen(false)}
              >
                <ShieldCheck className="h-4 w-4" aria-hidden />
                Админ-панель
              </Link>
            ) : null}
            <Link
              href="/app/import"
              className="flex items-center gap-2 rounded-md px-2 py-2 text-sm text-foreground transition hover:bg-muted"
              onClick={() => setIsOpen(false)}
            >
              <Upload className="h-4 w-4" aria-hidden />
              Импорт CSV
            </Link>
            <Link
              href="/app/export"
              className="flex items-center gap-2 rounded-md px-2 py-2 text-sm text-foreground transition hover:bg-muted"
              onClick={() => setIsOpen(false)}
            >
              <Upload className="h-4 w-4 rotate-180" aria-hidden />
              Экспорт CSV
            </Link>
            <div className="mt-1 border-t border-border pt-2">
              <div className="flex items-center justify-between px-2 py-2 text-sm text-foreground">
                <span>Тема</span>
                <ThemeToggle />
              </div>
              <SignOutButton
                variant="ghost"
                className="mt-2 flex w-full items-center gap-2 px-2 py-2 text-sm text-destructive hover:bg-destructive/10"
                icon={<LogOut className="h-4 w-4" aria-hidden />}
              >
                Выйти
              </SignOutButton>
            </div>
          </div>
        </div>
      ) : null}
    </div>
  );
}
