# Supabase migration guide

## Source of truth

`supabase/migrations/` is ordered by timestamp:

1. `20260731000000_legacy_schema_baseline.sql` — consolidated historical schema,
   for a new empty database only.
2. `20260731190247_transactional_group_keys.sql` — atomic group key lifecycle.
3. `20260731190400_explicit_data_api_grants.sql` — explicit RLS-aware Data API
   grants and function allow-list.
4. `20260731190702_ai_usage_quotas.sql` — private atomic daily counters.
5. `20260731191758_community_safety_controls.sql` — reports, blocks, and DB write
   throttles.
6. `20260801050047_harden_profiles_policy.sql` — explicit authenticated profile
   policies, ownership-preserving updates, pinned function paths, and an
   RLS-aware public-key projection.
7. `20260826120000_group_and_profile_avatars.sql` — preset avatar columns on
   groups and profiles, a check constraint per table, column-level SELECT on
   `profiles` (display names stay readable, avatars do not), and the
   relationship-scoped `get_profile_avatars()` RPC.
8. `20260826160000_avatar_photo_uploads.sql` — optional photo avatars: an
   `avatar_photo_path` column per table, the private `avatars` storage bucket
   with its policies, the shared `can_view_profile_avatar` /
   `can_view_group_avatar` / `can_edit_group_avatar` predicates, and
   before-delete triggers that take a profile's or group's avatar objects with
   it. **Creates a storage bucket** — see below.

The baseline preserves the old SQL files for audit/history; do not apply those
files separately after using the baseline. Seed data is disabled.

## Storage buckets

Two private buckets exist. `attachments` (created by the legacy
`rich_media_updates.sql`) only ever holds client-side ciphertext, so any signed-in
user may download from it. `avatars` (created by `20260826160000`) holds readable
images, so its read policies are relationship-scoped instead: a profile photo is
signable only by the person themselves, an accepted friend, or a member of a
group they share; a group photo only by a member or a pending invitee. The bucket
is capped at 512 KB per object and restricted to `image/webp` and `image/jpeg`,
which is a server-side floor under the client's 512x512 pipeline — SVG and every
other active format are refused by the bucket itself. A write policy also caps
each folder at 20 objects, so a client cannot write unbounded data by uploading
avatars it never references; normal use leaves one.

Avatar objects are named `<profiles|groups>/<owner id>/<32 hex>.<webp|jpg>`. A
check constraint ties a row's stored key to that row's own folder, so no profile
or group can reference an object it does not own. Nothing about a display name,
an email address, or any prayer content appears in an object name, and no avatar
has a permanent public URL — the client renders from short-lived signed URLs it
caches for the session.

Deploy order: apply `20260826160000` before shipping a client that can upload a
photo. A client deployed first simply cannot upload (the bucket does not exist);
preset and initials avatars are unaffected either way.

## New environment

```bash
npx --yes supabase@2.111.0 start
npx --yes supabase@2.111.0 db reset --local --no-seed
npx --yes supabase@2.111.0 test db --local supabase/tests
npx --yes supabase@2.111.0 db advisors --local --type all --level error --fail-on error
```

The same rebuild, pgTAP assertions, and error-level advisor gate run in CI. A
successful reset proves ordering and syntax from zero; tests verify RLS,
protected table privileges, critical RPC execution, group-key FK, fixed definer
search paths, profile ownership, and the caller-rights public-key view.

`supabase/tests/` holds two files. `security_schema.test.sql` inspects the
schema — that the right policies, grants, constraints, and definer settings
exist. `avatar_policies.test.sql` exercises them: it creates five users with
different relationships and checks, as each of them in turn, what they can
actually read and write.

Verified on 2026-08-26 with Supabase CLI 2.115.0 and the local Postgres 17 stack:
all eight migrations replayed from zero, all 53 pgTAP assertions passed, migration
history matched, and the security advisor returned no error-level findings.

## Existing deployment

1. Announce a maintenance window and take a restorable database backup.
2. Record the current migration list and schema; run `supabase db diff --linked`
   and resolve drift. Do not assume every historical hand-run file is present.
3. Compare production to the baseline. If equivalent, mark only the baseline as
   already applied: `supabase migration repair 20260731000000 --status applied --linked`.
4. Review every forward migration, especially RLS/grant changes and orphan output.
5. Apply with `supabase db push --linked` before deploying the new frontend.
6. Run `select * from public.detect_orphaned_group_key_versions();` as an admin
   workflow and resolve any content-bound orphan before relying on rotation.
7. Smoke-test two accounts, a group rotation, AI quota response, report/block,
   offline sign-out isolation, and notification delivery.

If production is not baseline-equivalent, stop. Create a reconciliation
migration from the actual schema; never run the clean-install baseline over live
tables. Record the decision in the release notes.

## Reversibility

Migrations are forward-only by default. The baseline is not a production
rollback tool. Table/column deletion, ciphertext/key deletion, membership/key
rotation, and data backfills are destructive or logically irreversible. Restore
from a tested backup or ship a reviewed compensating migration. Do not delete a
content-bound orphan key version. See [OPERATIONS.md](./OPERATIONS.md).
