-- ════════════════════════════════════════════════════════════════════════
-- Pin prayers to the top of personal lists. Run in the Supabase SQL editor.
-- `pinned` is personal organisation on the user's own prayer row; existing RLS
-- on `prayers` (owner can update their rows) already covers reads/writes.
-- ════════════════════════════════════════════════════════════════════════

alter table prayers add column if not exists pinned boolean not null default false;
