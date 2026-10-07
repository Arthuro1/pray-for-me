# Praystead → Qetoret: migration map

The public brand is **Qetoret**. Many internal identifiers still say `pfm`
("Pray for Me") or `praystead`, and **that is deliberate**. Renaming a persisted
identifier without a migration makes an existing installation look like a new one
and can strand local data. Brand and identifier do not have to match.

Audit date: 2026-10-06. Classes:

- **USER_VISIBLE_REBRAND** — text a person can read. Changed to Qetoret.
- **SAFE_INTERNAL_KEEP** — internal name with no visible effect. Kept.
- **NEEDS_MIGRATION** — would need a data migration to rename. Kept; none planned.
- **EXTERNAL_INTEGRATION** — bound to something outside this repo. Kept.

## What changed (USER_VISIBLE_REBRAND)

| Where | What |
|---|---|
| `index.html` | `<title>`, description, Open Graph / Twitter titles, `apple-mobile-web-app-title` |
| `public/manifest.json` | `name`, `short_name`, `description`, shortcut names/descriptions (shortcut URLs unchanged) |
| `public/logo.svg` + `npm run build:icons` | New mark: a gold serif Q on plum, a censer standing on its tail and incense smoke rising through its open top. All PWA, Play listing and Android launcher/splash rasters are regenerated from it; `public/brand/` holds the colour-on-light and monochrome marks |
| `public/privacy.html`, `public/terms.html` | Product name in the legal pages |
| `public/push-sw.js`, `supabase/functions/_shared/eventNotify.ts` | Default notification title (the edge function needs a redeploy to pick it up) |
| `api/plan-preview.js` | Link-preview title and `og:site_name` |
| App chrome | Sidebar, mobile bar, auth, boot splash, vault and key-recovery screens, guest and first-prayer flows, prayer session header, settings footer and test notification, shared-plan page |
| `src/i18n/locales/*.js` | Every string naming the product (16 locales) |
| Landing page + `src/pages/landing/locales/*` | Rewritten around Qetoret (16 locales) |
| Plan prose (`freedomInChristDays.js`, `intimacyWithTheSpiritDays.js`), resource descriptions | The product name where a reader sees it. Meaning unchanged, so no review sign-off is affected |
| Download file names | `qetoret-export-*.json`, `qetoret-schedule.ics`, `qetoret-plan-*.png`, `qetoret-verse-*.png` |
| `src/utils/export.js`, `src/utils/ics.js` | `app` field and ICS `PRODID` |
| Android launcher label | `name` / `launcherName` in `android-twa/app/build.gradle` and `twa-manifest.json` |
| `README.md` | Rewritten header around Qetoret; technical docs kept |

## What did not change

| Identifier | Class | Why |
|---|---|---|
| `pfm_*` localStorage / sessionStorage keys (`pfm_language`, `pfm_theme`, `pfm_settings`, `pfm_onboarded`, `pfm_vault`, `pfm_guest_draft`, `pfm_ak_*`, `pfm_data_*`, `pfm_form_draft:*`, `pfm_note_draft:*`, …) | NEEDS_MIGRATION | Renaming resets onboarding, language, theme, drafts and per-account caches. Not worth the risk |
| `pfm_mutation_queue` and the IndexedDB stores | NEEDS_MIGRATION | Holds unsent writes; renaming could drop them |
| Crypto context labels, key ids, `encryption_version` | NEEDS_MIGRATION | Bound into existing ciphertext |
| Supabase tables, columns, RPCs, buckets | NEEDS_MIGRATION | Server schema; the brand is not in it |
| `praystead.com` (canonical URL, OG URLs, ICS `UID` domain, `CARD_MARK` on share cards, plan share links, `assetlinks.json`) | EXTERNAL_INTEGRATION | The domain has not changed. A domain change is a separate project (origin change = fresh IndexedDB = vault unlock on every web device) |
| Android `applicationId` / `namespace` `space.praystead.twa`, Java package `space.praystead.twa`, keystore alias `pray4me` | EXTERNAL_INTEGRATION | A new application id would publish a **new app**, not an update. Existing installs would never receive Qetoret. Brand and package id do not have to match |
| Google Play URL `details?id=space.praystead.twa` | EXTERNAL_INTEGRATION | Follows the application id |
| `package.json` `name` (`praystead`) | SAFE_INTERNAL_KEEP | Private package, never published, no visible effect |
| Code comments that say "Praystead" | SAFE_INTERNAL_KEEP | Updated where they describe product behaviour; historical notes left alone |
| `docs/` history (changelogs, reviews, handoffs) | SAFE_INTERNAL_KEEP | Historical record |

## New persisted data

**Intercession circle** (`circle`: `self` · `household` · `people` · `church` ·
`authorities` · `nations` · `kingdom`, or absent).

- Stored **inside the encrypted prayer payload** (`PAYLOAD_ONLY_FIELDS` in
  `src/lib/crypto/prayerCrypto.js`). It is never a plaintext column and never
  sent as a column — a write with an unknown column would be rejected (4xx),
  and the offline queue drops rejected writes, which would lose the whole prayer.
- **No database migration.** Old rows have no circle and show under *Your prayers*.
- Offered only when the prayer is (or will be) encrypted. A prayer saved while
  the account key is unavailable has no circle. A carried copy of someone else's
  request is encrypted under the carrier's account key since Milestone C, so it
  can hold the carrier's own circle.
- Older clients: they decrypt and ignore the field. If an older client edits the
  prayer, it re-encrypts the payload without the circle (the person re-places it).
  The service worker updates clients within the hour, so this window is short.

**Tend-your-altar review marks** are device-local (`pfm_altar_tended_v1`),
content-free (prayer ids and dates only). "Remain with God" stores nothing.

## Deploy order

No schema change ships with this transformation, so there is nothing to apply
first. After deploying the web app:

1. Redeploy the edge functions that import `_shared/eventNotify.ts`
   (`send-event-notifications`) so push titles say Qetoret.
2. Rebuild and upload the Android bundle (`android-twa/`) with a bumped
   `versionCode`; the launcher label changes, the package id does not.
3. Regenerate plan link-preview images: `npm run build:plan-og`.
4. Update store listing text and screenshots by hand (Play Console).
