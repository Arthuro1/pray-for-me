# Current Play update — 10 October 2026

The prepared update is **1.0.5 (6)** for Qetoret, package **space.praystead.twa**,
minSdk 24 / targetSdk 36. Web/About version is aligned to 1.0.5. The signed AAB
and APK retain the existing upload key.

Start with [update-1.0.5.md](update-1.0.5.md). The complete local pack is
[android-twa/releases/1.0.5/qetoret-google-play-1.0.5-update-pack.zip](../../android-twa/releases/1.0.5/qetoret-google-play-1.0.5-update-pack.zip).
It contains signed artifacts, frontend/source ZIPs, copy-ready listing text and
release notes for all 16 Play languages, review instructions, declaration
assessment and current validation evidence. **Existing images/screenshots are
preserved and reused; none were regenerated.**

| Current file | Use |
| --- | --- |
| [update-1.0.5.md](update-1.0.5.md) | Exact upload values and submission sequence |
| [release-notes-1.0.5-all-locales.txt](release-notes-1.0.5-all-locales.txt) | Paste enabled-language release-note blocks into Console |
| [listings](listings) | Per-language title, short/full description and release notes |
| [update-app-access-1.0.5.txt](update-app-access-1.0.5.txt) | Reviewer directions; private credentials are entered only in Console |
| [update-console-fields-1.0.5.json](update-console-fields-1.0.5.json) | Release fields, links and app-to-Play locale mapping |
| [update-declarations-1.0.5.md](update-declarations-1.0.5.md) | App content/Data safety source-change assessment |
| [update-deployment-1.0.5.md](update-deployment-1.0.5.md) | Website/API deployment and recovery flag requirements |
| [update-readiness-1.0.5.md](update-readiness-1.0.5.md) | Current checks and remaining Console/device evidence |
| [release-artifacts.md](release-artifacts.md) | Artifact identities, checksums and signed-release evidence |

Current full unit suite: **304 files / 3,696 tests passed**. Production build,
typecheck, strict lint, locales and all 12 local/live release checks passed.
The new website UI still requires deployment; the local static build preserves
disabled new-recovery-enrollment defaults. Confirm the intended host settings.
Version code 6 availability, Play signing, private review access, installed-app
acceptance and rollout settings remain Console/device checks.

No website deployment, Play upload or publication was performed. The 8 October
submission record below is preserved as history, including its older artifacts
and observations.

---
# Qetoret Google Play submission pack

Prepared from the repository on **8 October 2026**. Public website:
**https://qetoret.com**. Android application ID remains
**`space.praystead.twa`** so this can update the existing app. The corrected wrapper
release is **versionCode `5`, versionName `1.0.4`, minSdk `24`, targetSdk `36`**.
Confirm that `5` is greater than every version already uploaded to Play before using it.

This folder contains submission material and a release gate. It is **not evidence
that the live domain, signing, Console declarations, or device tests have passed**.
The TWA displays the deployed website: a later web deployment changes the app
experience without a new bundle and must pass the same privacy and safety checks.

## Observed status on 8 October 2026

The checks below record the earlier release preparation. The subsequent
Android correction raises the installation floor to **API 24 (Android 7.0)**
for **1.0.4 (5)**; see [release-artifacts.md](release-artifacts.md) for its
artifact metadata, signatures and hashes.

The local release preflight passed all six static checks. The live preflight
reached qetoret.com but found the **old Praystead web manifest**; root, privacy,
terms and deletion responses did not contain the intended Qetoret identity.
Digital Asset Links matched the local certificate entries, but that alone does
not confirm the real Play app-signing certificate or a Play-installed TWA.
**The prepared web release still needs deployment and live verification before
Play review.** The feedback ownership migration and event-notification function
have now been deployed; no frontend deployment or Play submission was performed.
See [release-follow-up.md](release-follow-up.md) for the requested follow-up status.
Paul's **8 October 2026** approval is now recorded for all pending content
publication gates and the current release materials. All 27 plans, seven deep
circle layers and fourteen short-circle presentations are approved; resource
content/safety approvals and six wording re-reviews are complete. See
[paul-approval-2026-10-08.md](paul-approval-2026-10-08.md) for scope and provenance.

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
assertions across 8 files. Production now has all 20 migrations, including the
verified ownership guard. Event notifications are active as version 40 with
Qetoret digest titles; 34 focused tests passed. Read [validation.md](validation.md) and
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
| [database-verification.md](database-verification.md) | Passing isolated tests, applied production ownership migration and verified policy/grants |
| [database-verification.json](database-verification.json) | Machine-readable database evidence and recorded production migration/advisor metadata |

Listing artwork is in `assets/`: the 512px store icon, 1024 × 500 feature
graphic and six phone screenshot drafts in `assets/screenshots/en-US/`. Check the
asset manifest and final installed app before submitting the screenshots. The
store icon is 32-bit RGBA PNG; feature graphic and screenshots remain RGB.

Corrected Android artifacts and verification records are in
[`android-twa/releases/1.0.4/`](../../android-twa/releases/1.0.4):
`qetoret-1.0.4-5.aab` for Play upload, `qetoret-1.0.4-5.apk` for direct testing,
`SHA256SUMS.txt` and `release-verification.json`. Use the final rebuilt files and
the hashes in those records. A direct APK installation does not test Play signing.

The earlier `qetoret-google-play-1.0.3-submission-pack.zip` in the `1.0.3`
release folder is a **historical archive** containing the superseded minSdk
`21` wrapper. Use the corrected **1.0.4 (5)** AAB/APK and verification records
above for the current Android submission. The listing/asset material and
database/deployment evidence remain in this folder; follow
[validation.md](validation.md) and the Console checklist before publishing.

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
| Unit/browser/static/database verification | Local tests and production migration metadata passed; live account smoke tests and full-unit follow-up remain open. See validation.md and database-verification.md |
| Play app-signing SHA-256 certificate in live assetlinks | OWNER REQUIRED |
| Internal-track installed-app test results | NOT RECORDED |
| Final store screenshots checked against installed release | Source artwork approved by Paul; installed-release comparison NOT RECORDED |
| Data safety/privacy/UGC/AI operational review | OWNER REQUIRED |
| Developer account type and production access | OWNER REQUIRED |
| Rollout countries, audience, support owner and launch approval | OWNER REQUIRED |

Do not upload an old `android-twa/app-release-bundle.aab` or old APK merely because
its filename looks correct. Inspect the final artifact's package, version, target
SDK and signer. Keep keystores, passwords, reviewer credentials, Supabase service
keys and vault recovery secrets out of this folder and Git.
