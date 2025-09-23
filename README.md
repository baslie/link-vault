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

## Pre-commit хуки

В репозитории настроен `husky` с `lint-staged`: перед коммитом автоматически выполняются ESLint, Prettier и `pnpm typecheck`.

## Дополнительные материалы

- [Бриф продукта](docs/brief.md)
- [Архитектурная схема](docs/architecture.md)

Следующий шаг по дорожной карте — интеграция Supabase, миграции и настройка клиентских SDK (см. задачу 1-2 в `AGENTS.md`).
