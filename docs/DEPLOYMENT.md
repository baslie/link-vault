# Руководство по запуску и деплою Link Vault

Документ описывает полный цикл запуска платформы Link Vault: подготовку инфраструктуры Supabase, локальную разработку, настройку CI/CD на GitHub Actions и деплой на Vercel. Руководство дополняет архитектурные решения из [`docs/architecture.md`](./architecture.md) и требования из [`docs/brief.md`](./brief.md).

## 1. Предварительные требования

| Компонент                      | Версия/требование    | Комментарий                                      |
| ------------------------------ | -------------------- | ------------------------------------------------ |
| Node.js                        | 20.x LTS             | Используется Next.js 14                          |
| PNPM                           | 9.x                  | Менеджер пакетов проекта                         |
| Docker Desktop / Docker Engine | Последняя LTS        | Необходим для Supabase CLI (`supabase start`)    |
| Supabase CLI                   | ≥ 2.45               | Поставляется через `pnpm dlx supabase …`         |
| Vercel CLI                     | ≥ 39                 | Используется в GitHub Actions и локальном деплое |
| GitHub репозиторий             | main + PR ветки      | Автоматический CI/CD                             |
| Vercel проект                  | Production окружение | Подключается к репозиторию                       |

## 2. Настройка Supabase проекта

1. Создайте проект в Supabase и сохраните значения `project_id`, `anon key`, `service_role key`.
2. Включите провайдеры аутентификации Email и Google (см. [`docs/architecture.md#1-3-аутентификация`](./architecture.md#1-3-аутентификация)).
3. Создайте bucket `favicons` в разделе Storage с публичным доступом на чтение.
4. Склонируйте репозиторий и скопируйте `.env.example` в `.env.local`, заполнив ключи Supabase.
5. Запустите локальную инфраструктуру (Docker контейнеры PostgreSQL, Studio, Inbucket):
   ```bash
   pnpm exec supabase start
   ```
6. Примените миграции и сид-данные:
   ```bash
   pnpm exec supabase db reset --seed --workdir supabase
   ```
7. Для проверки схемы без сброса БД используйте:
   ```bash
   pnpm exec supabase db push --dry-run --workdir supabase
   ```
8. Детальные инструкции по структуре таблиц и политик RLS приведены в [`docs/supabase-setup.md`](./supabase-setup.md).

## 3. Переменные окружения

| Имя                                                  | Где используется                   | Описание                                           |
| ---------------------------------------------------- | ---------------------------------- | -------------------------------------------------- |
| `NEXT_PUBLIC_SUPABASE_URL`                           | Next.js, Playwright                | URL проекта Supabase                               |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY`                      | Next.js, Playwright                | Публичный ключ для клиента                         |
| `SUPABASE_SERVICE_ROLE_KEY`                          | Next.js (server), Supabase CLI     | Сервисный ключ для миграций и server-side операций |
| `SUPABASE_DB_URL`                                    | GitHub Actions, локальные миграции | Полный URL Postgres для `supabase db push`/`lint`  |
| `NEXT_PUBLIC_SITE_URL`                               | Next.js (опционально)              | Базовый URL для генерации абсолютных ссылок        |
| `YANDEX_METRIKA_ID`, `GA_TRACKING_ID`                | Аналитика                          | Идентификаторы счетчиков (опционально)             |
| `VERCEL_TOKEN`, `VERCEL_ORG_ID`, `VERCEL_PROJECT_ID` | CI/CD                              | Токен и идентификаторы проекта Vercel              |

> **Совет:** значения Supabase и Vercel сохраняются как GitHub Actions secrets. В локальной разработке используйте `.env.local` (не коммитится).

## 4. Локальная разработка

1. Установите зависимости:
   ```bash
   pnpm install
   ```
2. Поднимите Supabase и дождитесь готовности контейнеров:
   ```bash
   pnpm exec supabase start
   ```
3. Примените миграции и сиды (при первом запуске или после изменений в `supabase/migrations`):
   ```bash
   pnpm exec supabase db reset --seed --workdir supabase
   ```
4. Запустите Next.js в dev-режиме:
   ```bash
   pnpm dev
   ```
5. Параллельно можно выполнять автоматические проверки:
   - `pnpm lint`
   - `pnpm typecheck`
   - `pnpm test` (unit/integration)
   - `pnpm test --coverage`
   - `pnpm exec playwright install` (одноразовая загрузка браузеров перед e2e/a11y тестами)
   - `pnpm test:e2e` (Playwright, запускает dev-сервер автоматически)
   - `pnpm test:a11y` (axe-core + Playwright)
6. Завершите работу Supabase после разработки:
   ```bash
   pnpm exec supabase stop
   ```

## 5. Настройка CI/CD (GitHub Actions)

В репозитории настроен workflow `.github/workflows/ci.yml` с двумя задачами:

- **`quality-checks`** — запускается на каждом PR и пуше в `main`.
  - Устанавливает зависимости (`pnpm install`).
  - Выполняет `pnpm lint`, `pnpm typecheck`, `pnpm test --coverage`, `pnpm test:e2e`, `pnpm test:a11y`.
  - При наличии секрета `SUPABASE_DB_URL` запускает `pnpm dlx supabase db lint --db-url "$SUPABASE_DB_URL"` для валидации схемы на целевой БД.
- **`deploy`** — активируется на push в `main` после успешных проверок.
  - Повторно устанавливает зависимости.
  - При наличии `SUPABASE_DB_URL` выполняет `pnpm dlx supabase db push --db-url "$SUPABASE_DB_URL"` для применения миграций.
  - При наличии Vercel-секретов (`VERCEL_TOKEN`, `VERCEL_ORG_ID`, `VERCEL_PROJECT_ID`) запускает `vercel pull/build/deploy` для публикации production-сборки.

### Требуемые GitHub Secrets

| Secret              | Назначение                                                   |
| ------------------- | ------------------------------------------------------------ |
| `SUPABASE_DB_URL`   | строка подключения `postgresql://user:password@host:port/db` |
| `VERCEL_TOKEN`      | токен доступа Vercel                                         |
| `VERCEL_ORG_ID`     | идентификатор организации Vercel                             |
| `VERCEL_PROJECT_ID` | идентификатор проекта Vercel                                 |

Отсутствие любого секрета автоматически пропускает связанные шаги, что упрощает локальную работу с форками.

## 6. Продакшен-деплой

1. Убедитесь, что ветка `main` содержит нужные изменения и прошла проверки `quality-checks`.
2. При push в `main` workflow `deploy`:
   - Применяет миграции Supabase к production БД.
   - Выполняет `vercel pull --environment=production`, `vercel build --prod`, `vercel deploy --prebuilt --prod`.
3. Для ручного деплоя локально:
   ```bash
   # Подготовка окружения
   export VERCEL_TOKEN=... VERCEL_ORG_ID=... VERCEL_PROJECT_ID=...
   pnpm dlx vercel pull --yes --environment=production --token "$VERCEL_TOKEN" --project "$VERCEL_PROJECT_ID" --scope "$VERCEL_ORG_ID"
   pnpm dlx vercel build --prod --token "$VERCEL_TOKEN"
   pnpm dlx vercel deploy --prebuilt --prod --token "$VERCEL_TOKEN"
   ```
4. После деплоя выполните smoke-тесты:
   ```bash
   pnpm test:e2e --reporter=list
   pnpm test:a11y --reporter=list
   ```

## 7. Проверка и мониторинг

- Отслеживайте покрытия тестов через отчет Vitest (`coverage/lcov-report/index.html`).
- Для мониторинга продакшена используйте настроенные интеграции (Sentry/аналитика) согласно [`docs/monitoring.md`](./monitoring.md).
- Аналитика (Yandex Metrika, Google Analytics) активируется при заполнении переменных окружения.

## 8. Процедура отката

1. **Откат фронтенда (Vercel):**
   ```bash
   pnpm dlx vercel rollback --token "$VERCEL_TOKEN"
   ```
   Либо выберите предыдущий деплой в Vercel Dashboard и нажмите _Rollback_.
2. **Откат миграций Supabase:**
   - Посмотрите историю: `pnpm exec supabase migration list --workdir supabase`.
   - Откатите последнюю миграцию: `pnpm exec supabase migration down --workdir supabase`.
   - При критических ошибках выполните восстановление из бэкапа или `pnpm exec supabase db reset --db-url "$SUPABASE_DB_URL" --workdir supabase`.
3. Зафиксируйте проблемы в issue/ADR и подготовьте исправление перед повторным деплоем.

## 9. Чеклист перед релизом

- [ ] Обновлены переменные окружения и секреты.
- [ ] Пройдены команды `pnpm lint`, `pnpm typecheck`, `pnpm test --coverage`.
- [ ] Playwright e2e и a11y тесты проходят локально.
- [ ] Supabase миграции применяются без ошибок (`pnpm exec supabase db push --dry-run`).
- [ ] Создана точка восстановления на Vercel и Supabase (snapshot/backup).
- [ ] Обновлена документация/README при изменении функционала.

Следуя этому чеклисту, команда получает воспроизводимый процесс запуска и может оперативно реагировать на инциденты.
