# Changelog

All notable changes to this project are documented here.
Format based on [Keep a Changelog](https://keepachangelog.com/). This project uses date-based entries.

## [Unreleased] — 2026-07-04

### Added
- **Free vs Supporter tiering (scaffold)** — a centralized feature-tier config (`src/lib/plan.js`: `FREE_FEATURES`, `SUPPORTER_FEATURES`, `isFeatureAvailable`, `getFeatureTier`). No billing is wired in; while `BILLING_ENABLED` is `false` nothing is locked (the free app is never crippled). Privacy, export, and account deletion are always free.
- **Privacy Center** — a plain-language Settings surface explaining private/vault/shared prayers, AI, push, export, deletion, and the Free-vs-Supporter privacy guarantees (`src/components/PrivacyCenter.jsx`).
- **Supporter membership UX** — generous, non-manipulative "Become a Supporter" surface with pay-what-you-can giving levels, kept clearly separate from the optional one-time Donate flow (`src/components/SupporterModal.jsx`).
- **Privacy-preserving analytics** — a single choke point (`src/lib/analytics.js`) that emits only allowlisted product-activation events and structurally drops anything resembling prayer content.
- App version is now sourced from `package.json` via Vite `define` (`__APP_VERSION__`), so the Settings/About line never drifts (set to **1.0.0**).

### Changed
- **Onboarding simplified** — the first-run flow is now three warm, action-first slides ending in "Add your first prayer"; advanced tools (groups, plans, vault, AI, recurring rules) are no longer toured up front, and no Supporter prompts appear during onboarding.

### Security / Safety
- **No AI-generated Bible text** — the verse reader's AI fallback was removed. Verse text now comes only from authoritative sources (cache → shared cache → YouVersion); when none is available the reader shows the reference with a link to the user's Bible. AI may still offer reflections (behind consent) but never produces canonical Scripture wording (`src/lib/verseText.js`).

### Previously
- **Prayer scheduling** — one-time and recurring prayers per prayer (daily, chosen weekdays, every N days, monthly, yearly), with four end conditions: never, on a date, after N times, or **until answered** (the prayer retires itself when God answers). Recurrence is a small pure engine (`src/lib/schedule.js`) over local day keys, fully offline-capable; prayers without a schedule keep the weekly category plan unchanged.
- **Prayer-time slots** — schedule into morning / midday / evening (or anytime) instead of clock times; Today and the day agenda group by slot.
- **Month calendar in the Plan tab** — new Month/Week switcher; month grid with colored dots (recurring / one-time / weekly plan / group), tap a day for its agenda, mark prayed per prayer per day.
- **Per-occurrence edit scopes** — skip a day, move one occurrence to another date, restore it, or end the series before a day ("this day only" / "this and future"); series-wide edits stay in the prayer form.
- **Catch-up** — prayers missed the last 3 days surface gently on Home (grace, not guilt), one tap to mark prayed; per-prayer completions feed a new `prayer_completions` table + `last_prayed_at`.
- **Rotation lists** — a category can pray N subjects per day round-robin (deterministic by date, works offline), so large lists stay coverable without burnout.
- **Prayer plans** — guided journeys (7 days of gratitude, novena, 21 days of breakthrough, 30 days for others) with a theme + passage per day, authored en/fr with English fallback like the teaching layer; one tap creates the capped recurring prayer.
- **Group prayer calendar (prayer chain)** — on a community prayer, members claim days ("I'll pray this day"); coverage is visible to the group and claimed days land on each member's personal calendar. New `prayer_commitments` table with RLS.
- **Calendar export (.ics)** — download the whole prayer schedule (RRULE-based) for Google/Apple/Outlook calendars.
- Migration: `supabase/prayer_scheduling.sql` (run in the Supabase SQL editor). New i18n keys translated across **all 16 languages**.

## 2026-06-24

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
