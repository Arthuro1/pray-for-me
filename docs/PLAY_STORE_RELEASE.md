# Google Play release runbook

Ships the existing TWA wrapper in `android-twa/` (`space.praystead.twa`) as the
Android build of `praystead.com`. The TWA is a thin shell: it loads the live
site, so **the production web deploy is the release**. The bundle only changes
when the wrapper's manifest, icons, or SDK levels change.

Current artefact: `android-twa/app/build/outputs/bundle/release/app-release.aab`
— versionName `1.0.0`, versionCode `1`, `minSdk 21`, `targetSdk 36`, unsigned.
Declared permissions: `POST_NOTIFICATIONS` only.

## 1. Sign the bundle

Gradle has no `signingConfig`; the bundle is signed afterwards, as bubblewrap
does. The upload keystore is `android-twa/android.keystore`, alias `pray4me`
(gitignored, credentials in `android-twa/KEYSTORE_CREDENTIALS.txt`).

All paths below are relative to the **repository root**, not to
`android-twa/` — running these from the wrong directory is the easiest mistake
to make here, and jarsigner reports it as a missing keystore. `jarsigner`
prompts for the password, so it never lands in shell history:

```bash
jarsigner -sigalg SHA256withRSA -digestalg SHA-256 -keystore android-twa/android.keystore android-twa/app/build/outputs/bundle/release/app-release.aab pray4me
```

Verify before uploading — look for `jar verified`:

```bash
jarsigner -verify -verbose:summary android-twa/app/build/outputs/bundle/release/app-release.aab
```

To rebuild from scratch first:

```bash
cd android-twa && ./gradlew clean bundleRelease
```

Re-signing is required after any rebuild — the signature is on the file, not in
the build.

### If jarsigner rejects the password

`android.keystore` is a **PKCS12** keystore (magic bytes `3082`), not JKS. In
PKCS12 the store password and the key password are the same value, so if
`KEYSTORE_CREDENTIALS.txt` lists two different secrets, the store password is
the one that matters.

Check the password on its own, without touching the bundle — this prompts only
for the store password and prints the `pray4me` entry on success:

```bash
keytool -list -keystore android-twa/android.keystore -storetype PKCS12
```

If that succeeds but signing still fails, the prompt is not reaching a real
terminal: a non-interactive shell (a Run button, a CI step, anything with stdin
closed) reads EOF and jarsigner reports it as an incorrect password. Either run
it in an interactive terminal, or pass the password without putting it in shell
history:

```bash
jarsigner -storepass:env KSPASS -sigalg SHA256withRSA -digestalg SHA-256 -keystore android-twa/android.keystore android-twa/app/build/outputs/bundle/release/app-release.aab pray4me
```

with `KSPASS` exported in that shell beforehand.

### Finding the signed bundle

`android-twa/app/build/` is gitignored, so editors that hide ignored paths will
not show the output at all. The file is on disk regardless — paste the absolute
path into the upload dialog:

```
C:\Users\T480s\Desktop\Ministry\projets\pray_for_me\android-twa\app\build\outputs\bundle\release\app-release.aab
```

**Do not upload `android-twa/app-release-bundle.aab`.** That is a stale July
2026 artefact — unsigned, built at `targetSdk 35`, and carrying the old package
name `space.pray4me.twa`, which Play now rejects outright. The same is true of
the `app-release-*.apk` files beside it. The only bundle to upload is the one
under `app/build/outputs/bundle/release/`.

Check a candidate before uploading — both commands need no password:

- `jarsigner -verify <aab>` must print `jar verified`.
- The package name must be `space.praystead.twa`. Gradle re-signs nothing and
  will happily hand you a cached bundle, so verify the artefact itself rather
  than trusting that `build.gradle` was edited:
  `unzip -p <aab> base/manifest/AndroidManifest.xml | grep -a -o "space[.][a-z]*[.]twa" | head -1`

If a build looks suspiciously unchanged, it did not recompile: run
`./gradlew clean bundleRelease` rather than a bare `bundleRelease`.

## 2. Play Console

Upload the signed `.aab` to the target track. Sections that must be completed
before a production rollout:

| Section | Answer |
| --- | --- |
| App category | Lifestyle |
| Privacy policy | `https://praystead.com/privacy.html` |
| Account deletion URL | `https://praystead.com/privacy.html#delete-account` |
| Ads | No ads |
| In-app purchases | None (donations go to an external PayPal link — see Risks) |
| Target audience | 13+ (the privacy policy excludes under-13) |
| News app / COVID / finance / health | No to all |
| Data safety | Appendix A |
| Content rating | Appendix B |
| App access | Appendix C |
| Store listing | Appendix D |

## 3. Digital Asset Links — do this immediately after the first upload

**This step is what stops the app showing a Chrome address bar.**

`public/.well-known/assetlinks.json` currently lists only the *upload* key
fingerprint (`F3:67:E4:…`). Play App Signing re-signs the app with a
**different** key, so the installed app's fingerprint will not match what the
site serves.

Its `package_name` is `space.praystead.twa` and must stay in step with
`applicationId` in `app/build.gradle` — a mismatch fails verification just as
silently as a wrong fingerprint. **The file is only live once the site is
deployed**, so a package rename means a web deploy, not just a commit.

1. Play Console → Test and release → Setup → App integrity → App signing key
   certificate → copy the **SHA-256 certificate fingerprint**.
2. Add it to the `sha256_cert_fingerprints` array in
   `public/.well-known/assetlinks.json`, keeping the upload fingerprint —
   locally built APKs still use it.
3. Deploy the site, then confirm it is live:
   `curl https://praystead.com/.well-known/assetlinks.json`
4. Reinstall the app from Play and confirm no address bar appears.

## Risks to check before rollout

- **Closed testing requirement.** If the Play developer account is a *personal*
  account registered after 13 Nov 2023, Google requires a closed test with at
  least 12 testers opted in for 14 continuous days before production access is
  granted. Confirm which applies — it changes the timeline by two weeks.
- **Do not use `demo@pray4me.space` as the review account.** Private content is
  end-to-end encrypted with a key minted per device. A reviewer signing in on
  their device mints another key and can leave that account's content locked,
  destroying the demo account used for tutorial videos. Create a throwaway
  review account instead (Appendix C).
- **Donation link.** `DonateModal` links out to PayPal (`VITE_DONATION_URL`).
  Donations are generally allowed outside Play Billing, but external payment
  links attract anti-steering review — confirm the current Payments policy
  wording before rollout. Also confirm `VITE_DONATION_URL` is set in the Vercel
  production environment: it is inlined at **build** time, so an unset variable
  silently ships the `paypal.me/YOUR_USERNAME` placeholder. Same build-time trap
  as `VITE_YOUVERSION_ENABLED`.
- **`targetSdk 36` is untested on a device.** Android 16 enforces edge-to-edge
  without an opt-out. The bump was necessary — new apps must target API 36 from
  31 Aug 2026 — but install the signed build on an Android 15/16 device and
  check the status bar, navigation bar, and splash screen before rollout.

## Appendix A — Data safety

Grounded in `public/privacy.html` and the code paths named below.

**Collected, linked to the user:**

| Type | Purpose | Required | Source |
| --- | --- | --- | --- |
| Email address | Account management | Yes | Supabase auth (`authStore.js`) |
| Name | Account management, app functionality | No | `full_name` at signup, profile display name |
| Photos | App functionality | No | Optional avatar upload (`useAvatarPhoto.js`, private `avatars` bucket) |
| Other user-generated content | App functionality | Yes | Prayers, updates, testimonies, in-app feedback |
| Device or other IDs | App functionality | No | Web Push subscription endpoint (`push.js`), only when reminders are enabled |

**Collected, not linked to the user:**

| Type | Purpose | Source |
| --- | --- | --- |
| App interactions | Analytics | Vercel Analytics (`AuthenticatedApp.jsx`) |
| Diagnostics / performance | Analytics | Vercel Speed Insights |

**Shared with third parties:** Anthropic receives prayer content only for
AI-assisted features, only after explicit opt-in consent, through an
authenticated proxy (`api/anthropic.js`) that accepts fixed structured tasks and
does not log prayer text. Supabase, Vercel, and YouVersion act as processors.

**Security practices:** encrypted in transit — yes. Users can request deletion —
yes (Settings → Account → Delete account, plus the email route in the policy).
Independent security review — no.

Private prayers are end-to-end encrypted client-side before upload. Play's form
has no field for that; the encryption claim belongs in the listing description
and the privacy policy, both of which already state it.

## Appendix B — Content rating

The IARC questionnaire is short here — no violence, sexuality, gambling, drugs,
or profanity. The answers that matter:

- Users interact or communicate with each other: **yes** (groups, shared
  prayers, community updates, testimonies, friends).
- Users can share user-generated content: **yes**.
- Users share their location: **no**.
- Digital purchases: **no**.

The interaction answers raise the rating above the lowest tier and trigger the
UGC policy, which the app satisfies: members can report a prayer, update, or
testimony (`submit_community_report`) and block an author (`set_user_block`,
with restrictive RLS hiding that author's content). The moderator workflow is
documented in [COMMUNITY_SAFETY.md](./COMMUNITY_SAFETY.md) — link it if a
reviewer asks for the moderation process.

## Appendix C — App access

Core functionality is reachable without an account: the landing page's "Begin
with a prayer" leads straight into writing and praying a first prayer, stored on
the device. Community features (groups, shared prayers, testimonies, friends)
require sign-in, so the "All functionality is available without special access"
option does **not** apply.

Provide a dedicated, disposable review account — not the demo account. Sign-in
is email + password or a magic link; give the reviewer a password account, since
a magic link needs mailbox access. Seed it with a group and a shared prayer so
the community surfaces are not empty.

## Appendix D — Store listing

**App name**: `Praystead`. The Console field and the bundle's launcher
name must match; the bundle carries it from `twaManifest.launcherName` in
`android-twa/app/build.gradle`, so a name change means a rebuild, not just a
Console edit. The old name `Pray4Me` is taken by another Play listing and
must not be reused anywhere in the listing.

**Assets** (in `android-twa/`):

- App icon: `store_icon.png` — 512×512, 32-bit PNG with alpha. Ready.
- Feature graphic: `store_feature_graphic.png` — 1024×500, 24-bit, no alpha.
  Ready: the Praystead wordmark over the current logo, in **English**, so it
  suits an English default listing (Play accepts one graphic per listing
  language). Unlike the icon it is hand-made artwork, not output of
  `build:icons` — if it is ever replaced, strip the alpha channel first, as
  Play rejects transparency here.
- Phone screenshots: **still needed**, 2–8 of them, 16:9 or 9:16, each side
  320–3840 px. Capture on a device from the installed app rather than from a
  browser — they must show the real in-app experience. Suggested set: Today view
  with prayers due, a prayer detail with verses, the answered-prayer gallery, a
  group wall, and the verse finder.

**Short description** (80 char limit):

```
A free, private prayer journal: know what to pray today, remember every answer.
```

**Full description** (4000 char limit):

```
Praystead is a private prayer journal for Christians who want to pray with
intention and keep a record of God's faithfulness.

Write down what is on your heart in seconds. Open the app and today's prayers
are ready. Mark prayers as answered and watch a quiet record of what God has
done grow over time.

WHAT YOU CAN DO

- Prayer journal - log every request, for yourself or for others. Add details,
  follow up with updates, and never forget who you said you would pray for.
- Know what to pray today - today's prayers are ready when you open the app.
  Begin with one tap.
- Prayer scheduling - one-time or recurring (daily, chosen weekdays, every N
  days, monthly, yearly), even "until answered". A month calendar, gentle
  catch-up for missed days, and one-tap .ics export to Google, Apple, or
  Outlook.
- Answered prayer gallery - record the testimony alongside the answer.
- Pray together - join prayer groups and friends, share requests or stay
  anonymous, pray for one another, and celebrate answers as a community.
- Scripture suggestions - stuck on how to pray for a situation? Get prayer
  angles with relevant Bible passages and their full text, and tap any verse to
  read it in the app.
- Grow in prayer - a Scripture-first library of prayer guides to pray through,
  and short readings on prayer and the Christian life.
- Prayer reminders - a daily notification with the day's prayer subjects, plus
  gentle nudges to check in with the people you are praying for.
- Works offline - add and edit prayers without a connection; everything syncs
  when you are back.
- 16 languages - French, English, German, Portuguese, Chinese, Spanish, Hindi,
  Japanese, Swahili, Amharic, Indonesian, Tagalog, Korean, Russian, Arabic, and
  Persian.

PRIVATE BY DEFAULT

Private prayers are end-to-end encrypted from the moment you sign in - no setup
and no passphrase to remember. Add an optional passphrase and one-time recovery
code to unlock a new device. Prayers are stored with row-level security, so only
you can read yours. AI-assisted features are opt-in and ask for your consent
before anything is sent.

You do not need an account to begin. Your first prayer stays on your device
until you choose to save it.

Free to use, no ads, no subscriptions. Open source under the MIT licence.

"Pray without ceasing." - 1 Thessalonians 5:17
```
