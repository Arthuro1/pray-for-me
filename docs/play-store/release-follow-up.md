# Requested release follow-up — 8 October 2026

Checked at **2026-10-08 15:21:32 UTC**. Machine-readable evidence:
[release-follow-up.json](release-follow-up.json).

| Requested item | Verified result |
| --- | --- |
| Redeploy event notifications | **DONE:** active version **40** on project `pfybdjcapexqmffojuie`. The 17 old-brand digest/fallback title strings now say Qetoret. Entrypoint and internal-auth helper are unchanged. All deployed files match local source. |
| Higher Android versionCode | **ALREADY DONE:** signed **1.0.3 (4)**, increased from repository version **1.0.2 (3)**. Signature, hash and packaged identity rechecks passed; no redundant bump. Console history still needs checking. |
| Regenerate plan preview images | **DONE:** `npm run build:plan-og` regenerated **27 PNGs** after Paul's approval of `zechariah10`. |
| Update listing text/screenshots | **PREPARED LOCALLY:** EN/FR copy, six 1080 × 1920 English screenshots, feature graphic and icon verified. Store icon corrected to 32-bit RGBA PNG; artwork unchanged. **Not uploaded to Console:** no accessible publishing integration/browser session. |
| Approve pending release work | User authorization recorded for verified technical changes. The tested feedback ownership migration was applied and verified. Paul's explicit 8 October approval is now recorded for all pending content publication gates; Console declarations and device-test facts remain separate. |

## Deployment verification

Notification function version 40 retains its existing internal bearer
authentication. An unauthenticated POST returned **401** with
`{"error":"unauthorized"}`. No real-user push was triggered.

Five focused Vitest files passed **34 tests**, covering generic event payloads,
branding, push helpers and plan-preview freshness. Six local release checks and
ESLint on the changed scripts passed.

The production ownership migration is
[`20261008151537_feedback_report_ownership.sql`](../../supabase/migrations/20261008151537_feedback_report_ownership.sql).
Production now has **20 migrations**; post-apply metadata confirms enabled RLS,
the restrictive authenticated ownership policy, revoked anonymous INSERT,
retained authenticated INSERT and the existing account-erasure feedback statement.
Both post-apply advisor categories still have **0 ERROR** findings. Their
existing warnings remain recorded in [database-verification.md](database-verification.md).
Live synthetic-account reporting and erasure checks remain pending.

Supabase assigned the migration timestamp during application. The local filename
was reconciled to that version; the SQL bytes are identical to the migration that
passed the isolated **138-assertion** database suite. The historical local logs
retain the earlier test filename. No production reset or historical data rewrite
was performed.

## Remaining release work

The final live preflight still has **five failures**: qetoret.com serves the old
Praystead manifest and root/legal responses without the intended Qetoret
branding. Digital Asset Links passes for the configured local certificates.
Deploy and verify the intended web release before Play review.

The user selected manual upload using the prepared submission pack. The listing
pack is ready for Console entry; this session has no enabled
browser surface or Android Publisher integration. Console version history,
Play app-signing certificate, declarations, review access, physical-device tests
and any required closed test still need actual evidence. Four existing
resource guard failures also remain documented in [validation.md](validation.md).

## Paul’s human approval — 8 October 2026

The user explicitly instructed: “approve all that needed human review and sign
with Paul”. That supplied approval is recorded under **Paul**, dated
**2026-10-08**, with the exact instruction and closed content scope. Earlier
approval records and wording notes are preserved as history.

| Scope previously pending | Current state |
| --- | --- |
| `zechariah10` v1 | Theology, safety and all 16 locale publication signoffs recorded; all 27 plans now approved |
| Seven deep circle layers | Theology, safety and EN/FR signoffs recorded |
| Fourteen short-circle translations | Current-presentation approval recorded, retaining AI provenance |
| Five resource content/safety reviews | All recorded; three usable entries publish, two unavailable entries remain hidden |
| Six plan wording re-reviews | Exact September notes approved and moved into dated history |
| Current release materials and editorial snapshot | Owner approval recorded against the current source hashes |

Runtime inventory confirms no plan, circle publication or resource
content/safety signoff remains missing in this scope. Seven resources remain
held for edition availability; four other approved resources lack a usable
edition. One intentionally retired resource remains retired.

The records do not assert native fluency or an independent audit. The separate
specialist editorial metadata still requires actual native-language evidence;
Paul’s owner approval is bound to the current presentation and snapshot.

See [paul-approval-2026-10-08.md](paul-approval-2026-10-08.md) and
[paul-approval-2026-10-08.json](paul-approval-2026-10-08.json).
The combined approval/integration run passed **93 tests in 12 files**.
Strict lint, type checking, locale/content checks, production build and six local
release checks passed again. The four existing shelf guards still fail
(**62 passing / 4 failing**), separately from human approval.

Use [console-checklist.md](console-checklist.md) and
[test-plan.md](test-plan.md) to record the remaining operational evidence.
