# Changelog

All notable changes to this project are documented here.
Format based on [Keep a Changelog](https://keepachangelog.com/). This project uses date-based entries.

## [Unreleased] — 2026-07-16

UX simplification pass around one goal: **first prayer within 60 seconds of registration, daily prayer within one tap.**

### Changed
- **Onboarding IS the first prayer** — the intro carousel was replaced by a single capture screen ("What would you like to pray about?", private-and-encrypted reassurance) whose primary action saves the prayer and opens a real prayer session on it immediately; "I'll do this later" skips. Reminders, AI, groups and planning now introduce themselves later, in context (`src/components/Onboarding.jsx`).
- **Pray now starts instantly** — no upfront mode picker. Sessions open in the last-used format (requests, for a new user) and a small **Prayer format** control inside the session offers Guided and ACTS. Each prayer is recorded as prayed the moment you advance past it, so leaving a session halfway keeps the progress already made (`src/components/PrayerSession.jsx`).
- **Today is ordered around praying** — compact greeting → "Today · N prayers" → one large Pray now → today's list → add prayer. Catch-up moved *after* the list and starts collapsed (grace, not guilt); the daily verse became a small closing card. The statistics tiles moved to the Journal; the non-interactive category chips and the persistent AI-suggest control were removed (Scripture/AI help stays available inside each prayer). After the first completed session, a one-time toast gently offers a reminder — no permission asks during onboarding (`src/pages/HomeTab.jsx`).
- **Add prayer is one question** — "Who or what would you like to pray for?". A note and all organization (person, categories, prayer rhythm) wait behind collapsed "Add a note" / "Organize" expanders, and the button reads **Save prayer**. The rhythm question offers four everyday answers — Flexible / Daily / Weekly / Occasionally — with **Custom** opening the full recurrence editor (`src/components/PrayerForm.jsx`, `src/lib/scheduleDraft.js`).
- **Saved screen has one decision** — "Saved privately" with exactly two actions: **Pray now** (opens a real session on the prayer just written) and Done. Scripture, reminders and sharing are surfaced from the prayer detail page instead (`src/components/PrayerSavedStep.jsx`).
- **Four-destination navigation** — Today · Journal · Community · **More**. Grow, Plan, Notifications, Settings, data export and support live inside the new More page; Settings no longer occupies bottom-navigation space (`src/components/Layout.jsx`, `src/pages/MoreTab.jsx`).
- **Journal = two segments** — Active | Answered, plus the at-a-glance stats that used to sit on Home. The Answered segment *is* the remembrance gallery: the standalone `/answered` page was folded in (extracted to `src/components/AnsweredGallery.jsx`; old links redirect), removing the shortcut/filter/page triplication.
- **Settings reads as a short list** — every section starts collapsed; deep-links (`/settings#data` etc.) still force-open their target.
- **Community leads with joining** — an empty community account now sees **Join a group** first (a new modal accepting a pasted invite link or code, reusing the same join flow as invite links), then Create group (`src/pages/CommunityTab.jsx`).
- **Grow puts the believer's content first** — the gospel-journey invitation moved below the prayer guides as a smaller card.
- **Signup name is explicitly optional** — the register field now reads "Display name (optional)" in all 16 languages (it was never enforced; now it says so).

### Removed
- **Default weekday categories** — new accounts no longer receive six pre-scheduled categories. An uncategorized, unscheduled prayer simply shows up daily (planner fallback), and structure arrives only when the user creates it.
- **Example statistics on the public landing page** — the fake stats strip and its "illustrative data" caption were deleted outright.
- The Home day-plan AI suggestion feature (`getDayPlanSuggestions`) and 28 orphaned locale keys, across all 16 languages.

### i18n
- 20 new keys × 16 languages (AI-authored, pending native review); `authNamePlaceholder` reworded in every language.

## 2026-07-06

### Removed
- **Free vs Supporter product model** — all plan-based feature gating, the Supporter membership surface (modal + Settings card), the `src/lib/plan.js` tier scaffold, the soft "Supporter" feature tags, and the supporter/feature-gate analytics events (`supporter_prompt_viewed`, `supporter_prompt_clicked`, `feature_gate_seen`) were removed from `dev`. The app now has **no active paid feature gating** — every feature is available to everyone. This work is preserved on the `feature/supporter-model-staged` branch for possible future use.

### Added
- **Guided prayer plans now explain themselves before you commit** — tapping a plan opens a detail view (`src/components/PlanDetailModal.jsx`) with what the journey is (`intro`), the Scripture story it follows — when and how it was prayed/fasted in the Bible, with a tappable reference (`biblical`) — and a day-by-day preview (theme + verse per day) so there are no surprises; the Start action moved into that view. Teaching copy is authored en/fr with English fallback (`intro`/`biblical` in `src/content/prayerPlans.js`), matching the teaching layer.
- **New "3 days of fasting & prayer" plan** — a biblical three-day fast in the pattern of Esther's fast (Esther 4:15-16), walking Joel 2:12 → Isaiah 58:6 → Esther 4:16, with per-day themes authored across all 16 languages. Existing plans (gratitude, upper room, breakthrough, others) each gained their biblical background (Luke 17, Acts 1-2, Daniel 10, Colossians 4).
- **Per-prayer follow-up reminders** — "Remind me to follow up" is now a per-prayer check-back reminder (Tomorrow / in 3 days / 1 week / 2 weeks / pick a date), **separate** from the prayer's recurrence schedule and from the account-level follow-up cadence in Settings. It surfaces in-app as a banner on the prayer with Add update / Mark answered / Snooze / Set another / Dismiss (`src/store/followUpStore.js`, `src/components/FollowUpField.jsx`, `src/components/FollowUpBanner.jsx`). Delivery is in-app for now; push/cross-device sync is a documented TODO.
- **Privacy Center** — a plain-language Settings surface explaining private/vault/shared prayers, AI, push, export and deletion (`src/components/PrivacyCenter.jsx`).
- **Privacy-preserving analytics** — a single choke point (`src/lib/analytics.js`) that emits only allowlisted product-activation events and structurally drops anything resembling prayer content (first prayer, prayed, answered, reminder set, vault enabled, group joined, prayer shared, AI consent, export, account-deletion start, and `privacy_center_opened`) — all content-free.
- App version is now sourced from `package.json` via Vite `define` (`__APP_VERSION__`), so the Settings/About line never drifts (set to **1.0.0**).

### Changed
- **Scheduling is Simple/Advanced by UX only** — the Simple presets (follow plan / pray today / daily / weekly) and the "Advanced options" disclosure (interval / monthly / yearly rules + bounded end dates) are a pure overload-reduction split; they no longer carry any plan or "Supporter" tag, and every option stays available to everyone.
- **Onboarding simplified** — the first-run flow is three warm, action-first slides ending in "Add your first prayer"; advanced tools (groups, plans, vault, AI, recurring rules) are not toured up front, and no Supporter/pricing prompts appear.

### Security / Safety
- **No AI-generated Bible text** — the verse reader's AI fallback was removed. Verse text now comes only from authoritative sources (cache → shared cache → YouVersion); when none is available the reader shows the reference with a link to the user's Bible. AI may still offer reflections (behind consent) but never produces canonical Scripture wording (`src/lib/verseText.js`).

### Previously
- **Prayer scheduling** — one-time and recurring prayers per prayer (daily, chosen weekdays, every N days, monthly, yearly), with four end conditions: never, on a date, after N times, or **until answered** (the prayer retires itself when God answers). Recurrence is a small pure engine (`src/lib/schedule.js`) over local day keys, fully offline-capable; prayers without a schedule keep the weekly category plan unchanged.
- **Prayer-time slots** — schedule into morning / midday / evening (or anytime) instead of clock times; Today and the day agenda group by slot.
- **Month calendar in the Plan tab** — new Month/Week switcher; month grid with colored dots (recurring / one-time / weekly plan / group), tap a day for its agenda, mark prayed per prayer per day.
- **Per-occurrence edit scopes** — skip a day, move one occurrence to another date, restore it, or end the series before a day ("this day only" / "this and future"); series-wide edits stay in the prayer form.
- **Catch-up** — prayers missed the last 3 days surface gently on Home (grace, not guilt), one tap to mark prayed; per-prayer completions feed a new `prayer_completions` table + `last_prayed_at`.
- **Rotation lists** — a category can pray N subjects per day round-robin (deterministic by date, works offline), so large lists stay coverable without burnout.
- **Prayer plans** — guided journeys (7 days of gratitude, the upper room, 21 days of breakthrough, 30 days for others) with a theme + passage per day, authored en/fr with English fallback like the teaching layer; one tap creates the capped recurring prayer.
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
