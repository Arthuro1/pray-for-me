# Deploy & Migration Checklist

The single source of truth for **what must be applied to a live environment**, in
what order, and what's dangerous to get wrong. It exists because the backend is
40+ hand-applied SQL files plus Edge Functions, and "what's live in prod" was
being tracked from memory. Two mechanisms replace that:

1. **`supabase/_migrations_tracking.sql`** — a `schema_migrations` table so prod
   state is queryable *from the database*. Run it first in every environment.
2. **This file** — the authoritative list of every migration, its order, its
   danger flags, and its last-known status.

> **How to reconcile prod:** run
> `select filename, applied_at from public.schema_migrations order by applied_at;`
> against prod, then diff against the tables below. Anything here that isn't in
> that query is not live. Update the **Status** column here when you apply one.

**Status legend:** ✅ confirmed live · ⚠️ flagged pending in dev notes — **verify** ·
❓ unknown — verify · 🖥️ needs client redeploy · ⚡ needs Edge Function (re)deploy

---

## ⚠️ The one rule that loses data

Some migrations add columns the **client writes on every create**. If the client
ships *before* the migration, PostgREST answers `400`, and the offline queue
treats that as a permanent failure and **drops the prayer**. For these, the order
is strict: **migration → verify → client deploy.** The reverse (migration first)
is always safe (a nullable column the old client ignores).

Files with this constraint are marked **🔴 DB-before-client** below.

---

## 1. Core schema (apply first, in this order)

| # | File | Purpose | Notes | Status |
|---|------|---------|-------|--------|
| 0 | `_migrations_tracking.sql` | Migration tracking table | **run first** | ❓ new |
| 1 | `community_schema.sql` | Core + community tables, RLS | | ❓ verify |
| 2 | `migration.sql` | Sharing, two-way sync, realtime | after #1 | ❓ verify |
| 3 | `shared_prayer_sync.sql` | Fan-out edits to author + group copies | after #2 | ❓ verify |
| 4 | `security_hardening.sql` | Invite-code-validated joins | | ❓ verify |
| 5 | `offline_client_ids.sql` | Offline write-sync RPCs | | ❓ verify |
| 6 | `offline_conflict_hardening.sql` | Append-not-overwrite testimonies | | ❓ verify |
| 7 | `fix_signup_trigger.sql` | Hardens new-user trigger `search_path` | fixes "Database error saving new user" | ❓ verify |

## 2. Encryption (E2EE — on by default)

| File | Purpose | Notes | Status |
|------|---------|-------|--------|
| `e2ee_migration.sql` | Nullable `encrypted_payload` columns (non-breaking) | | ❓ verify |
| `e2ee_default.sql` | Per-user identity keypairs + wrapped group keys | Phase 1 | ⚠️ verify |
| `e2ee_testimonies.sql` | Encrypted `prayer_testimonies` table + back-fill | | ⚠️ flagged in security audit |

## 3. Scheduling & reminders

| File | Purpose | Notes | Status |
|------|---------|-------|--------|
| `push_notifications.sql` | Push subs + daily reminder cron | | ❓ verify |
| `follow_up_reminders.sql` | Follow-up columns + cron | | ❓ verify |
| `follow_up_time.sql` | Per-user follow-up time + cadence | ⚡ redeploy `send-follow-up-reminder` | ⚠️ verify |
| `prayer_scheduling.sql` | `schedule` cols, `prayer_completions`/`_commitments` | | ❓ verify |
| `split_reminder_crons.sql` | **Upgrade only** — replaces combined `send-reminders` cron | | ❓ verify |

## 4. Content & rich media

| File | Purpose | Notes | Status |
|------|---------|-------|--------|
| `content_language.sql` | `content_language` source-language columns | **🔴 DB-before-client** | ⚠️ flagged MUST-run |
| `rich_media_updates.sql` | Attachment cols + encrypted `attachments` bucket + `sync_add_update` | **🔴 DB-before-client** | ✅ noted live (verify) |
| `attachment_management.sql` | Author/admin DELETE policies + mirror-aware remove RPCs | after `rich_media_updates.sql` | ⚠️ flagged MUST-run |
| `update_text_edit.sql` | Plaintext shared-update mirror sync for author edits | | ⚠️ flagged MUST-run |
| `scripture_guidance.sql` | Persist AI guidance on the prayer row | | ❓ verify |
| `pin_prayers.sql` | Pin prayers to top | | ❓ verify |

## 5. Community management

| File | Purpose | Notes | Status |
|------|---------|-------|--------|
| `group_admin_management.sql` | Promote/demote admins (guarded DEFINER RPCs) | | ⚠️ flagged MUST-run |
| `group_invitation_visibility.sql` | Invitees can read invited group's name | fixes invite name "?" | ⚠️ flagged MUST-run |
| `group_rename.sql` | Admins rename group | | ❓ verify |
| `community_update_delete.sql` | Delete community updates | | ⚠️ flagged MUST-run |
| `group_plans.sql` | Persistent group-visible "praying together" plan | 🖥️ + client; 14 locales need native review | ⚠️ pending / not committed |
| `plan_invitations.sql` | Invite friends/groups to a guided plan | ⚡ redeploy `send-event-notifications` | ⚠️ pending / not committed |

## 6. Caches, settings, security

| File | Purpose | Notes | Status |
|------|---------|-------|--------|
| `verse_cache.sql` | Shared Scripture text cache | | ❓ verify |
| `community_translation_cache.sql` | Group-scoped translation cache | | ❓ verify |
| `user_settings.sql` | Account-level settings sync | vault key already synced — don't duplicate | ⚠️ verify |
| `notifications.sql` | Inbox, prefs, follow subs, triggers, retry cron | ⚡ + Edge Function + cron | ⚠️ NOT deployed (notes) |
| `notification_detail.sql` | Per-account opt-in for content in push | ⚡ redeploy `send-daily-reminder` | ⚠️ pending |
| `ai_rate_limit.sql` | Global fixed-window AI relay rate limit | backs `api/anthropic.js` shared limiter | ❓ verify |
| `rpc_hardening.sql` | grant/revoke on community RPCs; `find_user_by_email` leak; `search_path` | OWASP audit 2026-07-28 | ⚠️ flagged pending |
| `delete_account.sql` | Right-to-erasure | | ❓ verify |
| `_cron_secrets.sql` | Cron → Edge-Function creds in Vault (run once) | BEARER = `NOTIFY_FN_SECRET`, not service-role key | ❓ verify |

**One-offs / conditional:** `fix_sync_overloads.sql` (only if you hit PostgREST
`PGRST203` from stale overloads) · `rls_audit.sql` (audit helper, not a schema
change — **run it to confirm base RLS is on**: prayers/categories/translations
have no committed RLS file). Test fixtures `*_test.sql` and `seed.sql` are **not**
for prod — note `seed.sql`'s 3 fake users break GoTrue `listUsers` (NULL token
columns); delete or repair them if present.

---

## 7. Edge Functions

```bash
npx supabase functions deploy send-daily-reminder     --no-verify-jwt
npx supabase functions deploy send-follow-up-reminder --no-verify-jwt
npx supabase functions deploy send-event-notifications --no-verify-jwt
npx supabase secrets set VAPID_PUBLIC_KEY=... VAPID_PRIVATE_KEY=... VAPID_SUBJECT=mailto:you@example.com
```

- Redeploy `send-follow-up-reminder` after `follow_up_time.sql`.
- Redeploy `send-daily-reminder` after `notification_detail.sql`.
- Redeploy `send-event-notifications` after `plan_invitations.sql`.
- **Delete `generate-daily-verse`** — deprecated; unschedule its cron and remove
  the function (the daily verse is client-side now).

## 8. Supabase dashboard settings (not SQL)

- [ ] **Auth → URL Configuration → Redirect allow-list:** add `<origin>/**`
      (e.g. `https://pray4me.space/**`). Without it, invite/reset links fall back
      to root and lose their token.
- [ ] **Auth providers:** Google + email/password enabled.

## 9. Vercel env (see README → Environment Variables)

- [ ] `VITE_SUPABASE_URL`, `VITE_SUPABASE_ANON_KEY` (required)
- [ ] `ANTHROPIC_API_KEY` (server-only — **rotate the previously-committed key** if not already)
- [ ] `VITE_VAPID_PUBLIC_KEY` (+ Edge secret `VAPID_PRIVATE_KEY`)
- [ ] `VITE_YOUVERSION_ENABLED=true` + `YVP_APP_KEY` — **inlined at build time; a
      redeploy is required** for licensed verse text to switch on.

---

## Standard release flow

1. Land migrations for the release; **run 🔴 DB-before-client ones in prod first**
   and verify (each file has a verify query at its foot).
2. Deploy/redeploy any affected Edge Functions.
3. Deploy the client (Vercel).
4. `select * from public.schema_migrations order by applied_at;` and update the
   **Status** column above.
