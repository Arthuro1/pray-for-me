# Changelog

All notable changes to this project are documented here.
Format based on [Keep a Changelog](https://keepachangelog.com/). This project uses date-based entries.

## [Unreleased] — 2026-06-24

### Added
- **Community / social hub** — prayer groups (join by code, link, or QR), friends & friend requests, group invitations, member tools, reactions ("I'm praying"), member updates, and testimonies.
- **Prayer sharing & two-way sync** — share a personal prayer to multiple groups (optionally anonymous); updates, prayer points, verses, categories, and answered status stay in sync between a prayer and its shared copies.
- **On-demand translation** of community content ("See translation") into the viewer's language.
- **Offline support** — create/edit/delete/answer prayers and add updates/points/verses while offline, with optimistic UI, a durable IndexedDB write queue, idempotent replay on reconnect, local snapshot hydration, and a "syncing" indicator.
- **Real push notifications** — Web Push daily + follow-up reminders delivered even when the app is closed, via `pg_cron` + independently-scheduled `send-daily-reminder` / `send-follow-up-reminder` Supabase Edge Functions (localized, per-user local time).
- **Answered-prayers reflection view**; testimonies kept as a running list across resume / re-answer.
- **Weekly recap** (answered prayers / testimonies) on the home screen — a remembrance of God's faithfulness.
- **First-run onboarding** and **Export my data** (JSON download of the full journal).
- **Accessibility**: Esc-to-close, focus trapping, and `role="dialog"` semantics on every modal; accessible names on icon-only buttons.
- **Vercel Analytics** + client-side routing (lazy routes) for per-page tracking.
- Test suite (Vitest) for pure logic + GitHub Actions CI.

### Changed
- **Scripture-first, discipleship-focused reframe.** Creating a prayer now begins with God's Word (passages to read, faithful context, themes, reflection) before any optional AI-written prayer. **"Pray now"** meets you where you are — pray straight through your requests, or opt into a guided path or the full **ACTS** flow (Adoration → Confession → Thanksgiving → Supplication), each movement pointing to a Psalm to read. The **streak counter was removed** (no gamification); the weekly recap of answered prayers / testimonies remains as a remembrance of God's faithfulness. The app's **humble-assistant posture is now surfaced in the UI** — a single shared disclaimer wherever AI suggestions appear, the theological stance shown at the consent gate, and an "AI assistance" panel in Settings to review it or turn AI suggestions off.
- **Add Friend** reworked for discoverability — tap-to-add suggestions from your shared groups, a shareable friend link + QR, and a polished email path (inline validation, friendlier not-found).
- Personal & Home prayer lists redesigned into spacious cards matching the community wall, leading with author + creation date and showing source group, share badges, and "praying" counts.
- The user's own prayers/contributions now display as **"Me"** everywhere.
- Plan tab reworked to a day-centric editor (today highlight, prayer counts, empty-day nudges, auto-schedule, category reorder, per-prayer day overrides).
- Per-group **auto-add** preference moved from the prayer list into a member **Group settings** sheet.
- i18n split into lazy per-language chunks; all session keys translated across **all 16 languages**.
- Notification reminders are now server-driven Web Push (replacing the in-tab `setTimeout` scheduler).

### Security
- AI proxy (`/api/anthropic`) now **requires a valid Supabase session**; the Anthropic key is server-only (`ANTHROPIC_API_KEY`) and never shipped to the browser.
- Group joins are validated **server-side by invite code** (RLS no longer lets a user self-add by group id).
- Community prayers can only link a `source_prayer_id` the inserter owns (closes a tampering path through the sync RPCs).
- **End-to-end encryption ("Prayer Vault")** — private prayer content (title, description, person, phone, updates, prayer points, and now **testimonies**) is encrypted client-side and stored as ciphertext the server cannot read. Testimonies moved to their own `prayer_testimonies` table so each append is a conflict-free row insert (requires running `supabase/e2ee_testimonies.sql`).

### Fixed
- Answered-prayer testimonies are stored as individual rows, so a testimony added offline on one device can never overwrite a concurrent one from another.
- Permanently failed offline writes roll back to server truth instead of leaving "ghost" records.
- Confirmation dialogs required before destructive actions (deletes, removing points/members).
