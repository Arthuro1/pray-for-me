-- Atomic daily AI usage quotas. This table stores counters only; it never stores
-- prayer text, prompts, model output, access tokens, or other user content.
create table if not exists public.ai_daily_usage (
  scope text not null check (scope in ('user', 'global')),
  subject text not null,
  usage_date date not null,
  request_count integer not null default 0 check (request_count >= 0),
  updated_at timestamptz not null default now(),
  primary key (scope, subject, usage_date)
);

alter table public.ai_daily_usage enable row level security;
revoke all on table public.ai_daily_usage from anon, authenticated;

create or replace function public.check_ai_usage_quota(
  p_user_daily_max integer,
  p_global_daily_max integer
)
returns jsonb
language plpgsql
security definer
set search_path = public, pg_temp
as $$
declare
  v_user_id uuid := auth.uid();
  v_day date := (now() at time zone 'UTC')::date;
  v_user_count integer;
  v_global_count integer;
begin
  if v_user_id is null then
    raise exception 'authentication required' using errcode = '42501';
  end if;
  if p_user_daily_max < 1 or p_user_daily_max > 10000
     or p_global_daily_max < 1 or p_global_daily_max > 1000000 then
    raise exception 'invalid quota bounds' using errcode = '22023';
  end if;

  -- Serialize the small quota reservation section for this UTC day. This keeps
  -- the user and global counters all-or-nothing even under concurrent instances.
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

  return jsonb_build_object('allowed', true, 'reason', null);
end;
$$;

revoke all on function public.check_ai_usage_quota(integer, integer) from public, anon;
grant execute on function public.check_ai_usage_quota(integer, integer) to authenticated;
