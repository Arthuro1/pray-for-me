# Changelog

All notable changes to this project are documented here.
Format based on [Keep a Changelog](https://keepachangelog.com/). This project uses date-based entries.

## [Unreleased] — 2026-06-24

### Added
- **Community / social hub** — prayer groups (join by code, link, or QR), friends & friend requests, group invitations, member tools, reactions ("I'm praying"), member updates, and testimonies.
- **Prayer sharing & two-way sync** — share a personal prayer to multiple groups (optionally anonymous); updates, prayer points, verses, categories, and answered status stay in sync between a prayer and its shared copies.
- **On-demand translation** of community content ("See translation") into the viewer's language.
- **Offline support** — create/edit/delete/answer prayers and add updates/points/verses while offline, with optimistic UI, a durable IndexedDB write queue, idempotent replay on reconnect, local snapshot hydration, and a "syncing" indicator.
- **Real push notifications** — Web Push daily reminders delivered even when the app is closed, via `pg_cron` + a `send-reminders` Supabase Edge Function (localized, per-user local time).
- **Answered-prayers reflection view**; testimonies kept as a running list across resume / re-answer.
- **Prayer streak + weekly recap** on the home screen.
- **First-run onboarding** and **Export my data** (JSON download of the full journal).
- **Accessibility**: Esc-to-close, focus trapping, and `role="dialog"` semantics on every modal; accessible names on icon-only buttons.
- **Vercel Analytics** + client-side routing (lazy routes) for per-page tracking.
- Test suite (Vitest) for pure logic + GitHub Actions CI.

### Changed
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

### Fixed
- Mark-answered now **appends** the testimony server-side instead of overwriting the array (no lost concurrent testimonies).
- Permanently failed offline writes roll back to server truth instead of leaving "ghost" records.
- Confirmation dialogs required before destructive actions (deletes, removing points/members).
