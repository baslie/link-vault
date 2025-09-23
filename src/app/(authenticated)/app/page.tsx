export default function WorkspacePage() {
  return (
    <section className="space-y-6">
      <div className="space-y-2">
        <h1 className="text-3xl font-semibold tracking-tight">Рабочее пространство</h1>
        <p className="text-sm text-muted-foreground">
          Здесь появятся таблица ссылок, фильтры и инструменты импорта. Аутентификация настроена, можно переходить к реализации
          прикладных сценариев.
        </p>
      </div>
      <div className="rounded-xl border border-dashed border-border bg-card/60 p-6">
        <p className="text-sm text-muted-foreground">
          Добавьте компоненты управления ссылками и тегами на следующих этапах дорожной карты. Текущий экран подтверждает, что
          доступ ограничен авторизованными пользователями.
        </p>
      </div>
    </section>
  );
}
