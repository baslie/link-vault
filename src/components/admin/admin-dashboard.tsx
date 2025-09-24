import { ActivityChart } from "@/components/admin/activity-chart";
import type { AdminDashboardMetrics } from "@/lib/admin/types";

interface AdminDashboardProps {
  data: AdminDashboardMetrics;
}

function formatInteger(value: number) {
  return new Intl.NumberFormat("ru-RU").format(value);
}

function formatAverage(value: number) {
  return new Intl.NumberFormat("ru-RU", {
    minimumFractionDigits: 0,
    maximumFractionDigits: 2,
  }).format(value);
}

export function AdminDashboard({ data }: AdminDashboardProps) {
  const activeUsers = data.linksByUser.filter((item) => item.linksCount > 0).length;
  const topUsers = data.linksByUser.slice(0, 10);
  const topTags = data.popularTags.slice(0, 12);

  return (
    <div className="flex w-full flex-col gap-8">
      <header className="flex flex-col gap-2">
        <h1 className="text-2xl font-semibold tracking-tight">Административная панель</h1>
        <p className="text-sm text-muted-foreground">
          Сводные метрики по всем пользователям сервиса. Данные обновляются в режиме реального
          времени.
        </p>
      </header>

      <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <article className="rounded-lg border border-border bg-card p-5 shadow-sm">
          <p className="text-sm text-muted-foreground">Всего пользователей</p>
          <p className="mt-2 text-3xl font-semibold">{formatInteger(data.totalUsers)}</p>
          <p className="mt-2 text-xs text-muted-foreground">Аккаунтов в системе</p>
        </article>
        <article className="rounded-lg border border-border bg-card p-5 shadow-sm">
          <p className="text-sm text-muted-foreground">Всего ссылок</p>
          <p className="mt-2 text-3xl font-semibold">{formatInteger(data.totalLinks)}</p>
          <p className="mt-2 text-xs text-muted-foreground">Хранится во всех коллекциях</p>
        </article>
        <article className="rounded-lg border border-border bg-card p-5 shadow-sm">
          <p className="text-sm text-muted-foreground">Среднее ссылок на пользователя</p>
          <p className="mt-2 text-3xl font-semibold">{formatAverage(data.averageLinksPerUser)}</p>
          <p className="mt-2 text-xs text-muted-foreground">Показывает вовлечённость</p>
        </article>
        <article className="rounded-lg border border-border bg-card p-5 shadow-sm">
          <p className="text-sm text-muted-foreground">Активные пользователи</p>
          <p className="mt-2 text-3xl font-semibold">{formatInteger(activeUsers)}</p>
          <p className="mt-2 text-xs text-muted-foreground">Добавили хотя бы одну ссылку</p>
        </article>
      </section>

      <section className="grid gap-6 lg:grid-cols-2">
        <div className="rounded-lg border border-border bg-card p-6 shadow-sm">
          <ActivityChart data={data.activityByDay} />
        </div>
        <div className="rounded-lg border border-border bg-card p-6 shadow-sm">
          <h3 className="text-sm font-medium text-muted-foreground">Популярные теги</h3>
          {topTags.length > 0 ? (
            <ul className="mt-4 grid gap-2">
              {topTags.map((tag) => (
                <li
                  key={`${tag.tagName}-${tag.color}`}
                  className="flex items-center justify-between rounded-md border border-border/60 bg-muted/30 px-3 py-2 text-sm"
                >
                  <span className="flex items-center gap-2">
                    <span
                      className="h-2.5 w-2.5 rounded-full"
                      style={{ backgroundColor: tag.color }}
                      aria-hidden
                    />
                    {tag.tagName}
                  </span>
                  <span className="text-xs text-muted-foreground">
                    {formatInteger(tag.usageCount)} использований
                  </span>
                </li>
              ))}
            </ul>
          ) : (
            <p className="mt-4 text-sm text-muted-foreground">
              Пока нет данных о популярных тегах.
            </p>
          )}
        </div>
      </section>

      <section className="rounded-lg border border-border bg-card p-6 shadow-sm">
        <div className="flex flex-col gap-2">
          <h2 className="text-lg font-semibold">Вклад пользователей</h2>
          <p className="text-sm text-muted-foreground">
            Список пользователей с наибольшим количеством ссылок. Используйте данные для выявления
            power-user’ов.
          </p>
        </div>
        {topUsers.length > 0 ? (
          <div className="mt-4 overflow-x-auto">
            <table className="min-w-full divide-y divide-border text-sm">
              <thead>
                <tr className="text-left text-xs uppercase tracking-wide text-muted-foreground">
                  <th className="px-3 py-2">Пользователь</th>
                  <th className="px-3 py-2">Email</th>
                  <th className="px-3 py-2 text-right">Ссылок</th>
                  <th className="px-3 py-2 text-right">Доля</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {topUsers.map((user) => (
                  <tr key={user.userId}>
                    <td className="px-3 py-2 font-medium text-foreground">{user.displayName}</td>
                    <td className="px-3 py-2 text-muted-foreground">{user.email ?? "—"}</td>
                    <td className="px-3 py-2 text-right font-medium text-foreground">
                      {formatInteger(user.linksCount)}
                    </td>
                    <td className="px-3 py-2 text-right text-muted-foreground">
                      {formatAverage(user.linksShare)}%
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <p className="mt-4 text-sm text-muted-foreground">Пока никто не добавил ссылки.</p>
        )}
      </section>
    </div>
  );
}
