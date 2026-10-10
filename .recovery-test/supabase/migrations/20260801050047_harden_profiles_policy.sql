-- Replace legacy role checks with explicit policy roles and ensure profile
-- ownership cannot be reassigned during UPDATE. Profiles intentionally expose
-- display names to signed-in users; they contain no email or authorization data.
drop policy if exists "Authenticated can read profiles" on public.profiles;
create policy "Authenticated can read profiles"
  on public.profiles
  for select
  to authenticated
  using (true);

drop policy if exists "Users can upsert their own profile" on public.profiles;
create policy "Users can upsert their own profile"
  on public.profiles
  for insert
  to authenticated
  with check ((select auth.uid()) = id);

drop policy if exists "Users can update their own profile" on public.profiles;
create policy "Users can update their own profile"
  on public.profiles
  for update
  to authenticated
  using ((select auth.uid()) = id)
  with check ((select auth.uid()) = id);

-- This function already schema-qualifies every non-pg_catalog object, so it can
-- use the strongest fixed search path without changing behavior.
alter function public.check_ai_usage_quota(integer, integer) set search_path = '';

-- The legacy public_keys view intentionally projected only non-sensitive key
-- material, but its owner-rights execution bypassed RLS. Keep the same API
-- shape over a dedicated public-key table so the view can run as the caller.
create table if not exists public.user_public_keys (
  user_id uuid primary key references auth.users(id) on delete cascade,
  public_key_jwk jsonb not null,
  key_version integer not null default 1,
  updated_at timestamptz not null default now()
);

alter table public.user_public_keys enable row level security;

drop policy if exists "Authenticated users can read published public keys"
  on public.user_public_keys;
create policy "Authenticated users can read published public keys"
  on public.user_public_keys
  for select
  to authenticated
  using (true);

revoke all on table public.user_public_keys from public, anon, authenticated;
grant select on table public.user_public_keys to authenticated;
grant select, insert, update, delete on table public.user_public_keys to service_role;

insert into public.user_public_keys (user_id, public_key_jwk, key_version, updated_at)
select user_id, public_key_jwk, coalesce(key_version, 1), coalesce(updated_at, now())
from public.user_crypto_keys
on conflict (user_id) do update
set public_key_jwk = excluded.public_key_jwk,
    key_version = excluded.key_version,
    updated_at = excluded.updated_at;

create or replace function public.sync_user_public_key()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  if tg_op = 'DELETE' then
    delete from public.user_public_keys where user_id = old.user_id;
    return old;
  end if;

  insert into public.user_public_keys (user_id, public_key_jwk, key_version, updated_at)
  values (new.user_id, new.public_key_jwk, coalesce(new.key_version, 1), coalesce(new.updated_at, now()))
  on conflict (user_id) do update
  set public_key_jwk = excluded.public_key_jwk,
      key_version = excluded.key_version,
      updated_at = excluded.updated_at;
  return new;
end;
$$;

revoke all on function public.sync_user_public_key() from public, anon, authenticated;

drop trigger if exists sync_user_public_key on public.user_crypto_keys;
create trigger sync_user_public_key
  after insert or update of public_key_jwk, key_version or delete
  on public.user_crypto_keys
  for each row execute function public.sync_user_public_key();

create or replace view public.public_keys
  with (security_invoker = true)
as
  select user_id, public_key_jwk from public.user_public_keys;

revoke all on table public.public_keys from public, anon, authenticated;
grant select on table public.public_keys to authenticated;
grant select on table public.public_keys to service_role;

-- Pure SQL, but still pin its path so callers cannot influence name lookup.
alter function public.default_delivery_mode(text) set search_path = '';
