# Production operations runbook

## Release gate

Use a reviewed pull request and a tagged release. CI must pass `npm ci`, strict
lint, TypeScript, locale checks, unit/integration tests, real-browser tests,
production build, clean Supabase migration rebuild, and pgTAP schema assertions.
Production deployment requires a separate approval.

Release order is additive database migration, schema verification, Edge
Functions, serverless API, frontend, then smoke tests. Record migration IDs,
frontend commit/tag, Edge Function versions, approver, start/end time, and smoke
results in the release notes. For schema-writing changes, database always lands
before the client.

Smoke tests use synthetic content only:

- sign in/out as two test accounts and verify offline isolation;
- create/decrypt a personal prayer, update, attachment, and guest draft;
- create a group key, distribute it, remove a member, and write future content;
- exercise AI success, 429, and `AI_PROXY_DISABLED=true` in staging;
- report and block a synthetic group item;
- verify generic push payload and queue/cron health.

## Rollback

- Frontend: redeploy the last known-good immutable Vercel deployment. If a bad
  service worker shipped, deploy a *new* worker version that deletes its caches
  and calls `skipWaiting`/`clientsClaim`; rolling back HTML alone cannot evict an
  already installed worker.
- Serverless API: redeploy the previous function artifact. Set
  `AI_PROXY_DISABLED=true` first if cost, prompt, quota, or provider behavior is
  involved.
- Edge Functions: redeploy the prior tagged source and verify internal auth,
  cron, and a synthetic delivery. Disable the cron while correcting duplicates.
- Database: prefer a forward compensating migration. Never blindly down-migrate
  key/ciphertext/RLS changes. For destructive corruption, stop writes and restore
  the pre-release backup/PITR into a new project, validate it, then cut over.
- Group keys: do not delete a version referenced by content. Use detection/repair
  only for unused orphans. Restore a content-bound envelope from a legitimate
  member/device backup or leave the content locked and escalate.

## Backup and restore

Enable Supabase point-in-time recovery where the plan permits and take scheduled
logical backups of database schema/data plus Storage ciphertext. Protect backups
with separate credentials, encryption, retention, and access logs. Backups do
not contain users' device keys; restoring ciphertext does not guarantee content
recovery if users lost every key.

Quarterly, restore the latest backup into an isolated project, apply pending
migrations, run pgTAP, compare row counts/constraints/storage objects, decrypt
synthetic fixtures with retained test keys, and document recovery time/objective.
Delete the isolated restore after sign-off. A backup that has never been restored
is not considered verified.

## Avatar storage

Avatar objects in the private `avatars` bucket are owned by exactly one profile
or group, and every deletion path targets that owner's folder alone. There is no
bucket-wide cleanup job, and none should be written.

Replacing an avatar uploads the new object, points the row at it, and only then
deletes the old one, so a failed upload or a failed database write can never cost
someone the picture they already had. The cost of that ordering is that a failure
between the last two steps leaves an unreferenced object behind. Deleting a
profile or a group also removes the `storage.objects` rows for its folder through
a before-delete trigger — which revokes all access immediately — but the file in
the storage backend is only reclaimed through the Storage API.

Quarterly, or after a storage incident, reconcile: list the bucket and compare
each object against `profiles.avatar_photo_path` and `groups.avatar_photo_path`.
Delete only objects that no row references AND whose owner folder is older than
the last successful reconciliation, so an upload in flight is never collected.
Log counts, never object names.

## Monitoring and privacy-safe health checks

Alert on frontend error rate/release regressions, serverless 4xx/5xx and latency,
Supabase connection/RLS/RPC failures, failed migrations, Edge invocation and cron
misses, push rejection/dead-subscription rates, AI 429/5xx/cost and global quota,
decrypt/AAD failure counts, orphaned group-key versions, unreferenced avatar
objects, avatar upload rejection rates, and offline queue permanent failures. Use counts, task IDs, status codes, hashed release IDs, and
synthetic record IDs—never prayer titles/text, attachment names, email addresses,
tokens, ciphertext, key material, prompts, model output, invite codes, or full
URLs containing identifiers.

Health endpoints may check process liveness, dependency reachability, migration
version, queue depth, and synthetic canaries. They must not fetch or return real
prayers or enumerate users/groups.

## Incident response

1. Declare severity/commander, preserve timestamps and access logs, and open a
   restricted incident record.
2. Contain: pause deployment/cron, disable AI, revoke affected sessions or
   provider keys, and block vulnerable routes without collecting content.
3. Determine affected data, accounts, period, and whether plaintext/key material
   was accessible. Do not paste sensitive samples into tickets or chat.
4. Eradicate and recover from a reviewed release/restore. Run account-isolation,
   crypto, RLS, and migration tests before reopening.
5. Notify affected users/regulators as required with facts, dates, exposed data,
   actions, and support contacts. Preserve legal timelines.
6. Publish a blameless post-incident review with corrective owners and dates.

For a privacy incident, immediately restrict analytics/log access, stop the
source, preserve minimal evidence, identify processors/regions/retention, and
initiate deletion with downstream providers where applicable.

## Key compromise

- Anthropic/YouVersion/VAPID/internal function secret: disable the integration,
  rotate at the provider and deployment platform, redeploy, verify old-key
  rejection, and review usage logs without content.
- Supabase service role/JWT signing material: isolate the project, rotate keys,
  invalidate sessions as supported, redeploy every server/Edge consumer, audit
  RLS bypass activity, and assume metadata/ciphertext access.
- User account content key: inform the user that existing ciphertext may be
  exposed; a safe recovery requires generating a new account key and verified
  client-side re-encryption. Do not claim passphrase rotation repairs a stolen
  raw key.
- Group key: rotate to a new version and redistribute only to current members.
  Treat historical content under the compromised version as exposed.

## AI controls

Set `AI_USER_DAILY_LIMIT` and `AI_GLOBAL_DAILY_LIMIT` to approved budgets. The
database reservation is atomic and fails closed. Use `AI_PROXY_DISABLED=true`
as the emergency breaker. Review aggregate task/status/cost metrics; never log
the structured input, constructed prompts, or provider response body.
