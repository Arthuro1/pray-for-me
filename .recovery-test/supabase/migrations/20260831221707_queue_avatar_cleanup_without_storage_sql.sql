-- Supabase protects storage.objects from direct DELETE statements. The
-- historical profile/group triggers attempted that forbidden write, causing
-- every account deletion (profiles cascades from auth.users) to abort.
--
-- Keep the triggers as a durable orphan-cleanup signal, but perform the actual
-- object removal through the Storage API. The browser already does that before
-- self-service account deletion; this private queue covers failed/browserless
-- cleanup for an administrative worker or sweep.

create table if not exists public.avatar_cleanup_queue (
  scope text not null check (scope in ('profiles', 'groups')),
  owner_id uuid not null,
  requested_at timestamptz not null default now(),
  primary key (scope, owner_id)
);

alter table public.avatar_cleanup_queue enable row level security;
revoke all on table public.avatar_cleanup_queue from public, anon, authenticated;
grant select, delete on table public.avatar_cleanup_queue to service_role;

create or replace function public.cleanup_avatar_storage()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  insert into public.avatar_cleanup_queue (scope, owner_id, requested_at)
  values (tg_argv[0], old.id, now())
  on conflict (scope, owner_id) do update
    set requested_at = excluded.requested_at;
  return old;
end;
$$;

revoke all on function public.cleanup_avatar_storage() from public, anon, authenticated;
grant execute on function public.cleanup_avatar_storage() to service_role;
