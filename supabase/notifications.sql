-- ════════════════════════════════════════════════════════════════════════
-- In-app notification inbox + privacy-safe Web Push delivery.
--
-- Run this in the Supabase SQL editor (safe to re-run; upgrades in place).
-- Depends on: community_schema.sql (groups, group_members, community_prayers,
-- community_updates, friend_requests, group_invitations, testimonies) and
-- push_notifications.sql (push_subscriptions) and user_settings.sql.
--
-- PRIVACY CONTRACT (mirrors supabase/functions/_shared/notify.ts): a durable
-- notification row and its Web Push payload carry ONLY identifiers and routing
-- info — never decrypted prayer titles, descriptions, update text, testimony
-- text or person names. All prayer content stays end-to-end encrypted; these
-- rows point at content, they never copy it.
--
-- SECURITY MODEL:
--   • Clients may SELECT their own notifications and update only seen_at/read_at
--     on them (column-level GRANT + RLS). They cannot INSERT rows, change the
--     recipient/actor, or move delivery status — those happen only inside the
--     SECURITY DEFINER trigger/RPC functions below (or via the service role).
--   • Every function pins search_path='' and fully-qualifies table names so a
--     malicious search_path cannot redirect it.
--   • Notification-creating triggers swallow their own errors so a notification
--     failure can never break the underlying action (sending a friend request,
--     posting an update, …).
-- ════════════════════════════════════════════════════════════════════════

-- ── 1. Notifications table ──────────────────────────────────────────────────
create table if not exists public.notifications (
  id            uuid primary key default gen_random_uuid(),

  recipient_id  uuid not null references auth.users(id) on delete cascade,
  actor_id      uuid references auth.users(id) on delete set null,

  type          text not null,

  group_id      uuid references public.groups(id) on delete cascade,

  entity_type   text not null,
  entity_id     uuid,

  metadata      jsonb not null default '{}'::jsonb,

  dedupe_key    text,

  created_at    timestamptz not null default now(),
  seen_at       timestamptz,
  read_at       timestamptz,

  push_status   text not null default 'pending'
                  check (push_status in ('pending','processing','sent','failed','skipped')),
  push_attempts integer not null default 0,
  last_push_error text,
  pushed_at     timestamptz,

  constraint notifications_type_check check (type in (
    'friend_request','group_invitation','community_update','answered',
    'reaction_bucket','group_prayer_added','testimony','membership_change','role_change'
  ))
);

-- Recipient inbox, newest first.
create index if not exists notifications_recipient_created_idx
  on public.notifications (recipient_id, created_at desc);
-- Unread badge / filtered inbox.
create index if not exists notifications_unread_idx
  on public.notifications (recipient_id) where read_at is null;
-- Retry-worker scan (see claim_notifications_for_delivery).
create index if not exists notifications_push_pending_idx
  on public.notifications (push_status, created_at) where push_status in ('pending','failed');
-- Deduplication: at most one row per (recipient, dedupe_key).
create unique index if not exists notifications_dedupe_idx
  on public.notifications (recipient_id, dedupe_key) where dedupe_key is not null;

alter table public.notifications enable row level security;

-- Lock the table down, then re-grant the narrow client surface. Column-level
-- UPDATE means an authenticated user can only ever touch seen_at / read_at, even
-- though the RLS policy would otherwise allow updating the whole (own) row.
revoke all on public.notifications from anon, authenticated;
grant select on public.notifications to authenticated;
grant update (seen_at, read_at) on public.notifications to authenticated;

drop policy if exists "read own notifications" on public.notifications;
create policy "read own notifications" on public.notifications
  for select using (recipient_id = auth.uid());

drop policy if exists "update own notification read state" on public.notifications;
create policy "update own notification read state" on public.notifications
  for update using (recipient_id = auth.uid()) with check (recipient_id = auth.uid());
-- No INSERT/DELETE policy → clients cannot forge or delete notifications.
-- Rows are created by the SECURITY DEFINER triggers below; deletion is by
-- cascade (recipient/group removed) only.

-- Realtime: publish the table so the client inbox receives live INSERT/UPDATE
-- events (RLS still applies — each user only receives their own rows).
do $$
begin
  alter publication supabase_realtime add table public.notifications;
exception when duplicate_object then null;
end $$;

-- ── 2. Account notification preferences ─────────────────────────────────────
-- One row per (user, type, group). Precedence when resolving a notification:
--   group override (type + group_id)  →  type default (type, group null)  →
--   account default (type '_account', group null)  →  built-in default.
-- Quiet hours + IANA timezone live on the '_account' row (they are account-wide,
-- not per-type). Kept SEPARATE from push_subscriptions so notification-type
-- preferences are never duplicated across a user's devices.
create table if not exists public.notification_preferences (
  id            uuid primary key default gen_random_uuid(),
  user_id       uuid not null references auth.users(id) on delete cascade,
  type          text not null default '_account',
  group_id      uuid references public.groups(id) on delete cascade,
  in_app_enabled boolean not null default true,
  push_enabled   boolean not null default true,
  delivery_mode  text not null default 'immediate'
                   check (delivery_mode in ('immediate','digest','off')),
  quiet_hours_start time,
  quiet_hours_end   time,
  timezone       text,   -- IANA, e.g. 'Europe/Berlin'
  updated_at     timestamptz not null default now()
);

create unique index if not exists notification_preferences_scope_idx
  on public.notification_preferences
     (user_id, type, coalesce(group_id, '00000000-0000-0000-0000-000000000000'::uuid));

alter table public.notification_preferences enable row level security;
revoke all on public.notification_preferences from anon, authenticated;
grant select, insert, update, delete on public.notification_preferences to authenticated;

drop policy if exists "manage own notif prefs" on public.notification_preferences;
create policy "manage own notif prefs" on public.notification_preferences
  for all using (user_id = auth.uid()) with check (user_id = auth.uid());

-- ── 3. Per-prayer follow subscriptions ──────────────────────────────────────
-- Lets a user follow an individual community prayer for updates / answered /
-- testimony notifications (the prayer's owner is always notified of updates; a
-- follower opts in on top of that).
create table if not exists public.prayer_notification_subscriptions (
  user_id            uuid not null references auth.users(id) on delete cascade,
  community_prayer_id uuid not null references public.community_prayers(id) on delete cascade,
  notify_updates     boolean not null default true,
  notify_answered    boolean not null default true,
  notify_testimonies boolean not null default true,
  created_at         timestamptz not null default now(),
  primary key (user_id, community_prayer_id)
);

alter table public.prayer_notification_subscriptions enable row level security;
revoke all on public.prayer_notification_subscriptions from anon, authenticated;
grant select, insert, update, delete on public.prayer_notification_subscriptions to authenticated;

drop policy if exists "read own prayer follows" on public.prayer_notification_subscriptions;
create policy "read own prayer follows" on public.prayer_notification_subscriptions
  for select using (user_id = auth.uid());

-- A user may only follow prayers in groups they belong to (get_my_group_ids is
-- the same SECURITY DEFINER helper the community RLS uses — avoids recursion).
drop policy if exists "follow prayers in my groups" on public.prayer_notification_subscriptions;
create policy "follow prayers in my groups" on public.prayer_notification_subscriptions
  for insert with check (
    user_id = auth.uid()
    and community_prayer_id in (
      select id from public.community_prayers where group_id in (select public.get_my_group_ids())
    )
  );

drop policy if exists "update own prayer follows" on public.prayer_notification_subscriptions;
create policy "update own prayer follows" on public.prayer_notification_subscriptions
  for update using (user_id = auth.uid()) with check (user_id = auth.uid());

drop policy if exists "unfollow own prayers" on public.prayer_notification_subscriptions;
create policy "unfollow own prayers" on public.prayer_notification_subscriptions
  for delete using (user_id = auth.uid());

-- ── 4. IANA timezone columns (replace numeric offset as the primary rep) ─────
-- Kept ALONGSIDE the legacy tz_offset for backward compatibility with the
-- existing reminder schedulers. New code should prefer the IANA timezone so
-- quiet hours / digests / scheduling stay correct across DST.
alter table public.push_subscriptions add column if not exists timezone text;
alter table public.user_settings     add column if not exists timezone text;

-- ── 5. Preference resolution (used by triggers AND the Edge Function) ────────
create or replace function public.resolve_notification_pref(p_user uuid, p_type text, p_group uuid)
returns table (in_app boolean, push boolean, mode text, quiet_start time, quiet_end time, tz text)
language plpgsql
stable
security definer
set search_path = ''
as $$
declare
  r_group public.notification_preferences;
  r_type  public.notification_preferences;
  r_acct  public.notification_preferences;
begin
  if p_group is not null then
    select * into r_group from public.notification_preferences
      where user_id = p_user and type = p_type and group_id = p_group limit 1;
  end if;
  select * into r_type from public.notification_preferences
    where user_id = p_user and type = p_type and group_id is null limit 1;
  select * into r_acct from public.notification_preferences
    where user_id = p_user and type = '_account' and group_id is null limit 1;

  in_app := coalesce(r_group.in_app_enabled, r_type.in_app_enabled, r_acct.in_app_enabled, true);
  push   := coalesce(r_group.push_enabled,  r_type.push_enabled,  r_acct.push_enabled,  true);
  mode   := coalesce(r_group.delivery_mode, r_type.delivery_mode, r_acct.delivery_mode, 'immediate');
  quiet_start := r_acct.quiet_hours_start;
  quiet_end   := r_acct.quiet_hours_end;
  tz          := coalesce(r_acct.timezone, (
    select s.timezone from public.user_settings s where s.user_id = p_user
  ));
  return next;
end;
$$;

-- Whether a durable notification of this type should be created at all.
create or replace function public.notif_should_create(p_user uuid, p_type text, p_group uuid)
returns boolean
language plpgsql
stable
security definer
set search_path = ''
as $$
declare pref record;
begin
  select * into pref from public.resolve_notification_pref(p_user, p_type, p_group);
  if pref.mode = 'off' then return false; end if;          -- type switched off entirely
  if pref.in_app = false and pref.push = false then return false; end if; -- nothing to deliver
  return true;
end;
$$;

-- Central, safe insert used by every event trigger. Excludes the actor, honours
-- preferences, and dedupes. Swallows any error so a notification failure can
-- never break the caller's transaction.
create or replace function public.create_notification(
  p_recipient uuid, p_actor uuid, p_type text, p_group uuid,
  p_entity_type text, p_entity_id uuid, p_metadata jsonb, p_dedupe text
) returns void
language plpgsql
security definer
set search_path = ''
as $$
begin
  if p_recipient is null then return; end if;
  if p_actor is not null and p_actor = p_recipient then return; end if;  -- never notify self
  if not public.notif_should_create(p_recipient, p_type, p_group) then return; end if;

  insert into public.notifications
    (recipient_id, actor_id, type, group_id, entity_type, entity_id, metadata, dedupe_key)
  values
    (p_recipient, p_actor, p_type, p_group, p_entity_type, p_entity_id,
     coalesce(p_metadata, '{}'::jsonb), p_dedupe)
  on conflict (recipient_id, dedupe_key) where dedupe_key is not null do nothing;
exception when others then
  -- Never let notification bookkeeping break the underlying action.
  raise warning 'create_notification failed (% → %): %', p_type, p_recipient, sqlerrm;
end;
$$;

-- These are internal machinery — no client role should call them directly.
revoke all on function public.resolve_notification_pref(uuid, text, uuid) from public;
revoke all on function public.notif_should_create(uuid, text, uuid) from public;
revoke all on function public.create_notification(uuid, uuid, text, uuid, text, uuid, jsonb, text) from public;
grant execute on function public.resolve_notification_pref(uuid, text, uuid) to service_role;

-- ── 6. Event triggers ───────────────────────────────────────────────────────

-- 6a. Friend request received.
create or replace function public.tg_notify_friend_request()
returns trigger language plpgsql security definer set search_path = '' as $$
begin
  perform public.create_notification(
    new.to_user_id, new.from_user_id, 'friend_request', null,
    'friend_request', new.id,
    jsonb_build_object('from_user_id', new.from_user_id),
    'friend-request:' || new.id::text || ':' || new.to_user_id::text
  );
  return new;
exception when others then
  raise warning 'tg_notify_friend_request: %', sqlerrm;
  return new;
end; $$;

drop trigger if exists notify_friend_request on public.friend_requests;
create trigger notify_friend_request after insert on public.friend_requests
  for each row execute function public.tg_notify_friend_request();

-- 6b. Group invitation received.
create or replace function public.tg_notify_group_invitation()
returns trigger language plpgsql security definer set search_path = '' as $$
begin
  perform public.create_notification(
    new.invited_user_id, new.invited_by, 'group_invitation', new.group_id,
    'group_invitation', new.id,
    jsonb_build_object('group_id', new.group_id),
    'group-invitation:' || new.id::text || ':' || new.invited_user_id::text
  );
  return new;
exception when others then
  raise warning 'tg_notify_group_invitation: %', sqlerrm;
  return new;
end; $$;

drop trigger if exists notify_group_invitation on public.group_invitations;
create trigger notify_group_invitation after insert on public.group_invitations
  for each row execute function public.tg_notify_group_invitation();

-- 6c. Update posted on a community prayer → notify the prayer's owner and any
--     followers (never the actor).
create or replace function public.tg_notify_community_update()
returns trigger language plpgsql security definer set search_path = '' as $$
declare
  v_owner uuid;
  v_group uuid;
  v_actor uuid := new.user_id;
  r record;
begin
  select user_id, group_id into v_owner, v_group
  from public.community_prayers where id = new.community_prayer_id;

  perform public.create_notification(
    v_owner, v_actor, 'community_update', v_group,
    'community_prayer', new.community_prayer_id,
    jsonb_build_object('group_id', v_group, 'community_prayer_id', new.community_prayer_id, 'update_id', new.id),
    'community-update:' || new.id::text || ':' || coalesce(v_owner::text, 'none')
  );

  for r in
    select s.user_id from public.prayer_notification_subscriptions s
    where s.community_prayer_id = new.community_prayer_id
      and s.notify_updates = true
      and s.user_id is distinct from v_owner
  loop
    perform public.create_notification(
      r.user_id, v_actor, 'community_update', v_group,
      'community_prayer', new.community_prayer_id,
      jsonb_build_object('group_id', v_group, 'community_prayer_id', new.community_prayer_id, 'update_id', new.id),
      'community-update:' || new.id::text || ':' || r.user_id::text
    );
  end loop;
  return new;
exception when others then
  raise warning 'tg_notify_community_update: %', sqlerrm;
  return new;
end; $$;

drop trigger if exists notify_community_update on public.community_updates;
create trigger notify_community_update after insert on public.community_updates
  for each row execute function public.tg_notify_community_update();

-- 6d. Community prayer marked answered → notify followers, only on the
--     not-answered → answered transition. The dedupe key makes it fire at most
--     once per follower even if the prayer is toggled answered/active/answered.
create or replace function public.tg_notify_answered()
returns trigger language plpgsql security definer set search_path = '' as $$
declare
  v_actor uuid := auth.uid();
  r record;
begin
  if new.is_answered = true and coalesce(old.is_answered, false) = false then
    for r in
      select s.user_id from public.prayer_notification_subscriptions s
      where s.community_prayer_id = new.id and s.notify_answered = true
    loop
      perform public.create_notification(
        r.user_id, v_actor, 'answered', new.group_id,
        'community_prayer', new.id,
        jsonb_build_object('group_id', new.group_id, 'community_prayer_id', new.id),
        'answered:' || new.id::text || ':' || r.user_id::text
      );
    end loop;
  end if;
  return new;
exception when others then
  raise warning 'tg_notify_answered: %', sqlerrm;
  return new;
end; $$;

drop trigger if exists notify_answered on public.community_prayers;
create trigger notify_answered after update of is_answered on public.community_prayers
  for each row execute function public.tg_notify_answered();

-- 6e. Meaningful group membership / role change → notify the affected member
--     (never for a self-initiated join).
create or replace function public.tg_notify_membership()
returns trigger language plpgsql security definer set search_path = '' as $$
declare v_actor uuid := auth.uid();
begin
  if tg_op = 'INSERT' then
    if v_actor is not null and v_actor <> new.user_id then
      perform public.create_notification(
        new.user_id, v_actor, 'membership_change', new.group_id,
        'group', new.group_id,
        jsonb_build_object('group_id', new.group_id, 'role', new.role, 'change', 'added'),
        'membership-added:' || new.group_id::text || ':' || new.user_id::text
      );
    end if;
  elsif tg_op = 'UPDATE' then
    if new.role is distinct from old.role then
      perform public.create_notification(
        new.user_id, v_actor, 'role_change', new.group_id,
        'group', new.group_id,
        jsonb_build_object('group_id', new.group_id, 'role', new.role, 'previous_role', old.role, 'change', 'role'),
        'role-change:' || new.group_id::text || ':' || new.user_id::text || ':' || new.role
      );
    end if;
  end if;
  return new;
exception when others then
  raise warning 'tg_notify_membership: %', sqlerrm;
  return new;
end; $$;

drop trigger if exists notify_membership on public.group_members;
create trigger notify_membership after insert or update on public.group_members
  for each row execute function public.tg_notify_membership();

-- ── 7. Delivery claiming (concurrency-safe, service-role only) ───────────────
-- FOR UPDATE SKIP LOCKED so two workers (webhook + retry cron) never deliver the
-- same notification. Only pending/failed rows under the attempt + age caps are
-- claimable; claiming flips them to 'processing' so a duplicate invocation gets
-- an empty set (idempotency).
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
  returning n.*;
end; $$;

-- Records the outcome of a delivery attempt.
create or replace function public.finish_notification_delivery(
  p_id uuid, p_status text, p_error text default null, p_increment boolean default true
) returns void
language plpgsql
security definer
set search_path = ''
as $$
begin
  update public.notifications
  set push_status   = p_status,
      last_push_error = p_error,
      push_attempts = push_attempts + case when p_increment then 1 else 0 end,
      pushed_at     = case when p_status = 'sent' then now() else pushed_at end
  where id = p_id;
end; $$;

revoke all on function public.claim_notifications_for_delivery(int) from public;
revoke all on function public.claim_notification(uuid) from public;
revoke all on function public.finish_notification_delivery(uuid, text, text, boolean) from public;
grant execute on function public.claim_notifications_for_delivery(int) to service_role;
grant execute on function public.claim_notification(uuid) to service_role;
grant execute on function public.finish_notification_delivery(uuid, text, text, boolean) to service_role;

-- ── 8. Retry backstop (pg_cron + pg_net) ────────────────────────────────────
-- Runs every 5 minutes and asks the Edge Function to claim & deliver any
-- pending/failed notifications (< 5 attempts, < 24h old). This alone delivers
-- everything; the optional Database Webhook (see docs/notifications.md) just
-- makes the FIRST attempt near-instant. Row claiming above keeps the two from
-- double-sending.
-- ⚠️  Prerequisite: run supabase/_cron_secrets.sql once (stores project_url +
--     notify_fn_secret in Vault). The cron body reads them at run time.
create extension if not exists pg_cron;
create extension if not exists pg_net;

select cron.unschedule('retry-event-notifications')
  where exists (select 1 from cron.job where jobname = 'retry-event-notifications');

select cron.schedule(
  'retry-event-notifications',
  '*/5 * * * *',
  $CRON$
  select net.http_post(
    url     := (select decrypted_secret from vault.decrypted_secrets where name = 'project_url')
               || '/functions/v1/send-event-notifications',
    headers := jsonb_build_object(
      'Content-Type', 'application/json',
      'Authorization', 'Bearer ' || (select decrypted_secret from vault.decrypted_secrets where name = 'notify_fn_secret')
    ),
    body    := '{}'::jsonb
  );
  $CRON$
);

-- ════════════════════════════════════════════════════════════════════════
-- Section 10 — Aggregation + digest follow-ups
--   • reaction_bucket : "I'm praying" reactions aggregated into a time bucket
--   • group_prayer_added : a new prayer shared to a group
--   • testimony : a testimony shared to a group / followed prayer
--   • digest batching : delivery_mode='digest' defers push into one summary
-- Idempotent (safe to re-run). Requires Sections 1–9 above.
-- ════════════════════════════════════════════════════════════════════════

-- 10a. Digest bookkeeping column: when a digest-mode notification's push has been
--      folded into a summary, digested_at is stamped so it is never re-sent.
alter table public.notifications add column if not exists digested_at timestamptz;

-- Scan support for the digest builder.
create index if not exists notifications_digest_pending_idx
  on public.notifications (recipient_id)
  where digested_at is null and last_push_error = 'digest';

-- 10b. Type-aware default delivery mode: the "aggregated / preference-controlled"
--      types default to digest (batched push) to keep them quiet by default; all
--      other types stay immediate. Explicit preference rows always win.
create or replace function public.default_delivery_mode(p_type text)
returns text
language sql
immutable
as $$
  select case when p_type in ('group_prayer_added','testimony') then 'digest' else 'immediate' end;
$$;

-- Re-defines resolve_notification_pref (Section 5) to use the type-aware default.
create or replace function public.resolve_notification_pref(p_user uuid, p_type text, p_group uuid)
returns table (in_app boolean, push boolean, mode text, quiet_start time, quiet_end time, tz text)
language plpgsql
stable
security definer
set search_path = ''
as $$
declare
  r_group public.notification_preferences;
  r_type  public.notification_preferences;
  r_acct  public.notification_preferences;
begin
  if p_group is not null then
    select * into r_group from public.notification_preferences
      where user_id = p_user and type = p_type and group_id = p_group limit 1;
  end if;
  select * into r_type from public.notification_preferences
    where user_id = p_user and type = p_type and group_id is null limit 1;
  select * into r_acct from public.notification_preferences
    where user_id = p_user and type = '_account' and group_id is null limit 1;

  in_app := coalesce(r_group.in_app_enabled, r_type.in_app_enabled, r_acct.in_app_enabled, true);
  push   := coalesce(r_group.push_enabled,  r_type.push_enabled,  r_acct.push_enabled,  true);
  mode   := coalesce(r_group.delivery_mode, r_type.delivery_mode, r_acct.delivery_mode,
                     public.default_delivery_mode(p_type));
  quiet_start := r_acct.quiet_hours_start;
  quiet_end   := r_acct.quiet_hours_end;
  tz          := coalesce(r_acct.timezone, (
    select s.timezone from public.user_settings s where s.user_id = p_user
  ));
  return next;
end;
$$;
revoke all on function public.resolve_notification_pref(uuid, text, uuid) from public;
grant execute on function public.resolve_notification_pref(uuid, text, uuid) to service_role;

-- 10c. Reactions ("I'm praying") aggregated into an hourly bucket → notify the
--      prayer owner at most once per bucket (dedupe_key carries the bucket, so
--      later reactions in the same hour create no new row and no extra push).
--      Reaction REMOVAL never notifies (trigger is INSERT-only).
create or replace function public.tg_notify_reaction()
returns trigger language plpgsql security definer set search_path = '' as $$
declare
  v_owner uuid;
  v_group uuid;
  v_bucket text := to_char(date_trunc('hour', now() at time zone 'utc'), 'YYYYMMDDHH24');
begin
  select user_id, group_id into v_owner, v_group
  from public.community_prayers where id = new.community_prayer_id;

  perform public.create_notification(
    v_owner, new.user_id, 'reaction_bucket', v_group,
    'community_prayer', new.community_prayer_id,
    jsonb_build_object('group_id', v_group, 'community_prayer_id', new.community_prayer_id),
    'reaction-bucket:' || new.community_prayer_id::text || ':' || coalesce(v_owner::text, 'none') || ':' || v_bucket
  );
  return new;
exception when others then
  raise warning 'tg_notify_reaction: %', sqlerrm;
  return new;
end; $$;

drop trigger if exists notify_reaction on public.prayer_reactions;
create trigger notify_reaction after insert on public.prayer_reactions
  for each row execute function public.tg_notify_reaction();

-- 10d. New community prayer shared to a group → notify every member but the
--      author (a "watched group" is a group you belong to).
create or replace function public.tg_notify_group_prayer_added()
returns trigger language plpgsql security definer set search_path = '' as $$
declare r record;
begin
  for r in
    select gm.user_id from public.group_members gm
    where gm.group_id = new.group_id and gm.user_id is distinct from new.user_id
  loop
    perform public.create_notification(
      r.user_id, new.user_id, 'group_prayer_added', new.group_id,
      'community_prayer', new.id,
      jsonb_build_object('group_id', new.group_id, 'community_prayer_id', new.id),
      'group-prayer-added:' || new.id::text || ':' || r.user_id::text
    );
  end loop;
  return new;
exception when others then
  raise warning 'tg_notify_group_prayer_added: %', sqlerrm;
  return new;
end; $$;

drop trigger if exists notify_group_prayer_added on public.community_prayers;
create trigger notify_group_prayer_added after insert on public.community_prayers
  for each row execute function public.tg_notify_group_prayer_added();

-- 10e. Testimony shared to a group / followed prayer → notify every member but
--      the author. Members ⊇ followers, so a "followed prayer" testimony reaches
--      followers too; metadata carries the linked prayer (may be null → routes to
--      the group).
create or replace function public.tg_notify_testimony()
returns trigger language plpgsql security definer set search_path = '' as $$
declare r record;
begin
  for r in
    select gm.user_id from public.group_members gm
    where gm.group_id = new.group_id and gm.user_id is distinct from new.user_id
  loop
    perform public.create_notification(
      r.user_id, new.user_id, 'testimony', new.group_id,
      'testimony', new.id,
      jsonb_build_object('group_id', new.group_id, 'community_prayer_id', new.community_prayer_id),
      'testimony:' || new.id::text || ':' || r.user_id::text
    );
  end loop;
  return new;
exception when others then
  raise warning 'tg_notify_testimony: %', sqlerrm;
  return new;
end; $$;

drop trigger if exists notify_testimony on public.testimonies;
create trigger notify_testimony after insert on public.testimonies
  for each row execute function public.tg_notify_testimony();

-- 10f. Digest builder RPCs (service-role only).
-- Recipients with undelivered, unread digest notifications waiting to be summarized.
create or replace function public.pending_digest_recipients(p_limit int default 200)
returns table (recipient_id uuid)
language sql
security definer
set search_path = ''
as $$
  select distinct n.recipient_id
  from public.notifications n
  where n.push_status = 'skipped'
    and n.last_push_error = 'digest'
    and n.digested_at is null
    and n.read_at is null
  limit p_limit;
$$;

-- Atomically claims one user's pending digest batch (stamps digested_at so a
-- concurrent worker gets nothing) and returns the claimed rows. The caller sends
-- ONE summary push for however many rows come back.
create or replace function public.claim_user_digest(p_recipient uuid)
returns setof public.notifications
language plpgsql
security definer
set search_path = ''
as $$
begin
  return query
  update public.notifications n
  set digested_at = now()
  where n.recipient_id = p_recipient
    and n.push_status = 'skipped'
    and n.last_push_error = 'digest'
    and n.digested_at is null
    and n.read_at is null
  returning n.*;
end; $$;

revoke all on function public.default_delivery_mode(text) from public;
revoke all on function public.pending_digest_recipients(int) from public;
revoke all on function public.claim_user_digest(uuid) from public;
grant execute on function public.pending_digest_recipients(int) to service_role;
grant execute on function public.claim_user_digest(uuid) to service_role;

-- 10g. Digest cron — hourly. Sends each user their batched summary (respecting
--      quiet hours, inside the Edge Function). Reuses the same function via the
--      { "digest": true } body.
--      ⚠️  Prerequisite: run supabase/_cron_secrets.sql once (stores project_url
--          + notify_fn_secret in Vault). The cron body reads them at run time.
select cron.unschedule('digest-event-notifications')
  where exists (select 1 from cron.job where jobname = 'digest-event-notifications');

select cron.schedule(
  'digest-event-notifications',
  '0 * * * *',
  $CRON$
  select net.http_post(
    url     := (select decrypted_secret from vault.decrypted_secrets where name = 'project_url')
               || '/functions/v1/send-event-notifications',
    headers := jsonb_build_object(
      'Content-Type', 'application/json',
      'Authorization', 'Bearer ' || (select decrypted_secret from vault.decrypted_secrets where name = 'notify_fn_secret')
    ),
    body    := '{"digest": true}'::jsonb
  );
  $CRON$
);
