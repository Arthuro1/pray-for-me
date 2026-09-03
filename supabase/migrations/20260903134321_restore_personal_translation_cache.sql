-- The legacy schema baseline omitted the per-user cache still used by
-- translationStore and delete_account(). Include it in fresh database builds.
-- Existing installations may already have this hand-created table.
create table if not exists public.translations (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  lang text not null,
  original_text text not null,
  translated_text text not null,
  created_at timestamptz not null default now(),
  unique (user_id, lang, original_text)
);

alter table public.translations enable row level security;

drop policy if exists "Users manage own translations" on public.translations;
create policy "Users manage own translations" on public.translations
  for all to authenticated
  using ((select auth.uid()) = user_id)
  with check ((select auth.uid()) = user_id);

-- Keep the existing client's reads and upserts available only to the owner.
revoke all on table public.translations from public, anon;
grant select, insert, update, delete on table public.translations
  to authenticated, service_role;
