import type { Metadata } from "next";
import { redirect } from "next/navigation";

import { AdminDashboard } from "@/components/admin/admin-dashboard";
import { fetchAdminDashboard } from "@/lib/admin/server";
import { isAdminSession } from "@/lib/admin/utils";
import { getSupabaseServerComponentClient } from "@/lib/supabase/server";

export const metadata: Metadata = {
  title: "Админ-панель — Link Vault",
  description:
    "Страница администратора Link Vault со сводными метриками по пользователям, активности и популярным тегам.",
};

export default async function AdminPage() {
  const supabase = getSupabaseServerComponentClient();
  const {
    data: { session },
  } = await supabase.auth.getSession();

  if (!session) {
    redirect("/auth/sign-in");
  }

  if (!isAdminSession(session)) {
    redirect("/app");
  }

  const data = await fetchAdminDashboard(supabase);

  return <AdminDashboard data={data} />;
}
