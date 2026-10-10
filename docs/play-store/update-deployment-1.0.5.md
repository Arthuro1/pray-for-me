# Website deployment for Android update 1.0.5 (6)

The Android app is a TWA opening https://qetoret.com/. It does not embed the new
frontend. Publishing an AAB alone therefore does not deploy these screens.

Use the current source checkout or qetoret-web-source-1.0.5.zip with the existing
hosting project. That source archive includes src/, public/, api/, server/,
build configuration and locked dependency versions. Restore the host's existing
environment variables from its secret settings; actual keys, .env files,
signing credentials and host/account configuration are excluded.
Run npm ci then npm run build. Keep same-origin API routes and Vercel rewrites
and headers in place. Follow docs/OPERATIONS.md for deployment and rollback.
Production deployment requires separate approval there.

qetoret-web-1.0.5.zip contains only built frontend files. It can update static
files while the existing server/API is retained. It does not replace /api/recovery
or /api/ai. Do not treat it as the entire server deployment.

## Recovery availability

The local production build has VITE_PRAYER_PROTECTION_ENABLED disabled. This
update preserves that rollout switch. New access/backup enrollment is visible
only when the production build uses VITE_PRAYER_PROTECTION_ENABLED=true and
the recovery API permits enrollment with RECOVERY_ENROLLMENT_ENABLED=true.
Retain and verify intended production settings rather than copying .env.example
defaults. Checking enrolled access and legacy recovery remain separate from
enabling new enrollment.

Before enabling enrollment, confirm the existing recovery database schema and
server credential are configured, and validate on a fresh device. The API reads
SUPABASE_SECRET_KEY (or the existing legacy service-role alternative) only
server-side. It also needs the existing Supabase URL and public auth key.
Never prefix a server secret with VITE_. Production passkeys are bound to
qetoret.com and the exact origin https://qetoret.com. No environment setting or
database/function deployment was changed by this update preparation.

## Deployment acceptance

1. Record the immutable host deployment ID/source revision and environment flag
   choices. The web app About version and Android wrapper now both use 1.0.5.
2. Run npm run check:release -- --live. Public URL/branding/Digital Asset Links
   checks already pass; they do not verify the new UI is deployed.
3. Check an existing encrypted account and a fresh reviewer account: device
   access, backup saving, independent saved-copy verification, reopening after
   lock, and cancelling/confirming removal. Keep encrypted prayers readable.
4. Exercise English, French, an RTL language and large text without creating new
   store screenshots. Inspect and reuse the current artwork as requested.
5. Verify a Play-installed internal-track update launches as a trusted app and
   the actual Play app-signing fingerprint is in the live asset links.
6. Keep the prior immutable host deployment for rollback. Do not revert recovery
   data or remove a key referenced by encrypted content.

This preparation performed no website deployment or Play upload/publication.
