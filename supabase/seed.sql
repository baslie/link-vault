-- Seed data for local development. The statements are idempotent and depend on the first existing profile.
with profile as (
  select id from public.profiles order by created_at limit 1
)
, tag_payload as (
  select * from (values
    ('Research', '#0ea5e9'),
    ('Design', '#f59e0b'),
    ('Reading List', '#10b981')
  ) as t(name, color)
)
, inserted_tags as (
  insert into public.tags (user_id, name, color)
  select
    p.id,
    t.name,
    t.color
  from profile p
  join tag_payload t on true
  on conflict (user_id, name) do update
    set color = excluded.color,
        updated_at = now()
  returning id, user_id, name
)
, link_payload as (
  select * from (values
    ('https://supabase.com/docs', 'Supabase Docs', 'Документация по Supabase и CLI', 'Research'),
    ('https://nextjs.org/docs', 'Next.js App Router Guide', 'Рекомендации по архитектуре и данным', 'Research'),
    ('https://leerob.io/blog/nextjs', 'Next.js Patterns', 'Подборка UX/архитектурных паттернов', 'Design')
  ) as l(url, title, comment, primary_tag)
)
, inserted_links as (
  insert into public.links (user_id, url, title, comment)
  select
    p.id,
    l.url,
    l.title,
    l.comment
  from profile p
  join link_payload l on true
  on conflict (user_id, url) do update
    set title = excluded.title,
        comment = excluded.comment,
        updated_at = now()
  returning id, user_id, url
)
insert into public.link_tags (link_id, tag_id)
select
  l.id,
  t.id
from inserted_links l
join link_payload lp on lp.url = l.url
join inserted_tags t on t.name = lp.primary_tag and t.user_id = l.user_id
on conflict do nothing;

with profile as (
  select id from public.profiles order by created_at limit 1
)
, import_row as (
  select
    '11111111-1111-1111-1111-111111111111'::uuid as id,
    p.id as user_id,
    'seed/import-demo.csv'::text as source,
    'completed'::public.import_status as status,
    5 as total_rows,
    4 as imported_rows,
    1 as duplicate_rows,
    0 as failed_rows
  from profile p
)
insert into public.imports (id, user_id, source, status, total_rows, imported_rows, duplicate_rows, failed_rows)
select * from import_row
on conflict (id) do update
  set status = excluded.status,
      total_rows = excluded.total_rows,
      imported_rows = excluded.imported_rows,
      duplicate_rows = excluded.duplicate_rows,
      failed_rows = excluded.failed_rows;

with import_entry as (
  select i.id, i.user_id from public.imports i where i.id = '11111111-1111-1111-1111-111111111111'
)
insert into public.import_errors (id, import_id, row_number, url, error_code, error_details)
select
  '22222222-2222-2222-2222-222222222222'::uuid,
  e.id,
  5,
  'https://example.com/bad-link',
  'invalid_url',
  jsonb_build_object('message', 'Некорректный URL — требуется https')
from import_entry e
on conflict (id) do update
  set row_number = excluded.row_number,
      url = excluded.url,
      error_code = excluded.error_code,
      error_details = excluded.error_details;
