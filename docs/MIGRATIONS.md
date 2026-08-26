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

The baseline preserves the old SQL files for audit/history; do not apply those
files separately after using the baseline. Seed data is disabled.

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

Verified on 2026-08-01 with Supabase CLI 2.111.0 and the local Postgres 17 stack:
all six migrations replayed from zero, all 16 pgTAP assertions passed, migration
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
