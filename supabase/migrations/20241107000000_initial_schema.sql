-- Initial schema for Link Vault Supabase project
-- Generated to cover profiles, links, tags, imports and auditing requirements described in docs/architecture.md

set check_function_bodies = off;

create extension if not exists "pgcrypto";
create extension if not exists "citext";
create extension if not exists "pg_trgm";

create type public.theme_preference as enum ('light', 'dark', 'system');
create type public.import_status as enum ('pending', 'completed', 'failed');
create type public.link_event_type as enum ('created', 'updated', 'deleted', 'imported');

create table public.profiles (
  id uuid primary key references auth.users (id) on delete cascade,
  email text unique,
  display_name text,
  theme public.theme_preference not null default 'system',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.links (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles (id) on delete cascade,
  url text not null,
  title text not null default '',
  comment text default '',
  fav_icon_path text,
  metadata_source jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint links_user_url_unique unique (user_id, url)
);

create table public.tags (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles (id) on delete cascade,
  name citext not null,
  color text not null default '#6366f1',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint tags_user_name_unique unique (user_id, name)
);

create table public.link_tags (
  link_id uuid not null references public.links (id) on delete cascade,
  tag_id uuid not null references public.tags (id) on delete cascade,
  primary key (link_id, tag_id)
);

create table public.imports (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles (id) on delete cascade,
  source text,
  status public.import_status not null default 'pending',
  total_rows integer not null default 0,
  imported_rows integer not null default 0,
  duplicate_rows integer not null default 0,
  failed_rows integer not null default 0,
  created_at timestamptz not null default now()
);

create table public.import_errors (
  id uuid primary key default gen_random_uuid(),
  import_id uuid not null references public.imports (id) on delete cascade,
  row_number integer,
  url text,
  error_code text,
  error_details jsonb,
  created_at timestamptz not null default now()
);

create table public.audit_link_events (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles (id) on delete cascade,
  link_id uuid,
  event_type public.link_event_type not null,
  event_timestamp timestamptz not null default now()
);

create or replace function public.handle_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create trigger set_timestamp_profiles
before update on public.profiles
for each row
execute function public.handle_updated_at();

create trigger set_timestamp_links
before update on public.links
for each row
execute function public.handle_updated_at();

create trigger set_timestamp_tags
before update on public.tags
for each row
execute function public.handle_updated_at();

create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  default_name text;
begin
  if new.raw_user_meta_data ? 'full_name' then
    default_name := nullif(trim(new.raw_user_meta_data ->> 'full_name'), '');
  end if;

  if default_name is null and new.email is not null then
    default_name := split_part(new.email, '@', 1);
  end if;

  insert into public.profiles (id, email, display_name)
  values (new.id, new.email, default_name)
  on conflict (id) do update
    set email = excluded.email,
        display_name = coalesce(excluded.display_name, public.profiles.display_name),
        updated_at = now();

  return new;
end;
$$;

create trigger on_auth_user_created
after insert on auth.users
for each row execute function public.handle_new_user();

create trigger on_auth_user_updated
after update of email, raw_user_meta_data on auth.users
for each row execute function public.handle_new_user();

create or replace function public.record_link_event()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  current_event public.link_event_type;
  event_user uuid;
  event_link uuid;
begin
  if tg_op = 'INSERT' then
    current_event := 'created';
    event_user := new.user_id;
    event_link := new.id;
  elsif tg_op = 'UPDATE' then
    current_event := 'updated';
    event_user := new.user_id;
    event_link := new.id;
  elsif tg_op = 'DELETE' then
    current_event := 'deleted';
    event_user := old.user_id;
    event_link := old.id;
  else
    return null;
  end if;

  insert into public.audit_link_events (user_id, link_id, event_type)
  values (event_user, event_link, current_event);

  if tg_op = 'DELETE' then
    return old;
  end if;

  return new;
end;
$$;

create trigger log_link_events
after insert or update or delete on public.links
for each row
execute function public.record_link_event();

create index links_user_created_at_idx on public.links using btree (user_id, created_at desc);
create index links_user_title_idx on public.links using btree (user_id, title);
create index links_search_idx on public.links using gin (to_tsvector('simple', coalesce(title, '') || ' ' || coalesce(comment, '')));

create index tags_user_name_idx on public.tags using btree (user_id, name);
create index link_tags_tag_idx on public.link_tags using btree (tag_id);
create index link_tags_link_idx on public.link_tags using btree (link_id);

create index imports_user_created_at_idx on public.imports using btree (user_id, created_at desc);
create index import_errors_import_idx on public.import_errors using btree (import_id);
create index audit_link_events_user_idx on public.audit_link_events using btree (user_id, event_timestamp desc);

alter table public.profiles enable row level security;
alter table public.links enable row level security;
alter table public.tags enable row level security;
alter table public.link_tags enable row level security;
alter table public.imports enable row level security;
alter table public.import_errors enable row level security;
alter table public.audit_link_events enable row level security;

create policy "Profiles are viewable by owner"
  on public.profiles
  for select
  using (id = auth.uid());

create policy "Profiles are updatable by owner"
  on public.profiles
  for update
  using (id = auth.uid())
  with check (id = auth.uid());

create policy "Links are manageable by owner"
  on public.links
  for all
  using (user_id = auth.uid())
  with check (user_id = auth.uid());

create policy "Tags are manageable by owner"
  on public.tags
  for all
  using (user_id = auth.uid())
  with check (user_id = auth.uid());

create policy "Link tags are manageable by owner"
  on public.link_tags
  for all
  using (
    exists (
      select 1
      from public.links l
      where l.id = link_id and l.user_id = auth.uid()
    )
    and exists (
      select 1
      from public.tags t
      where t.id = tag_id and t.user_id = auth.uid()
    )
  )
  with check (
    exists (
      select 1
      from public.links l
      where l.id = link_id and l.user_id = auth.uid()
    )
    and exists (
      select 1
      from public.tags t
      where t.id = tag_id and t.user_id = auth.uid()
    )
  );

create policy "Imports are manageable by owner"
  on public.imports
  for all
  using (user_id = auth.uid())
  with check (user_id = auth.uid());

create policy "Import errors visible within own imports"
  on public.import_errors
  for select
  using (
    exists (
      select 1
      from public.imports i
      where i.id = import_id and i.user_id = auth.uid()
    )
  );

create policy "Import errors manageable by owner"
  on public.import_errors
  for all
  using (
    exists (
      select 1
      from public.imports i
      where i.id = import_id and i.user_id = auth.uid()
    )
  )
  with check (
    exists (
      select 1
      from public.imports i
      where i.id = import_id and i.user_id = auth.uid()
    )
  );

create policy "Audit log visible by owner"
  on public.audit_link_events
  for select
  using (user_id = auth.uid());

comment on table public.profiles is 'User profile settings synced with auth.users';
comment on table public.links is 'Stored links for each profile';
comment on table public.tags is 'User-defined tags for links';
comment on table public.link_tags is 'Join table connecting links and tags';
comment on table public.imports is 'Import jobs and progress metadata';
comment on table public.import_errors is 'Detailed import errors per job';
comment on table public.audit_link_events is 'Audit trail for link operations';

create or replace view public.links_with_tags as
select
  l.id,
  l.user_id,
  l.url,
  l.title,
  l.comment,
  l.fav_icon_path,
  l.metadata_source,
  l.created_at,
  l.updated_at,
  coalesce(array_agg(t.id order by t.name) filter (where t.id is not null), '{}'::uuid[]) as tag_ids,
  coalesce(array_agg(t.name order by t.name) filter (where t.id is not null), '{}'::text[]) as tag_names,
  coalesce(array_agg(t.color order by t.name) filter (where t.id is not null), '{}'::text[]) as tag_colors,
  (
    setweight(to_tsvector('simple', coalesce(l.title, '')), 'A') ||
    setweight(to_tsvector('simple', coalesce(l.comment, '')), 'B') ||
    setweight(to_tsvector('simple', coalesce(l.url, '')), 'C') ||
    setweight(
      to_tsvector(
        'simple',
        coalesce(string_agg(t.name order by t.name, ' ') filter (where t.id is not null), '')
      ),
      'B'
    )
  ) as search_vector
from public.links l
left join public.link_tags lt on lt.link_id = l.id
left join public.tags t on t.id = lt.tag_id
group by l.id;

comment on view public.links_with_tags is
  'Aggregated representation of links with tag metadata and a search vector for filtering.';

create or replace function public.search_links(
  p_search text default null,
  p_tag_ids uuid[] default null,
  p_sort text default 'created_at',
  p_order text default 'desc',
  p_page integer default 1,
  p_page_size integer default 20,
  p_date_from timestamptz default null,
  p_date_to timestamptz default null
)
returns jsonb
language plpgsql
stable
set search_path = public
as $$
declare
  normalized_sort text;
  normalized_order text;
  limit_value integer;
  page_number integer;
  offset_value integer;
  search_term text;
  filter_tag_ids uuid[];
  payload jsonb;
begin
  normalized_sort := case when lower(coalesce(p_sort, '')) = 'title' then 'title' else 'created_at' end;
  normalized_order := case when lower(coalesce(p_order, '')) = 'asc' then 'asc' else 'desc' end;
  limit_value := greatest(1, least(500, coalesce(p_page_size, 20)));
  page_number := greatest(1, coalesce(p_page, 1));
  offset_value := (page_number - 1) * limit_value;
  filter_tag_ids := coalesce(p_tag_ids, '{}');
  search_term := nullif(trim(coalesce(p_search, '')), '');

  with base as (
    select
      l.id,
      l.user_id,
      l.url,
      l.title,
      l.comment,
      l.fav_icon_path,
      l.metadata_source,
      l.created_at,
      l.updated_at,
      l.tag_ids,
      l.tag_names,
      l.tag_colors,
      l.search_vector
    from public.links_with_tags l
    where l.user_id = auth.uid()
      and (p_date_from is null or l.created_at >= p_date_from)
      and (p_date_to is null or l.created_at <= p_date_to)
  ),
  filtered as (
    select *
    from base
    where (
      coalesce(array_length(filter_tag_ids, 1), 0) = 0
      or tag_ids @> filter_tag_ids
    )
      and (
        search_term is null
        or search_term = ''
        or (
          search_vector @@ plainto_tsquery('simple', search_term)
          or url ilike '%' || search_term || '%'
          or exists (
            select 1 from unnest(tag_names) as tag_name
            where tag_name ilike '%' || search_term || '%'
          )
        )
      )
  ),
  total_count as (
    select count(*)::bigint as value from filtered
  ),
  paginated as (
    select
      filtered.id,
      filtered.user_id,
      filtered.url,
      filtered.title,
      filtered.comment,
      filtered.fav_icon_path,
      filtered.metadata_source,
      filtered.created_at,
      filtered.updated_at,
      filtered.tag_ids,
      filtered.tag_names,
      filtered.tag_colors
    from filtered
    order by
      case when normalized_sort = 'title' and normalized_order = 'asc' then filtered.title end asc,
      case when normalized_sort = 'title' and normalized_order = 'desc' then filtered.title end desc,
      case when normalized_sort = 'created_at' and normalized_order = 'asc' then filtered.created_at end asc,
      case when normalized_sort = 'created_at' and normalized_order = 'desc' then filtered.created_at end desc,
      filtered.created_at desc,
      filtered.id asc
    limit limit_value
    offset offset_value
  ),
  items_json as (
    select coalesce(jsonb_agg(row_to_json(paginated)), '[]'::jsonb) as items from paginated
  )
  select jsonb_build_object(
      'items', items_json.items,
      'total', total_count.value,
      'page', page_number,
      'perPage', limit_value
    )
  into payload
  from items_json, total_count;

  if payload is null then
    payload := jsonb_build_object(
      'items', '[]'::jsonb,
      'total', 0,
      'page', page_number,
      'perPage', limit_value
    );
  end if;

  return payload;
end;
$$;

comment on function public.search_links(
  p_search text,
  p_tag_ids uuid[],
  p_sort text,
  p_order text,
  p_page integer,
  p_page_size integer,
  p_date_from timestamptz,
  p_date_to timestamptz
) is 'Return paginated links with aggregated tags applying search, filters and pagination for the authenticated user.';

grant select on public.links_with_tags to authenticated;
grant execute on function public.search_links(
  p_search text,
  p_tag_ids uuid[],
  p_sort text,
  p_order text,
  p_page integer,
  p_page_size integer,
  p_date_from timestamptz,
  p_date_to timestamptz
) to authenticated;

