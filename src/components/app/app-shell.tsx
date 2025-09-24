import Link from "next/link";
import type { ReactNode } from "react";

import { GlobalSearch } from "@/components/app/global-search";
import { ProfileMenu } from "@/components/app/profile-menu";
import { Button } from "@/components/ui/button";
import type { ProfileRecord } from "@/lib/profile/schema";

type Profile = ProfileRecord;

interface AppShellProps {
  profile: Profile | null;
  isAdmin?: boolean;
  children: ReactNode;
}

export function AppShell({ profile, isAdmin = false, children }: AppShellProps) {
  const displayName = profile?.display_name?.trim() || profile?.email || "Новый пользователь";
  const email = profile?.email;

  return (
    <div className="flex min-h-screen flex-col bg-background">
      <header className="border-b border-border bg-card/70 backdrop-blur supports-[backdrop-filter]:bg-card/60">
        <div className="container mx-auto flex w-full max-w-6xl flex-col gap-4 px-4 py-4 sm:px-6 lg:py-5">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex items-center gap-3">
              <Link href="/app" className="text-lg font-semibold tracking-tight">
                Link Vault
              </Link>
              <span className="hidden text-sm text-muted-foreground md:inline">
                Минималистичный менеджер ссылок
              </span>
            </div>
            <div className="flex items-center gap-2 sm:justify-end">
              <Button type="button" size="sm" className="hidden sm:inline-flex" disabled>
                Добавить ссылку
              </Button>
              <ProfileMenu profile={profile} isAdmin={isAdmin} />
            </div>
          </div>
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <GlobalSearch className="sm:flex-1" />
            <div className="flex w-full items-center justify-between gap-3 sm:w-auto sm:justify-end">
              <div className="text-sm text-muted-foreground sm:text-right">
                <p className="font-medium text-foreground">{displayName}</p>
                {email ? (
                  <p className="text-xs">{email}</p>
                ) : (
                  <p className="text-xs">Профиль загружается...</p>
                )}
              </div>
              <Button type="button" size="sm" className="sm:hidden" disabled>
                Добавить ссылку
              </Button>
            </div>
          </div>
        </div>
      </header>
      <main className="container mx-auto flex w-full max-w-6xl flex-1 px-4 py-10 sm:px-6 lg:py-12">
        {children}
      </main>
    </div>
  );
}
