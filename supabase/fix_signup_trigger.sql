-- ════════════════════════════════════════════════════════════════════════
-- FIX: Google/email signup failing in production with
--   error=server_error&error_code=unexpected_failure
--   &error_description=Database+error+saving+new+user
--
-- Cause: the on_auth_user_created trigger runs handle_new_user(), which mirrors
-- the new user into public.profiles. It was SECURITY DEFINER with NO search_path
-- and an UNQUALIFIED `insert into profiles`. When the auth admin role executes
-- the trigger and its search_path doesn't include `public`, the insert raises
-- and GoTrue reports "Database error saving new user", blocking ALL new signups.
--
-- Fix: pin search_path, fully-qualify the table, and make the profile mirror
-- non-blocking so a profile hiccup can never again break authentication.
-- Idempotent — safe to run in the Supabase SQL editor.
-- ════════════════════════════════════════════════════════════════════════

create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  insert into public.profiles (id, full_name)
  values (new.id, coalesce(new.raw_user_meta_data->>'full_name', split_part(new.email, '@', 1)))
  on conflict (id) do nothing;
  return new;
exception when others then
  -- Never block auth signup because the profile mirror failed; just log it.
  raise warning 'handle_new_user failed for %: %', new.id, sqlerrm;
  return new;
end;
$$;

-- Belt-and-suspenders: let the auth admin role reach public.profiles even if a
-- future platform change tightens its grants.
grant usage on schema public to supabase_auth_admin;
grant insert on public.profiles to supabase_auth_admin;
grant execute on function public.handle_new_user() to supabase_auth_admin;

-- Recreate the trigger so it points at the corrected function.
drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- Backfill any profiles missed while signups were failing / for older users.
insert into public.profiles (id, full_name)
select id, coalesce(raw_user_meta_data->>'full_name', split_part(email, '@', 1))
from auth.users
on conflict (id) do nothing;
