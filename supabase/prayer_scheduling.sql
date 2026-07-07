-- ════════════════════════════════════════════════════════════════════════
-- Prayer scheduling: one-time & recurring prayers, time-of-day slots,
-- per-occurrence overrides, per-prayer completions, category rotation and
-- group prayer calendars (commitments). Run in the Supabase SQL editor.
--
-- `schedule` is a small client-interpreted jsonb object (see src/lib/schedule.js):
--   { "type": "once", "date": "2026-07-14", "slot": "morning" }
--   { "type": "recurring", "freq": "daily|weekly|interval|monthly|yearly",
--     "weekDays": [2,5], "interval": 3, "dayOfMonth": 15, "month": 7, "day": 14,
--     "startDate": "2026-07-04", "slot": "evening",
--     "end": { "kind": "never|date|count|answered", "date": "...", "count": 21 },
--     "plan": { "id": "upperRoom", "startDate": "2026-07-04" } }
--
-- Scheduling metadata deliberately stays OUTSIDE the E2EE envelope (like
-- week_days today): it reveals timing, never content. Prayers without a
-- `schedule` keep the legacy category week_days behaviour.
-- ════════════════════════════════════════════════════════════════════════

alter table prayers add column if not exists schedule jsonb default null;
-- Per-occurrence exceptions keyed by local date: {"2026-07-14": {"skip": true}}
-- or {"2026-07-14": {"movedTo": "2026-07-16"}}. Kept on the row (not a child
-- table) so the offline mutation queue and snapshot carry it for free.
alter table prayers add column if not exists schedule_overrides jsonb not null default '{}';
-- Denormalised "last prayed" timestamp for rotation fairness + catch-up UI.
alter table prayers add column if not exists last_prayed_at timestamptz;

-- Category rotation: {"perDay": 5} → the app prays through the category's
-- active prayers N at a time, round-robin by day, instead of all at once.
alter table categories add column if not exists rotation jsonb default null;

-- ── Per-prayer completions ────────────────────────────────────────────────
-- One row per prayer per local day it was prayed. Powers the catch-up list,
-- calendar history and rotation fairness. Client-generated ids keep offline
-- replays idempotent (mirrors the prayer_testimonies pattern).
create table if not exists prayer_completions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users(id) on delete cascade not null,
  prayer_id uuid references prayers(id) on delete cascade not null,
  day date not null,
  slot text default null,
  created_at timestamptz default now(),
  unique (prayer_id, day)
);

alter table prayer_completions enable row level security;
create policy "Users manage own completions" on prayer_completions
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);
create index if not exists idx_completions_user_day on prayer_completions(user_id, day desc);

-- ── Group prayer calendar (commitments) ──────────────────────────────────
-- A member claims a day (prayer-chain style) for a community prayer: "I'll
-- pray for this on the 18th". Uses get_my_group_ids() (community_schema.sql)
-- to avoid RLS recursion, same as every other community table.
create table if not exists prayer_commitments (
  id uuid primary key default gen_random_uuid(),
  community_prayer_id uuid references community_prayers(id) on delete cascade not null,
  group_id uuid references groups(id) on delete cascade not null,
  user_id uuid references auth.users(id) on delete cascade not null,
  user_name text default '',
  day date not null,
  slot text default null,
  created_at timestamptz default now(),
  unique (community_prayer_id, user_id, day)
);

alter table prayer_commitments enable row level security;
create policy "Members read group commitments" on prayer_commitments
  for select using (group_id in (select get_my_group_ids()));
create policy "Members add own commitments" on prayer_commitments
  for insert with check (user_id = auth.uid() and group_id in (select get_my_group_ids()));
create policy "Users remove own commitments" on prayer_commitments
  for delete using (user_id = auth.uid());
create index if not exists idx_commitments_prayer on prayer_commitments(community_prayer_id, day);
create index if not exists idx_commitments_user on prayer_commitments(user_id, day);
