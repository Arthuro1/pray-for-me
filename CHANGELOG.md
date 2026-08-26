# Changelog

This project follows Keep a Changelog. Every production release gets an
immutable signed tag and records user-visible, security, migration, compatibility,
and rollback notes. Unreleased entries are moved into a dated version at release.

## Unreleased

### Added

- Added optional prayer-session notes: while praying for a request, a collapsed
  "Add a prayer note" action captures formatted text and/or a voice note for
  that request. Next commits the note as an ordinary entry in that prayer's
  update history (same encryption, offline mutation queue, rendering and
  edit/delete behaviour) and records the completion; Previous preserves the
  draft without committing it or marking the prayer prayed. Drafts are held on
  device as AES-GCM ciphertext under a non-extractable key, and a recording made
  offline is retried on reconnect. No schema change.

### Security

- Removed authenticated Supabase Workbox caching and purge legacy user caches.
- Added 128-bit versioned recovery codes and version 2 AES-GCM context binding.
- Made group key creation and removal/rotation transactional and retry-safe.
- Restricted AI to structured tasks with daily/global quotas and a kill switch.
- Unified development/production AI handling and redacted provider failures.
- Made community writes fail closed without a group key and retry incomplete
  member-key distribution.
- Added resumable migration of member-owned legacy community rows to AAD-bound v2.
- Prevented account-key generation when server encryption state is unavailable.
- Added community report/block/RLS controls and database write limits.
- Hardened profile ownership policies and replaced the owner-rights public-key
  view with an RLS-aware, authenticated-read-only projection.

### Operations

- Added deterministic Supabase migrations, schema tests, strict CI, governance,
  migration, rollback, backup, incident, and community-safety documentation.
- Repaired clean-install dependency ordering in the consolidated legacy baseline
  and expanded the database security suite to 16 pgTAP assertions.
- Pinned CI actions and Supabase CLI versions and added CodeQL analysis.
