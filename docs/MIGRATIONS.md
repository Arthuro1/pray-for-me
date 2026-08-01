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

The baseline preserves the old SQL files for audit/history; do not apply those
files separately after using the baseline. Seed data is disabled.

## New environment

```bash
npx supabase start
npx supabase db reset --local --no-seed
npx supabase test db --local supabase/tests
```

The same rebuild and pgTAP assertions run in CI. A successful reset proves
ordering and syntax from zero; tests verify RLS, protected table privileges,
critical RPC execution, group-key FK, and fixed definer search paths.

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
