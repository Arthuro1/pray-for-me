-- ════════════════════════════════════════════════════════════════════════
-- Database behaviour tests for the notification system (supabase/notifications.sql).
--
-- These run against a LOCAL Supabase / Postgres as the `postgres` superuser
-- (so they can seed auth.users and set request.jwt.claims to simulate a signed-in
-- user). They are NOT part of the Vitest suite (which covers the JS/TS pure
-- logic) — run them manually:
--
--   psql "$DATABASE_URL" -f supabase/notifications.sql      -- once, to install
--   psql "$DATABASE_URL" -f supabase/notifications_test.sql -- to verify
--
-- Everything runs in a transaction that ROLLS BACK at the end, so the test data
-- never persists. A failed `assert` aborts with a clear message.
-- ════════════════════════════════════════════════════════════════════════
begin;

-- ── Seed two users, a group, a community prayer ─────────────────────────────
insert into auth.users (id, email, aud, role)
values
  ('aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', 'a@test.dev', 'authenticated', 'authenticated'),
  ('bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb', 'b@test.dev', 'authenticated', 'authenticated');

insert into public.groups (id, name, invite_code, created_by)
values ('99999999-9999-9999-9999-999999999999', 'Test group', 'TESTCODE', 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa');

insert into public.group_members (group_id, user_id, role) values
  ('99999999-9999-9999-9999-999999999999', 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', 'admin');

insert into public.community_prayers (id, group_id, user_id, author_name, title)
values ('77777777-7777-7777-7777-777777777777', '99999999-9999-9999-9999-999999999999',
        'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', 'A', 'ciphertext-title');

-- ── 1. A friend request generates exactly one notification for the recipient ──
insert into public.friend_requests (from_user_id, to_user_id)
values ('aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', 'bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb');

do $$ begin
  assert (select count(*) from public.notifications
          where recipient_id = 'bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb' and type = 'friend_request') = 1,
    'friend request should create exactly one notification';
end $$;

-- ── 2. A group invitation generates one notification for the invitee ─────────
insert into public.group_invitations (group_id, invited_user_id, invited_by)
values ('99999999-9999-9999-9999-999999999999', 'bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb',
        'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa');

do $$ begin
  assert (select count(*) from public.notifications
          where recipient_id = 'bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb' and type = 'group_invitation') = 1,
    'group invitation should create exactly one notification';
end $$;

-- ── 3. An update by another member notifies the prayer owner ─────────────────
insert into public.community_updates (community_prayer_id, user_id, author_name, text)
values ('77777777-7777-7777-7777-777777777777', 'bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb', 'B', 'ciphertext');

do $$ begin
  assert (select count(*) from public.notifications
          where recipient_id = 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa' and type = 'community_update') = 1,
    'a member update should notify the prayer owner';
end $$;

-- ── 4. A user does NOT get notified for their OWN update ─────────────────────
insert into public.community_updates (community_prayer_id, user_id, author_name, text)
values ('77777777-7777-7777-7777-777777777777', 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', 'A', 'ciphertext');

do $$ begin
  -- still exactly one (the owner's own update added no self-notification)
  assert (select count(*) from public.notifications
          where recipient_id = 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa' and type = 'community_update') = 1,
    'a user must not be notified about their own update';
end $$;

-- ── 5. Answered fires only on the transition, and dedupes on re-toggle ───────
insert into public.prayer_notification_subscriptions (user_id, community_prayer_id, notify_answered)
values ('bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb', '77777777-7777-7777-7777-777777777777', true);

update public.community_prayers set is_answered = true where id = '77777777-7777-7777-7777-777777777777';
update public.community_prayers set is_answered = false where id = '77777777-7777-7777-7777-777777777777';
update public.community_prayers set is_answered = true where id = '77777777-7777-7777-7777-777777777777';

do $$ begin
  assert (select count(*) from public.notifications
          where recipient_id = 'bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb' and type = 'answered') = 1,
    'answered should notify once per follower even across answered/active/answered toggles';
end $$;

-- ── 6. Duplicate trigger execution does not create duplicate notifications ────
-- Re-inserting the same friend request would violate the unique key; instead we
-- assert the dedupe index directly by attempting a second create_notification
-- with the same dedupe_key.
do $$
declare before_count int; after_count int;
begin
  select count(*) into before_count from public.notifications
    where recipient_id = 'bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb' and type = 'friend_request';
  perform public.create_notification(
    'bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb', 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa',
    'friend_request', null, 'friend_request', gen_random_uuid(),
    '{}'::jsonb,
    (select dedupe_key from public.notifications
       where recipient_id = 'bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb' and type = 'friend_request' limit 1)
  );
  select count(*) into after_count from public.notifications
    where recipient_id = 'bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb' and type = 'friend_request';
  assert before_count = after_count, 'duplicate dedupe_key must not create a second notification';
end $$;

-- ── Aggregation / digest fixtures: add user C, make B + C members ────────────
insert into auth.users (id, email, aud, role)
values ('cccccccc-cccc-cccc-cccc-cccccccccccc', 'c@test.dev', 'authenticated', 'authenticated');
insert into public.group_members (group_id, user_id, role) values
  ('99999999-9999-9999-9999-999999999999', 'bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb', 'member'),
  ('99999999-9999-9999-9999-999999999999', 'cccccccc-cccc-cccc-cccc-cccccccccccc', 'member');

-- ── 9. Reactions aggregate into ONE bucket notification per hour ─────────────
insert into public.prayer_reactions (community_prayer_id, user_id) values
  ('77777777-7777-7777-7777-777777777777', 'bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb'),
  ('77777777-7777-7777-7777-777777777777', 'cccccccc-cccc-cccc-cccc-cccccccccccc');

do $$ begin
  assert (select count(*) from public.notifications
          where recipient_id = 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa' and type = 'reaction_bucket') = 1,
    'two reactions in the same hour must aggregate into one bucket notification';
end $$;

-- ── 10. A new community prayer notifies every other member (not the author) ──
insert into public.community_prayers (id, group_id, user_id, author_name, title)
values ('66666666-6666-6666-6666-666666666666', '99999999-9999-9999-9999-999999999999',
        'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', 'A', 'ciphertext');

do $$ begin
  assert (select count(*) from public.notifications
          where type = 'group_prayer_added' and recipient_id = 'bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb') = 1,
    'a new group prayer should notify other members';
  assert (select count(*) from public.notifications
          where type = 'group_prayer_added' and recipient_id = 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa') = 0,
    'the author must not be notified of their own new prayer';
end $$;

-- ── 11. A testimony notifies every other member ──────────────────────────────
insert into public.testimonies (group_id, user_id, author_name, content, community_prayer_id)
values ('99999999-9999-9999-9999-999999999999', 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa',
        'A', 'ciphertext', '77777777-7777-7777-7777-777777777777');

do $$ begin
  assert (select count(*) from public.notifications
          where type = 'testimony' and recipient_id = 'cccccccc-cccc-cccc-cccc-cccccccccccc') = 1,
    'a testimony should notify other members';
end $$;

-- ── 12. Digest claim is idempotent ───────────────────────────────────────────
-- group_prayer_added defaults to digest; simulate deliver() marking B's row, then
-- claim it twice — the second claim must return nothing.
update public.notifications set push_status = 'skipped', last_push_error = 'digest'
  where type = 'group_prayer_added' and recipient_id = 'bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb';

do $$
declare first_batch int; second_batch int;
begin
  assert exists (select 1 from public.pending_digest_recipients(100)
                 where recipient_id = 'bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb'),
    'B should be a pending digest recipient';
  select count(*) into first_batch from public.claim_user_digest('bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb');
  assert first_batch >= 1, 'the first digest claim should return the pending rows';
  select count(*) into second_batch from public.claim_user_digest('bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb');
  assert second_batch = 0, 'a second digest claim must be idempotent (return nothing)';
end $$;

-- ── 7. RLS: a user cannot read another user's notifications ──────────────────
set local role authenticated;
set local request.jwt.claims = '{"sub":"aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa"}';

do $$ begin
  -- User A sees their own community_update notification…
  assert (select count(*) from public.notifications where type = 'community_update') >= 1,
    'user A should see their own notifications';
  -- …but none of user B's friend_request/group_invitation notifications.
  assert (select count(*) from public.notifications
          where recipient_id = 'bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb') = 0,
    'RLS must hide another user''s notifications';
end $$;

-- ── 8. A user may only update read-related fields on their own notification ──
do $$
declare nid uuid;
begin
  select id into nid from public.notifications
    where recipient_id = 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa' limit 1;

  -- Allowed: mark read.
  update public.notifications set read_at = now() where id = nid;
  assert (select read_at is not null from public.notifications where id = nid),
    'owner should be able to set read_at';

  -- Forbidden: changing delivery status is blocked by the column-level GRANT
  -- (only seen_at/read_at are updatable by `authenticated`).
  begin
    update public.notifications set push_status = 'sent' where id = nid;
    raise exception 'expected column privilege to block push_status update';
  exception when insufficient_privilege then
    null; -- expected
  end;
end $$;

reset role;
rollback;

\echo 'notifications_test.sql: all assertions passed'
