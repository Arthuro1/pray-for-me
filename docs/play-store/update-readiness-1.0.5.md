# Readiness evidence for 1.0.5 (6)

Prepared 10 October 2026. This is the current update evidence; historical 8 October
failures do not describe this local test run. No Play publication or production
deployment is claimed.

| Check | Result / scope |
| --- | --- |
| Signed AAB/APK | Existing 1.0.5 (6) binaries retained; signature/bundle validation passed in the release record |
| Native identity | space.praystead.twa, minSdk 24, targetSdk 36, existing upload certificate |
| Web version | package.json and package-lock.json aligned to 1.0.5 |
| Full unit suite | PASS: 304 files, 3,696 tests; .codex-play-update-unit.log |
| Protection browser checks | Prior PASS: 23 checks, including mobile/RTL/large text and complete backup flow; not rerun to avoid writing screenshots |
| i18n | All 14 revised protection keys updated across 16 locales; 14 i18n tests passed |
| Strict lint | PASS in translation refresh; no subsequent runtime JS/JSX change |
| Typecheck | PASS after web version alignment |
| Production build | PASS after web version alignment; existing chunk-size warnings |
| Local/live release preflight | PASS: 6 local and 6 live checks on 10 October; .codex-play-update-preflight.log |
| Listing/release notes | 16 languages; title <= 30, short <= 80, full <= 4000, release notes <= 500 Unicode characters |
| Existing artwork | 26 store image/screenshot files preserved; hashes recorded in existing-play-assets-sha256.json |
| Secrets in release pack | No actual environment files, keystore/signing properties, account tokens or reviewer secrets included |

The full unit run supersedes the older unresolved unit-test observations from
release work. Expected negative-test console output (ErrorBoundary/canvas stubs)
does not change the successful exit/result. Database/schema and Play-installed
device checks are not covered by these unit tests.

## Verify before sending for review

- Deploy the included website source to qetoret.com with the existing API routes
  and intended recovery flags. The static ZIP was built with enrollment disabled.
- Confirm code 6 is unused in actual Play Console history. Select the intended
  update track, rollout and managed-publishing settings.
- Match the actual Play app-signing certificate to live Digital Asset Links.
  Configured fingerprints were checked live, but Console identity was not read.
- Verify the disposable reviewer and deletion-test accounts on a fresh device;
  enter credentials/recovery details privately in Console.
- Verify the Play-installed update, recovery/backup flow, account migration and
  privacy/deletion behavior on synthetic accounts; inspect existing artwork.
- Retain accurate current App content/Data safety answers. This source update
  introduces no additional collection or native permission, but does not verify
  production retention, moderation staffing or the current Console declarations.

No image/screenshot generator or browser screenshot suite was run for this
preparation. Existing assets are reused. New source/frontend archives and their
hashes are recorded alongside the signed files and submission-pack manifest.
