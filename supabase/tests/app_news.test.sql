-- App news ("What's new"), exercised as the server that sends it.
--
--   paris   — chose Europe/Paris for quiet hours
--   tokyo   — chose Asia/Tokyo
--   offset  — a zone Postgres doesn't know, and a device 5 hours behind UTC
--   plain   — no zone, no device (treated as UTC)
--   optout  — switched app news off
--
-- What must hold: only the server announces a release, once per account and
-- never to someone who switched it off; the rows carry the version and
-- nothing else; the usual queue never claims them; a push waits for the
-- member's daytime (10:00–20:00) and gives up after three days.
begin;
select plan(19);

-- ── Fixtures ────────────────────────────────────────────────────────────────
insert into auth.users (id, instance_id, aud, role, email, encrypted_password, email_confirmed_at, created_at, updated_at)
select id, '00000000-0000-0000-0000-000000000000', 'authenticated', 'authenticated',
       who || '@example.test', 'x', now(), now(), now()
from (values
  ('a1111111-1111-4111-8111-111111111111'::uuid, 'paris'),
  ('a2222222-2222-4222-8222-222222222222'::uuid, 'tokyo'),
  ('a3333333-3333-4333-8333-333333333333'::uuid, 'offset'),
  ('a4444444-4444-4444-8444-444444444444'::uuid, 'plain'),
  ('a5555555-5555-4555-8555-555555555555'::uuid, 'optout')
) as u(id, who)
on conflict (id) do nothing;

insert into public.notification_preferences (user_id, type, group_id, timezone) values
  ('a1111111-1111-4111-8111-111111111111', '_account', null, 'Europe/Paris'),
  ('a2222222-2222-4222-8222-222222222222', '_account', null, 'Asia/Tokyo'),
  ('a3333333-3333-4333-8333-333333333333', '_account', null, 'Mars/Olympus');

insert into public.notification_preferences (user_id, type, group_id, delivery_mode)
values ('a5555555-5555-4555-8555-555555555555', 'app_news', null, 'off');

insert into public.push_subscriptions (user_id, endpoint, p256dh, auth, tz_offset)
values ('a3333333-3333-4333-8333-333333333333', 'https://push.example.test/offset', 'k', 'a', -300);

-- ── The surface ─────────────────────────────────────────────────────────────
select ok(
  not has_function_privilege('authenticated', 'public.queue_app_news(text)', 'EXECUTE')
  and not has_function_privilege('anon', 'public.queue_app_news(text)', 'EXECUTE')
  and has_function_privilege('service_role', 'public.queue_app_news(text)', 'EXECUTE'),
  'only the server announces a release'
);
select ok(
  not has_function_privilege('authenticated', 'public.claim_app_news_for_delivery(integer,timestamp with time zone)', 'EXECUTE')
  and not has_function_privilege('authenticated', 'public.app_news_daytime(uuid,timestamp with time zone)', 'EXECUTE')
  and has_function_privilege('service_role', 'public.claim_app_news_for_delivery(integer,timestamp with time zone)', 'EXECUTE'),
  'only the server claims app news'
);
select throws_ok(
  $$ select public.queue_app_news('soon') $$,
  '22023', null,
  'an announcement names a real version'
);

-- ── Daytime, in each member's own zone ──────────────────────────────────────
select ok(
  public.app_news_daytime('a1111111-1111-4111-8111-111111111111', '2026-10-17 08:30+00')
  and not public.app_news_daytime('a1111111-1111-4111-8111-111111111111', '2026-10-17 19:00+00'),
  'Paris: 10:30 is daytime, 21:00 is not'
);
select ok(
  public.app_news_daytime('a2222222-2222-4222-8222-222222222222', '2026-10-17 08:30+00')
  and not public.app_news_daytime('a2222222-2222-4222-8222-222222222222', '2026-10-17 12:00+00'),
  'Tokyo: 17:30 is daytime, 21:00 is not'
);
select ok(
  public.app_news_daytime('a3333333-3333-4333-8333-333333333333', '2026-10-17 16:00+00')
  and not public.app_news_daytime('a3333333-3333-4333-8333-333333333333', '2026-10-17 12:00+00'),
  'an unknown zone falls back to the device offset'
);
select ok(
  public.app_news_daytime('a4444444-4444-4444-8444-444444444444', '2026-10-17 12:00+00')
  and not public.app_news_daytime('a4444444-4444-4444-8444-444444444444', '2026-10-17 22:00+00'),
  'no zone at all reads as UTC'
);

-- ── Announcing 1.0.6 ────────────────────────────────────────────────────────
select is(
  public.queue_app_news('1.0.6'),
  (select count(*)::integer from auth.users) - 1,
  'every account but the one that opted out holds the announcement'
);
select is(
  (select count(*)::integer from public.notifications
    where recipient_id = 'a5555555-5555-4555-8555-555555555555' and type = 'app_news'),
  0,
  'switching app news off means no announcement'
);
select is(
  public.queue_app_news('1.0.6'),
  (select count(*)::integer from auth.users) - 1,
  'announcing the same version twice changes nothing'
);
select is(
  (select count(*)::integer from public.notifications
    where recipient_id = 'a1111111-1111-4111-8111-111111111111' and type = 'app_news'),
  1,
  'one announcement per account'
);
select ok(
  not exists (
    select 1 from public.notifications
    where type = 'app_news' and (metadata <> '{"version": "1.0.6"}'::jsonb or actor_id is not null)
  ),
  'an announcement carries its version and nothing else'
);

-- ── Its own queue ───────────────────────────────────────────────────────────
select is(
  (select count(*)::integer from public.claim_notifications_for_delivery(500) where type = 'app_news'),
  0,
  'the usual queue never claims app news'
);
select is(
  (select count(*)::integer from public.claim_notification(
    (select id from public.notifications
      where recipient_id = 'a1111111-1111-4111-8111-111111111111' and type = 'app_news'))),
  0,
  'nor does a direct claim'
);

-- At 19:00 UTC it is evening in Paris and night in Tokyo, but daytime five
-- hours behind UTC and in UTC itself.
select set_eq(
  $$ select recipient_id from public.claim_app_news_for_delivery(100, date_trunc('day', now()) + interval '19 hours') $$,
  $$ values ('a3333333-3333-4333-8333-333333333333'::uuid), ('a4444444-4444-4444-8444-444444444444'::uuid) $$,
  'a push goes only to members whose daytime it is'
);
select is(
  (select push_status from public.notifications
    where recipient_id = 'a4444444-4444-4444-8444-444444444444' and type = 'app_news'),
  'processing',
  'a claimed announcement is held while it is sent'
);
select is(
  (select count(*)::integer from public.claim_app_news_for_delivery(100, date_trunc('day', now()) + interval '19 hours')),
  0,
  'a claimed announcement is never claimed twice'
);

-- 03:00 UTC is noon in Tokyo: too late after four days, in time after one.
select is(
  (select count(*)::integer from public.claim_app_news_for_delivery(100, date_trunc('day', now()) + interval '4 days 3 hours')),
  0,
  'after three days the push is dropped'
);
select set_eq(
  $$ select recipient_id from public.claim_app_news_for_delivery(100, date_trunc('day', now()) + interval '1 day 3 hours') $$,
  $$ values ('a2222222-2222-4222-8222-222222222222'::uuid) $$,
  'a member asleep at the first send hears it in their morning'
);

select * from finish();
rollback;
