# Changelog

This project follows Keep a Changelog. Every production release gets an
immutable signed tag and records user-visible, security, migration, compatibility,
and rollback notes. Unreleased entries are moved into a dated version at release.

## Unreleased

### Added

- Added "Preparing in Prayer", a 21-day guided prayer plan for single believers,
  under a new "Relationships & family" category on the Plan tab. It runs on the
  existing plan engine (one recurring prayer capped after 21 days), so Pray now,
  the prayer session, prayer notes and voice notes, completion, history,
  scheduling, reminders and offline all behave exactly as for any other prayer.
  Days carry a reflection, prayer prompts, an "also pray for yourself" mirror, an
  optional practice, related passages and — where a curator has approved any — a
  collapsed "Go deeper" shelf. Scripture is referenced, never authored or
  generated. The plan never promises marriage and stays valuable if the reader
  never marries. Optional, device-local onboarding (season, emphasis, an
  explicitly asked husband/wife question defaulting to "keep the plan general",
  and growth areas) only adds emphasis; the 21 days are identical for everyone.
  No schema change. See `docs/PRAYER_PLANS.md`.
- Added a curated external-resource catalogue and an on-device resolver behind
  "Go deeper", with a draft → needs_review → approved → retired review gate.
  Only approved entries with a verified edition in a language the reader
  actually reads are ever shown, locales are curated independently rather than
  translated from English, and no edition, URL or title is ever fabricated. The
  catalogue started as a curation worksheet and entries pass the gate one at a
  time; a day with nothing approved for it simply has no "Go deeper" section —
  the plan is complete without it. A new device-local "Resource languages"
  preference (Settings → Appearance & language) is the only way a resource in
  another language is ever offered. See `docs/RESOURCES.md`.
- Added cover thumbnails to "Go deeper" cards. An entry may name a cover file we
  host ourselves; where none exists — the normal case — the card draws a calm
  tile instead: the resource's type glyph on a tint seeded from its id, so a
  shelf reads as several covers rather than a list of lines. A thumbnail may
  never be hot-linked from a publisher or a retailer, because the request itself
  would tell that host the reader's IP and the subject they are praying about
  before they tapped anything; the resolver refuses anything that is not a
  same-origin path. Cover files are skipped entirely under Low data mode, and a
  missing or broken one falls back to the drawn tile rather than a hole.
- Added localized book names for Micah (`MIC`), so plan and teaching references
  to it render in all 16 languages instead of falling back to English.
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
