-- Group prayer meetings: a group's "we pray together" time, in person or online.
--
-- The app supports the meeting; it isn't the meeting. A group sets a rhythm
-- (the same schedule shape the prayer engine uses: once, daily, weekly, every
-- N days, monthly), a local start time in the scheduler's IANA timezone and a
-- length. Members see the next time in their own timezone, can open the call
-- link (Zoom, Meet, Teams, WhatsApp, Slack…) or read where to meet, and get one
-- reminder shortly before each meeting.
--
-- Privacy: the title, the place, the call link and the notes are encrypted in
-- the browser under the group's content key (communityCrypto, entity
-- "group-meeting"), like the group's prayers. The server stores only the
-- ciphertext and the timing it needs to send reminders — never the link (a call
-- link is an access credential), never where people meet.
--
-- Any member may schedule a meeting; the member who scheduled it or a group
-- admin may change or end it (same rule as group plans).
--
-- Reminders: send-event-notifications (already run every 5 minutes by the
-- retry-event-notifications cron) works out which meetings start soon, using
-- the shared schedule engine, and calls queue_group_meeting_reminder() below,
-- which fans one 'prayer_meeting' notification out to each member through
-- create_notification() — so per-type preferences, quiet hours and dedupe all
-- apply. The push itself carries generic copy only (eventNotify.ts).
--
-- Apply this migration BEFORE deploying the client that writes group_meetings.

-- ── 1. The meetings ──────────────────────────────────────────────────────────
create table if not exists public.group_meetings (
  id                 uuid primary key,                -- client-generated (idempotent writes)
  group_id           uuid not null references public.groups(id) on delete cascade,
  created_by         uuid references auth.users(id) on delete set null,
  schedule           jsonb not null,
  start_time         time not null,                   -- wall-clock time in `timezone`
  timezone           text not null,                   -- IANA, e.g. 'Europe/Paris'
  duration_minutes   smallint not null default 60,
  encrypted_payload  jsonb not null,                  -- { title, mode, place, link, notes } under the GCK
  encryption_version smallint not null,
  key_version        integer not null,
  created_at         timestamptz not null default now(),
  updated_at         timestamptz not null default now(),

  constraint group_meetings_schedule_shape check (
    jsonb_typeof(schedule) = 'object' and (
      (schedule->>'type' = 'once' and coalesce(schedule->>'date', '') ~ '^\d{4}-\d{2}-\d{2}$')
      or (
        schedule->>'type' = 'recurring'
        and schedule->>'freq' in ('daily', 'weekly', 'interval', 'monthly')
        and coalesce(schedule->>'startDate', '') ~ '^\d{4}-\d{2}-\d{2}$'
      )
    )
  ),
  constraint group_meetings_duration check (duration_minutes between 15 and 240),
  -- Fail closed: a row without ciphertext is refused, so a client bug can never
  -- store a call link or an address in the clear.
  constraint group_meetings_encrypted check (
    jsonb_typeof(encrypted_payload) = 'object'
    and encrypted_payload ? 'iv' and encrypted_payload ? 'ct'
  ),
  constraint group_meetings_key_version check (key_version >= 1)
);

create index if not exists group_meetings_group_idx on public.group_meetings (group_id);
create index if not exists group_meetings_created_by_idx on public.group_meetings (created_by);

comment on table public.group_meetings is
  'A group''s recurring or one-off prayer meeting. Details are end-to-end encrypted under the group key; only timing is plaintext.';

-- ── 2. Guard: timezone, timestamps, a sane number per group ─────────────────
create or replace function public.tg_group_meetings_guard()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  -- An unknown timezone raises here (invalid_parameter_value).
  perform now() at time zone new.timezone;

  if tg_op = 'INSERT' then
    if (select count(*) from public.group_meetings where group_id = new.group_id) >= 12 then
      raise exception 'too many meetings for this group' using errcode = '23514';
    end if;
    new.created_at := now();
  end if;
  new.updated_at := now();
  return new;
end;
$$;

drop trigger if exists group_meetings_guard on public.group_meetings;
create trigger group_meetings_guard
  before insert or update on public.group_meetings
  for each row execute function public.tg_group_meetings_guard();

-- ── 3. Privileges and Row Level Security ────────────────────────────────────
alter table public.group_meetings enable row level security;

revoke all on public.group_meetings from anon, authenticated;
grant select, insert, delete on public.group_meetings to authenticated;
-- Only the meeting itself may change; never its group, author or history.
grant update (schedule, start_time, timezone, duration_minutes, encrypted_payload, encryption_version, key_version)
  on public.group_meetings to authenticated;

drop policy if exists "Members read group meetings" on public.group_meetings;
create policy "Members read group meetings" on public.group_meetings
  for select to authenticated
  using (group_id in (select public.get_my_group_ids()));

drop policy if exists "Members schedule group meetings" on public.group_meetings;
create policy "Members schedule group meetings" on public.group_meetings
  for insert to authenticated
  with check (
    created_by = (select auth.uid())
    and group_id in (select public.get_my_group_ids())
  );

drop policy if exists "Scheduler or admin changes group meetings" on public.group_meetings;
create policy "Scheduler or admin changes group meetings" on public.group_meetings
  for update to authenticated
  using (
    group_id in (select public.get_my_group_ids())
    and (created_by = (select auth.uid()) or group_id in (select public.get_my_admin_group_ids()))
  )
  with check (group_id in (select public.get_my_group_ids()));

drop policy if exists "Scheduler or admin ends group meetings" on public.group_meetings;
create policy "Scheduler or admin ends group meetings" on public.group_meetings
  for delete to authenticated
  using (
    group_id in (select public.get_my_group_ids())
    and (created_by = (select auth.uid()) or group_id in (select public.get_my_admin_group_ids()))
  );

-- ── 4. Realtime: the group page updates when a meeting is set, moved or ended ─
do $$
begin
  alter publication supabase_realtime add table public.group_meetings;
exception when duplicate_object then null;
end $$;

-- ── 5. The reminder notification type ───────────────────────────────────────
alter table public.notifications drop constraint if exists notifications_type_check;
alter table public.notifications add constraint notifications_type_check check (type in (
  'friend_request','group_invitation','community_update','answered',
  'reaction_bucket','group_prayer_added','testimony','membership_change',
  'role_change','plan_invitation','prayer_meeting'
));

-- One reminder per member per occurrence. Called by send-event-notifications
-- (service role) once a meeting is about to start; the dedupe key makes a
-- repeated call for the same occurrence a no-op. Metadata holds identifiers and
-- the start instant only (so a reminder held back by quiet hours can expire).
create or replace function public.queue_group_meeting_reminder(
  p_meeting uuid, p_occurrence date, p_starts_at timestamptz
) returns integer
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_group uuid;
  v_count integer := 0;
  r record;
begin
  select group_id into v_group from public.group_meetings where id = p_meeting;
  if v_group is null then return 0; end if;

  for r in select user_id from public.group_members where group_id = v_group loop
    perform public.create_notification(
      r.user_id, null, 'prayer_meeting', v_group,
      'group_meeting', p_meeting,
      jsonb_build_object('group_id', v_group, 'meeting_id', p_meeting, 'starts_at', p_starts_at),
      'prayer-meeting:' || p_meeting::text || ':' || p_occurrence::text
    );
    v_count := v_count + 1;
  end loop;
  return v_count;
end;
$$;

revoke all on function public.queue_group_meeting_reminder(uuid, date, timestamptz) from public, anon, authenticated;
grant execute on function public.queue_group_meeting_reminder(uuid, date, timestamptz) to service_role;

notify pgrst, 'reload schema';
