-- A member's RSA identity key can legitimately change after an explicit
-- encryption reset. It could also change in older clients when two first-run
-- initialisers raced. In both cases an existing group_member_keys row is wrapped
-- to the superseded public key and can never be opened by the current identity.
--
-- A holder of the real group key may replace that envelope only while the
-- target identity is provably newer than the envelope. Fresh envelopes remain
-- immutable, preserving the normal insert-once behaviour.
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
  v_target_identity_updated_at timestamptz;
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

  select updated_at
    into v_target_identity_updated_at
  from public.user_crypto_keys
  where user_id = p_target_user_id;

  insert into public.group_member_keys(
    group_id,
    key_version,
    user_id,
    encrypted_group_key
  )
  values (
    p_group_id,
    p_key_version,
    p_target_user_id,
    p_encrypted_group_key
  )
  on conflict (group_id, key_version, user_id) do update
    set encrypted_group_key = excluded.encrypted_group_key,
        created_at = now()
    where public.group_member_keys.created_at < v_target_identity_updated_at;
end;
$$;

revoke all on function public.distribute_group_key(uuid, integer, uuid, jsonb)
  from public, anon;
grant execute on function public.distribute_group_key(uuid, integer, uuid, jsonb)
  to authenticated;
