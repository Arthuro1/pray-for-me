# Qetoret Play update 1.0.5 (6)

Prepared 10 October 2026. This is an update to the existing app, not a new
Play listing. No screenshots, icons or feature graphics were regenerated.

## Upload fields

| Field | Value |
| --- | --- |
| App | Qetoret |
| Package | space.praystead.twa |
| Release name | 1.0.5 (6) - clearer prayer protection |
| Version | 1.0.5, version code 6 |
| Android support | Android 7.0+, minSdk 24, targetSdk 36 |
| Play upload | android-twa/releases/1.0.5/qetoret-1.0.5-6.aab |
| AAB SHA-256 | 67413d674cdfe760e9830e2b721743d2622e608c639f69a765fd34374b1cc734 |
| Release notes | release-notes-1.0.5-all-locales.txt |
| Public support | arthur.meteng@gmail.com; confirm it is monitored |
| Website | https://qetoret.com |
| Privacy | https://qetoret.com/privacy.html |
| Account deletion | https://qetoret.com/delete-account.html |

The signed AAB/APK retain the existing upload key and application ID. Web/About
version metadata is aligned to 1.0.5. Machine-readable fields and language mapping
are in update-console-fields-1.0.5.json. The complete local update package is
android-twa/releases/1.0.5/qetoret-google-play-1.0.5-update-pack.zip.

## Submit the update

1. Deploy the website source to the existing qetoret.com hosting project and
   complete update-deployment-1.0.5.md. The TWA loads the live site, so the AAB
   alone cannot deliver these frontend changes. Confirm intended recovery flags;
   local production currently preserves disabled new-enrollment defaults.
2. In the existing Play Console app, confirm version code 6 is unused. If it is
   already used, a new higher-code signed artifact is required before uploading.
   Confirm the live Digital Asset Links contains the Play app-signing certificate
   from Console; the local upload certificate is a different role.
3. Create a release on the intended track. Internal testing is the first
   validation step; upload only qetoret-1.0.5-6.aab and use the release name above.
   Do not upload the APK, source ZIP or complete update pack as an App Bundle.
4. Paste release-notes-1.0.5-all-locales.txt into What's new. Its 16 blocks use the
   supported Play language tags and each has fewer than 500 Unicode characters.
   The app's Tagalog code tl maps to Play fil. If Console has fewer languages,
   add the desired text translations first or paste only enabled-language blocks.
5. Reuse the existing published graphics/screenshots. Existing 16-language listing
   copy has been split into listings/<Play-language>/title.txt,
   short-description.txt and full-description.txt for copying if any translation
   is missing or stale. No new marketing claims or replacement images were made.
6. App content: review update-declarations-1.0.5.md; retain verified current
   declarations unless the live service or Console questions require a change.
   Enter the verified review account and recovery details privately under App
   access. update-app-access-1.0.5.txt supplies the instructions, not credentials.
7. Save/review the release, resolve errors and assess warnings/pre-launch results.
   Install the internal-track update from Play and check existing-account unlock,
   backup save/check, method removal, relaunch, large text and an RTL language.
   Use existing images only; no new screenshot capture is requested by this pack.
8. Once website/device/reviewer checks pass, promote or prepare the intended
   update track and choose the actual rollout. Review Publishing overview before
   sending changes for review. Managed-publishing/rollout settings belong to the
   owner; no timing or rollout percentage has been assumed.

## Local evidence and remaining Console items

See update-readiness-1.0.5.md for current validation. Version-code availability,
real Play app-signing association, verified private reviewer access, installed
Android acceptance and rollout settings still require Console/device evidence.
No Console field was entered, no release was uploaded/submitted, and no website
was deployed during this preparation. Earlier 8 October records remain history.

Official references checked 10 October 2026:

- [Release preparation and release-note format](https://support.google.com/googleplay/android-developer/answer/9859348?hl=en)
- [Supported listing languages and existing default graphics](https://support.google.com/googleplay/android-developer/answer/9844778?hl=en)
