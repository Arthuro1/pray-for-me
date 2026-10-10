# Prepared Android artifacts

The current local release, prepared on **10 October 2026**, is **1.0.5 (6)**.
It accompanies the refined encryption views: calmer visual styling, clearer
access verification and backup-code setup, and simpler saved-access controls.
The simplified wording is translated across all 16 interface languages.

| Artifact | Relative path from repository root | SHA-256 |
| --- | --- | --- |
| Play App Bundle | `android-twa/releases/1.0.5/qetoret-1.0.5-6.aab` | `67413d674cdfe760e9830e2b721743d2622e608c639f69a765fd34374b1cc734` |
| Direct-test APK | `android-twa/releases/1.0.5/qetoret-1.0.5-6.apk` | `45dc3c2e01e67148b9849f3e7c748241ee92dfcaec120b4c25ff94f2a5bcb8d4` |
| Production web files | `android-twa/releases/1.0.5/qetoret-web-1.0.5.zip` | `40ce9f1802a61161fa468a5f33765ac72b5e79ce815be2c6806fba872d2b99b4` |
| Hosting source and API files | android-twa/releases/1.0.5/qetoret-web-source-1.0.5.zip | b45e031abdf96be765c8019387d93beaa3cf406b62cef13d418ff26927158f12 |

Packaged identity was independently inspected from both Android artifacts:
package `space.praystead.twa`, label `Qetoret`, versionName `1.0.5`,
versionCode `6`, minSdk `24`, and compile/targetSdk `36`. The package and upload
signing identity are unchanged. Confirm version code **6** is unused in Play
Console before uploading; Console history was not accessed.

AAB jarsigner verification, APK apksigner verification and bundletool validation
passed. The APK uses the v2 signature scheme. Both artifacts use the existing
upload certificate:

`F3:67:E4:FF:3D:DD:7B:11:CD:03:BD:0C:50:46:2D:B2:B0:D3:4D:85:26:57:18:96:D1:6A:1E:C0:E0:F2:B1:14`

The offline Android release build and lint passed with **0 errors and 9 warnings**.
No native libraries were found. Web production build, strict lint, type checking
and locale checks passed, together with **39 focused unit tests and 23 Chrome
browser checks**. After completing the translations, all 14 i18n unit tests,
locale checks, strict lint and a fresh production build also passed.
The final full unit run passed **3,696 tests across 304 files**, and web/About
version is aligned to 1.0.5. All 16 languages have copy-ready listing files and
[release notes](release-notes-1.0.5-all-locales.txt); see
[the current upload guide](update-1.0.5.md). Existing artwork is preserved.

This is a Trusted Web Activity: packaged resources confirm the launch origin
`https://qetoret.com/`. **The new encryption UI requires deploying the accompanying
web build to qetoret.com.** The signed AAB does not embed those frontend files.
The web archive has 374 entries, including `.well-known/assetlinks.json`, the
web manifest and public legal pages. Source and web-file hash manifests accompany it.

The **10 October 2026** live preflight passed all six local and six live checks,
including current branding, legal URLs and configured Digital Asset Links.
The recorded 8 October branding mismatch is resolved. These checks do not prove
the new encryption UI is deployed or replace a Play-installed device check.
No website deployment, Play Console upload or publication was performed.

The release folder contains `SHA256SUMS.txt`, `release-verification.json`,
`release-source-sha256.json`, `web-files-sha256.json`, the lint reports and
signature/manifest/resource logs. Toolchain: AGP `8.10.1`, Gradle `8.11.1`,
JDK `17`, bundletool `1.18.3`. Reproduction commands and remaining artifact
limits are recorded in the verification JSON and release-folder README.

TargetSdk 36 meets the current API 36 update requirement checked on 10 October
2026 against [Google Play's target API guidance](https://support.google.com/googleplay/android-developer/answer/11926878?hl=en-EN).
The installation floor remains Android 7.0 (minSdk 24).

Earlier release directories, including **1.0.4 (5)** and the superseded minSdk 21
**1.0.3 (4)**, are preserved. Use the current 1.0.5 AAB above for this release.

---

## Historical verification — 8 October 2026

# Prepared Android artifacts

The **8 October 2026** SDK correction supersedes the earlier **1.0.3 (4)**
wrapper. Google Play rejected its minSdk 21 configuration with automatic
protection enabled. The corrected **1.0.4 (5)** declares **minSdk 24** in both
Gradle and the Bubblewrap manifest, matching the
[automatic protection requirement](https://support.google.com/googleplay/android-developer/answer/10183279?hl=en-GB).

| Artifact | Relative path from repository root | SHA-256 |
| --- | --- | --- |
| Play App Bundle | `android-twa/releases/1.0.4/qetoret-1.0.4-5.aab` | `8488d9dfb64968d29c62a71c992eabd70cd887134f837ccf5a22fdd27b912378` |
| Direct-test APK | `android-twa/releases/1.0.4/qetoret-1.0.4-5.apk` | `b380a707bfddada88e2d1f48e46ef562eae266a7b01d8588d44a55909c0d6135` |

Packaged identity verified from the AAB and APK: package `space.praystead.twa`,
label `Qetoret`, versionName `1.0.4`, versionCode `5`, minSdk `24`, and
compile/targetSdk `36`. AAB resource inspection confirms launch origin
`https://qetoret.com/`. The installation floor is now **Android 7.0**; Android
5 and 6 devices are outside this wrapper's support range. Confirm version code
`5` against the actual Console history before uploading.

Bundletool validation and AAB jarsigner verification passed. The APK verifies
with the v2 signature scheme. Both use the existing local upload certificate:

`F3:67:E4:FF:3D:DD:7B:11:CD:03:BD:0C:50:46:2D:B2:B0:D3:4D:85:26:57:18:96:D1:6A:1E:C0:E0:F2:B1:14`

Android release build and lint passed with **0 errors and 9 warnings**.
No native libraries were found. The release folder contains `SHA256SUMS.txt`,
`release-verification.json`, the lint reports, packaged-manifest/resource
inspection and signature verification logs. Toolchain: AGP `8.10.1`, Gradle
`8.11.1`, JDK `17`, bundletool `1.18.3`. Reproduction commands are in the
verification record. The release consistency script now checks minSdk >=24 and
matching Gradle/Bubblewrap values, preventing regeneration from restoring 21.

The old `1.0.3` files and submission archive are preserved as historical evidence;
use the corrected AAB above for this upload. No Console upload or publication
was performed by this rebuild. It validates the local Android wrapper; the TWA
loads the deployed website. Continue the existing release checks in
[console-checklist.md](console-checklist.md), including the real Play
app-signing association and installed-device acceptance tests.
