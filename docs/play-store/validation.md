# Validation record — 8 October 2026

This records local release preparation and a read-only live preflight. No
production deployment, database migration or Play submission was performed.
Passing a local check does not confirm production configuration or device behavior.

## Completed local checks

| Check | Result | Scope / limit |
| --- | --- | --- |
| `npm run lint:strict` | PASS | Strict repository lint |
| `npm run typecheck` | PASS | TypeScript project check |
| `npm run check:locales` | PASS | Locale consistency checks |
| `npm run check:content` | PASS, 0 new findings | No new findings relative to the content baseline; not a claim that every existing content issue is resolved |
| `npm run build` | PASS | Production frontend compiled locally; not deployed |
| Browser suite | PASS: 13 files, 44 tests | Automated browser coverage; not a physical Android/TWA/Play-install test |
| `npm run check:release` | PASS: 6 local checks | Local identity, listing/asset and release configuration preflight |
| Focused terms/UGC regression | PASS: 5 files, 46 tests | Terms gate; typed update/testimony report targets and author identity; blocking/error/cancel behavior; existing edit/delete/admin regressions |
| Final terms-gate recheck | PASS: 1 file, 5 tests | Rechecked after adding deletion access before terms acceptance |
| Final focused release follow-up | PASS: 9 files, 67 tests | Single worker, 33.97 seconds; detailed scope below |
| Android artifact identity/signing | PASS | Signed AAB and APK metadata/signatures; final paths and SHA-256 in [release-artifacts.md](release-artifacts.md) |
| Android release lint | PASS: 0 errors, 10 warnings | Read `android-twa/releases/1.0.3/lint-results-release.txt`; warnings remain documented |

The focused rows overlap; do not add their counts together as distinct coverage.
Strict lint and the six-check local release preflight were also rerun successfully
after the focused follow-up.

## Unit-suite results and remaining investigation

The initial complete unit run did **not** pass:

- Files: **263 total; 254 passed; 9 failed**.
- Tests: **2,961 total; 2,951 passed; 10 failed**.

The final focused follow-up passed **all 67 tests in 9 files**, with one worker
in 33.97 seconds. It covered PWA manifest, LandingCircles, the AI development API
boundary, AI consent, key manager, AI output reports, terms acceptance, community
safety actions and disabled analytics. Stale expectations for the intended
release behavior were corrected; the key-manager timeout did not recur.

**Four resource content guard suites remain unresolved.** A focused rerun
confirmed **4 failing and 62 passing tests across those 4 files**. Read-only review found
conflicts between existing shelf-isolation guards and the previously approved
September resource expansion:

- `src/content/resources/authorBooks.test.js`: `poonen-living-as-jesus-lived`
  spans freedom and Christian living; the guard requires Christian-living books
  to remain exclusive to formation plans.
- `src/content/resources/deliveranceBooks.test.js`: `prince-holy-spirit-in-you`
  spans freedom and Christian living; the guard requires the freedom shelf alone.
- `src/content/plans/davidHeart.test.js`: the shared repentance topic also
  selects `bibleproject-psalms-study-podcast` on David's historical shelf.
- `src/content/plans/prayingForUnbornChild.test.js`: the shared Scripture-prayer
  topic selects `brisley-verses-dont-enjoy-motherhood`, whose tags omit the child
  or parenting topics required by this shelf's guard.

No resource curriculum, human review records or guard assertions were changed
to hide these failures. Settle the intended shelf scope, then fix the source and
rerun the guards and full suite before deployment. A passing follow-up subset
does not establish a clean complete unit run.

## Live preflight: five failures remain

The live preflight reached `qetoret.com` and reported:

| URL / check | Observed result |
| --- | --- |
| `https://qetoret.com/` | FAIL: intended Qetoret identity absent from response |
| `https://qetoret.com/privacy.html` | FAIL: intended Qetoret identity absent from response |
| `https://qetoret.com/terms.html` | FAIL: intended Qetoret identity absent from response |
| `https://qetoret.com/delete-account.html` | FAIL: intended Qetoret identity absent from response |
| Live web manifest name | FAIL: still `Praystead` |
| `https://qetoret.com/.well-known/assetlinks.json` | PASS for the certificate/package entries checked locally |

This does not prove that a legal URL is absent or returns a particular HTTP error;
it establishes that the intended prepared Qetoret content is not yet verified
there. The Digital Asset Links check alone does not identify the Console's real
Play app-signing certificate or prove fullscreen trust on a Play-installed build.

Deploy the reviewed frontend/legal release, then rerun
`npm run check:release -- --live` and the authentication, deletion, push,
recovery and safety smoke tests. Keep old-origin recovery access available during
the cutover, as described in [domain-migration.md](domain-migration.md).

## Database verification not performed

`20261008160000_feedback_report_ownership.sql` was prepared but **not applied or
database-tested** during this task. The Docker daemon was stopped and a usable
local Supabase CLI was unavailable. No successful pgTAP run is claimed.

Before deploying the reporter-enabled client, apply the additive migration to an
isolated/staging database and run its ownership/security pgTAP checks. Verify
forged `user_id` insertion is rejected, anonymous-role inserts are revoked,
legitimate authenticated reporting works, and deleting the account handles its
attributed reports. Record the actual migration/test result before production.

## Owner release gates still open

- Deploy the intended Qetoret site and legal pages; resolve all five live checks.
- Verify migration application and database tests before the new client deploys.
- Resolve or disposition the remaining unit/content failures with actual evidence.
- Confirm versionCode `4` is unused in Console and publish its real Play
  app-signing fingerprint; install the internal-track release from Play.
- Test Android 15/16 layout, trust, push, media, sign-in, account erasure and
  old-origin vault recovery on physical devices.
- Confirm gateway recipients, logs/backup retention and storage cleanup; finalize
  the Data safety declaration against observed production behavior.
- Provide working review credentials plus new-device vault recovery, name the
  moderation/safeguarding owners, and test report triage.
- Complete actual audience/rating/account verification and any required closed
  test/production-access application, then make the production rollout decision.

See [console-checklist.md](console-checklist.md) for the execution sequence. The
prepared bundle and listing pack are reviewable; production readiness remains
conditional on these concrete checks and owner decisions.
