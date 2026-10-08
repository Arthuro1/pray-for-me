# qetoret.com origin migration and launch operations

Prepared **8 October 2026**. A brand rename and an origin move have different
effects: browser storage, authentication state, notification permissions and
encryption keys are scoped to the origin. Keeping `pfm_*` storage keys is correct
but does not make them readable across domains.

## Preserve existing encrypted journals before redirecting

1. Keep `https://praystead.com` serving a trusted, working app during migration.
   Do not immediately redirect every authenticated user to the new origin.
2. Ask existing users to return to their original browser/device, synchronize
   pending changes, and set up the optional vault passphrase/recovery code.
   Verify the wrapped recovery record is synced to the same Supabase project.
   Never ask users to email a key, passphrase or recovery code.
3. Guest drafts, unsent mutation queues and local-only notes require explicit
   saving/sync/export on that origin. A server-side redirect cannot transfer
   IndexedDB, localStorage or the service-worker cache.
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
