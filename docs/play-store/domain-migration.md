# qetoret.com origin migration and launch operations

Prepared **8 October 2026**. A brand rename and an origin move have different
effects: browser storage, authentication state, notification permissions and
encryption keys are scoped to the origin. Keeping `pfm_*` storage keys is correct
but does not make them readable across domains.

Browser behavior: [MDN's same-origin storage explanation](https://developer.mozilla.org/en-US/docs/Web/Security/Defenses/Same-origin_policy#cross-origin_data_storage_access).
Authentication setup: [Supabase redirect URL guidance](https://supabase.com/docs/guides/auth/redirect-urls).

## Move at the user's pace

The least disruptive release is to change the brand on the existing origin first,
keep existing sessions and installed apps working there, and offer the new origin
when a person is ready. New users can begin directly at qetoret.com. Branding does
not require moving every returning user immediately.

The source includes an old-origin migration notice and a guide available from
Settings. The notice can be postponed; it never navigates automatically. The
guide reuses the existing recovery setup, checks that recovery works for the
current key and has reached the server, and checks for unsent changes and local
drafts before offering the new-domain link. It opens the new origin in a separate
tab so the original app remains available. No key, passphrase or session token is
attached to that link. The missing-key screen at qetoret.com offers a return to
the original app.

The migration guide currently has English and French copy. Other interface
languages show the English guide with its language marked for assistive tools;
do not advertise it as translated into all 16 interface languages. Native review
of the recovery wording remains separate from the functional checks below.

Use calm, concrete wording: “Qetoret has a new address. You can keep praying here.
When you're ready, we'll help you prepare access to your prayers at qetoret.com.”
Do not present the preparation check as proof of a completed migration: only the
user's successful unlock and inspection on the new origin establish that.

A first visit to the new origin still requires sign-in and a recovery unlock.
After that, the existing device-key mechanism remembers access on that browser.
If avoiding even that one-time step is essential, keep returning users on the
old origin for now. A normal redirect cannot carry their local encryption key.

Do not automatically update old Android wrappers to the new launch origin before
recovery is available to their users. Keep their current launch origin working,
along with its Digital Asset Links, until the new-origin recovery flow has been
tested on a Play-installed app. Browser and TWA storage access must be checked on
the actual device; a desktop browser test does not prove the Android experience.

## Preserve existing encrypted journals before redirecting

1. Keep `https://praystead.com` serving a trusted, working app during migration.
   Do not immediately redirect every authenticated user to the new origin.
   If any users used `https://www.praystead.com`, keep that exact origin working
   too: `www` and apex storage are separate. Do not canonical-redirect an old
   app origin before its users have recovered their keys.
2. Ask existing users to return to their original browser/device, synchronize
   pending changes, and set up the optional vault passphrase/recovery code.
   Verify the wrapped recovery record is synced to the same Supabase project.
   Never ask users to email a key, passphrase or recovery code.
3. Guest drafts, unsent mutation queues and local-only notes require explicit
   saving/sync/export on that origin. A server-side redirect cannot transfer
   IndexedDB, localStorage or the service-worker cache.
   The JSON export is a readable snapshot, not a full restoration package: it
   does not replace recovery of the encryption key, attachments and group access.
4. Sign in on qetoret.com using the same Supabase account and unlock using recovery.
   Verify private content, media and group keys on the new origin before clearing
   old storage. A sign-in password or OAuth account alone does not recover the
   device-local content key.
5. If no recovery exists, return to the original working device and configure it.
   The application's missing-key gate must remain enabled. Starting fresh can
   strand old ciphertext; do not market it as a safe migration.
6. Keep old-origin support until the owner has verified recovery coverage and
   communicated an actual retirement date. A forced redirect can be rolled back,
   but it can still block users who never prepared recovery.

Do not implement a URL-query, clipboard auto-transfer or cross-origin postMessage
scheme for raw keys as a launch shortcut. Any future assisted migration needs a
separate reviewed design and explicit trust checks.

## Recovery walkthrough to verify before release

Use a disposable existing account and synthetic prayer content. Run this on both
real origins using the same Supabase project; do not clear a real user's storage.

1. In the original browser at praystead.com, save a private prayer, an update,
   an attachment and a shared group prayer. Leave another change queued offline
   and a prayer-session note unfinished. Confirm the move guide does not offer
   a ready-to-move link while those changes remain local.
2. Go online, save the unfinished note and any open prayer edits, and wait for
   ordinary synchronization. Open the guide and set up recovery if necessary.
   Save the recovery code privately; it must never appear in a URL, analytics,
   release evidence or support message.
3. Verify recovery in the guide. Test a wrong passphrase, network failure and
   failed recovery-record upload: each must keep the move link unavailable and
   leave the original prayers readable. Retry successfully. Existing recovery
   should use its existing passphrase, without generating a replacement key.
4. Open qetoret.com from the guide, sign in to the same account and unlock with
   the recovery passphrase. Inspect the synthetic prayer, update, attachment and
   group content. Refresh and reopen the app to check remembered access. Keep
   the old tab available throughout; the guide does not clear its storage.
5. In a separate clean browser profile, test the recovery-code path. It resets
   the recovery passphrase; verify the updated wrapper synchronizes and the
   original browser still reads its prayers. Do not confuse the sign-in password
   with this encryption recovery passphrase.
6. Test an old account without recovery by signing in at the new origin. Its
   missing-key gate must direct the person back to the original browser to set
   up recovery. Do not choose “start fresh” as part of the migration test.
   Repeat for accounts whose original keys were stored on the `www` host, using
   the alternative `www.praystead.com` return link.
7. Postpone the notice and confirm prayer use continues normally. Confirm the
   guide is still reachable from Settings, and that unrelated hosts do not show
   the notice. Verify old sign-in/reset callbacks, installed PWA/TWA access and
   notifications independently before declaring the release ready.

Record the tested deployment IDs, devices and outcomes below. These instructions
and passing local tests are preparation, not evidence of a live-origin recovery.

| Check | Live result |
| --- | --- |
| Existing account, passphrase recovery, private/media/group content | NOT YET VERIFIED |
| Clean profile, recovery-code reset, original device still readable | NOT YET VERIFIED |
| Offline queue/drafts, wrong passphrase, failed recovery sync | NOT YET VERIFIED |
| Postponed notice, Settings access, no forced navigation | NOT YET VERIFIED |
| Play-installed TWA and old installed PWA | NOT YET VERIFIED |

Local source checks on **9 October 2026** passed: the affected unit regression
run (24 files, 210 tests), the final migration-guide rerun (14 tests), and three
real-browser suites (9 tests) covering vault recovery, encrypted note storage
and the guest prayer flow. Type checking, locale integrity, content metadata
(zero new findings), changed-file strict lint and the production build passed.
Full-repository strict lint remains blocked by existing generated vendor code
in `reports/store-listing-document/docx-preview.min.js`. These results do not
verify production authentication, both old origins or a Play-installed TWA.

## Hosting and authentication

- Attach and verify qetoret.com in the existing hosting project; configure DNS
  using that project's exact values, issue TLS and verify both apex and www
  behavior. Choose the apex as canonical. Do not guess DNS records from a runbook.
- Deploy the app, static privacy/terms/deletion pages, icons/manifest and
  `.well-known/assetlinks.json` on the final origin. Make all review resources
  publicly accessible without preview protection.
- Keep the same Supabase project, tables, storage buckets, content key formats
  and Android package. This migration does not require a fresh database.
- Supabase Auth: set the primary Site URL to `https://qetoret.com`, add the exact
  approved new-origin redirect URLs/paths used by sign-in, confirmation, reset,
  magic links and invites, and retain old-origin callbacks during transition.
  Configure broad production wildcards only after considering their scope.
- Google OAuth: update consent-screen branding, verified/authorized domains and
  homepage/privacy/terms URLs. Confirm the actual redirect URI: Supabase-managed
  OAuth normally returns to the project's Supabase auth callback, then to the
  app; changing the app domain does not automatically mean replacing that
  Supabase callback.
- Test Google, password sign-in, sign-up confirmation, reset, resend and magic
  links from a fresh device. Check invite/shared-plan deep links after the auth
  round trip. Do not include auth fragments or tokens in analytics, logs or URLs
  that are shared onward.
- Confirm SMTP sender display branding and contact mailbox; update mail templates
  and external provider dashboards with real owner access.
- Inspect deployment environment URLs without printing secrets. `VITE_*` values
  are built into the browser bundle and require rebuilding; never put service
  keys or inference provider secrets there. Verify the configured AI gateway and
  any CSP/CORS allowlist for the new origin.

## TWA trust and signing

The app remains `space.praystead.twa`. Retain the existing upload key and Play
app-signing lineage. Changing applicationId creates a different Play app.

Publish the matching package and SHA-256 fingerprints at
`https://qetoret.com/.well-known/assetlinks.json`. Copy the real **Play app-signing
certificate** from Console → App integrity; keep the existing upload certificate
if local signed builds also need association. Never replace fingerprints with
placeholders. Verify the response is the JSON file itself and contains the final
certificate, then install from Play to verify fullscreen trusted behavior.

Keep old-origin Digital Asset Links while old installed wrappers still open the
old host. Old wrapper releases, links and recovery access can coexist during the
transition; deploy each origin deliberately rather than assuming one file serves
both hosts.

## Push, links and cache transition

- New-origin notification permission must be requested again after explanation.
  Establish a new Web Push subscription only when the user opts in.
- Old-origin push endpoints may still deliver. Offer a deliberate disabling/
  cleanup path and verify database subscriptions do not produce duplicate
  reminders; do not revoke working reminders before the new subscription works.
- Redeploy notification edge functions so visible sender/default names use
  Qetoret. Verify VAPID configuration and push click URLs use the intended origin.
- Preserve group invite and plan-share paths when redirecting share links.
  Test old emailed links and new links; never log invitation or plan tokens.
- Retain persisted `pfm_*`, IndexedDB and encryption-context identifiers. They
  are data identifiers, not public branding.
- Verify old and new service-worker behavior independently; one origin cannot
  clean the other origin's cache. Rollback must account for cached workers.
- Coordinate PWA shortcut/deep-link behavior and Play listing website/legal URLs.

## Cutover and rollback evidence

Record old/new web deployment IDs, database migration state, auth callback list,
assetlinks response, Play-installed test, old-account recovery test, notification
test, monitored owner and rollback target. Save synthetic screenshots/results,
not tokens or recovery secrets.

If qetoret.com fails, restore its known-good deployment and keep the old origin
usable. Do not solve a domain incident by replacing user content keys or resetting
the database. Production deployment and public rollout need the owner's actual
release decision after these checks.
