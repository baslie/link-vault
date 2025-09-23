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

## Настройка Supabase

- Скопируй `.env.example` в `.env.local` и заполни ключи проекта Supabase (`NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`, `SUPABASE_SERVICE_ROLE_KEY`).
- Установи и авторизуй Supabase CLI (пакет `supabase` добавлен в `devDependencies`). Команды запускаются через `pnpm exec supabase …`.
- Запусти локальную инфраструктуру: `pnpm exec supabase start`.
- Проверь миграции: `pnpm exec supabase db push --dry-run`. Для полной перезагрузки с сид-данными используй `pnpm exec supabase db reset --seed` (прочитает `supabase/migrations` и `supabase/seed.sql`).
- Детальная пошаговая инструкция размещена в [`docs/supabase-setup.md`](docs/supabase-setup.md).

## Pre-commit хуки

В репозитории настроен `husky` с `lint-staged`: перед коммитом автоматически выполняются ESLint, Prettier и `pnpm typecheck`.

## Дополнительные материалы

- [Бриф продукта](docs/brief.md)
- [Архитектурная схема](docs/architecture.md)
