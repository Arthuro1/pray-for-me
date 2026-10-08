# Qetoret Google Play submission pack

Prepared from the repository on **8 October 2026**. Public website:
**https://qetoret.com**. Android application ID remains
**`space.praystead.twa`** so this can update the existing app. The planned wrapper
release is **versionCode `4`, versionName `1.0.3`, targetSdk `36`**. Confirm that
`4` is greater than every version already uploaded to Play before using it.

This folder contains submission material and a release gate. It is **not evidence
that the live domain, signing, Console declarations, or device tests have passed**.
The TWA displays the deployed website: a later web deployment changes the app
experience without a new bundle and must pass the same privacy and safety checks.

## Observed status on 8 October 2026

The local release preflight passed all six static checks. The live preflight
reached qetoret.com but found the **old Praystead web manifest**; root, privacy,
terms and deletion responses did not contain the intended Qetoret identity.
Digital Asset Links matched the local certificate entries, but that alone does
not confirm the real Play app-signing certificate or a Play-installed TWA.
**The prepared web release still needs deployment and live verification before
Play review.** No production deployment or Play submission was performed.

Terms acceptance and update/testimony report/block controls are implemented in
source; their focused regression run passed **46 tests across 5 files**. Narrow
ESLint checks passed. AI reporting and disabling client telemetry are also in
source. Moderator staffing, data recipients/retention, review credentials,
new-origin key recovery and physical-device acceptance remain owner release gates.

Strict lint, type checking, locale checks, the content-baseline check (0 new
findings), production build and the browser suite (13 files, 44 tests) passed.
The initial full unit run had **10 failing tests across 9 files**; follow-up
verification passed **67 tests across 9 files**, including the key-manager rerun.
Four resource guard suites remain under review, so no clean complete unit run is
claimed. Isolated database verification passed all 20 migrations and 138 pgTAP
assertions across 8 files. Read-only production inspection confirms the ownership
migration remains pending there. Read [validation.md](validation.md) and
[database-verification.md](database-verification.md) for exact evidence, live
failures and the remaining release limits.

| File | Use |
| --- | --- |
| [English listing files](listings/en-US) | Copy title.txt, short-description.txt, full-description.txt and release-notes.txt into Console |
| [French listing files](listings/fr-FR) | French localized title, descriptions and release notes |
| [console-checklist.md](console-checklist.md) | Submission sequence, open launch blockers, owner fields and asset requirements |
| [data-safety-draft.md](data-safety-draft.md) | Evidence-based draft; resolve deployment and processor choices before attesting |
| [reviewer-access.md](reviewer-access.md) | Disposable review-account setup, vault recovery and review instructions |
| [test-plan.md](test-plan.md) | Installed-app, migration, privacy, safety and closed-test acceptance checks |
| [domain-migration.md](domain-migration.md) | DNS, hosting, Supabase auth, device keys, old-origin support and push migration |
| [policy-sources.md](policy-sources.md) | Official policies checked on 8 October 2026 |
| [release-artifacts.md](release-artifacts.md) | Final signed AAB/APK paths, hashes, verified identity and remaining release limits |
| [validation.md](validation.md) | Actual local/browser/Android/database results, full-unit failures and live preflight |
| [database-verification.md](database-verification.md) | Passing isolated database tests, read-only production findings and the pending production migration |
| [database-verification.json](database-verification.json) | Machine-readable database evidence and recorded production migration/advisor metadata |

Listing artwork is in `assets/`: the 512px store icon, 1024 × 500 feature
graphic and phone screenshot drafts in `assets/screenshots/en-US/`. Check the
asset manifest and final installed app before submitting the screenshots.

Prepared Android artifacts and verification records are in
[`android-twa/releases/1.0.3/`](../../android-twa/releases/1.0.3):
`qetoret-1.0.3-4.aab` for Play upload, `qetoret-1.0.3-4.apk` for direct testing,
`SHA256SUMS.txt` and `release-verification.json`. Use the final rebuilt files and
the hashes in those records. A direct APK installation does not test Play signing.

The shareable `qetoret-google-play-1.0.3-submission-pack.zip` in that release
folder contains these Android artifacts, this complete listing/asset pack and
the pending feedback-ownership migration/tests. Paths inside the archive retain
their repository structure. It excludes signing keys, passwords, environment
files and reviewer credentials. It is a preparation archive, not an approval to
publish; follow [validation.md](validation.md) and the Console checklist first.

Canonical Console URLs after deployment:

- Website: https://qetoret.com
- Privacy policy: https://qetoret.com/privacy.html
- Account deletion: https://qetoret.com/delete-account.html
- Terms: https://qetoret.com/terms.html
- Digital Asset Links: https://qetoret.com/.well-known/assetlinks.json

These URLs must load publicly over HTTPS without authentication, geo restrictions,
a preview password or bot challenge. A local file or successful build does not
prove they are live.

## Release evidence to fill in

| Item | Actual value / result |
| --- | --- |
| Source commit and deployment ID | OWNER REQUIRED |
| Live domain/TLS/auth/deletion smoke tests | Live preflight has 5 identity/content failures; auth/deletion smoke checks remain pending |
| AAB path, SHA-256 and signature verification | Verified locally; see release-artifacts.md and release-verification.json |
| Unit/browser/static/database verification | Local database tests passed; production migration and full-unit follow-up remain open. See validation.md and database-verification.md |
| Play app-signing SHA-256 certificate in live assetlinks | OWNER REQUIRED |
| Internal-track installed-app test results | NOT RECORDED |
| Final store screenshots checked against installed release | NOT RECORDED |
| Data safety/privacy/UGC/AI operational review | OWNER REQUIRED |
| Developer account type and production access | OWNER REQUIRED |
| Rollout countries, audience, support owner and launch approval | OWNER REQUIRED |

Do not upload an old `android-twa/app-release-bundle.aab` or old APK merely because
its filename looks correct. Inspect the final artifact's package, version, target
SDK and signer. Keep keystores, passwords, reviewer credentials, Supabase service
keys and vault recovery secrets out of this folder and Git.
