<div align="center">

<br/>

<img src="public/logo.svg" alt="Pray4Me" width="80" height="80" />

# Pray4Me

### Your personal Christian prayer companion

*"Pray without ceasing." — 1 Thessalonians 5:17*

<br/>

[![Live](https://img.shields.io/badge/Live-pray4me.space-6d28d9?style=for-the-badge&logo=vercel&logoColor=white)](https://pray4me.space)
[![React](https://img.shields.io/badge/React_18-61dafb?style=for-the-badge&logo=react&logoColor=black)](https://react.dev)
[![Vite](https://img.shields.io/badge/Vite-646cff?style=for-the-badge&logo=vite&logoColor=white)](https://vitejs.dev)
[![Tailwind CSS](https://img.shields.io/badge/Tailwind_CSS-38bdf8?style=for-the-badge&logo=tailwindcss&logoColor=white)](https://tailwindcss.com)
[![Supabase](https://img.shields.io/badge/Supabase-3ecf8e?style=for-the-badge&logo=supabase&logoColor=white)](https://supabase.com)
[![PWA](https://img.shields.io/badge/PWA-ready-5a0fc8?style=for-the-badge&logo=pwa&logoColor=white)](https://pray4me.space)
[![License: MIT](https://img.shields.io/badge/License-MIT-a78bfa?style=for-the-badge)](LICENSE)

<br/>

> A private, multilingual prayer journal powered by AI — helping you pray deeper, track God's answers, and never forget a prayer request.

<br/>

</div>

---

## ✨ Features

- **🙏 Pray first, sign up only to save** — a visitor can pray a genuine first prayer *before* registering: the landing CTA is "Begin with a prayer", which opens one question ("Who or what is on your heart?") and then a guest-safe prayer session — no account, no AI/translation/community calls, and **nothing sent to the server**. Only afterward does it ask, once, whether to keep the prayer; choosing to save opens warm, contextual auth and then imports it through the normal **encrypted** path. The guest draft lives only in device-local **AES-GCM ciphertext** (non-extractable key in IndexedDB), expires after 24h, and survives a same-device OAuth redirect — honest copy throughout ("This stays on this device until you choose to save it"). Existing users keep a direct **Sign in**, and invite links flow through the unchanged auth path
- **🗂️ Prayer journal** — capture a request in a single field (your very first prayer *is* the onboarding — write it, save it, pray it); organizing with categories, people and prayer rhythms is optional and one tap away. Add updates and prayer points with Bible verses, mark prayers answered, and revisit testimonies in the Journal's **Active | Answered** segments. Updates and testimonies support **simple formatting** (bold, italic, lists, auto-linked URLs) and **media** — photos, voice notes, video and links — with every file **encrypted on-device before upload** (per-file AES-GCM key, private storage bucket that only ever holds ciphertext). An author can later remove a single attachment or the text from a posted update, and the entry disappears once nothing remains — the answered side is a reflection gallery of God's faithfulness. An optional **People view** appears once several prayers name people, grouping requests by person with latest updates and follow-up dates (pastoral follow-up without a CRM)
- **🤝 Community** — prayer groups (invite code, link, or QR) with **multiple admins** (promote/demote members, owner & admin badges), a dismissible **first-group checklist** that walks a new leader from invite to praying together (it never offers an action it can't honour — with no requests yet the row reads "Add a request first" and goes there — and its **Invite** step ticks itself off as soon as another member joins, re-checked when the app returns to the foreground rather than by polling), a **Needs attention** row for invitations awaiting you, friends (including a view of your own still-pending outgoing requests, with one-tap cancel), anonymous sharing with a **share preview** that names its audience before you publish, "I'm praying" reactions, member updates and testimonies (with the same formatting and encrypted media as personal updates), two-way sync between your prayer and its shared copies, and translation controls that appear only when a request's language differs from yours — new content stores its **source language** (`content_language`), so even a three-word request in another language reliably offers translation; the original is always preserved behind "Show original", the choice is remembered per group (per prayer for personal ones), and Scripture text never goes through AI translation. The language is **defaulted from the one you're using, and correctable** — bilingual writers get a quiet "Written in English · Change" line inside the existing Organize/advanced disclosure (never a new form field, and nobody is ever asked to pick a language for a prayer). An explicit choice always beats the on-device heuristic; when the heuristic confidently disagrees it *offers* its reading, and only applies it if you tap it. Corrections travel with the prayer through edits, sharing, saving a group request personally, and the offline queue
- **🙌 Intercession queue** — the requests you *explicitly* took on (prayers for someone, requests saved from groups) gather in one Community section. The default session covers only what is **due today** — per-prayer schedules and claimed prayer-chain days, via the same planner as Today; legacy unscheduled requests keep their daily fallback — while **"View all requests I'm carrying"** stays one tap away behind a collapsed disclosure. Sessions resume where you left off, completions feed the same per-prayer log as Today, and a fully-prayed day collapses to a quiet "✓ prayed today" row instead of a dashboard card
- **🌱 Grow** — a path, not a catalogue: ONE recommended next step from your own progress (continue an in-progress guide, or the next new one), with the full library of 12 prayer guides and 16 short readings behind "Browse all" and completed guides in a collapsed history — all localized, plus an optional **gospel journey** for anyone exploring the hope behind prayer
- **📅 Prayer scheduling** — one gentle question ("How often should this return?") with everyday rhythm presets — daily, weekly, occasionally — and a **Custom** editor for the full engine: once or recurring (chosen weekdays, every N days, monthly, yearly) into morning / midday / evening slots, with four end conditions including *until answered* (the prayer retires itself when God answers); a month/week calendar with per-occurrence skips & moves, gentle **catch-up** for days missed (grace, not guilt), **rotation lists** to pray large lists round-robin, guided **prayer plans** (gratitude, the upper room, 21-day breakthrough…), group **prayer chains** (members claim days), and one-click **.ics** export to Google/Apple/Outlook. The recurrence engine is a pure, fully offline module ([`src/lib/schedule.js`](./src/lib/schedule.js)). **New prayers default to a bounded weekly rhythm** (seeded on the weekday they were written); **legacy unscheduled prayers keep their fallback** — they show up daily, or follow the weekly category plan once categories exist (assign categories to days, per-prayer overrides)
- **🤖 AI, humbly** — Claude suggests prayer angles with Bible verses in your language, behind theological guardrails (never speaks for God, always points back to Scripture) and a one-tap opt-out; the API key stays server-side, session-gated and rate-limited
- **📖 Scripture in-app** — a daily verse from a curated pool, plus an in-app reader for any reference. Verse text comes only from authoritative sources (cache → shared cache → YouVersion Platform API when configured); when none is available the reader shows the **reference with a link to your Bible** — Scripture text is **never generated by AI**
- **🔔 Push reminders** — a daily Web Push with the day's prayer subjects, and follow-up nudges at your chosen cadence to check in with the people you pray for; sent server-side via `pg_cron` + Edge Functions (iOS requires the installed PWA, 16.4+)
- **📬 Notifications** — a durable in-app inbox with a live unread badge, deep links, and privacy-safe Web Push for community events (friend requests, group invitations, prayer updates, answered prayers). Per-type preferences, quiet hours, and per-prayer follow; payloads never carry prayer content. [How it works →](./docs/NOTIFICATIONS.md)
- **📱 PWA & offline** — installable on Android, iOS, and desktop; create and edit prayers offline with a durable IndexedDB write queue that replays on reconnect
- **🌍 16 languages** — full UI in French, English, German, Portuguese, Chinese, Spanish, Hindi, Japanese, Swahili, Amharic, Indonesian, Tagalog, Korean, Russian, Arabic, and Persian; dynamic content translated via AI and cached. A device-local **Low data mode** (Privacy & Security) defers nonessential fetches for expensive connections — verse text falls back to a reference + link, while capture, Today and sessions keep working offline
- **🔐 Encryption by default** — private prayers, updates, points, testimonies, and attachments are encrypted in the browser with AES-256-GCM. The raw account content key is intentionally retained in user-scoped IndexedDB for same-device access and mirrored in tab-scoped `sessionStorage` while unlocked; it survives sign-out, while user snapshots, queues, and legacy service-worker caches are cleared. Optional passphrase recovery syncs only wrapped key material and uses a 128-bit Crockford Base32 recovery code (`XXXXX-XXXXX-XXXXX-XXXXX-XXXXX-X`, shown once). New version-2 ciphertext is bound to its owner, record, parent, field, and key version. Community content uses per-group keys; member removal rotates the key for future content but cannot revoke historical keys already obtained. See [`docs/ENCRYPTION.md`](./docs/ENCRYPTION.md) for the exact guarantees and limitations
- **🔒 Security & privacy at a glance** — Supabase Auth (Google or email/password), Row Level Security, server-only secrets, strict CSP; full threat model in [`docs/THREAT_MODEL.md`](./docs/THREAT_MODEL.md). Every prayer carries a compact **audience label** (Private / Shared with … / From \<group\>) in the form, the saved confirmation, the detail page and the share preview, with encryption shown as a **separate, smaller protection status** — never as a different audience. **Protection is determined per prayer, not by whether the vault is unlocked**: a prayer reads "Encrypted" only when its own stored row says so (`encryption_version` / an encrypted payload / the explicit marker recorded when it was written), so a legacy plaintext prayer is never relabelled just because the device key is available — unlocking lets ciphertext be *read*, it does not retroactively encrypt anything. While creating, the form states the intent ("Will be encrypted"); the saved confirmation switches to the fact, read from the prayer that was actually created. An encrypted prayer that can't be opened on this device says "Encrypted · locked here" rather than implying it is readable; a consolidated **Privacy & Security** settings section (from More) opens as a compact list of disclosure rows — Privacy Center, vault, notification privacy (pushes are generic by default — titles and names never leave the server), low data mode, AI consent, export — with account deletion kept apart at the bottom
- Light & dark mode, accessible modals (Esc-to-close, focus trap), JSON export of your data

---

## 🚀 Quick Start

```bash
git clone https://github.com/Arthuro1/pray-for-me.git
cd pray-for-me
npm install
cp .env.example .env   # fill in your values
npm run dev            # http://localhost:5173
```

```bash
npm run build          # production build → dist/
npm test               # Vitest suite (jsdom)
npm run test:browser   # real-browser E2E (Chromium) — see docs/TESTING.md
npm run lint           # ESLint
npm run lint:strict    # zero-warning CI lint
npm run typecheck      # strict TypeScript check
npm run test:db        # pgTAP schema/RLS tests (after supabase start)
npm run check:locales  # i18n key + placeholder parity — see docs/I18N_REVIEW.md
```

### Run without optional integrations

The **only** required config is Supabase (`VITE_SUPABASE_URL` + `VITE_SUPABASE_ANON_KEY`). With just those you get the full prayer journal, scheduling, reminders (in-app), community, vault, and export. The rest degrade gracefully:

| Integration | Env | Without it |
|---|---|---|
| **Supabase** | `VITE_SUPABASE_URL`, `VITE_SUPABASE_ANON_KEY` | **required** — app won't sign in |
| **Anthropic (AI)** | `ANTHROPIC_API_KEY` (server-only) | AI features stay off (they're consent-gated anyway) |
| **YouVersion** | `VITE_YOUVERSION_ENABLED`, `YVP_APP_KEY` | verse reader shows the reference + a Bible.com link |
| **Web Push** | `VITE_VAPID_PUBLIC_KEY` (+ Edge secrets) | push reminders unavailable; in-app reminders still work |
| **Analytics** | *none* | Vercel Analytics auto-injects in prod; a no-op locally. Disable with `localStorage.pfm_analytics_off = '1'` |

---

## ⚙️ Environment Variables

Anything **`VITE_`-prefixed ships in the browser bundle** — never put a secret there. Secrets stay un-prefixed and are read only server-side (the Vite dev proxy in dev, the `api/` serverless functions in prod).

```env
# Client (safe to ship)
VITE_SUPABASE_URL=https://your-project.supabase.co/rest/v1/
VITE_SUPABASE_ANON_KEY=your-anon-key
VITE_VAPID_PUBLIC_KEY=your-vapid-public-key      # Web Push (npx web-push generate-vapid-keys)
VITE_DONATION_URL=https://paypal.me/your-handle  # optional
VITE_YOUVERSION_ENABLED=true                     # optional — YouVersion verse text

# Server-only — never bundled
ANTHROPIC_API_KEY=your-claude-api-key            # AI features
YVP_APP_KEY=your-youversion-app-key              # optional — in-app verse reader
```

The VAPID **private** key is used only by the reminder Edge Functions and lives in Supabase secrets: `supabase secrets set VAPID_PRIVATE_KEY=...`

Production procedures: [deployment and incidents](./docs/OPERATIONS.md) · [database migrations](./docs/MIGRATIONS.md) · [security policy](./SECURITY.md).

---

## 🗄️ Database Setup

Run these in the Supabase SQL editor. Each file is idempotent (safe to re-run), but apply the **Core** and **Encryption** groups first — the app encrypts by default and expects those tables. Apply the rest as you enable each area.

> **Tracking what's live:** run [`_migrations_tracking.sql`](./supabase/_migrations_tracking.sql) first — it creates a `schema_migrations` table so prod state is queryable from the database instead of from memory. [`docs/DEPLOY.md`](./docs/DEPLOY.md) is the authoritative per-migration checklist with **ordering constraints and the 🔴 "run in DB before deploying the client" data-loss flags**.

**Core schema**

- [`community_schema.sql`](./supabase/community_schema.sql) — core + community tables, RLS
- [`migration.sql`](./supabase/migration.sql) — sharing, two-way sync, realtime
- [`shared_prayer_sync.sql`](./supabase/shared_prayer_sync.sql) — fully-shared prayers: edits fan out to the author's prayer and every group copy
- [`security_hardening.sql`](./supabase/security_hardening.sql) — invite-code-validated joins
- [`offline_client_ids.sql`](./supabase/offline_client_ids.sql) — offline write sync RPCs
- [`offline_conflict_hardening.sql`](./supabase/offline_conflict_hardening.sql) — append-not-overwrite testimonies
- [`fix_signup_trigger.sql`](./supabase/fix_signup_trigger.sql) — hardens the new-user profile trigger (`search_path`)

**Encryption (E2EE — on by default)**

- [`e2ee_migration.sql`](./supabase/e2ee_migration.sql) — nullable `encrypted_payload` columns on prayers (non-breaking)
- [`e2ee_default.sql`](./supabase/e2ee_default.sql) — per-user identity keypairs + wrapped group-key storage for community E2EE
- [`e2ee_testimonies.sql`](./supabase/e2ee_testimonies.sql) — encrypted `prayer_testimonies` table

**Scheduling & reminders**

- [`push_notifications.sql`](./supabase/push_notifications.sql) — push subscriptions + daily reminder cron
- [`follow_up_reminders.sql`](./supabase/follow_up_reminders.sql) — follow-up reminder columns + cron
- [`follow_up_time.sql`](./supabase/follow_up_time.sql) — per-user follow-up time + cadence anchor
- [`prayer_scheduling.sql`](./supabase/prayer_scheduling.sql) — `schedule`/`schedule_overrides` columns, `prayer_completions` + `prayer_commitments` tables, RLS
- [`split_reminder_crons.sql`](./supabase/split_reminder_crons.sql) — **upgrade only**: replaces the old combined `send-reminders` cron

**Caches & settings**

- [`verse_cache.sql`](./supabase/verse_cache.sql) — shared Scripture text cache
- [`community_translation_cache.sql`](./supabase/community_translation_cache.sql) — group-scoped translation cache
- [`user_settings.sql`](./supabase/user_settings.sql) — account-level settings sync
- [`scripture_guidance.sql`](./supabase/scripture_guidance.sql) — persist AI prayer guidance on the prayer row
- [`pin_prayers.sql`](./supabase/pin_prayers.sql) — pin prayers to the top of your lists
- [`content_language.sql`](./supabase/content_language.sql) — additive `content_language` metadata columns (source language of prayers, requests, updates, testimonies; legacy rows stay NULL and fall back to the on-device heuristic). **⚠️ Run this BEFORE deploying the client.** The client writes `content_language` on every create; against a database without the column PostgREST answers 400, which the offline queue treats as a permanent failure and drops — so a client deployed ahead of this migration loses prayers written in the gap. The reverse order is safe (a nullable column the old client simply ignores). Verify with the query at the bottom of the file: expect 6 rows, all `is_nullable = YES`.

**Rich updates & media**

- [`rich_media_updates.sql`](./supabase/rich_media_updates.sql) — `attachments` columns on updates/testimonies, the private encrypted `attachments` storage bucket + policies, and `sync_add_update` learning attachments. **⚠️ Run BEFORE deploying the client** — an update carrying media calls the new 6-arg RPC and writes the `attachments` column, which an unmigrated database rejects (the offline queue treats that as a permanent failure); plain-text updates stay compatible either way
- [`attachment_management.sql`](./supabase/attachment_management.sql) — author-only UPDATE policies on community updates/testimonies + mirror-aware RPCs to remove one attachment, remove the text, or delete a personal update together with its fanned-out community mirrors. Run after `rich_media_updates.sql`

**Notifications**

- [`notifications.sql`](./supabase/notifications.sql) — inbox, preferences, prayer-follow subscriptions, event triggers, delivery claim RPCs + retry cron ([full docs](./docs/NOTIFICATIONS.md))
- [`notification_detail.sql`](./supabase/notification_detail.sql) — per-account opt-in for prayer content in push (generic by default)

**Community management**

- [`group_admin_management.sql`](./supabase/group_admin_management.sql) — promote/demote admins via guarded `SECURITY DEFINER` RPCs
- [`group_invitation_visibility.sql`](./supabase/group_invitation_visibility.sql) — let invitees read the invited group's name
- [`group_rename.sql`](./supabase/group_rename.sql) — let admins rename their group

**Account & AI**

- [`ai_rate_limit.sql`](./supabase/ai_rate_limit.sql) — global fixed-window rate limit for the AI relay (`api/anthropic.js`)
- [`delete_account.sql`](./supabase/delete_account.sql) — right-to-erasure: permanently delete an account and all its data
- [`_cron_secrets.sql`](./supabase/_cron_secrets.sql) — store cron → Edge-Function credentials in Supabase Vault (run once; see the **Edge Functions** section below)

> If you built up the sync RPCs incrementally, run [`fix_sync_overloads.sql`](./supabase/fix_sync_overloads.sql) to drop stale function overloads (PostgREST `PGRST203`).

The daily verse is client-side: a curated pool of ~200 vetted references rotated by day-of-year ([`src/content/dailyVerses.js`](./src/content/dailyVerses.js)) — never AI-generated, no recurring cost.

---

## ☁️ Edge Functions

| Function | Purpose |
|---|---|
| `send-daily-reminder` | Daily Web Push with today's prayer subjects, at each user's local reminder time (`pg_cron`, every 15 min) |
| `send-follow-up-reminder` | Follow-up Web Push every `follow_up_days`, at each user's chosen time (`pg_cron`, every 15 min) |
| `send-event-notifications` | Privacy-safe Web Push for community events (friend requests, invitations, prayer updates, answered). Claims durable notification rows via a Database Webhook (fast) + retry cron (backstop). [Docs](./docs/NOTIFICATIONS.md) |

```bash
npx supabase functions deploy send-daily-reminder --no-verify-jwt
npx supabase functions deploy send-follow-up-reminder --no-verify-jwt
npx supabase functions deploy send-event-notifications --no-verify-jwt
npx supabase secrets set VAPID_PUBLIC_KEY=... VAPID_PRIVATE_KEY=... VAPID_SUBJECT=mailto:you@example.com
```

> `generate-daily-verse` is deprecated — if it's still deployed, unschedule its cron and delete the function.

---

## 💛 No paid feature gating

Pray4Me currently has **no active paid tiers and no plan-based feature gates**. Every capability — advanced scheduling, AI assistance, end-to-end encryption, groups, calendar export, prayer chains — is available to everyone. Private prayers, data export and account deletion are simply how the app works, never an upgrade.

Some of the richer flows use a **Simple vs Advanced** split purely to keep new users from being overloaded — it is a UX distinction, **not** a plan distinction:

- **Simple** = fewer fields, faster action, safe defaults (e.g. the prayer-rhythm presets Daily / Weekly / Occasionally — new prayers default to the bounded weekly rhythm; the legacy "Flexible" weekly-category-plan mode remains on prayers that already use it).
- **Advanced** = more control, revealed only when asked for (custom recurrence, intervals, monthly/yearly rules, "until answered", calendar export, rotations).

Advanced options are always one tap away for every user.

**Optional donations** (the Donate modal in Settings) are exactly that — a voluntary one-time gift that never unlocks features and is never required to use the app.

> A future "Supporter membership" model is **staged separately** on the `feature/supporter-model-staged` branch and is **not active** on `dev`.

---

## 🛠️ Tech Stack

React 18 · Tailwind CSS 3 · React Router 7 · Zustand 5 · Vite + vite-plugin-pwa (Workbox) · Supabase (PostgreSQL, RLS, Edge Functions, `pg_cron`) · Claude via server-side proxy · idb-keyval (offline queue) · Web Crypto API (E2EE) · web-push (VAPID) · Vitest + GitHub Actions CI · Vercel

---

## 🌐 Deployment

Deployed at **[pray4me.space](https://pray4me.space)** on Vercel. Set the same env vars in your Vercel project; the `api/` folder contains the serverless proxies for Anthropic and YouVersion.

---

## 🙌 Contributing

Contributions welcome — fork, create a feature branch, and open a Pull Request. Recent changes are in [`CHANGELOG.md`](./CHANGELOG.md).

---

## 📜 License

MIT — see `LICENSE`.

---

<div align="center">

<br/>

Built with ❤️ and faith · [pray4me.space](https://pray4me.space)

*"I can do all things through him who strengthens me." — Philippians 4:13*

<br/>

</div>
