-- Keep a content-free receipt for every daily quota reservation so the server
-- can release a request rejected by the provider without refunding twice. The
-- opaque receipt stays between the app server and Postgres; never send it to a
-- browser or put it in logs. Existing successful/unknown-outcome usage remains.
create table public.ai_usage_reservations (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  usage_date date not null,
  created_at timestamptz not null default now(),
  released_at timestamptz
);

create index ai_usage_reservations_user_date_idx
  on public.ai_usage_reservations(user_id, usage_date);

alter table public.ai_usage_reservations enable row level security;
revoke all on table public.ai_usage_reservations from public, anon, authenticated;

-- Preserve the existing RPC signature and atomic user/global spending caps.
create or replace function public.check_ai_usage_quota(
  p_user_daily_max integer,
  p_global_daily_max integer
)
returns jsonb
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_user_id uuid := auth.uid();
  v_day date := (now() at time zone 'UTC')::date;
  v_user_count integer;
  v_global_count integer;
  v_reservation_id uuid;
begin
  if v_user_id is null then
    raise exception 'authentication required' using errcode = '42501';
  end if;
  if p_user_daily_max is null or p_global_daily_max is null
     or p_user_daily_max < 1 or p_user_daily_max > 10000
     or p_global_daily_max < 1 or p_global_daily_max > 1000000 then
    raise exception 'invalid quota bounds' using errcode = '22023';
  end if;

  perform pg_advisory_xact_lock(hashtextextended('ai-quota:' || v_day::text, 0));

  select request_count into v_user_count
  from public.ai_daily_usage
  where scope = 'user' and subject = v_user_id::text and usage_date = v_day;

  select request_count into v_global_count
  from public.ai_daily_usage
  where scope = 'global' and subject = '*' and usage_date = v_day;

  if coalesce(v_user_count, 0) >= p_user_daily_max then
    return jsonb_build_object('allowed', false, 'reason', 'user_daily');
  end if;
  if coalesce(v_global_count, 0) >= p_global_daily_max then
    return jsonb_build_object('allowed', false, 'reason', 'global_daily');
  end if;

  insert into public.ai_daily_usage(scope, subject, usage_date, request_count)
  values ('user', v_user_id::text, v_day, 1)
  on conflict (scope, subject, usage_date) do update
    set request_count = public.ai_daily_usage.request_count + 1,
        updated_at = now();

  insert into public.ai_daily_usage(scope, subject, usage_date, request_count)
  values ('global', '*', v_day, 1)
  on conflict (scope, subject, usage_date) do update
    set request_count = public.ai_daily_usage.request_count + 1,
        updated_at = now();

  insert into public.ai_usage_reservations(user_id, usage_date)
  values (v_user_id, v_day)
  returning id into v_reservation_id;

  return jsonb_build_object('allowed', true, 'reason', null, 'reservation_id', v_reservation_id);
end;
$$;

-- The caller must know its own unguessable receipt. No counter values or
-- receipt details are exposed, and refunding after midnight changes only the
-- original UTC day's counters. The same daily advisory lock serializes reserve
-- and release, including concurrent/replayed releases of the same receipt.
create or replace function public.release_ai_usage_reservation(p_reservation_id uuid)
returns boolean
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_user_id uuid := auth.uid();
  v_day date;
begin
  if v_user_id is null then
    raise exception 'authentication required' using errcode = '42501';
  end if;

  select usage_date into v_day
  from public.ai_usage_reservations
  where id = p_reservation_id and user_id = v_user_id and released_at is null;
  if not found then return false; end if;

  perform pg_advisory_xact_lock(hashtextextended('ai-quota:' || v_day::text, 0));

  update public.ai_usage_reservations
    set released_at = now()
  where id = p_reservation_id and user_id = v_user_id and released_at is null;
  if not found then return false; end if;

  update public.ai_daily_usage
    set request_count = greatest(0, request_count - 1), updated_at = now()
  where scope = 'user' and subject = v_user_id::text and usage_date = v_day;

  update public.ai_daily_usage
    set request_count = greatest(0, request_count - 1), updated_at = now()
  where scope = 'global' and subject = '*' and usage_date = v_day;

  return true;
end;
$$;

revoke all on function public.check_ai_usage_quota(integer, integer) from public, anon;
grant execute on function public.check_ai_usage_quota(integer, integer) to authenticated;
revoke all on function public.release_ai_usage_reservation(uuid) from public, anon;
grant execute on function public.release_ai_usage_reservation(uuid) to authenticated;
