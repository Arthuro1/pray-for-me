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

- **🗂️ Prayer journal** — log requests for yourself or others, organize by category, add updates and prayer points with Bible verses, mark prayers answered and keep testimonies in an **Answered** reflection view
- **🤝 Community** — prayer groups (invite code, link, or QR), friends, anonymous sharing, "I'm praying" reactions, member updates and testimonies, two-way sync between your prayer and its shared copies, and on-demand translation of any group prayer
- **🌱 Grow** — a Scripture-first library: 12 prayer guides to pray through (the Psalms, God's promises, for your enemies…) and 16 short readings on prayer and the Christian life
- **📅 Prayer scheduling** — schedule any prayer once or recurring (daily, chosen weekdays, every N days, monthly, yearly) into morning / midday / evening slots, with four end conditions including *until answered* (the prayer retires itself when God answers); a month/week calendar with per-occurrence skips & moves, gentle **catch-up** for days missed (grace, not guilt), **rotation lists** to pray large lists round-robin, guided **prayer plans** (gratitude, novena, 21-day breakthrough…), group **prayer chains** (members claim days), and one-click **.ics** export to Google/Apple/Outlook. The recurrence engine is a pure, fully offline module ([`src/lib/schedule.js`](./src/lib/schedule.js)); prayers without a schedule keep the simple weekly category plan (assign categories to days, per-prayer overrides, auto-fill empty days)
- **🤖 AI, humbly** — Claude suggests prayer angles with Bible verses in your language, behind theological guardrails (never speaks for God, always points back to Scripture) and a one-tap opt-out; the API key stays server-side, session-gated and rate-limited
- **📖 Scripture in-app** — a daily verse from a curated pool, plus an in-app reader for any reference (YouVersion Platform API text when configured, cached fallback otherwise)
- **🔔 Push reminders** — a daily Web Push with the day's prayer subjects, and follow-up nudges at your chosen cadence to check in with the people you pray for; sent server-side via `pg_cron` + Edge Functions (iOS requires the installed PWA, 16.4+)
- **📱 PWA & offline** — installable on Android, iOS, and desktop; create and edit prayers offline with a durable IndexedDB write queue that replays on reconnect
- **🌍 16 languages** — full UI in French, English, German, Portuguese, Chinese, Spanish, Hindi, Japanese, Swahili, Amharic, Indonesian, Tagalog, Korean, Russian, Arabic, and Persian; dynamic content translated via AI and cached
- **🔐 Prayer Vault (E2EE)** — opt-in client-side AES-256-GCM encryption of private prayers (including updates and prayer points) with a passphrase and one-time recovery code; sharing to a group publishes plaintext by design
- **🔒 Security** — Supabase Auth (Google or email/password), Row Level Security, server-only secrets, strict CSP; full threat model in [`docs/THREAT_MODEL.md`](./docs/THREAT_MODEL.md)
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
npm run build    # production build → dist/
npm test         # Vitest suite
npm run lint     # ESLint
```

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

---

## 🗄️ Database Setup

Run these in the Supabase SQL editor, in order:

1. [`community_schema.sql`](./supabase/community_schema.sql) — core + community tables, RLS
2. [`migration.sql`](./supabase/migration.sql) — sharing, two-way sync, realtime
3. [`security_hardening.sql`](./supabase/security_hardening.sql) — invite-code-validated joins
4. [`offline_client_ids.sql`](./supabase/offline_client_ids.sql) — offline write sync RPCs
5. [`offline_conflict_hardening.sql`](./supabase/offline_conflict_hardening.sql) — append-not-overwrite testimonies
6. [`push_notifications.sql`](./supabase/push_notifications.sql) — push subscriptions + daily reminder cron
7. [`follow_up_reminders.sql`](./supabase/follow_up_reminders.sql) — follow-up reminder columns + cron
8. [`follow_up_time.sql`](./supabase/follow_up_time.sql) — per-user follow-up time + cadence anchor
9. [`verse_cache.sql`](./supabase/verse_cache.sql) — shared Scripture text cache
10. [`community_translation_cache.sql`](./supabase/community_translation_cache.sql) — group-scoped translation cache
11. [`user_settings.sql`](./supabase/user_settings.sql) — account-level settings sync
12. [`prayer_scheduling.sql`](./supabase/prayer_scheduling.sql) — `schedule`/`schedule_overrides` columns, `prayer_completions` + `prayer_commitments` tables, RLS
13. [`split_reminder_crons.sql`](./supabase/split_reminder_crons.sql) — **upgrade only**: replaces the old combined `send-reminders` cron

The daily verse is client-side: a curated pool of ~200 vetted references rotated by day-of-year ([`src/content/dailyVerses.js`](./src/content/dailyVerses.js)) — never AI-generated, no recurring cost.

---

## ☁️ Edge Functions

| Function | Purpose |
|---|---|
| `send-daily-reminder` | Daily Web Push with today's prayer subjects, at each user's local reminder time (`pg_cron`, every 15 min) |
| `send-follow-up-reminder` | Follow-up Web Push every `follow_up_days`, at each user's chosen time (`pg_cron`, every 15 min) |

```bash
npx supabase functions deploy send-daily-reminder --no-verify-jwt
npx supabase functions deploy send-follow-up-reminder --no-verify-jwt
npx supabase secrets set VAPID_PUBLIC_KEY=... VAPID_PRIVATE_KEY=... VAPID_SUBJECT=mailto:you@example.com
```

> `generate-daily-verse` is deprecated — if it's still deployed, unschedule its cron and delete the function.

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
