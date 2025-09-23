# Настройка Supabase для проекта Link Vault

Этот документ описывает минимальные шаги, чтобы подготовить проект Supabase и связать его с локальной разработкой. После прохождения инструкции команды `pnpm exec supabase db push --dry-run` и `pnpm exec supabase db test` должны выполняться без ошибок подключения.

## 1. Предварительные требования

- Аккаунт в [Supabase](https://supabase.com/) с правом создания проектов.
- Установленный `pnpm` (см. [официальную документацию](https://pnpm.io/installation)).
- Node.js версии, указанной в `package.json` (рекомендуется использовать `nvm`).
- Supabase CLI (в проекте вызывается через `pnpm exec supabase`, поэтому отдельная глобальная установка не обязательна).

## 2. Создание или выбор проекта Supabase

1. Зайдите в консоль Supabase и создайте проект (или выберите существующий):
   - Укажите название и организацию.
   - Выберите регион, ближайший к команде разработки.
   - Задайте пароль БД (будет нужен для локального `supabase db remote commit`).
2. На вкладке **Authentication → Providers** включите Email (Magic Link) и Google (Client ID/Secret можно добавить позже).
3. На вкладке **Storage → Buckets** создайте приватный bucket `favicons`.
4. Убедитесь, что RLS включен для всех таблиц (по умолчанию Supabase активирует RLS, миграции в репозитории добавляют политики).

## 3. Переменные окружения

Скопируйте файл `.env.example` в `.env.local` и заполните значения:

```bash
cp .env.example .env.local
```

- `NEXT_PUBLIC_SUPABASE_URL` — URL проекта (`https://<project-ref>.supabase.co`).
- `NEXT_PUBLIC_SUPABASE_ANON_KEY` — публичный анонимный ключ (Dashboard → **Project Settings → API → Project API keys**).
- `SUPABASE_SERVICE_ROLE_KEY` — сервисный ключ (там же). **Не коммитьте** его в репозиторий.
- `SUPABASE_DB_PASSWORD` — пароль БД, указанный при создании проекта (используется для локального доступа через CLI).

> ⚠️ Проверьте, что `.env.local` добавлен в `.gitignore` (уже настроено в репозитории).

## 4. Авторизация в Supabase CLI

```bash
pnpm exec supabase login
```

- Откроется ссылка в браузере. Введите одноразовый токен и подтвердите доступ.
- Проверить авторизацию можно командой `pnpm exec supabase projects list`.

## 5. Связка репозитория с проектом

### Вариант A. Работа с удалённым проектом

1. Получите `project-ref` (формат `abcd1234`) в Dashboard → **Project Settings → General**.
2. Свяжите репозиторий с проектом:

   ```bash
   pnpm exec supabase link --project-ref <project-ref>
   ```

   CLI обновит `supabase/config.toml`, добавив сведения о подключении.

3. Для применения свежих миграций выполните:

   ```bash
   pnpm exec supabase db push
   pnpm exec supabase db reset --seed   # при необходимости накатить сид-данные
   ```

### Вариант B. Локальный self-hosted стек

1. Убедитесь, что Docker запущен.
2. Запустите локальный Supabase:

   ```bash
   pnpm exec supabase start
   ```

   Это создаст `.env` с локальными ключами и обновит `supabase/config.toml` на `local` профиль.

3. Выполните миграции и сид-данные (если нужно):

   ```bash
   pnpm exec supabase db push
   pnpm exec supabase db reset --seed
   ```

4. Для остановки служб используйте `pnpm exec supabase stop`.

## 6. Проверка миграций и SQL-тестов

После настройки окружения прогоните обязательные проверки из `AGENTS.md`:

```bash
pnpm exec supabase db push --dry-run
pnpm exec supabase db test
pnpm test -- --filter db
```

Если используются локальные сервисные ключи, убедитесь, что они совпадают с текущими значениями `.env.local` или `.env` (для локального профиля Supabase).

## 7. Частые проблемы и решения

- **`Error: Not logged in` при запуске CLI.** Повторите `pnpm exec supabase login` и убедитесь, что токен вставлен без пробелов.
- **`Missing SUPABASE_SERVICE_ROLE_KEY`.** Проверьте `.env.local` и наличие `SUPABASE_SERVICE_ROLE_KEY`. В Next.js серверный код использует этот ключ.
- **`Postgres connection refused` при локальном старте.** Убедитесь, что Docker поднялся, либо выполните `pnpm exec supabase stop && pnpm exec supabase start`.
- **Политики RLS блокируют доступ.** Запустите `pnpm exec supabase db reset --seed`, чтобы применить политики и сид-данные из репозитория.

## 8. Подготовка к деплою

- Для Vercel скопируйте значения из `.env.local` в переменные проекта (см. `docs/architecture.md#7.4-переменные-окружения-vercel`).
- Настройте GitHub Secrets `SUPABASE_ACCESS_TOKEN` (токен из `supabase login --token`) для будущих CI/CD сценариев.
- Перед выполнением `pnpm dlx supabase@2.45.5 db push --dry-run` в CI убедитесь, что используется тот же `project-ref`, что и локально.

Следуя этим шагам, вы получите рабочую связку Supabase ↔ Next.js и сможете запускать миграции, тесты и локальную разработку без ручных правок конфигурации.
