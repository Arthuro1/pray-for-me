-- Repair the profile mirror so incoming/outgoing friend requests always have
-- a recipient/sender display name. Some accounts created while the historical
-- auth trigger was unhealthy can exist in auth.users without a profiles row;
-- blank metadata also used to survive ON CONFLICT unchanged.

create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  insert into public.profiles (id, full_name)
  values (new.id, coalesce(
    nullif(btrim(new.raw_user_meta_data->>'full_name'), ''),
    nullif(btrim(new.raw_user_meta_data->>'name'), ''),
    nullif(btrim(new.raw_user_meta_data->>'display_name'), ''),
    nullif(split_part(coalesce(new.email, ''), '@', 1), ''),
    'Praystead member'
  ))
  on conflict (id) do update
    set full_name = coalesce(
      nullif(btrim(public.profiles.full_name), ''),
      excluded.full_name
    );
  return new;
exception when others then
  raise warning 'handle_new_user failed for %: %', new.id, sqlerrm;
  return new;
end;
$$;

grant usage on schema public to supabase_auth_admin;
grant insert, update on public.profiles to supabase_auth_admin;
grant execute on function public.handle_new_user() to supabase_auth_admin;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert or update of raw_user_meta_data, email on auth.users
  for each row execute function public.handle_new_user();

-- Restore rows that were missed and fill only blank names. A name deliberately
-- chosen by the user is never overwritten by auth-provider metadata.
insert into public.profiles (id, full_name)
select u.id, coalesce(
  nullif(btrim(u.raw_user_meta_data->>'full_name'), ''),
  nullif(btrim(u.raw_user_meta_data->>'name'), ''),
  nullif(btrim(u.raw_user_meta_data->>'display_name'), ''),
  nullif(split_part(coalesce(u.email, ''), '@', 1), ''),
  'Praystead member'
)
from auth.users u
on conflict (id) do update
  set full_name = excluded.full_name
  where nullif(btrim(public.profiles.full_name), '') is null;
