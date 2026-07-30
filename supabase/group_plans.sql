-- ════════════════════════════════════════════════════════════════════════
-- GROUP prayer plans — a plan a whole group is walking through together.
--
-- Run this in the Supabase SQL editor (safe to re-run; upgrades in place).
-- Depends on: community_schema.sql (groups, group_members, get_my_group_ids,
-- get_my_admin_group_ids).
--
-- Unlike plan_invitations (transient, one row per invited person, deleted on
-- accept/decline), a group plan is a PERSISTENT, group-scoped record: "this
-- group is praying <plan_id>, starting <start_date>". It stays visible to every
-- member — including people who join the group LATER — so they can see it and
-- join in. A guided plan lives entirely client-side (src/content/prayerPlans.js),
-- so this row carries only the short content id + a start date; no prayer
-- content, hence no end-to-end encryption to handle here.
--
-- group_plan_members records who has joined the shared plan, so the group can
-- see a warm "who's praying" count. Joining also starts the same guided plan on
-- the member's own calendar (client-side), but that personal prayer is E2EE and
-- never referenced here.
-- ════════════════════════════════════════════════════════════════════════

-- ── 1. The group's adopted plans ─────────────────────────────────────────────
create table if not exists public.group_plans (
  id          uuid primary key default gen_random_uuid(),
  group_id    uuid not null references public.groups(id) on delete cascade,
  plan_id     text not null,                        -- content id, e.g. 'fast3'
  start_date  date not null,                        -- the day the group begins
  added_by    uuid references auth.users(id) on delete set null,
  created_at  timestamptz not null default now(),
  -- One live record per plan per group; re-adopting the same plan is a no-op.
  unique (group_id, plan_id)
);

create index if not exists group_plans_group_idx on public.group_plans (group_id);

-- ── 2. Who has joined each group plan ────────────────────────────────────────
-- group_id is denormalized from group_plans so RLS + realtime can scope by group
-- with a single column (the insert policy verifies it matches the plan's group).
create table if not exists public.group_plan_members (
  group_plan_id  uuid not null references public.group_plans(id) on delete cascade,
  group_id       uuid not null references public.groups(id) on delete cascade,
  user_id        uuid not null references auth.users(id) on delete cascade,
  created_at     timestamptz not null default now(),
  primary key (group_plan_id, user_id)
);

create index if not exists group_plan_members_group_idx on public.group_plan_members (group_id);

alter table public.group_plans        enable row level security;
alter table public.group_plan_members enable row level security;

-- Explicit privileges (do not rely on Supabase default grants). RLS below still
-- scopes every row. No UPDATE: adopting is an idempotent insert-or-nothing.
grant select, insert, delete on public.group_plans        to authenticated;
grant select, insert, delete on public.group_plan_members to authenticated;

-- ── 3. Row Level Security ────────────────────────────────────────────────────
-- group_plans: every member of the group can see its shared plans.
drop policy if exists "Members can read group plans" on public.group_plans;
create policy "Members can read group plans" on public.group_plans
  for select using (group_id in (select get_my_group_ids()));

-- Any member may start a shared plan for a group they belong to.
drop policy if exists "Members can start group plans" on public.group_plans;
create policy "Members can start group plans" on public.group_plans
  for insert with check (
    added_by = auth.uid() and group_id in (select get_my_group_ids())
  );

-- The member who started it, or any group admin, can end it (cascades to members).
drop policy if exists "Starter or admin can end group plans" on public.group_plans;
create policy "Starter or admin can end group plans" on public.group_plans
  for delete using (
    added_by = auth.uid() or group_id in (select get_my_admin_group_ids())
  );

-- group_plan_members: everyone in the group can see who's praying (the count).
drop policy if exists "Members can read group plan members" on public.group_plan_members;
create policy "Members can read group plan members" on public.group_plan_members
  for select using (group_id in (select get_my_group_ids()));

-- You may only add yourself, and only to a plan that belongs to a group you're
-- in; the denormalized group_id must match the plan's real group (no spoofing).
drop policy if exists "Members can join group plans" on public.group_plan_members;
create policy "Members can join group plans" on public.group_plan_members
  for insert with check (
    user_id = auth.uid()
    and exists (
      select 1 from public.group_plans gp
      where gp.id = group_plan_id
        and gp.group_id = group_plan_members.group_id
        and gp.group_id in (select get_my_group_ids())
    )
  );

-- You can leave a plan (remove your own participation) at any time.
drop policy if exists "Members can leave group plans" on public.group_plan_members;
create policy "Members can leave group plans" on public.group_plan_members
  for delete using (user_id = auth.uid());

-- ── 4. Realtime ──────────────────────────────────────────────────────────────
-- Publish both tables so the group view live-updates when a plan is started/
-- ended or someone joins (RLS still scopes each subscriber to their groups).
do $$
begin
  alter publication supabase_realtime add table public.group_plans;
exception when duplicate_object then null;
end $$;

do $$
begin
  alter publication supabase_realtime add table public.group_plan_members;
exception when duplicate_object then null;
end $$;

-- ── 5. Reload the PostgREST schema cache ─────────────────────────────────────
-- Pick up the new tables + FKs immediately so fetches work right after the
-- migration (a stale cache is a common cause of "it never shows up").
notify pgrst, 'reload schema';
