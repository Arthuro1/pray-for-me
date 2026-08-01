-- Transactional, retry-safe group key creation and rotation.
-- Reversible: dropping these RPCs/table restores the previous API, but clients
-- deployed with this migration depend on the functions below.

create table if not exists public.group_key_operations (
  group_id uuid not null references public.groups(id) on delete cascade,
  idempotency_key uuid not null,
  actor_id uuid not null references auth.users(id) on delete cascade,
  operation text not null check (operation in ('create', 'rotate', 'remove_and_rotate')),
  key_version integer not null check (key_version > 0),
  created_at timestamptz not null default now(),
  primary key (group_id, idempotency_key)
);

alter table public.group_key_operations enable row level security;
revoke all on table public.group_key_operations from public, anon, authenticated;

do $$
begin
  alter table public.group_key_versions
    add constraint group_key_versions_positive check (version > 0) not valid;
exception when duplicate_object then null;
end $$;
alter table public.group_key_versions validate constraint group_key_versions_positive;

do $$
begin
  alter table public.group_member_keys
    add constraint group_member_keys_version_fk
    foreign key (group_id, key_version)
    references public.group_key_versions(group_id, version)
    on delete cascade not valid;
exception when duplicate_object then null;
end $$;

create or replace function public.create_group_key_version(
  p_group_id uuid,
  p_requested_version integer,
  p_encrypted_creator_key jsonb,
  p_idempotency_key uuid
)
returns integer
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_actor uuid := auth.uid();
  v_current integer;
  v_existing public.group_key_operations;
  v_operation text;
begin
  if v_actor is null then
    raise exception 'not_authenticated' using errcode = '28000';
  end if;
  if p_idempotency_key is null or p_requested_version is null or p_requested_version < 1 then
    raise exception 'invalid_key_request' using errcode = '22023';
  end if;
  if jsonb_typeof(p_encrypted_creator_key) <> 'object'
     or coalesce(p_encrypted_creator_key->>'data', '') = '' then
    raise exception 'invalid_wrapped_key' using errcode = '22023';
  end if;

  perform 1 from public.groups where id = p_group_id for update;
  if not found then
    raise exception 'not_group_member' using errcode = '42501';
  end if;

  select * into v_existing
  from public.group_key_operations
  where group_id = p_group_id and idempotency_key = p_idempotency_key;
  if found then
    if v_existing.actor_id <> v_actor then
      raise exception 'idempotency_key_reused' using errcode = '42501';
    end if;
    return v_existing.key_version;
  end if;

  if not exists (
    select 1 from public.group_members
    where group_id = p_group_id and user_id = v_actor
  ) then
    raise exception 'not_group_member' using errcode = '42501';
  end if;

  select coalesce(max(version), 0) into v_current
  from public.group_key_versions where group_id = p_group_id;

  if v_current = 0 then
    if p_requested_version <> 1 then
      raise exception 'key_version_conflict' using errcode = '40001';
    end if;
    v_operation := 'create';
  else
    if not exists (
      select 1 from public.group_members
      where group_id = p_group_id and user_id = v_actor and role = 'admin'
    ) then
      raise exception 'not_group_admin' using errcode = '42501';
    end if;
    if p_requested_version <> v_current + 1 then
      raise exception 'key_version_conflict' using errcode = '40001';
    end if;
    v_operation := 'rotate';
  end if;

  insert into public.group_key_versions(group_id, version, created_by)
  values (p_group_id, p_requested_version, v_actor);

  insert into public.group_member_keys(group_id, key_version, user_id, encrypted_group_key)
  values (p_group_id, p_requested_version, v_actor, p_encrypted_creator_key);

  insert into public.group_key_operations(group_id, idempotency_key, actor_id, operation, key_version)
  values (p_group_id, p_idempotency_key, v_actor, v_operation, p_requested_version);

  return p_requested_version;
end;
$$;

create or replace function public.distribute_group_key(
  p_group_id uuid,
  p_key_version integer,
  p_target_user_id uuid,
  p_encrypted_group_key jsonb
)
returns void
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_actor uuid := auth.uid();
begin
  if v_actor is null then
    raise exception 'not_authenticated' using errcode = '28000';
  end if;
  if jsonb_typeof(p_encrypted_group_key) <> 'object'
     or coalesce(p_encrypted_group_key->>'data', '') = '' then
    raise exception 'invalid_wrapped_key' using errcode = '22023';
  end if;
  if not exists (
    select 1 from public.group_members
    where group_id = p_group_id and user_id = v_actor
  ) or not exists (
    select 1 from public.group_members
    where group_id = p_group_id and user_id = p_target_user_id
  ) or not exists (
    select 1 from public.group_member_keys
    where group_id = p_group_id and key_version = p_key_version and user_id = v_actor
  ) then
    raise exception 'not_authorized_to_distribute' using errcode = '42501';
  end if;

  insert into public.group_member_keys(group_id, key_version, user_id, encrypted_group_key)
  values (p_group_id, p_key_version, p_target_user_id, p_encrypted_group_key)
  on conflict (group_id, key_version, user_id) do nothing;
end;
$$;

create or replace function public.remove_group_member_and_rotate(
  p_group_id uuid,
  p_target_user_id uuid,
  p_requested_version integer,
  p_encrypted_creator_key jsonb,
  p_idempotency_key uuid
)
returns integer
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_actor uuid := auth.uid();
  v_creator uuid;
  v_target_role text;
  v_current integer;
  v_existing public.group_key_operations;
begin
  if v_actor is null then
    raise exception 'not_authenticated' using errcode = '28000';
  end if;
  if p_target_user_id = v_actor then
    raise exception 'cannot_remove_self' using errcode = '42501';
  end if;
  if p_idempotency_key is null or jsonb_typeof(p_encrypted_creator_key) <> 'object'
     or coalesce(p_encrypted_creator_key->>'data', '') = '' then
    raise exception 'invalid_key_request' using errcode = '22023';
  end if;

  select created_by into v_creator from public.groups
  where id = p_group_id for update;
  if v_creator is null or not exists (
    select 1 from public.group_members
    where group_id = p_group_id and user_id = v_actor and role = 'admin'
  ) then
    raise exception 'not_group_admin' using errcode = '42501';
  end if;

  select * into v_existing from public.group_key_operations
  where group_id = p_group_id and idempotency_key = p_idempotency_key;
  if found then
    if v_existing.actor_id <> v_actor then
      raise exception 'idempotency_key_reused' using errcode = '42501';
    end if;
    return v_existing.key_version;
  end if;

  select role into v_target_role from public.group_members
  where group_id = p_group_id and user_id = p_target_user_id;
  if v_target_role is null then
    raise exception 'target_not_member' using errcode = 'P0002';
  end if;
  if p_target_user_id = v_creator then
    raise exception 'creator_cannot_be_removed' using errcode = '42501';
  end if;
  if v_target_role = 'admin' and not exists (
    select 1 from public.group_members
    where group_id = p_group_id and role = 'admin' and user_id <> p_target_user_id
  ) then
    raise exception 'must_retain_admin' using errcode = '42501';
  end if;

  select coalesce(max(version), 0) into v_current
  from public.group_key_versions where group_id = p_group_id;
  if p_requested_version <> v_current + 1 then
    raise exception 'key_version_conflict' using errcode = '40001';
  end if;

  delete from public.group_members
  where group_id = p_group_id and user_id = p_target_user_id;
  delete from public.group_member_prefs
  where group_id = p_group_id and user_id = p_target_user_id;
  delete from public.group_member_keys
  where group_id = p_group_id and user_id = p_target_user_id;

  insert into public.group_key_versions(group_id, version, created_by)
  values (p_group_id, p_requested_version, v_actor);
  insert into public.group_member_keys(group_id, key_version, user_id, encrypted_group_key)
  values (p_group_id, p_requested_version, v_actor, p_encrypted_creator_key);
  insert into public.group_key_operations(group_id, idempotency_key, actor_id, operation, key_version)
  values (p_group_id, p_idempotency_key, v_actor, 'remove_and_rotate', p_requested_version);

  return p_requested_version;
end;
$$;

create or replace function public.detect_orphaned_group_key_versions(p_group_id uuid default null)
returns table(group_id uuid, key_version integer, has_encrypted_content boolean)
language sql
security definer
set search_path = ''
as $$
  select v.group_id, v.version,
    exists(select 1 from public.community_prayers p where p.group_id = v.group_id and p.key_version = v.version)
    or exists(select 1 from public.community_updates u join public.community_prayers p on p.id = u.community_prayer_id where p.group_id = v.group_id and u.key_version = v.version)
    or exists(select 1 from public.testimonies t where t.group_id = v.group_id and t.key_version = v.version)
  from public.group_key_versions v
  where (p_group_id is null or v.group_id = p_group_id)
    and exists (
      select 1 from public.group_members m
      where m.group_id = v.group_id and m.user_id = auth.uid() and m.role = 'admin'
    )
    and not exists (
      select 1 from public.group_member_keys k
      where k.group_id = v.group_id and k.key_version = v.version
    );
$$;

create or replace function public.repair_orphaned_group_key_versions(p_group_id uuid)
returns integer
language plpgsql
security definer
set search_path = ''
as $$
declare v_deleted integer;
begin
  if not exists (
    select 1 from public.group_members
    where group_id = p_group_id and user_id = auth.uid() and role = 'admin'
  ) then
    raise exception 'not_group_admin' using errcode = '42501';
  end if;

  delete from public.group_key_versions v
  where v.group_id = p_group_id
    and not exists (select 1 from public.group_member_keys k where k.group_id = v.group_id and k.key_version = v.version)
    and not exists (select 1 from public.community_prayers p where p.group_id = v.group_id and p.key_version = v.version)
    and not exists (select 1 from public.community_updates u join public.community_prayers p on p.id = u.community_prayer_id where p.group_id = v.group_id and u.key_version = v.version)
    and not exists (select 1 from public.testimonies t where t.group_id = v.group_id and t.key_version = v.version);
  get diagnostics v_deleted = row_count;
  return v_deleted;
end;
$$;

drop policy if exists "members create key versions" on public.group_key_versions;
drop policy if exists "members wrap keys for the group" on public.group_member_keys;
drop policy if exists "revoke wrapped group keys" on public.group_member_keys;

revoke insert, update, delete on public.group_key_versions from public, anon, authenticated;
revoke insert, update, delete on public.group_member_keys from public, anon, authenticated;

revoke all on function public.create_group_key_version(uuid, integer, jsonb, uuid) from public, anon;
revoke all on function public.distribute_group_key(uuid, integer, uuid, jsonb) from public, anon;
revoke all on function public.remove_group_member_and_rotate(uuid, uuid, integer, jsonb, uuid) from public, anon;
revoke all on function public.detect_orphaned_group_key_versions(uuid) from public, anon;
revoke all on function public.repair_orphaned_group_key_versions(uuid) from public, anon;
grant execute on function public.create_group_key_version(uuid, integer, jsonb, uuid) to authenticated;
grant execute on function public.distribute_group_key(uuid, integer, uuid, jsonb) to authenticated;
grant execute on function public.remove_group_member_and_rotate(uuid, uuid, integer, jsonb, uuid) to authenticated;
grant execute on function public.detect_orphaned_group_key_versions(uuid) to authenticated;
grant execute on function public.repair_orphaned_group_key_versions(uuid) to authenticated;
