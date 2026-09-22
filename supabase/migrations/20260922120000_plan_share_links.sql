-- Public share links for guided prayer plans.
--
-- A reader can share a plan they are walking through with people who have no
-- account yet and are not their friends: one stable link per person per plan
-- (/plans/<plan>/<token>), posted anywhere. Opening it shows the plan publicly;
-- joining starts the recipient's own run from day 1.
--
-- Like plan_invitations, a link carries only the plan's content id — never any
-- prayer content — so there is no end-to-end encryption to handle. What it DOES
-- expose is the sharer's first name, to anyone the link is forwarded to. So:
--
--   * both tables are RPC-only (no direct Data API access for any client role);
--   * the one anonymous RPC returns the plan id and a first name, nothing else —
--     never the sharer's id, and no name at all when the link was turned off,
--     when a block stands between the two people, or when the stored name is
--     just the email's local part (the signup fallback in handle_new_user);
--   * the sharer's id reaches only a SIGNED-IN visitor holding an active link,
--     so they can send an ordinary friend request the sharer still accepts;
--   * the sharer sees how many people joined, and names only for accepted
--     friends — everyone else stays a number.
--
-- "Stop sharing" deactivates the link. The old URL keeps working as a plain
-- plan page without the name; sharing again mints a NEW token, so a link that
-- escaped too far can never be switched back on.

-- ── 1. Tables ────────────────────────────────────────────────────────────────
create table if not exists public.plan_share_links (
  token      text primary key check (token ~ '^[A-Za-z0-9_-]{16,32}$'),
  user_id    uuid not null references auth.users(id) on delete cascade,
  plan_id    text not null check (plan_id ~ '^[A-Za-z0-9_-]{1,64}$'),
  active     boolean not null default true,
  created_at timestamptz not null default now()
);

-- One live link per person per plan; stopped links stay for their join counts.
create unique index if not exists plan_share_links_one_active_idx
  on public.plan_share_links (user_id, plan_id) where active;

create table if not exists public.plan_share_joins (
  token     text not null references public.plan_share_links(token) on delete cascade,
  user_id   uuid not null references auth.users(id) on delete cascade,
  joined_at timestamptz not null default now(),
  primary key (token, user_id)
);

create index if not exists plan_share_joins_user_idx
  on public.plan_share_joins (user_id);

-- RLS on with no policies: every client read or write goes through the
-- definer-rights functions below, whose checks ARE the authorization.
alter table public.plan_share_links enable row level security;
alter table public.plan_share_joins enable row level security;

revoke all on table public.plan_share_links, public.plan_share_joins from public, anon, authenticated;
grant select, insert, update, delete on table public.plan_share_links, public.plan_share_joins to service_role;

-- ── 2. Helpers ───────────────────────────────────────────────────────────────
-- True when either person has blocked the other.
create or replace function public.plan_share_blocked(p_a uuid, p_b uuid)
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select p_a is not null and p_b is not null and exists (
    select 1 from public.user_blocks b
    where (b.blocker_id = p_a and b.blocked_id = p_b)
       or (b.blocker_id = p_b and b.blocked_id = p_a)
  );
$$;

-- The name a stranger may see: the first word of the display name, capped, and
-- nothing when that "name" is only the email's local part or looks like an
-- address. Showing no name is always the safe fallback.
create or replace function public.plan_share_first_name(p_user uuid)
returns text
language sql
stable
security definer
set search_path = ''
as $$
  select case
    when first_word is null or first_word like '%@%' then null
    when lower(btrim(p.full_name)) = lower(split_part(coalesce(u.email, ''), '@', 1)) then null
    else left(first_word, 40)
  end
  from public.profiles p
  left join auth.users u on u.id = p.id
  cross join lateral (select nullif(split_part(btrim(coalesce(p.full_name, '')), ' ', 1), '') as first_word) w
  where p.id = p_user;
$$;

-- ── 3. RPCs for the sharer ───────────────────────────────────────────────────
-- Everything the share sheet shows about the caller's link for one plan: the
-- live token (null when none), whether an earlier link was stopped, how many
-- people began the plan through any of the caller's links for it, and the
-- names of the ones who are accepted friends.
create or replace function public.plan_share_status(p_plan_id text)
returns table (active_token text, stopped boolean, join_count integer, friend_names text[])
language sql
stable
security definer
set search_path = ''
as $$
  with me as (select (select auth.uid()) as id),
  links as (
    select l.token, l.active from public.plan_share_links l, me
    where l.user_id = me.id and l.plan_id = p_plan_id
  ),
  joined as (
    select distinct j.user_id from public.plan_share_joins j
    where j.token in (select token from links)
  )
  select
    (select token from links where active limit 1),
    exists (select 1 from links where not active) and not exists (select 1 from links where active),
    (select count(*)::integer from joined),
    coalesce((
      select array_agg(btrim(p.full_name) order by btrim(p.full_name))
      from joined jn
      join public.profiles p on p.id = jn.user_id
      cross join me
      where nullif(btrim(p.full_name), '') is not null
        and exists (
          select 1 from public.friendships f
          where (f.user_id = me.id and f.friend_id = jn.user_id)
             or (f.friend_id = me.id and f.user_id = jn.user_id)
        )
    ), '{}'::text[])
  from me
  where me.id is not null;
$$;

-- Returns the caller's live link for the plan, minting one if there is none.
-- Idempotent under concurrency: the partial unique index turns a racing second
-- insert into a no-op, and the re-select returns whichever row won.
create or replace function public.create_plan_share_link(p_plan_id text)
returns text
language plpgsql
volatile
security definer
set search_path = ''
as $$
declare
  v_user uuid := (select auth.uid());
  v_token text;
begin
  if v_user is null then
    raise exception 'not authenticated' using errcode = '28000';
  end if;
  if p_plan_id is null or p_plan_id !~ '^[A-Za-z0-9_-]{1,64}$' then
    raise exception 'invalid plan id' using errcode = '22023';
  end if;

  select l.token into v_token from public.plan_share_links l
  where l.user_id = v_user and l.plan_id = p_plan_id and l.active;
  if v_token is not null then
    return v_token;
  end if;

  -- 122 random bits from gen_random_uuid(), as 22 URL-safe characters.
  v_token := rtrim(translate(encode(decode(replace(gen_random_uuid()::text, '-', ''), 'hex'), 'base64'), '+/', '-_'), '=');
  insert into public.plan_share_links (token, user_id, plan_id)
  values (v_token, v_user, p_plan_id)
  on conflict do nothing;

  select l.token into v_token from public.plan_share_links l
  where l.user_id = v_user and l.plan_id = p_plan_id and l.active;
  return v_token;
end;
$$;

-- "Stop sharing": the link keeps showing the plan, without the sharer's name.
create or replace function public.stop_plan_share_link(p_plan_id text)
returns void
language sql
volatile
security definer
set search_path = ''
as $$
  update public.plan_share_links
  set active = false
  where user_id = (select auth.uid()) and plan_id = p_plan_id and active;
$$;

-- ── 4. RPCs for the person opening a link ────────────────────────────────────
-- The public lookup behind the plan page. Callable without an account. An
-- unknown token returns no row. `inviter_id` is filled only for a signed-in
-- caller, so an anonymous visitor never learns the sharer's account id.
create or replace function public.resolve_plan_share_link(p_token text)
returns table (plan_id text, inviter_first_name text, inviter_id uuid, active boolean)
language sql
stable
security definer
set search_path = ''
as $$
  select
    l.plan_id,
    case when v.visible then public.plan_share_first_name(l.user_id) end,
    case when v.visible and (select auth.uid()) is not null then l.user_id end,
    v.visible
  from public.plan_share_links l
  cross join lateral (
    select l.active and not public.plan_share_blocked(l.user_id, (select auth.uid())) as visible
  ) v
  where l.token = p_token;
$$;

-- Counts the caller as having begun the plan through this link. Only a live
-- link for the same plan counts, never the sharer themselves, and never across
-- a block. Idempotent. Returns whether a new join was recorded.
create or replace function public.record_plan_share_join(p_token text, p_plan_id text)
returns boolean
language plpgsql
volatile
security definer
set search_path = ''
as $$
declare
  v_user uuid := (select auth.uid());
  v_count integer;
begin
  if v_user is null then
    raise exception 'not authenticated' using errcode = '28000';
  end if;

  insert into public.plan_share_joins (token, user_id)
  select l.token, v_user
  from public.plan_share_links l
  where l.token = p_token
    and l.plan_id = p_plan_id
    and l.active
    and l.user_id <> v_user
    and not public.plan_share_blocked(l.user_id, v_user)
  on conflict do nothing;

  get diagnostics v_count = row_count;
  return v_count > 0;
end;
$$;

-- ── 5. Grants ────────────────────────────────────────────────────────────────
-- New functions are not exposed by default (see the explicit Data API grants
-- migration). Allow-list exactly the surface above: the lookup for everyone,
-- the rest for signed-in users; the helpers for nobody but the definer.
revoke all on function public.plan_share_blocked(uuid, uuid) from public, anon, authenticated;
revoke all on function public.plan_share_first_name(uuid) from public, anon, authenticated;
revoke all on function public.plan_share_status(text) from public, anon, authenticated;
revoke all on function public.create_plan_share_link(text) from public, anon, authenticated;
revoke all on function public.stop_plan_share_link(text) from public, anon, authenticated;
revoke all on function public.resolve_plan_share_link(text) from public, anon, authenticated;
revoke all on function public.record_plan_share_join(text, text) from public, anon, authenticated;

grant execute on function public.resolve_plan_share_link(text) to anon, authenticated;
grant execute on function public.plan_share_status(text) to authenticated;
grant execute on function public.create_plan_share_link(text) to authenticated;
grant execute on function public.stop_plan_share_link(text) to authenticated;
grant execute on function public.record_plan_share_join(text, text) to authenticated;

grant execute on function
  public.plan_share_blocked(uuid, uuid),
  public.plan_share_first_name(uuid),
  public.plan_share_status(text),
  public.create_plan_share_link(text),
  public.stop_plan_share_link(text),
  public.resolve_plan_share_link(text),
  public.record_plan_share_join(text, text)
to service_role;

notify pgrst, 'reload schema';
