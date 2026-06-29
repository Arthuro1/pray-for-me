-- ════════════════════════════════════════════════════════════════════════
-- Right-to-erasure: let a user permanently delete their account and ALL data.
-- Run in the Supabase SQL editor (idempotent).
--
-- The function runs as its owner (security definer) so it can remove the row
-- from auth.users; every user-owned table referencing auth.users(id) with
-- `on delete cascade` (prayers, categories, prayer_updates, prayer_points,
-- vault_keys, push_subscriptions, group_members, community_prayers, …) is then
-- cleared automatically. Tables without a cascade are deleted explicitly first.
-- ════════════════════════════════════════════════════════════════════════

create or replace function delete_account()
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  uid uuid := auth.uid();
begin
  if uid is null then
    raise exception 'not authenticated' using errcode = 'insufficient_privilege';
  end if;

  -- Explicitly clear tables that may not cascade from auth.users.
  delete from translations       where user_id = uid;
  delete from vault_keys         where user_id = uid;
  delete from push_subscriptions where user_id = uid;

  -- Removing the auth user cascades to everything that references it.
  delete from auth.users where id = uid;
end;
$$;

-- Only an authenticated user may call it (and it only ever deletes auth.uid()).
revoke all on function delete_account() from public, anon;
grant execute on function delete_account() to authenticated;
