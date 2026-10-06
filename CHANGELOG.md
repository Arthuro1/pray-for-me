# Changelog

This project follows Keep a Changelog. Every production release gets an
immutable signed tag and records user-visible, security, migration, compatibility,
and rollback notes. Unreleased entries are moved into a dated version at release.

## Unreleased

### Changed — Praystead becomes Qetoret

- **New name and identity.** The app is now **Qetoret** — *Let your prayers
  rise. Build a life of prayer before God.* New mark (a Q whose tail rises like
  incense), warm-neutral / royal-plum / restrained-gold palette in light and
  dark, one "rise" motion that respects reduced motion. Product constitution:
  `docs/QETORET_IDENTITY.md`. Rename map: `docs/QETORET_MIGRATION.md`.
  **Compatibility:** internal identifiers are unchanged on purpose — `pfm_*`
  storage keys, the `praystead.com` domain and the Android package
  `space.praystead.twa` (a new package id would ship a new app, not an update).
  Only the Android launcher label changes.
- **Landing page** rebuilt around the movements Bring · Carry · Return ·
  Remember, the seven Intercession Circles and a short "Why Qetoret?" with
  Scripture references only (the quoted verses the old landing carried are gone).
  Guest-first is unchanged: no account before the first prayer.
- **Entry:** "What is on your heart? Bring it before God." The first saved
  prayer says "Your prayer altar has begun" and offers one step: choose a prayer
  rhythm.
- **Today is "your altar today":** "Begin prayer", a completed day without
  task language, "Return to prayer" instead of catch-up, and an optional
  "On your altar" row once circles are used.
- **Carry this prayer** replaces "I'm praying" (same permissions and data: the
  request joins "Prayers you're carrying"); the count is information, never a
  rank.
- **Answered prayer → testimony:** "What happened?", "Record a testimony", then
  one optional "Is there a faithful next step?" — private by default. The app
  never declares that God answered; it records that you did.
- **AI guardrails** extended in `api/anthropic.js` (never speaks for God, never
  promises outcomes, non-partisan prayer for leaders, authority under Christ).
  **Scripture fix:** the AI tasks no longer return verse wording, and the client
  discards any that arrives — Bible text only ever comes from the authoritative
  verse pipeline.

### Added

- **Intercession Circles** (My heart · My house · My people · His Church ·
  Authorities · Nations · Kingdom & Mission): optional "Place on your altar" in
  the prayer form and a Journal filter. Stored **inside the encrypted prayer
  payload** only — no schema change, never a plaintext column; old prayers stay
  under "Your prayers" and are never classified automatically.
- **Remain with God** — an optional quiet ending (30 s / 1 min / Finish) after a
  session and from a completed Today; no text, metrics or recommendations.
- **Carried since …** on a prayer's page, with a plain count of the days it was
  prayed (memory, never merit).
- **Tend your altar** — a gentle review of prayers that have rested 30+ days:
  continue carrying, something has changed, record a testimony, or release from
  my rhythm. Answers are device-local (`pfm_altar_tended_v1`, ids and dates only).
- **"Who else would you like to carry before God?"** — a last, once-only
  activation step after repeated use, for someone whose prayers are all their own.
- **A royal priesthood** prayer guide (first in Grow) and **About Qetoret**
  (More → About), both reference-only.
- **At the Altar: Learning to Carry Prayer** (`zechariah10`), a 10-day plan on
  Luke 1 — a **draft** awaiting a named reviewer's theology, safety and locale
  sign-offs (visible only in dev or with `?planPreview=1`).
- All new copy in 16 languages (EN/FR authored; 14 AI-drafted and flagged for
  native review — see the vocabulary table in
  `docs/content/CHRISTIAN_TERMINOLOGY.md`).

### Deploy notes

No migration. After the web deploy: redeploy `send-event-notifications` (push
title), rebuild the Android bundle with a bumped `versionCode`, run
`npm run build:plan-og`, and update store listing text and screenshots by hand.

- Drafted thirteen new guided plans, all held behind content review (visible
  only with `?planPreview=1` until a named human signs theology, safety and
  every locale): Identity in Christ, The Fruit of the Spirit, Intimacy with the
  Holy Spirit, Your Kingdom Come, Work, Calling & Faithfulness, Man of God and
  Woman of God under a new "Growing in Christ" category; Praying for Those Who
  Don't Yet Believe and Praying for a Prodigal; Praying for Children & the Next
  Generation and Praying for Your Unborn Child; Healing from Church Hurt; and a
  42-day study, Psalms: Learning to Pray Everything. Prose is authored in
  English and French, day and plan titles in all 16 languages (native review
  pending). Each plan has its own safety guardrail tests. New resource domains
  (`intercession`, `care`) and topics, study-day safety notes, and localized
  names for nine more Bible books. No schema change. See
  `docs/NEW_PLANS_2026-09-23.md`.

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
