-- Monitoring and observability support
set check_function_bodies = off;

create table if not exists public.monitoring_events (
  id uuid primary key default gen_random_uuid(),
  event_type text not null,
  payload jsonb not null,
  created_at timestamptz not null default now()
);

comment on table public.monitoring_events is 'Application monitoring log: web vitals, client errors, performance metrics.';
comment on column public.monitoring_events.event_type is 'Event category (web_vital, client_error, search_performance, etc).';
comment on column public.monitoring_events.payload is 'Structured payload with event details and optional context.';

create index if not exists monitoring_events_created_at_idx on public.monitoring_events using btree (created_at desc);

alter table public.monitoring_events enable row level security;
