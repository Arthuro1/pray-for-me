-- App news: tell existing members what a release brought ("What's new").
--
-- Qetoret's Android app is a Trusted Web Activity: every feature ships with the
-- website, so a release reaches everyone at once and the server cannot (and
-- need not) tell which shell version a device runs. An announcement is
-- therefore one 'app_news' notification per existing account:
--
--   select public.queue_app_news('1.0.6');   -- run once, after the deploy
--
-- The inbox row is the in-app card's source (Today shows it while unread) and
-- the push is delivered by send-event-notifications like any other type, so
-- the member's own switches, quiet hours and dedupe all apply. Two things
-- differ from ordinary events:
--
--   • Daytime only. A push goes out between 10:00 and 20:00 in the member's
--     own timezone, never at night. claim_app_news_for_delivery() claims only
--     rows whose recipient is inside that window, for up to three days.
--   • Its own queue. The usual claims skip 'app_news', so a release fanned out
--     to every account can never hold back an invitation or a meeting reminder.
--
-- The copy is fixed product text (eventNotify.ts / appNews.ts): no member
-- content is read or sent. Accounts created after the call get nothing — the
-- whole app is new to them.
--
-- Apply this migration BEFORE deploying the client or the Edge Function.

-- ── 1. The notification type ────────────────────────────────────────────────
alter table public.notifications drop constraint if exists notifications_type_check;
alter table public.notifications add constraint notifications_type_check check (type in (
  'friend_request','group_invitation','community_update','answered',
  'reaction_bucket','group_prayer_added','testimony','membership_change',
  'role_change','plan_invitation','prayer_meeting','app_news'
));

-- ── 2. The usual delivery claims leave app news to its own queue ────────────
create or replace function public.claim_notifications_for_delivery(p_limit int default 20)
returns setof public.notifications
language plpgsql
security definer
set search_path = ''
as $$
begin
  return query
  update public.notifications n
  set push_status = 'processing'
  where n.id in (
    select id from public.notifications
    where push_status in ('pending','failed')
      and push_attempts < 5
      and created_at > now() - interval '24 hours'
      and type <> 'app_news'
    order by created_at
    for update skip locked
    limit p_limit
  )
  returning n.*;
end; $$;

create or replace function public.claim_notification(p_id uuid)
returns setof public.notifications
language plpgsql
security definer
set search_path = ''
as $$
begin
  return query
  update public.notifications n
  set push_status = 'processing'
  where n.id = p_id
    and n.push_status in ('pending','failed')
    and n.push_attempts < 5
    and n.type <> 'app_news'
  returning n.*;
end; $$;

-- ── 3. Daytime for a member ─────────────────────────────────────────────────
-- True when it is between 10:00 and 20:00 for `p_user` at `p_at`. The zone is
-- the one the member chose for quiet hours, else their settings', else their
-- latest device's; an unknown zone name falls back to the device's UTC offset,
-- and a member with neither is treated as UTC.
create or replace function public.app_news_daytime(p_user uuid, p_at timestamptz default now())
returns boolean
language plpgsql
stable
set search_path = ''
as $$
declare
  v_tz text;
  v_offset int;
  v_local time;
begin
  select coalesce(
    (select np.timezone from public.notification_preferences np
      where np.user_id = p_user and np.type = '_account' and np.group_id is null limit 1),
    (select s.timezone from public.user_settings s where s.user_id = p_user),
    (select ps.timezone from public.push_subscriptions ps
      where ps.user_id = p_user and ps.timezone is not null order by ps.updated_at desc limit 1)
  ) into v_tz;

  if v_tz is not null then
    begin
      v_local := (p_at at time zone v_tz)::time;
    exception when others then
      v_local := null;  -- not a zone Postgres knows: use the device offset
    end;
  end if;

  if v_local is null then
    select ps.tz_offset into v_offset from public.push_subscriptions ps
      where ps.user_id = p_user order by ps.updated_at desc limit 1;
    v_local := ((p_at at time zone 'UTC') + make_interval(mins => coalesce(v_offset, 0)))::time;
  end if;

  return v_local >= time '10:00' and v_local < time '20:00';
end;
$$;

-- ── 4. The app news queue ───────────────────────────────────────────────────
-- Claimed every 5 minutes by send-event-notifications. Rows wait (still
-- 'pending') until their member's daytime; after three days an undelivered
-- push is dropped, while the inbox row and the Today card stay.
create or replace function public.claim_app_news_for_delivery(p_limit int default 100, p_at timestamptz default now())
returns setof public.notifications
language plpgsql
security definer
set search_path = ''
as $$
begin
  return query
  update public.notifications n
  set push_status = 'processing'
  where n.id in (
    select x.id from public.notifications x
    where x.type = 'app_news'
      and x.push_status in ('pending','failed')
      and x.push_attempts < 5
      and x.created_at > p_at - interval '3 days'
      and public.app_news_daytime(x.recipient_id, p_at)
    order by x.created_at
    for update skip locked
    limit p_limit
  )
  returning n.*;
end; $$;

-- One announcement per existing account for `p_version` ('1.0.6'). The dedupe
-- key makes a second call for the same version a no-op; create_notification()
-- skips anyone who switched app news off. Returns how many accounts hold the
-- announcement.
create or replace function public.queue_app_news(p_version text)
returns integer
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_dedupe text;
  v_count integer;
  r record;
begin
  if p_version is null or p_version !~ '^\d+\.\d+\.\d+$' then
    raise exception 'app news needs a version such as 1.0.6' using errcode = '22023';
  end if;
  v_dedupe := 'app-news:' || p_version;

  for r in select id from auth.users loop
    perform public.create_notification(
      r.id, null, 'app_news', null,
      'app_release', null,
      jsonb_build_object('version', p_version),
      v_dedupe
    );
  end loop;

  select count(*) into v_count from public.notifications
    where type = 'app_news' and dedupe_key = v_dedupe;
  return v_count;
end;
$$;

revoke all on function public.app_news_daytime(uuid, timestamptz) from public, anon, authenticated;
revoke all on function public.claim_app_news_for_delivery(int, timestamptz) from public, anon, authenticated;
revoke all on function public.queue_app_news(text) from public, anon, authenticated;
grant execute on function public.app_news_daytime(uuid, timestamptz) to service_role;
grant execute on function public.claim_app_news_for_delivery(int, timestamptz) to service_role;
grant execute on function public.queue_app_news(text) to service_role;

notify pgrst, 'reload schema';
