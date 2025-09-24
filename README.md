# Link Vault

Next.js 14 приложение для управления ссылками с Supabase в качестве backend (настроено в дальнейших этапах). Репозиторий строит инфраструктурный каркас, описанный в [`docs/architecture.md`](docs/architecture.md) и [`docs/brief.md`](docs/brief.md).

## Технологический стек

- **Next.js 14** (App Router, RSC)
- **TypeScript** со строгой типизацией
- **Tailwind CSS 3** + дизайн-токены от shadcn/ui
- **shadcn/ui** — библиотека повторно используемых UI-компонентов
- **React Query** для работы с данными
- **Zod** для схем валидации
- **Vitest** + Testing Library для модульных тестов
- **ESLint** + **Prettier** + **Husky/lint-staged** для качества кода

## Структура проекта

```
.
├── components.json          # конфигурация shadcn/ui
├── public/
│   └── docs/                # статические копии брифа и архитектуры
├── src/
│   ├── app/                 # маршруты App Router и глобальные стили
│   ├── components/          # UI-компоненты и провайдеры
│   └── lib/                 # утилиты и вспомогательные функции
├── supabase/
│   ├── config.toml          # конфигурация Supabase CLI для локального запуска
│   ├── migrations/          # SQL-миграции схемы данных и политик RLS
│   └── seed.sql             # идемпотентные сид-данные для разработки
└── docs/                    # исходные документы брифа и архитектуры
```

## Скрипты

Все команды запускаются через `pnpm`:

- `pnpm dev` — запуск локального dev-сервера Next.js
- `pnpm build` — production-сборка
- `pnpm start` — запуск production-сборки
- `pnpm lint` — ESLint с настройками Next.js
- `pnpm typecheck` — проверка типов (`tsc --noEmit`)
- `pnpm test` — запуск тестов в headless-режиме (`vitest run`)
- `pnpm test:watch` — запуск тестов в watch-режиме
- `pnpm test:e2e` — сквозные сценарии Playwright с автоматическим поднятием dev-сервера
- `pnpm test:a11y` — a11y-проверки на базе axe-core + Playwright

## Тестирование и качество

- `pnpm test` запускает unit и integration тесты через Vitest.
- `pnpm test --coverage` формирует отчёт покрытия (`coverage/lcov-report`). Пороговые значения: ≥65% для statements/lines, ≥70% для functions и ≥60% для branches.
- `pnpm test:e2e` выполняет сквозные сценарии маркетинговой страницы. Используется в CI и перед релизами как smoke-тест.
- `pnpm test:a11y` проверяет основные страницы на соответствие WCAG 2.1 AA с помощью axe-core.
- `pnpm lint` и `pnpm typecheck` обеспечивают качество кода и типобезопасность.

Детальная карта проверок и деплоя описана в [`docs/DEPLOYMENT.md`](docs/DEPLOYMENT.md).

## Настройка Supabase

- Скопируй `.env.example` в `.env.local` и заполни ключи проекта Supabase (`NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`, `SUPABASE_SERVICE_ROLE_KEY`).
- Установи и авторизуй Supabase CLI (пакет `supabase` добавлен в `devDependencies`). Команды запускаются через `pnpm exec supabase …`.
- Запусти локальную инфраструктуру: `pnpm exec supabase start`.
- Проверь миграции: `pnpm exec supabase db push --dry-run`. Для полной перезагрузки с сид-данными используй `pnpm exec supabase db reset --seed` (прочитает `supabase/migrations` и `supabase/seed.sql`).
- Детальная пошаговая инструкция размещена в [`docs/supabase-setup.md`](docs/supabase-setup.md).

## Аналитика

- Для подключения счётчиков укажи в `.env.local` переменные `YANDEX_METRIKA_ID` и/или `GA_TRACKING_ID`.
- После развертывания идентификаторы передаются в компонент аналитики, который добавляет `gtag.js` и тег Яндекс.Метрики и пробрасывает кастомные события (`link_created`, `import_completed`, `export_generated`, `theme_changed`).
- Отправка событий происходит на уровне клиентских хуков и компонентов, поэтому данные доступны и локально (при наличии переменных окружения), и в production.

## Pre-commit хуки

В репозитории настроен `husky` с `lint-staged`: перед коммитом автоматически выполняются ESLint/Prettier для изменённых файлов, затем `pnpm typecheck` и полный прогон `pnpm test`.

## CI/CD и деплой

- Workflow `.github/workflows/ci.yml` запускает lint, typecheck, unit/integration тесты с покрытием, а также Playwright e2e/a11y проверки на каждом PR и push в `main`.
- При наличии секрета `SUPABASE_DB_URL` дополнительно выполняется `supabase db lint`/`db push`.
- Деплой на Vercel выполняется из той же workflow после успешных проверок. Необходимы секреты `VERCEL_TOKEN`, `VERCEL_ORG_ID`, `VERCEL_PROJECT_ID`.
- Пошаговый runbook и чеклисты приведены в [`docs/DEPLOYMENT.md`](docs/DEPLOYMENT.md).

## Дополнительные материалы

- [Бриф продукта](docs/brief.md)
- [Архитектурная схема](docs/architecture.md)
- [Мониторинг и метрики](docs/monitoring.md)
