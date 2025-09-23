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

