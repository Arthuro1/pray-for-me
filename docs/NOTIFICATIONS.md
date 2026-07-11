# Notification system

A durable in-app inbox + real-time updates + privacy-safe Web Push for meaningful
community events, built on the project's existing Web Push, Supabase Realtime and
Edge Function infrastructure.

## What triggers a notification

| Event | Recipient(s) | Type | Deep link |
|---|---|---|---|
| Friend request received | requestee | `friend_request` | `/community` |
| Group invitation received | invitee | `group_invitation` | `/community` |
| Update posted on a community prayer | prayer owner + followers | `community_update` | `/community/group/{g}/prayer/{p}` |
| Community prayer marked answered | followers | `answered` | `/community/group/{g}/prayer/{p}` |
| Added to a group / role changed | affected member | `membership_change` / `role_change` | `/community/group/{g}` |
| "I'm praying" reactions (hourly bucket) | prayer owner | `reaction_bucket` | `/community/group/{g}/prayer/{p}` |
| New prayer shared to a group | other members | `group_prayer_added` | `/community/group/{g}` |
| Testimony shared to a group | other members | `testimony` | `/community/group/{g}/prayer/{p}` |

Never notified: your own actions, routine edits, automatic sync, reaction
removal, duplicate events, disabled types, or events you're already viewing
(foreground suppression, best-effort).

**Aggregation.** `reaction_bucket` dedupes on an hourly time bucket
(`reaction-bucket:{prayerId}:{recipientId}:{YYYYMMDDHH}`), so many reactions
within the hour produce **one** notification/push, not one per reaction.

## Privacy model

A notification row and its push payload carry **only identifiers and routing
info** — never a prayer title, description, update text, testimony text or person
name. All prayer content stays end-to-end encrypted; notifications point at
content, they never copy it. Push bodies are fixed generic strings
(`supabase/functions/_shared/eventNotify.ts`), e.g. "There is an update on a
prayer you follow." The inbox renders the same generic per-type labels — it does
**not** read text out of `metadata`. `metadata` holds UUIDs (`group_id`,
`community_prayer_id`, `from_user_id`) used purely to build the deep link.

## Architecture

```
 user action (friend request / update / answered / …)
        │  AFTER INSERT/UPDATE trigger (SECURITY DEFINER, search_path='')
        ▼
 notifications row  ──Realtime INSERT──►  in-app inbox (bell badge, panel, page)
        │
        ├─ Database Webhook (optional, fast path) ─┐
        └─ retry cron every 5 min (backstop) ──────┤
                                                    ▼
                        send-event-notifications Edge Function
                        (claims row · checks prefs + quiet hours ·
                         builds privacy-safe payload · web-push to devices ·
                         cleans up dead subscriptions · records outcome)
```

### Files

- **DB**: [`supabase/notifications.sql`](../supabase/notifications.sql) — tables,
  RLS, preference resolution, event triggers, claim RPCs, retry cron.
- **Edge Function**: [`supabase/functions/send-event-notifications/index.ts`](../supabase/functions/send-event-notifications/index.ts)
  + shared [`_shared/eventNotify.ts`](../supabase/functions/_shared/eventNotify.ts)
  (payload/route builders) and the existing [`_shared/reminders.ts`](../supabase/functions/_shared/reminders.ts)
  (VAPID + web-push).
- **Service worker**: [`public/push-sw.js`](../public/push-sw.js).
- **Store**: [`src/store/notificationStore.js`](../src/store/notificationStore.js).
- **Routing**: [`src/lib/notificationRoutes.js`](../src/lib/notificationRoutes.js)
  (client twin of `eventNotify.eventUrl`; a parity test locks them together).
- **UI**: `NotificationBell`, `NotificationPanel`, `NotificationRow`,
  `NotificationPreferences`, `FollowPrayerButton` (components) and
  `pages/NotificationsPage.jsx`.

### Tables (all in `supabase/notifications.sql`)

- `notifications` — the durable inbox. RLS: users **select** their own rows and
  **update only `seen_at`/`read_at`** (column-level `GRANT` + policy). No client
  insert/delete. Delivery status is moved only by the SECURITY DEFINER RPCs /
  service role.
- `notification_preferences` — account-level, per `(user, type, group)`:
  `in_app_enabled`, `push_enabled`, `delivery_mode` (`immediate`/`digest`/`off`).
  The `_account` row holds quiet-hours start/end + IANA `timezone`. Kept separate
  from device push subscriptions (no per-type prefs duplicated per device).
  Default mode is type-aware (`default_delivery_mode()`): the noisier
  `group_prayer_added` / `testimony` types default to **digest**; everything else
  is **immediate**. Explicit preference rows always win.

### Digest batching

When a notification's effective `delivery_mode` is `digest`, the durable inbox
row is created immediately (you see it in-app right away), but the **push** is
deferred: `deliver()` marks the row `skipped` / `last_push_error='digest'`
(no attempt spent). An hourly cron calls the function with `{ "digest": true }`,
which — per recipient, outside quiet hours — atomically claims their pending
digest rows (`claim_user_digest`, stamping `digested_at` so they're never
summarized twice) and sends **one** "You have N new notifications" push to
`/notifications`. A recipient still in quiet hours is left for the next run.
- `prayer_notification_subscriptions` — follow an individual community prayer.
  Tapping "I'm praying" auto-follows (reversible from the prayer's follow toggle).

## Timezone

Notification scheduling (quiet hours, future digests) uses an **IANA timezone**
(`Intl.DateTimeFormat().resolvedOptions().timeZone`, e.g. `Europe/Berlin`), so
it stays DST-correct. It's captured on `push_subscriptions.timezone` and on the
`_account` preference row. The legacy numeric `tz_offset` is still written for
backward compatibility with the daily/follow-up reminder schedulers.

## Deployment

### 1. Database

Run in the Supabase SQL editor **after** `community_schema.sql`,
`push_notifications.sql` and `user_settings.sql`:

```
supabase/notifications.sql
```

Before running the cron block at the bottom, replace `<PROJECT_REF>` and
`<SERVICE_ROLE_KEY>`.

### 2. Edge Function

Reuses the reminder functions' VAPID secrets — no new secrets needed.

```bash
npx supabase functions deploy send-event-notifications --no-verify-jwt
# secrets already set for the reminder functions:
# npx supabase secrets set VAPID_PUBLIC_KEY=... VAPID_PRIVATE_KEY=... VAPID_SUBJECT=mailto:you@example.com
```

The function authenticates callers by requiring the **service-role bearer** in
the `Authorization` header (so `--no-verify-jwt` is safe — pg_net and the webhook
send that header).

### 3. Delivery: retry cron (required) + Database Webhook (optional, fast)

The **retry cron** in `notifications.sql` (`retry-event-notifications`, every 5
min) is the reliable delivery path — it claims and delivers any
`pending`/`failed` rows (`push_attempts < 5`, `< 24h old`). The system works with
just this.

A second cron, **`digest-event-notifications`** (hourly, also in
`notifications.sql`), calls the function with `{ "digest": true }` to send the
batched summaries. Fill in `<PROJECT_REF>` / `<SERVICE_ROLE_KEY>` in both cron
blocks.

For **near-instant** first delivery, add a Supabase **Database Webhook**
(Dashboard → Database → Webhooks):

- Table: `public.notifications`, Events: **Insert**
- Type: **HTTP Request**, Method: `POST`
- URL: `https://<PROJECT_REF>.supabase.co/functions/v1/send-event-notifications`
- Header: `Authorization: Bearer <SERVICE_ROLE_KEY>`

The function handles the webhook's `{ record: { id } }` shape, an explicit
`{ notificationId }`, or `{}` (batch). Row claiming (`FOR UPDATE SKIP LOCKED`)
guarantees the webhook and the cron never double-send.

## Environment variables

No new variables. Reuses:

| Var | Where | Purpose |
|---|---|---|
| `VITE_VAPID_PUBLIC_KEY` | client `.env` | subscribe devices |
| `VAPID_PUBLIC_KEY` / `VAPID_PRIVATE_KEY` / `VAPID_SUBJECT` | Supabase secrets | sign pushes |
| `SUPABASE_SERVICE_ROLE_KEY` | Edge runtime (auto) | claim rows, gate the function |

## Local development

`notifications.sql` + `notifications_test.sql` run against a local Supabase
(`supabase start`). The client inbox/UI works against any Supabase project with
the migration applied. Web Push itself needs HTTPS + a real VAPID key and a
granted browser permission; without it, the in-app inbox + Realtime still work.

## Testing

- **Vitest** (CI): `npm test` covers the pure logic —
  `src/lib/eventNotify.test.js` (payload privacy + routing),
  `src/lib/notificationRoutes.test.js` (client/server route parity),
  `src/store/notificationStore.test.js` (unread count, dedupe, read state,
  reset), `src/lib/pushSw.test.js` (service-worker parse/route/focus/external-URL
  safety — loads the real `public/push-sw.js`).
- **Database** (manual, local): `supabase/notifications_test.sql` asserts the
  trigger + RLS behaviours (one notification per event, no self-notify,
  answered-transition only, dedupe, RLS isolation, read-only field updates).

## Troubleshooting browser notification permissions

- **No push, but the inbox updates** → the browser hasn't granted notification
  permission, or this device has no live push subscription. Turn on **Push
  notifications** in Settings → Notifications (that requests permission +
  subscribes this device), or enable a reminder, or check
  `Notification.permission`. The push toggle and event delivery are **independent
  of the daily-reminder flag** (`push_subscriptions.enabled`): the master switch
  for event push is `notification_preferences.push_enabled`, and delivery reaches
  every subscribed device regardless of whether the daily reminder is on.
- **Turned it on one device, another device gets nothing** → each device needs a
  browser permission grant once (the platform forbids subscribing without it).
  After that, `push_enabled` propagates automatically: on app load,
  `prayerStore.syncSettings` calls `ensurePushSubscription(..., eventPushEnabled)`
  which re-subscribes any already-permission-granted device — so the toggle only
  has to be flipped once per account, not once per device (except for the initial
  permission grant on each new device).
- **Permission granted, still nothing** → a stale subscription bound to a rotated
  VAPID key sends silently-failing; the Edge Function deletes 401/403/404/410
  subscriptions so the client re-subscribes. Re-toggle a reminder to refresh.
- **iOS** → Web Push requires the **installed PWA** (Add to Home Screen) on iOS
  16.4+.
- **Quiet hours** → push is delayed (not dropped) during the window; the in-app
  notification still appears immediately.

## Limitations / follow-ups

- `reaction_bucket` aggregates on a fixed **hourly** bucket; the copy is a
  generic "Several people are praying with you" and does not carry a live count.
- Digest cadence is a fixed **hourly** cron; a per-user digest time/frequency
  could be added on top of the existing preference table.
- Foreground push suppression is best-effort (depends on the SW seeing a visible
  client on the exact route).
- Actor display names are intentionally not shown in the inbox (kept generic);
  could be enriched via a `profiles` lookup later.
