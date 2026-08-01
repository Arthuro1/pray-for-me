-- Community safety primitives. Reports intentionally contain identifiers and a
-- fixed category only; prayer text is never copied into the moderation queue.
create table public.community_reports (
  id uuid primary key default gen_random_uuid(),
  reporter_id uuid not null references auth.users(id) on delete cascade,
  group_id uuid not null references public.groups(id) on delete cascade,
  content_type text not null check (content_type in ('prayer', 'update', 'testimony')),
  content_id uuid not null,
  category text not null check (category in ('privacy', 'spam', 'harassment', 'self_harm', 'child_safety', 'other')),
  status text not null default 'open' check (status in ('open', 'reviewing', 'resolved', 'dismissed', 'escalated')),
  created_at timestamptz not null default now(),
  resolved_at timestamptz,
  unique (reporter_id, content_type, content_id)
);

create index community_reports_group_status_idx
  on public.community_reports(group_id, status, created_at);

alter table public.community_reports enable row level security;
create policy "reporters can see their reports" on public.community_reports
  for select to authenticated using (reporter_id = auth.uid());
create policy "group admins can review reports" on public.community_reports
  for select to authenticated using (exists (
    select 1 from public.group_members m
    where m.group_id = community_reports.group_id
      and m.user_id = auth.uid() and m.role = 'admin'
  ));

create table public.user_blocks (
  blocker_id uuid not null references auth.users(id) on delete cascade,
  blocked_id uuid not null references auth.users(id) on delete cascade,
  created_at timestamptz not null default now(),
  primary key (blocker_id, blocked_id),
  check (blocker_id <> blocked_id)
);

alter table public.user_blocks enable row level security;
create policy "users can see their own blocks" on public.user_blocks
  for select to authenticated using (blocker_id = auth.uid());

-- Private fixed-window counters used by insert triggers and the reporting RPC.
create table public.community_rate_limits (
  user_id uuid not null references auth.users(id) on delete cascade,
  action text not null,
  window_start timestamptz not null,
  hits integer not null check (hits > 0),
  primary key (user_id, action, window_start)
);
alter table public.community_rate_limits enable row level security;

revoke all on public.community_reports, public.user_blocks, public.community_rate_limits
  from public, anon, authenticated;
grant select on public.community_reports, public.user_blocks to authenticated;
grant select, insert, update, delete on public.community_reports, public.user_blocks, public.community_rate_limits to service_role;

create or replace function public.consume_community_rate(
  p_action text,
  p_limit integer,
  p_window_seconds integer
)
returns boolean
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_user uuid := auth.uid();
  v_window timestamptz;
  v_hits integer;
begin
  if v_user is null then return false; end if;
  if p_limit < 1 or p_limit > 1000 or p_window_seconds < 10 or p_window_seconds > 86400 then
    raise exception 'invalid_rate_limit' using errcode = '22023';
  end if;
  v_window := to_timestamp(floor(extract(epoch from now()) / p_window_seconds) * p_window_seconds);

  insert into public.community_rate_limits(user_id, action, window_start, hits)
  values (v_user, p_action, v_window, 1)
  on conflict (user_id, action, window_start) do update
    set hits = public.community_rate_limits.hits + 1
    where public.community_rate_limits.hits < p_limit
  returning hits into v_hits;

  return v_hits is not null;
end;
$$;

create or replace function public.enforce_community_write_rate()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_action text;
  v_limit integer;
begin
  if auth.uid() is null then return new; end if;
  v_action := case tg_table_name
    when 'community_prayers' then 'prayer'
    when 'community_updates' then 'update'
    when 'testimonies' then 'testimony'
    when 'prayer_reactions' then 'reaction'
    else 'unknown'
  end;
  v_limit := case v_action
    when 'prayer' then 5
    when 'testimony' then 5
    when 'update' then 15
    when 'reaction' then 60
    else 1
  end;
  if not public.consume_community_rate(v_action, v_limit, 60) then
    raise exception 'community_rate_limited' using errcode = 'P0001';
  end if;
  return new;
end;
$$;

create trigger rate_limit_community_prayers
  before insert on public.community_prayers
  for each row execute function public.enforce_community_write_rate();
create trigger rate_limit_community_updates
  before insert on public.community_updates
  for each row execute function public.enforce_community_write_rate();
create trigger rate_limit_testimonies
  before insert on public.testimonies
  for each row execute function public.enforce_community_write_rate();
create trigger rate_limit_prayer_reactions
  before insert on public.prayer_reactions
  for each row execute function public.enforce_community_write_rate();

create or replace function public.submit_community_report(
  p_content_type text,
  p_content_id uuid,
  p_category text
)
returns uuid
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_user uuid := auth.uid();
  v_group uuid;
  v_report uuid;
begin
  if v_user is null then raise exception 'not_authenticated' using errcode = '28000'; end if;
  if p_category not in ('privacy', 'spam', 'harassment', 'self_harm', 'child_safety', 'other') then
    raise exception 'invalid_report_category' using errcode = '22023';
  end if;

  if p_content_type = 'prayer' then
    select group_id into v_group from public.community_prayers where id = p_content_id;
  elsif p_content_type = 'update' then
    select p.group_id into v_group
    from public.community_updates u join public.community_prayers p on p.id = u.community_prayer_id
    where u.id = p_content_id;
  elsif p_content_type = 'testimony' then
    select group_id into v_group from public.testimonies where id = p_content_id;
  else
    raise exception 'invalid_report_type' using errcode = '22023';
  end if;

  if v_group is null or not exists (
    select 1 from public.group_members
    where group_id = v_group and user_id = v_user
  ) then
    raise exception 'content_not_visible' using errcode = '42501';
  end if;
  if not public.consume_community_rate('report', 10, 3600) then
    raise exception 'community_rate_limited' using errcode = 'P0001';
  end if;

  insert into public.community_reports(reporter_id, group_id, content_type, content_id, category)
  values (v_user, v_group, p_content_type, p_content_id, p_category)
  on conflict (reporter_id, content_type, content_id) do update
    set category = excluded.category
  returning id into v_report;
  return v_report;
end;
$$;

create or replace function public.set_user_block(p_blocked_user_id uuid, p_blocked boolean)
returns void
language plpgsql
security definer
set search_path = ''
as $$
declare v_user uuid := auth.uid();
begin
  if v_user is null then raise exception 'not_authenticated' using errcode = '28000'; end if;
  if p_blocked_user_id is null or p_blocked_user_id = v_user then
    raise exception 'invalid_block_target' using errcode = '22023';
  end if;
  if p_blocked then
    insert into public.user_blocks(blocker_id, blocked_id)
    values (v_user, p_blocked_user_id) on conflict do nothing;
  else
    delete from public.user_blocks
    where blocker_id = v_user and blocked_id = p_blocked_user_id;
  end if;
end;
$$;

-- Restrictive policies compose with existing group-membership policies and hide
-- content authored by users the viewer blocked without weakening membership RLS.
create policy "blocked prayer authors are hidden" on public.community_prayers
  as restrictive for select to authenticated using (not exists (
    select 1 from public.user_blocks b
    where b.blocker_id = auth.uid() and b.blocked_id = community_prayers.user_id
  ));
create policy "blocked update authors are hidden" on public.community_updates
  as restrictive for select to authenticated using (not exists (
    select 1 from public.user_blocks b
    where b.blocker_id = auth.uid() and b.blocked_id = community_updates.user_id
  ));
create policy "blocked testimony authors are hidden" on public.testimonies
  as restrictive for select to authenticated using (not exists (
    select 1 from public.user_blocks b
    where b.blocker_id = auth.uid() and b.blocked_id = testimonies.user_id
  ));

revoke all on function public.consume_community_rate(text, integer, integer) from public, anon, authenticated;
revoke all on function public.enforce_community_write_rate() from public, anon, authenticated;
revoke all on function public.submit_community_report(text, uuid, text) from public, anon;
revoke all on function public.set_user_block(uuid, boolean) from public, anon;
grant execute on function public.submit_community_report(text, uuid, text) to authenticated;
grant execute on function public.set_user_block(uuid, boolean) to authenticated;
grant execute on function public.consume_community_rate(text, integer, integer), public.enforce_community_write_rate() to service_role;
grant execute on function public.submit_community_report(text, uuid, text), public.set_user_block(uuid, boolean) to service_role;
