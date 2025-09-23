import Link from "next/link";
import type { ReactNode } from "react";

import { SignOutButton } from "@/components/app/sign-out-button";
import type { Tables } from "@/lib/supabase/types";

type Profile = Pick<Tables<"profiles">, "id" | "email" | "display_name" | "theme">;

interface AppShellProps {
  profile: Profile | null;
  children: ReactNode;
}

export function AppShell({ profile, children }: AppShellProps) {
  const displayName = profile?.display_name?.trim() || profile?.email || "Новый пользователь";

  return (
    <div className="flex min-h-screen flex-col bg-background">
      <header className="border-b border-border bg-card/70 backdrop-blur">
        <div className="container flex flex-col gap-4 py-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <Link href="/app" className="text-lg font-semibold tracking-tight">
              Link Vault
            </Link>
            <p className="text-sm text-muted-foreground">
              {profile?.email ? `Вы вошли как ${profile.email}` : "Авторизуйтесь, чтобы управлять закладками."}
            </p>
          </div>
          <div className="flex items-center gap-4">
            <div className="text-right text-sm text-muted-foreground">
              <p className="font-medium text-foreground">{displayName}</p>
              {profile?.email ? <p className="text-xs">{profile.email}</p> : null}
            </div>
            <SignOutButton />
          </div>
        </div>
      </header>
      <main className="container flex-1 py-10">{children}</main>
    </div>
  );
}
