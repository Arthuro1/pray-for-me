# Qetoret Google Play release

The current submission pack is [docs/play-store/README.md](play-store/README.md).
Use that pack for the qetoret.com migration, final signed Android artifacts,
English/French listing copy, Data safety draft, reviewer access, current policy
checks and the release gate.

The package remains `space.praystead.twa`; the prepared wrapper is Qetoret
`1.0.3` (versionCode `4`), targetSdk `36`. Final artifact paths and SHA-256 hashes
are in [release-artifacts.md](play-store/release-artifacts.md).

As of 8 October 2026, local release checks and focused terms/UGC tests passed,
but live preflight still found the old Praystead app/legal identity on
qetoret.com. Production deployment, actual Play app-signing association,
moderation/retention decisions, reviewer credentials and installed-device tests
remain launch gates. This is preparation, not a completed Play publication.

Follow [console-checklist.md](play-store/console-checklist.md) in order.
Do not use historical Praystead domain, version, AI-provider or UGC-readiness
statements as the current release instructions.
