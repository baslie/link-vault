-- Admin dashboard aggregates: views and summary function
set check_function_bodies = off;

create or replace view public.admin_links_by_user as
select
  p.id as user_id,
  coalesce(nullif(trim(p.display_name), ''), p.email, '—') as display_name,
  p.email,
  count(l.id) as links_count
from public.profiles p
left join public.links l on l.user_id = p.id
group by p.id, p.display_name, p.email
order by count(l.id) desc, coalesce(nullif(trim(p.display_name), ''), p.email, '—');

comment on view public.admin_links_by_user is
  'Aggregated count of links per user for admin dashboards.';

create or replace view public.admin_activity_by_day as
select
  date_trunc('day', l.created_at)::date as activity_date,
  count(l.id) as links_count
from public.links l
group by date_trunc('day', l.created_at)
order by date_trunc('day', l.created_at) desc;

comment on view public.admin_activity_by_day is
  'Daily aggregation of created links for admin dashboards.';

create or replace view public.admin_popular_tags as
select
  t.name as tag_name,
  t.color,
  count(lt.link_id) as usage_count
from public.tags t
left join public.link_tags lt on lt.tag_id = t.id
group by t.id, t.name, t.color
order by count(lt.link_id) desc, t.name asc;

comment on view public.admin_popular_tags is
  'Tag popularity aggregated across all users for admin dashboards.';

create or replace function public.admin_dashboard_summary()
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  is_admin boolean;
  total_users integer;
  total_links integer;
  average_links numeric;
  payload jsonb;
begin
  is_admin := coalesce(auth.jwt() ->> 'role', '') = 'admin';
  if not is_admin then
    raise exception 'Access denied' using errcode = '42501';
  end if;

  select count(*) into total_users from public.profiles;
  select count(*) into total_links from public.links;
  if total_users = 0 then
    average_links := 0;
  else
    average_links := round(total_links::numeric / greatest(total_users, 1), 2);
  end if;

  select jsonb_build_object(
    'totalUsers', total_users,
    'totalLinks', total_links,
    'averageLinksPerUser', average_links,
    'linksByUser', coalesce(
      (
        select jsonb_agg(
          jsonb_build_object(
            'userId', user_id,
            'displayName', display_name,
            'email', email,
            'linksCount', links_count
          )
        )
        from (
          select user_id, display_name, email, links_count
          from public.admin_links_by_user
          order by links_count desc, display_name asc
          limit 20
        ) ranked
      ),
      '[]'::jsonb
    ),
    'activityByDay', coalesce(
      (
        select jsonb_agg(
          jsonb_build_object(
            'date', to_char(activity_date, 'YYYY-MM-DD'),
            'linksCount', links_count
          )
          order by to_char(activity_date, 'YYYY-MM-DD')
        )
        from (
          select activity_date, links_count
          from public.admin_activity_by_day
          where activity_date >= (current_date - interval '29 days')
          order by activity_date asc
        ) activity
      ),
      '[]'::jsonb
    ),
    'popularTags', coalesce(
      (
        select jsonb_agg(
          jsonb_build_object(
            'tagName', tag_name,
            'color', color,
            'usageCount', usage_count
          )
          order by usage_count desc, tag_name asc
        )
        from (
          select tag_name, color, usage_count
          from public.admin_popular_tags
          order by usage_count desc, tag_name asc
          limit 12
        ) popular
      ),
      '[]'::jsonb
    )
  ) into payload;

  return payload;
end;
$$;

grant execute on function public.admin_dashboard_summary to authenticated;
