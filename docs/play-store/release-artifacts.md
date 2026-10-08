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
