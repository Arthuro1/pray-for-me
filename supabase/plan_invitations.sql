-- ════════════════════════════════════════════════════════════════════════
-- Invite friends or groups to a GUIDED PRAYER PLAN.
--
-- Run this in the Supabase SQL editor (safe to re-run; upgrades in place).
-- Depends on: community_schema.sql (groups, group_members, friendships,
-- get_my_group_ids) and notifications.sql (notifications table +
-- create_notification()).
--
-- A guided plan lives entirely CLIENT-SIDE (src/content/prayerPlans.js); a plan
-- invitation therefore carries only a short content identifier (plan_id, e.g.
-- 'fast3') plus a proposed start date. It stores NO prayer content, so — unlike
-- community prayers — there is no end-to-end-encryption to handle here, and the
-- row fits the "notifications point at content, they never copy it" contract.
--
-- Modeled on group_invitations (community_schema.sql) and the notification
-- trigger pattern (notifications.sql).
-- ════════════════════════════════════════════════════════════════════════

-- ── 1. Invitations table ────────────────────────────────────────────────────
create table if not exists public.plan_invitations (
  id               uuid primary key default gen_random_uuid(),
  plan_id          text not null,                       -- content id, e.g. 'fast3'
  start_date       date not null,                       -- proposed local start day
  invited_user_id  uuid not null references auth.users(id) on delete cascade,
  invited_by       uuid references auth.users(id) on delete cascade,
  -- Context only: set when the invitation came from selecting a whole group, so
  -- the invitee can be told "…and the rest of <group>". Null for a direct
  -- friend invite. Not a membership requirement.
  group_id         uuid references public.groups(id) on delete set null,
  created_at       timestamptz not null default now(),
  -- Re-inviting the same person to the same plan is an idempotent no-op.
  unique (plan_id, invited_by, invited_user_id),
  check (invited_by <> invited_user_id)
);

create index if not exists plan_invitations_invited_user_idx
  on public.plan_invitations (invited_user_id);
create index if not exists plan_invitations_inviter_idx
  on public.plan_invitations (invited_by);

alter table public.plan_invitations enable row level security;

-- Explicit privileges (do not rely solely on Supabase default grants). The
-- narrow client surface: read your own rows, create invitations, delete
-- (accept/decline/cancel). RLS policies below still scope every row.
grant select, insert, delete on public.plan_invitations to authenticated;

-- ── 2. Row Level Security ────────────────────────────────────────────────────
-- Sender and recipient can both see the invitation.
drop policy if exists "Inviter and invitee can see plan invitations" on public.plan_invitations;
create policy "Inviter and invitee can see plan invitations" on public.plan_invitations
  for select using (
    invited_user_id = auth.uid() or invited_by = auth.uid()
  );

-- You may only invite someone you can actually reach: a friend, or someone who
-- shares a group with you. This blocks inviting arbitrary strangers by id.
drop policy if exists "Reachable users can be invited to a plan" on public.plan_invitations;
create policy "Reachable users can be invited to a plan" on public.plan_invitations
  for insert with check (
    invited_by = auth.uid()
    and invited_user_id <> auth.uid()
    and (
      exists (
        select 1 from public.friendships f
        where (f.user_id = auth.uid() and f.friend_id = invited_user_id)
           or (f.user_id = invited_user_id and f.friend_id = auth.uid())
      )
      or invited_user_id in (
        select gm.user_id from public.group_members gm
        where gm.group_id in (select get_my_group_ids())
      )
    )
  );

-- The invitee accepts/declines by deleting the row; the sender may cancel it.
drop policy if exists "Invitee can dismiss plan invitations" on public.plan_invitations;
create policy "Invitee can dismiss plan invitations" on public.plan_invitations
  for delete using (invited_user_id = auth.uid());

drop policy if exists "Inviter can cancel plan invitations" on public.plan_invitations;
create policy "Inviter can cancel plan invitations" on public.plan_invitations
  for delete using (invited_by = auth.uid());

-- ── 3. Allow the new notification type ───────────────────────────────────────
-- Widen the notifications type check constraint (originally set in
-- notifications.sql) to include 'plan_invitation'.
alter table public.notifications drop constraint if exists notifications_type_check;
alter table public.notifications add constraint notifications_type_check check (type in (
  'friend_request','group_invitation','community_update','answered',
  'reaction_bucket','group_prayer_added','testimony','membership_change',
  'role_change','plan_invitation'
));

-- ── 4. Notification trigger ──────────────────────────────────────────────────
-- Plan invitation received → notify the invitee (never the actor). Uses the
-- central, preference-aware, self-excluding create_notification() helper.
-- Content-free: metadata carries only the plan id + optional group context.
create or replace function public.tg_notify_plan_invitation()
returns trigger language plpgsql security definer set search_path = '' as $$
begin
  perform public.create_notification(
    new.invited_user_id, new.invited_by, 'plan_invitation', new.group_id,
    'plan_invitation', new.id,
    jsonb_build_object('plan_id', new.plan_id, 'group_id', new.group_id),
    'plan-invitation:' || new.id::text || ':' || new.invited_user_id::text
  );
  return new;
exception when others then
  raise warning 'tg_notify_plan_invitation: %', sqlerrm;
  return new;
end; $$;

drop trigger if exists notify_plan_invitation on public.plan_invitations;
create trigger notify_plan_invitation after insert on public.plan_invitations
  for each row execute function public.tg_notify_plan_invitation();

-- ── 5. Realtime ──────────────────────────────────────────────────────────────
-- Publish the table so the pending-invitations nav badge live-updates when an
-- invitation arrives or is cleared (RLS still scopes each user to their rows).
do $$
begin
  alter publication supabase_realtime add table public.plan_invitations;
exception when duplicate_object then null;
end $$;

-- ── 6. Reload the PostgREST schema cache ─────────────────────────────────────
-- Force the API layer to pick up the new table + foreign keys immediately, so
-- the invitee's fetch works right after this migration (a stale cache is a
-- common cause of "the invitation never shows up" straight after a migration).
notify pgrst, 'reload schema';
