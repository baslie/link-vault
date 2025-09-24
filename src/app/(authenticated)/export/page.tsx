import type { Metadata } from "next";

import { ExportWorkspace } from "@/components/export/export-workspace";

export const metadata: Metadata = {
  title: "Экспорт ссылок — Link Vault",
  description: "Скачивание ссылок в CSV с учетом фильтров и выбранных записей",
};

export default function ExportPage() {
  return <ExportWorkspace />;
}
