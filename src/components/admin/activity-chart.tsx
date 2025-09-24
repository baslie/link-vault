import type { AdminActivityPoint } from "@/lib/admin/types";

interface ActivityChartProps {
  data: AdminActivityPoint[];
  maxBars?: number;
}

function formatLabel(date: string) {
  try {
    const formatter = new Intl.DateTimeFormat("ru-RU", {
      month: "short",
      day: "numeric",
    });
    return formatter.format(new Date(`${date}T00:00:00Z`));
  } catch (error) {
    console.warn("Не удалось отформатировать дату активности", error);
    return date;
  }
}

export function ActivityChart({ data, maxBars = 14 }: ActivityChartProps) {
  if (data.length === 0) {
    return (
      <p className="text-sm text-muted-foreground">Нет данных об активности за выбранный период.</p>
    );
  }

  const relevant = data.slice(-maxBars);
  const maxValue = Math.max(...relevant.map((item) => item.linksCount), 1);

  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-medium text-muted-foreground">Активность по дням</h3>
        <span className="text-xs text-muted-foreground">Последние {relevant.length} дней</span>
      </div>
      <div
        className="flex h-48 items-end gap-2 rounded-md border border-border/60 bg-muted/30 p-4"
        role="img"
        aria-label="График количества добавленных ссылок по дням"
      >
        {relevant.map((item) => {
          const height = Math.max(6, Math.round((item.linksCount / maxValue) * 100));
          return (
            <div
              key={item.date}
              className="flex h-full flex-1 flex-col items-center justify-end gap-2"
            >
              <div
                className="flex w-full flex-col items-center gap-1 text-xs text-muted-foreground"
                aria-hidden
              >
                <span>{item.linksCount}</span>
              </div>
              <div
                className="w-full rounded-t-md bg-primary/80"
                style={{ height: `${height}%` }}
                aria-hidden
              />
              <span className="text-xs text-muted-foreground" aria-hidden>
                {formatLabel(item.date)}
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
}
