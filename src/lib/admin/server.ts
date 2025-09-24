import { normalizeAdminDashboard } from "@/lib/admin/schema";
import type { AdminDashboardMetrics } from "@/lib/admin/types";
import type { ServerClient } from "@/lib/supabase/server";

function mapErrorMessage(message: string): string {
  if (message.toLowerCase().includes("access denied")) {
    return "Доступ к административной панели запрещен";
  }

  return `Не удалось загрузить статистику: ${message}`;
}

export async function fetchAdminDashboard(client: ServerClient): Promise<AdminDashboardMetrics> {
  const { data, error } = await client.rpc("admin_dashboard_summary");

  if (error) {
    throw new Error(mapErrorMessage(error.message));
  }

  if (!data) {
    throw new Error("Пустой ответ при загрузке административной статистики");
  }

  try {
    return normalizeAdminDashboard(data);
  } catch (parseError) {
    if (parseError instanceof Error) {
      throw new Error(`Некорректный формат административных данных: ${parseError.message}`);
    }

    throw new Error("Некорректный формат административных данных");
  }
}
