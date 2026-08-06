-- ════════════════════════════════════════════════════════════════════════
-- Shared rate limit for AI requests. Called by the self-hosted AI gateway (via
-- api/ai.js) as check_ai_rate_limit. A GLOBAL fixed-window counter in Postgres,
-- so the cap holds across every gateway instance instead of resetting on each
-- cold start (gateway-local limiting alone would not). Run in the Supabase SQL editor.
--
-- The proxy calls check_ai_rate_limit with the user's own Bearer token. The
-- function is SECURITY DEFINER and keys on auth.uid(), so it can write the
-- counter even though users have no direct table access — and it can only ever
-- touch the caller's own row. No service-role key is needed on the server.
-- ════════════════════════════════════════════════════════════════════════

create table if not exists ai_rate_limits (
  user_id      uuid primary key references auth.users(id) on delete cascade,
  window_start timestamptz not null default now(),
  count        integer     not null default 0
);

-- Lock the table down: only the SECURITY DEFINER function (which runs as the
-- table owner and bypasses RLS) may read or write it. No policies = no direct
-- access for anon/authenticated roles.
alter table ai_rate_limits enable row level security;

-- Atomic fixed-window check. Increments the caller's counter for the current
-- window (resetting it when the window has elapsed) and returns true while the
-- count is at or below p_max — i.e. true = allowed, false = rate limited.
create or replace function check_ai_rate_limit(p_max integer, p_window_seconds integer)
returns boolean
language plpgsql
security definer
set search_path = public
as $$
declare
  v_user  uuid := auth.uid();
  v_now   timestamptz := now();
  v_count integer;
begin
  if v_user is null then
    return false; -- unauthenticated callers are never "allowed"
  end if;

  insert into ai_rate_limits (user_id, window_start, count)
    values (v_user, v_now, 1)
  on conflict (user_id) do update
    set
      count = case
        when ai_rate_limits.window_start < v_now - make_interval(secs => p_window_seconds)
          then 1
        else ai_rate_limits.count + 1
      end,
      window_start = case
        when ai_rate_limits.window_start < v_now - make_interval(secs => p_window_seconds)
          then v_now
        else ai_rate_limits.window_start
      end
  returning count into v_count;

  return v_count <= p_max;
end;
$$;

-- Allow the app's signed-in users to invoke the RPC (it self-scopes to auth.uid).
grant execute on function check_ai_rate_limit(integer, integer) to authenticated;
