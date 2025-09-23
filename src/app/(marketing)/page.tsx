import Link from "next/link";

import { Button } from "@/components/ui/button";

const checklist = [
  "Next.js 14 App Router",
  "TypeScript + строгий режим",
  "Tailwind CSS с дизайн-токенами shadcn/ui",
  "React Query провайдер",
  "Zod для типобезопасной валидации",
];

export default function HomePage() {
  return (
    <main className="flex min-h-screen flex-col gap-12 bg-gradient-to-b from-background via-background to-muted/40 pb-20">
      <section className="container flex flex-1 flex-col items-center justify-center gap-6 pt-24 text-center">
        <span className="inline-flex items-center gap-2 rounded-full border border-border bg-card px-4 py-1 text-xs font-medium uppercase tracking-[0.2em] text-muted-foreground">
          link vault
        </span>
        <div className="space-y-3">
          <h1 className="text-3xl font-semibold sm:text-5xl">
            Каркас приложения готов к дальнейшей разработке
          </h1>
          <p className="max-w-2xl text-balance text-muted-foreground sm:text-lg">
            Настроены общие стили, дизайн-система и инфраструктура сборки. Далее можно переходить к
            интеграции Supabase и прикладных сценариев, описанных в документации.
          </p>
        </div>
        <div className="flex flex-wrap items-center justify-center gap-3">
          <Button asChild size="lg">
            <Link href="/docs/architecture.md" className="no-underline">
              Ознакомиться с архитектурой
            </Link>
          </Button>
          <Button asChild variant="outline" size="lg">
            <Link href="/docs/brief.md" className="no-underline">
              Прочитать бриф
            </Link>
          </Button>
        </div>
      </section>
      <section className="container max-w-4xl rounded-2xl border border-border bg-card/60 p-8 shadow-sm backdrop-blur">
        <h2 className="text-left text-sm font-semibold uppercase tracking-wide text-muted-foreground">
          Что включено в сборку
        </h2>
        <ul className="mt-4 grid gap-3 text-left text-sm text-muted-foreground sm:grid-cols-2">
          {checklist.map((item) => (
            <li
              key={item}
              className="flex items-start gap-2 rounded-lg bg-background/60 p-3 shadow-sm"
            >
              <span
                className="mt-1 h-2.5 w-2.5 flex-shrink-0 rounded-full bg-primary"
                aria-hidden
              />
              <span className="text-foreground/90">{item}</span>
            </li>
          ))}
        </ul>
      </section>
    </main>
  );
}
