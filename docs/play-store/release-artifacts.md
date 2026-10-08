# Prepared Android artifacts

Final local rebuild verified **8 October 2026**. These files prepare submission;
they do not establish a successful live deployment, Play upload or device test.

| Artifact | Relative path from repository root | SHA-256 |
| --- | --- | --- |
| Play App Bundle | `android-twa/releases/1.0.3/qetoret-1.0.3-4.aab` | `898db491517b6a948a4d76c86a5d34e70e06250f910a1adc7d5d7f4a9fbd6e74` |
| Direct-test APK | `android-twa/releases/1.0.3/qetoret-1.0.3-4.apk` | `d4087bb88239e017896401ac0275d876a6983a52a4e2c031055c5b70bd6f603c` |

Verified package `space.praystead.twa`, label `Qetoret`, versionName `1.0.3`,
versionCode `4`, minSdk `21`, compile/targetSdk `36`, launch origin
`https://qetoret.com`. Version `4` must still be checked against the actual
Console upload history. No native libraries were found in the wrapper.

The APK signatures verify for v1/v2; AAB verification passed jarsigner. The
existing local upload signer was preserved:

`F3:67:E4:FF:3D:DD:7B:11:CD:03:BD:0C:50:46:2D:B2:B0:D3:4D:85:26:57:18:96:D1:6A:1E:C0:E0:F2:B1:14`

This is **not a substitute for confirming Play's app-signing certificate** from
Console and testing the Play-installed build's association with qetoret.com.

The release folder includes `SHA256SUMS.txt`, `release-verification.json` and
`lint-results-release.txt`. Android lint completed with **0 errors and 10
warnings**; read the report for their scope. Toolchain: AGP `8.10.1`, Gradle
`8.11.1`, JDK `17`; reproduction commands are in the verification record. The
embedded web manifest was refreshed and references the current screenshot paths.

These artifacts are the TWA wrapper. The prepared frontend/privacy/safety code
still needs deployment to the live site. On the same date, live preflight found
an old Praystead manifest and root/legal responses without the intended Qetoret
identity. Do not submit for review until that live mismatch and the owner gates
in [console-checklist.md](console-checklist.md) are resolved.
