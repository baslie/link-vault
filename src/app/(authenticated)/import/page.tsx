import type { Metadata } from "next";

import { ImportWorkspace } from "@/components/import/import-workspace";

export const metadata: Metadata = {
  title: "Импорт ссылок — Link Vault",
  description: "Загрузка ссылок из CSV с предпросмотром и проверкой дублей",
};

export default function ImportPage() {
  return <ImportWorkspace />;
}
