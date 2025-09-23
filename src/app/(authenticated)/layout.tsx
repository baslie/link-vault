import { redirect } from "next/navigation";
import type { ReactNode } from "react";

import { AppShell } from "@/components/app/app-shell";
import { getSupabaseServerComponentClient } from "@/lib/supabase/server";

export default async function AuthenticatedLayout({ children }: { children: ReactNode }) {
  const supabase = getSupabaseServerComponentClient();
  const {
    data: { session },
  } = await supabase.auth.getSession();

  if (!session) {
    redirect("/auth/sign-in");
  }

  const { data: profile } = await supabase
    .from("profiles")
    .select("id, email, display_name, theme")
    .eq("id", session.user.id)
    .maybeSingle();

  return <AppShell profile={profile ?? null}>{children}</AppShell>;
}
