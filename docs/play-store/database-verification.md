# Database verification — 8 October 2026

**Local verification: PASS. Production ownership migration: PENDING.** The
isolated database applied all 20 repository migrations, passed all 138 pgTAP
assertions across 8 files, and passed the advisor error gate. Production was
inspected read-only; no production migration, DDL, data write or deployment was
performed. This closes the local database-test gate, not the production-apply gate.
The machine-readable record is
[database-verification.json](database-verification.json), checked at
**2026-10-08 15:04:42 UTC**.

## Isolated local verification

Supabase CLI **2.111.0** and Docker were used with project ID
`qetoret_db_verify_20261008`, database port **55322**, and PostgreSQL **17.6**.
Only copied configuration, migrations and tests were used in the ignored working
directory `android-twa/releases/1.0.3/db-verification/`. This was an independent
local database, not a reset of the linked production project. The initial
CLI/Docker availability limitation recorded during release preparation is resolved.
Cleanup passed: only the isolated verification project's containers and volumes
were removed; unrelated Docker containers were left alone.

| Check | Recorded result |
| --- | --- |
| Start isolated database | PASS; all 20 migrations applied |
| `db reset --local --no-seed` | PASS; all 20 migrations reapplied from a clean database |
| Full pgTAP suite | PASS; 8 files, 138 assertions |
| Feedback ownership pgTAP coverage | PASS; 15 assertions included in that full run |
| `db advisors --type all --level error --fail-on error` | PASS; no error-level issues reported locally |
| Migration history | 20 versions, matching the repository through `20261008160000` |
| Feedback metadata | Restrictive ownership guard present; `anon` INSERT false; `authenticated` INSERT true |
| Synthetic data after suite | Zero `auth.users` rows and zero feedback rows; test transactions rolled back |

The eight test files cover account deletion, avatar policies, daily reminder
scheduling, feedback ownership, plan-share links, schema security, translations
and wording reports. The feedback tests verify that callers cannot forge another
account's ownership, submit without a JWT subject, claim identity on unlinked
feedback, read the report queue, or directly mutate their submitted reports. They
also verify accepted owned reports and deliberately unlinked general feedback,
and account deletion that erases the caller's report while preserving the other
account's report and unlinked feedback. Anonymous general feedback here means an
authenticated person's submission with no stored attribution; it does not grant
the signed-out `anon` database role access.

The initial pgTAP run had three diagnostic-string mismatches: PostgreSQL named
the restrictive policy in its expected `42501` errors. Those three expected
strings were corrected; the migration did not require a schema change. The
feedback test now has 15 assertions, and the complete rerun passed all 138.

Evidence files are under
[`android-twa/releases/1.0.3/db-verification/`](../../android-twa/releases/1.0.3/db-verification):

- [migration-reset.log](../../android-twa/releases/1.0.3/db-verification/migration-reset.log)
- [pgtap-results-final.log](../../android-twa/releases/1.0.3/db-verification/pgtap-results-final.log)
- [advisors-error-gate.log](../../android-twa/releases/1.0.3/db-verification/advisors-error-gate.log)
- [migration-history.log](../../android-twa/releases/1.0.3/db-verification/migration-history.log)
- [local-metadata.log](../../android-twa/releases/1.0.3/db-verification/local-metadata.log)

The advisor command deliberately gates on **errors**. It does not establish that
every warning or information-level finding is absent, and passing schema tests
does not verify production storage cleanup, edge functions, gateway behavior,
moderator operations or the installed Android app.

## Production read-only findings

Supabase MCP inspection identified project **`pfybdjcapexqmffojuie`**, matching
the configured application project URL. Its status was **ACTIVE_HEALTHY**, with
PostgreSQL **17.6.1.127**. Only migration history, schema/access metadata and
advisors were inspected; no user-content export was needed.
No full production schema diff, live authorization writes or production-account
smoke test was performed. Local behavior tests and remote metadata inspection
provide different evidence; neither establishes those unperformed checks.

| Item | Observed production state |
| --- | --- |
| Applied migration history | 19 versions, matching the repository through `20260922230622` |
| `20261008160000_feedback_report_ownership.sql` | **Not applied** |
| Public table RLS | Enabled on every public table inspected |
| `delete_account`, `submit_community_report`, `set_user_block` | SECURITY DEFINER, pinned empty search path; execute allowed for `authenticated`, denied for `anon` |
| Existing feedback access | SELECT policy false; permissive INSERT policy true; `anon` INSERT privilege still present |
| Account deletion | `delete_account` explicitly deletes the caller's attributed feedback |

RLS being enabled does not close the feedback gap: the existing permissive insert
policy and grants still allow the behavior the new restrictive guard is designed
to constrain. Apply the verified additive migration before deploying the new
reporter-enabled client. Its source is
[`20261008160000_feedback_report_ownership.sql`](../../supabase/migrations/20261008160000_feedback_report_ownership.sql),
with regression coverage in
[`feedback_report_ownership.test.sql`](../../supabase/tests/feedback_report_ownership.test.sql).
The migration does not rewrite historical feedback.

## Production advisor triage

Both production advisor categories reported **0 ERROR** findings. Warnings still
need review; a zero-error result is not an independent security assessment.
Official remediation guidance below was checked on **8 October 2026**. Supabase
explains that advisors inspect schema metadata and that some flagged access is
intentional; document the actual authorization model before changing it.
[Supabase Advisors](https://supabase.com/docs/guides/observability/advisors).

| Security finding | Count | Required review / remediation |
| --- | --- | --- |
| Mutable function search path: `avatar_owner_uuid` | 1 WARN | Pin a suitable search path and schema-qualify references; verify avatar access afterward. [Function search path guidance](https://supabase.com/docs/guides/observability/advisors?lint=0011_function_search_path_mutable) |
| `anon` executable SECURITY DEFINER: `resolve_plan_share_link` | 1 WARN | Public token lookup is intentional. Review token scope, expiry/revocation and returned fields; record why public execution is needed. Do not revoke it blindly and break share links. [Anonymous definer guidance](https://supabase.com/docs/guides/observability/advisors?lint=0028_anon_security_definer_function_executable) |
| `authenticated` executable SECURITY DEFINER functions | 35 WARN | Review caller/ownership checks, grants, qualified references and elevated operations per function. Role access alone does not prove row authorization. [Authenticated definer guidance](https://supabase.com/docs/guides/observability/advisors?lint=0029_authenticated_security_definer_function_executable), [database functions](https://supabase.com/docs/guides/database/functions) |
| Leaked-password protection disabled | 1 WARN | Owner should enable the supported compromised-password check and test signup/password changes, or record the operational decision. [Password security](https://supabase.com/docs/guides/auth/password-security) |
| RLS enabled with no policies | 8 INFO | Confirm these tables remain intentionally server-only and that grants match that intent; do not add broad client policies to silence a finding. [No-policy guidance](https://supabase.com/docs/guides/observability/advisors?lint=0008_rls_enabled_no_policy) |

| Performance finding | Count | Required review / remediation |
| --- | --- | --- |
| Auth RLS initplan | 61 WARN | Review stable caller helpers and use an initplan where behavior permits; compare policy results and query plans. [Initplan guidance](https://supabase.com/docs/guides/observability/advisors?lint=0003_auth_rls_initplan) |
| Multiple permissive policies | 19 WARN | Review overlapping role/action policies and consolidate only when the resulting access remains equivalent. [Policy guidance](https://supabase.com/docs/guides/observability/advisors?lint=0006_multiple_permissive_policies) |
| Unindexed foreign keys | 32 INFO | Inspect join/delete workloads and existing indexes before adding indexes. [Foreign-key index guidance](https://supabase.com/docs/guides/observability/advisors?lint=0001_unindexed_foreign_keys) |
| Unused indexes | 7 INFO | Check observation period and constraints/workloads before removing indexes. [Unused-index guidance](https://supabase.com/docs/guides/observability/advisors?lint=0005_unused_index) |

These findings were recorded, not changed on production. Keep their triage
separate from the verified feedback migration; do not bundle unrelated access or
performance changes into its deployment without review and testing.

## Production release gate still open

1. The owner/operator reviews the verified migration, confirms the intended
   production project and current history, and applies it through the normal
   migration process. Do not run a production database reset.
2. Record the production migration version and verify the restrictive policy,
   `anon` INSERT denial and authenticated INSERT grant after application.
3. Run a controlled synthetic-account smoke test: owned reporting succeeds,
   forged ownership fails, reports are not client-readable, and account erasure
   removes attributed feedback. Resolve the synthetic records afterward.
4. Verify the deployed client and moderation workflow, rerun advisors and retain
   the resulting evidence. Storage/provider deletion and live privacy checks
   remain separate gates in [console-checklist.md](console-checklist.md).

Do not mark production migrated, live deletion verified or the Play release ready
on the basis of this local verification record.
