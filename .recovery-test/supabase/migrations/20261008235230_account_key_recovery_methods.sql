-- Additive encrypted recovery. vault_keys remains readable by existing clients.
-- Server-only RPCs receive an account ID verified by Supabase Auth getUser().
-- No client can execute those RPCs or write credentials/challenges/proofs.
-- Ciphertext tests are CLIENT REPORTED; no server decryption is claimed.
begin;

create table if not exists public.account_key_recovery_methods (
  id uuid primary key,
  user_id uuid not null references auth.users(id) on delete cascade,
  method_type text not null check (method_type in ('passkey', 'emergency-code')),
  status text not null default 'pending' check (status in ('pending', 'active', 'revoked')),
  credential_id text unique,
  wrapper jsonb,
  revision integer not null default 0 check (revision >= 0),
  label text not null default '' check (length(label) <= 80),
  created_at timestamptz not null default now(),
  verified_at timestamptz,
  revoked_at timestamptz,
  readback_at timestamptz,
  readback_revision integer,
  unique(id, user_id),
  check (wrapper is null or (jsonb_typeof(wrapper) = 'object' and octet_length(wrapper::text) <= 4096)),
  check (status <> 'active' or (wrapper is not null and verified_at is not null)),
  check (method_type <> 'emergency-code' or credential_id is null)
);
create index if not exists account_key_recovery_methods_owner on public.account_key_recovery_methods(user_id, status);
alter table public.account_key_recovery_methods enable row level security;
revoke all on public.account_key_recovery_methods from public, anon, authenticated;
grant select on public.account_key_recovery_methods to authenticated;
grant all on public.account_key_recovery_methods to service_role;
drop policy if exists "Owners read their available recovery wrappers" on public.account_key_recovery_methods;
create policy "Owners read their available recovery wrappers"
  on public.account_key_recovery_methods for select to authenticated
  using ((select auth.uid()) = user_id and status <> 'revoked');

create table if not exists public.account_recovery_credentials (
  id text primary key check (length(id) between 1 and 1366),
  user_id uuid not null references auth.users(id) on delete cascade,
  method_id uuid not null unique,
  public_key text not null check (length(public_key) between 1 and 8192),
  counter bigint not null check (counter >= 0 and counter <= 9007199254740991),
  revision integer not null default 0,
  transports text[] not null default '{}',
  device_type text not null check (device_type in ('singleDevice', 'multiDevice')),
  backed_up boolean not null,
  rp_id text not null check (rp_id in ('qetoret.com', 'localhost')),
  created_at timestamptz not null default now(),
  revoked_at timestamptz,
  foreign key(method_id, user_id) references public.account_key_recovery_methods(id, user_id) on delete cascade
);
create index if not exists account_recovery_credentials_owner on public.account_recovery_credentials(user_id);
alter table public.account_recovery_credentials enable row level security;
revoke all on public.account_recovery_credentials from public, anon, authenticated;
grant all on public.account_recovery_credentials to service_role;

create table if not exists public.account_recovery_challenges (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  method_id uuid not null,
  operation text not null check (operation in ('register', 'enroll', 'recover', 'verify')),
  credential_id text,
  challenge text not null check (length(challenge) between 32 and 128),
  origin text not null,
  rp_id text not null,
  expected_revision integer not null,
  created_at timestamptz not null default now(),
  expires_at timestamptz not null default now() + interval '5 minutes',
  consumed_at timestamptz,
  verified_at timestamptz,
  proof_used_at timestamptz,
  foreign key(method_id, user_id) references public.account_key_recovery_methods(id, user_id) on delete cascade
);
create index if not exists account_recovery_challenges_owner on public.account_recovery_challenges(user_id);
create index if not exists account_recovery_challenges_expiry on public.account_recovery_challenges(expires_at);
alter table public.account_recovery_challenges enable row level security;
revoke all on public.account_recovery_challenges from public, anon, authenticated;
grant all on public.account_recovery_challenges to service_role;

create table if not exists public.account_recovery_rate_limits (
  user_id uuid primary key references auth.users(id) on delete cascade,
  minute_start timestamptz not null default now(),
  minute_count integer not null default 0,
  day_start timestamptz not null default now(),
  day_count integer not null default 0
);
alter table public.account_recovery_rate_limits enable row level security;
revoke all on public.account_recovery_rate_limits from public, anon, authenticated;
grant all on public.account_recovery_rate_limits to service_role;

-- SECURITY INVOKER + service_role-only execute avoids a client-callable RLS
-- bypass. Backend must derive p_user_id exclusively from auth.getUser(token).
create or replace function public.check_recovery_rate_limit(p_user_id uuid)
returns boolean language plpgsql security invoker set search_path = '' as $$
declare r public.account_recovery_rate_limits;
begin
  insert into public.account_recovery_rate_limits(user_id) values(p_user_id) on conflict do nothing;
  select * into strict r from public.account_recovery_rate_limits where user_id = p_user_id for update;
  if r.minute_start <= now() - interval '1 minute' then r.minute_start := now(); r.minute_count := 0; end if;
  if r.day_start <= now() - interval '1 day' then r.day_start := now(); r.day_count := 0; end if;
  if r.minute_count >= 30 or r.day_count >= 500 then return false; end if;
  update public.account_recovery_rate_limits set minute_start = r.minute_start, minute_count = r.minute_count + 1,
    day_start = r.day_start, day_count = r.day_count + 1 where user_id = p_user_id;
  -- Bound per-account storage, without deleting unexpired read-back proofs.
  delete from public.account_recovery_challenges where user_id = p_user_id and expires_at < now() - interval '1 day';
  return true;
end;
$$;

create or replace function public.create_recovery_method(p_user_id uuid, p_method_id uuid, p_method_type text, p_wrapper jsonb, p_label text)
returns public.account_key_recovery_methods language plpgsql security invoker set search_path = '' as $$
declare r public.account_key_recovery_methods;
begin
  perform pg_catalog.pg_advisory_xact_lock(pg_catalog.hashtextextended(p_user_id::text, 82712));
  if (select count(*) from public.account_key_recovery_methods where user_id = p_user_id and status <> 'revoked') >= 20 then
    raise exception using errcode = '40001', message = 'recovery method limit';
  end if;
  if (p_method_type = 'passkey' and p_wrapper is not null) or (p_method_type = 'emergency-code' and p_wrapper is null) then
    raise exception using errcode = '22023', message = 'invalid recovery method';
  end if;
  insert into public.account_key_recovery_methods(id, user_id, method_type, wrapper, revision, label)
  values(p_method_id, p_user_id, p_method_type, p_wrapper, case when p_wrapper is null then 0 else 1 end, p_label)
  returning * into r;
  return r;
end;
$$;

create or replace function public.create_recovery_challenge(p_user_id uuid, p_method_id uuid, p_operation text, p_challenge text, p_origin text, p_rp_id text, p_revision integer)
returns public.account_recovery_challenges language plpgsql security invoker set search_path = '' as $$
declare m public.account_key_recovery_methods; r public.account_recovery_challenges;
begin
  select * into m from public.account_key_recovery_methods where id = p_method_id and user_id = p_user_id and status <> 'revoked' for update;
  if not found then raise exception using errcode = 'P0002', message = 'recovery method unavailable'; end if;
  if m.revision <> p_revision or (p_operation = 'register' and (m.credential_id is not null or m.revision <> 0))
    or (p_operation = 'enroll' and m.revision <> 0) or (p_operation = 'recover' and m.status <> 'active')
    or (p_operation = 'verify' and m.wrapper is null) then
    raise exception using errcode = '40001', message = 'recovery revision conflict';
  end if;
  insert into public.account_recovery_challenges(user_id, method_id, operation, challenge, origin, rp_id, expected_revision, credential_id)
  values(p_user_id, m.id, p_operation, p_challenge, p_origin, p_rp_id, m.revision, m.credential_id) returning * into r;
  return r;
end;
$$;

create or replace function public.consume_recovery_challenge(p_user_id uuid, p_challenge_id uuid, p_method_id uuid, p_operation text)
returns public.account_recovery_challenges language plpgsql security invoker set search_path = '' as $$
declare r public.account_recovery_challenges;
begin
  -- A failed verification burns the challenge too. Atomic compare-and-set
  -- prevents replay across parallel requests/serverless instances.
  update public.account_recovery_challenges set consumed_at = now()
  where id = p_challenge_id and user_id = p_user_id and method_id = p_method_id
    and ((p_operation = 'assert' and operation in ('enroll', 'recover', 'verify')) or operation = p_operation)
    and expires_at > now() and consumed_at is null returning * into r;
  return r;
end;
$$;

create or replace function public.register_recovery_credential(p_user_id uuid, p_method_id uuid, p_challenge_id uuid,
  p_credential_id text, p_public_key text, p_counter bigint, p_transports text[], p_device_type text, p_backed_up boolean, p_rp_id text)
returns void language plpgsql security invoker set search_path = '' as $$
declare m public.account_key_recovery_methods;
begin
  select * into m from public.account_key_recovery_methods where id = p_method_id and user_id = p_user_id for update;
  if not found or m.status <> 'pending' or m.revision <> 0 or m.credential_id is not null then
    raise exception using errcode = '40001', message = 'recovery revision conflict';
  end if;
  update public.account_recovery_challenges set verified_at = now(), proof_used_at = now()
  where id = p_challenge_id and user_id = p_user_id and method_id = m.id and operation = 'register'
    and consumed_at is not null and verified_at is null and expires_at > now() and expected_revision = 0 and rp_id = p_rp_id;
  if not found then raise exception using errcode = '40001', message = 'invalid recovery challenge'; end if;
  insert into public.account_recovery_credentials(id, user_id, method_id, public_key, counter, transports, device_type, backed_up, rp_id)
    values(p_credential_id, p_user_id, m.id, p_public_key, p_counter, p_transports, p_device_type, p_backed_up, p_rp_id);
  update public.account_key_recovery_methods set credential_id = p_credential_id where id = m.id;
end;
$$;

create or replace function public.complete_recovery_assertion(p_user_id uuid, p_method_id uuid, p_challenge_id uuid,
  p_old_counter bigint, p_new_counter bigint, p_credential_revision integer)
returns void language plpgsql security invoker set search_path = '' as $$
declare m public.account_key_recovery_methods;
begin
  select * into m from public.account_key_recovery_methods where id = p_method_id and user_id = p_user_id and status <> 'revoked' for update;
  if not found then raise exception using errcode = 'P0002', message = 'recovery method unavailable'; end if;
  update public.account_recovery_credentials set counter = p_new_counter, revision = revision + 1
  where id = m.credential_id and user_id = p_user_id and method_id = m.id and revoked_at is null
    and counter = p_old_counter and revision = p_credential_revision
    and ((p_old_counter = 0 and p_new_counter = 0) or p_new_counter > p_old_counter);
  if not found then raise exception using errcode = '40001', message = 'recovery counter conflict'; end if;
  update public.account_recovery_challenges set verified_at = now()
  where id = p_challenge_id and user_id = p_user_id and method_id = m.id
    and credential_id = m.credential_id and expected_revision = m.revision and operation in ('enroll', 'verify', 'recover')
    and (operation <> 'recover' or m.status = 'active')
    and consumed_at is not null and verified_at is null and expires_at > now();
  if not found then raise exception using errcode = '40001', message = 'invalid recovery challenge'; end if;
end;
$$;

create or replace function public.commit_recovery_method(p_user_id uuid, p_method_id uuid, p_revision integer, p_proof_id uuid, p_wrapper jsonb)
returns public.account_key_recovery_methods language plpgsql security invoker set search_path = '' as $$
declare m public.account_key_recovery_methods;
begin
  select * into m from public.account_key_recovery_methods where id = p_method_id and user_id = p_user_id for update;
  if not found then raise exception using errcode = 'P0002', message = 'recovery method unavailable'; end if;
  if m.status <> 'pending' or m.method_type <> 'passkey' or m.revision <> p_revision or p_revision <> 0 or p_wrapper is null then
    raise exception using errcode = '40001', message = 'recovery revision conflict';
  end if;
  update public.account_recovery_challenges set proof_used_at = now()
  where id = p_proof_id and user_id = p_user_id and method_id = m.id and operation = 'enroll'
    and credential_id = m.credential_id and expected_revision = m.revision and verified_at is not null
    and proof_used_at is null and expires_at > now();
  if not found then raise exception using errcode = '40001', message = 'invalid recovery proof'; end if;
  update public.account_key_recovery_methods set wrapper = p_wrapper, revision = revision + 1 where id = m.id returning * into m;
  return m;
end;
$$;

create or replace function public.read_recovery_method(p_user_id uuid, p_method_id uuid)
returns public.account_key_recovery_methods language plpgsql security invoker set search_path = '' as $$
declare m public.account_key_recovery_methods;
begin
  -- Pending registration metadata must stay readable/revocable after a user
  -- cancels the authenticator UI. Reading it does not count as wrapper proof.
  update public.account_key_recovery_methods
    set readback_at = case when wrapper is not null then now() else readback_at end,
      readback_revision = case when wrapper is not null then revision else readback_revision end
    where id = p_method_id and user_id = p_user_id and status <> 'revoked' returning * into m;
  if not found then raise exception using errcode = 'P0002', message = 'recovery method unavailable'; end if;
  return m;
end;
$$;

create or replace function public.verify_recovery_method(p_user_id uuid, p_method_id uuid, p_revision integer, p_proof_id uuid)
returns public.account_key_recovery_methods language plpgsql security invoker set search_path = '' as $$
declare m public.account_key_recovery_methods;
begin
  select * into m from public.account_key_recovery_methods where id = p_method_id and user_id = p_user_id for update;
  if not found then raise exception using errcode = 'P0002', message = 'recovery method unavailable'; end if;
  if m.status = 'revoked' or m.revision <> p_revision or m.wrapper is null then
    raise exception using errcode = '40001', message = 'recovery revision conflict';
  end if;
  if m.method_type = 'passkey' then
    update public.account_recovery_challenges set proof_used_at = now()
    where id = p_proof_id and user_id = p_user_id and method_id = m.id and operation = 'verify'
      and credential_id = m.credential_id and expected_revision = m.revision and verified_at is not null
      and proof_used_at is null and expires_at > now();
    if not found then raise exception using errcode = '40001', message = 'invalid recovery proof'; end if;
  elsif m.readback_revision is distinct from m.revision or m.readback_at < now() - interval '5 minutes' then
    raise exception using errcode = '40001', message = 'recovery readback required';
  end if;
  update public.account_key_recovery_methods set status = 'active', verified_at = now(), revision = revision + 1
    where id = m.id returning * into m;
  return m;
end;
$$;

create or replace function public.revoke_recovery_method(p_user_id uuid, p_method_id uuid, p_revision integer)
returns public.account_key_recovery_methods language plpgsql security invoker set search_path = '' as $$
declare m public.account_key_recovery_methods;
begin
  select * into m from public.account_key_recovery_methods where id = p_method_id and user_id = p_user_id for update;
  if not found then raise exception using errcode = 'P0002', message = 'recovery method unavailable'; end if;
  if m.revision <> p_revision or m.status = 'revoked' then raise exception using errcode = '40001', message = 'recovery revision conflict'; end if;
  update public.account_key_recovery_methods set status = 'revoked', revoked_at = now(), revision = revision + 1
    where id = m.id returning * into m;
  update public.account_recovery_credentials set revoked_at = now(), revision = revision + 1 where method_id = m.id and user_id = p_user_id;
  update public.account_recovery_challenges set expires_at = now() where method_id = m.id and user_id = p_user_id;
  return m;
end;
$$;

-- The new client uses an exact-record CAS. Unmodified legacy clients can still
-- use their old writes; rollout must account for those clients separately.
create or replace function public.compare_and_swap_vault_record(expected_record jsonb, new_record jsonb)
returns boolean language plpgsql security invoker set search_path = '' as $$
declare uid uuid := auth.uid(); existing jsonb;
begin
  if uid is null then raise exception using errcode = '42501', message = 'not authenticated'; end if;
  if new_record is null or jsonb_typeof(new_record) <> 'object' or octet_length(new_record::text) > 16384 then
    raise exception using errcode = '22023', message = 'invalid vault record';
  end if;
  -- Lock the auth-owner's advisory slot, including insert-when-absent races.
  perform pg_catalog.pg_advisory_xact_lock(pg_catalog.hashtextextended(uid::text, 82713));
  select record into existing from public.vault_keys where user_id = uid for update;
  if not found then
    if expected_record is not null then return false; end if;
    insert into public.vault_keys(user_id, record, updated_at) values(uid, new_record, now()) on conflict do nothing;
    return found;
  end if;
  if existing is distinct from expected_record then return false; end if;
  update public.vault_keys set record = new_record, updated_at = now() where user_id = uid;
  return true;
end;
$$;
revoke all on function public.compare_and_swap_vault_record(jsonb,jsonb) from public, anon;
grant execute on function public.compare_and_swap_vault_record(jsonb,jsonb) to authenticated;

-- Explicitly revoke PostgreSQL's default PUBLIC execute on every new RPC.
do $$
declare f record;
begin
  for f in select p.oid::regprocedure as signature from pg_proc p join pg_namespace n on n.oid = p.pronamespace
    where n.nspname = 'public' and p.proname in (
      'check_recovery_rate_limit', 'create_recovery_method', 'create_recovery_challenge', 'consume_recovery_challenge',
      'register_recovery_credential', 'complete_recovery_assertion', 'commit_recovery_method', 'read_recovery_method',
      'verify_recovery_method', 'revoke_recovery_method')
  loop
    execute format('revoke all on function %s from public, anon, authenticated', f.signature);
    execute format('grant execute on function %s to service_role', f.signature);
  end loop;
end;
$$;
commit;
