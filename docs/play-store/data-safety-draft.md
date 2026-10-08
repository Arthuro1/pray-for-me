# Data safety draft — owner review required

Reviewed against source on **8 October 2026**. This is a working inventory for
Play Console, not a pre-approved attestation or an importable response. Declare
the combined behavior of all active releases and the live web app they load.

## Rules used for this draft

Google includes off-device transfers and SDK collection. On-device-only processing
is outside collection; qualifying end-to-end ciphertext can be exempt only when
intermediaries cannot read it. Plaintext AI requests do not inherit that exemption.
Processor and specifically user-directed transfers can have sharing exceptions.
Keep evidence before applying them. Collection still needs review independently.
[Official Data safety guidance](https://support.google.com/googleplay/android-developer/answer/10787469?hl=en).

## Source-based inventory

| Play data type | Observed path / purpose | Draft handling and unresolved check |
| --- | --- | --- |
| Email address | Supabase sign-up, password and magic-link auth in `src/store/authStore.js` | Collected for account management/functionality; required for an account but guest first prayer works without one. Confirm optional/required against the actual whole-app functionality. |
| Name | Sign-up `full_name`, profile display names and group attribution | Collected, user-provided; functionality/account management. Check Google identity metadata too. |
| User IDs | Supabase auth UUIDs, row ownership, memberships, friendship graph, AI bearer-token identity | Collected for account management, functionality and quota/security. Not a device advertising identifier. |
| Photos | Optional profile/group avatars via `avatarPhotos.js`; image attachments via `attachments.js` | Avatar images are stored in a private bucket and served to permitted viewers; do not call avatars end-to-end encrypted. Declare photos collected for functionality. Attachments are encrypted separately; verify payload/key paths before an E2EE exemption. |
| Videos | Optional encrypted media attachments | Inventory includes video uploads, even though the wrapper has no broad photo-library permission. Determine whether every active upload path qualifies for the E2EE exception; otherwise declare optional collection for functionality. |
| Voice or sound recordings / other audio files | Prayer-session recorder and audio uploads | Classify recordings and uploaded sound separately if Console asks. Verify encrypted media key delivery and metadata; no automatic audio collection. |
| Files and docs | Filename/type/size metadata associated with uploads | Only image/audio/video uploads are supported by `attachmentType`; there is no general document picker in that service. Determine if readable filename/document information leaves a device on any legacy/current path. Do not select arbitrary document upload merely because media uses file objects. |
| Other user-generated content | Private prayers, notes, updates, testimonies, labels; feedback and wording reports | Private encrypted journal content may qualify for E2EE exclusion. Feedback/wording reports and any selected plaintext AI input do not. Declare optional non-exempt content for functionality; feedback may also serve developer communications. Audit legacy rows/releases. |
| Other in-app messages | Shared prayer updates/encouragement addressed to group members | Determine whether this category rather than other UGC describes the shared-message paths. Avoid double-counting the same content without considering Google's category definitions. E2EE exception needs verified group-key distribution. |
| Political or religious beliefs | Prayer topics, selected spiritual plans, optional guidance input | Content sent to AI can reveal religious belief and potentially politics. Review selected tasks/metadata and disclose the non-exempt category where applicable; a general “UGC” declaration must not hide sensitive structured collection. |
| Health info / other sensitive personal info | Users may voluntarily put diagnoses, family details or other personal information into AI prompts/feedback | No Health Connect or structured medical-record feature found. Assess the actual non-exempt inputs and purposes with the owner; do not declare a medical service or promise such input cannot occur. |
| Contacts | In-app friends, group membership and social graph in `communityStore.js` | No device-address-book API found. Google's contacts category includes social graph information; assess the stored in-app relationships and declare if in scope. |
| Calendar events | Prayer schedules/reminders and generated ICS exports | No device-calendar read permission found. ICS generation/export is local user-directed output. Determine whether stored schedule data is classified as calendar events or app-specific activity/UGC in the actual Console form. |
| Device or other IDs | Web Push subscription endpoints and keys in `push.js` | Optional for configured reminders; functionality. Endpoints can identify a browser/device and are separate from the account UUID. |
| App interactions / diagnostics | Product event helper and former Vercel Web Analytics/Speed Insights | Automatic SDK mounting and custom event transmission are disabled for this release. Confirm the actual deployment and every older active Play version before answering “not collected”. Hosting/access/security logs remain a separate inventory. |
| Approximate location | Potential IP-derived geography in hosting, providers and previously enabled telemetry | No GPS permission/API found. With telemetry disabled, verify whether hosting/security/provider configuration derives or retains location. Do not equate no GPS permission with no location collection. |
| Crash logs / other performance data | Hosting/function/platform monitoring and any selected external logging | Client source does not establish production log configuration. Owner must inspect enabled drains, integrations and retention before choosing an answer. |

The browser sends Supabase session tokens to the configured AI endpoint. Tokens
and authentication secrets must never be included in Console screenshots, support
logs or this document.

Generated-output reports explicitly submit only the text the reporter chooses to
provide; prayer text/conversation is not automatically attached. They are linked
to the authenticated reporter for ownership/deletion, with no automatically
attached name/email. General feedback can still be submitted without attribution;
such unlinked messages cannot be automatically located by account deletion.
The public policy explains its retention/request handling. Migration
`20261008151537_feedback_report_ownership.sql` is applied to production, with restrictive policy and
role grants verified. Isolated database checks passed all 15 feedback assertions
in the full 138-assertion pgTAP run. Live synthetic-account reporting and erasure
smoke tests remain open. See [database-verification.md](database-verification.md).

## AI topology must be verified

The active browser transport is `src/lib/aiClient.js`: same-origin `/api/ai`
unless `VITE_AI_GATEWAY_URL` is set. `api/ai.js` forwards requests to
`AI_GATEWAY_URL` and does not itself contact an external AI model provider.
The gateway implementation referenced by the comments is absent from this
checkout. Self-hosted transport does **not** prove local inference or zero
downstream recipients. The old `api/anthropic.js` remains in source.

Before declaring recipients, record the deployed endpoint, gateway operator/model
runtime, any downstream model provider, prompt/response retention, backups, logs,
training use and provider instructions/contracts. Verify whether the old endpoint
is still deployed/reachable and used by an older active client. AI requests carry
selected decrypted text only after the feature's consent path; they are readable
at the inference endpoint and cannot be treated as private E2EE ciphertext.

## Sharing decision

Supabase (auth/database/storage), hosting and any inference operator are actual
recipients. Decide whether each qualifies as a processor under the owner's
contract and instructions before using Google's service-provider exception.
Group sharing is explicitly user-directed; verify audience preview and user
consent before using that exception. Do not simply list all infrastructure as
“shared” or all opt-in AI as “not shared” without a documented basis.

Provider disclosure in the privacy policy remains necessary even when a Play
sharing exception applies. Unknown gateway recipients are a launch question,
not a reason to invent “Anthropic only” or “no third parties”.

## Security and account-deletion answers

| Console question | Draft answer / proof needed |
| --- | --- |
| Collects or shares required data types? | **Yes**: at least account email/IDs, optional avatars and non-exempt feedback. |
| All collected data encrypted in transit? | Intended HTTPS transport; verify Supabase, qetoret.com, inference upstream, enabled providers and legacy endpoints before attesting **Yes**. Browser HTTPS alone does not prove gateway-to-model encryption. |
| Account creation methods | Email/password, email link and Google OAuth found in source; select all applicable options shown in Console. |
| Account deletion | In-app deletion is implemented through `delete_account`; external resource is `https://qetoret.com/delete-account.html`. Verify both live and the actual erasure workflow before answering **Yes**. |
| Independent security review badge | **No**, unless the owner supplies an actual qualifying independent assessment. Repository tests/review documents are not that certification. |
| Data sold / advertising purpose | No selling/ad SDK path found. Confirm business/provider behavior; do not select advertising or marketing without such use. |

`deleteAccount` clears local state and invokes the database RPC; avatar removal
is best effort. Migration `20260831221707_queue_avatar_cleanup_without_storage_sql`
queues orphan cleanup for an administrative Storage API worker/sweep. Confirm
that queue is actually serviced and encrypted attachments are removed after their
rows disappear. Verify database cascades, shared/group content, wording reports,
feedback, push subscriptions, logs, processor retention and backup expiry.
Define any legitimate retention exception and duration in the public policy.
Recipients can retain already received copies; that is distinct from continuing
to host deleted user data on the operator's systems.

## Required owner record before submitting

- Production deployment ID, active Play tracks/versions and actual SDK network trace.
- Supabase/hosting/storage regions, processors/contracts and retention schedules.
- Gateway topology, recipients and whether prompt/output logging or training occurs.
- Media/content E2EE exemption decision with key/access evidence.
- Logs, inferred location, identifiers, social graph and schedule classification.
- Account/storage/provider erasure results and backup/retention exceptions.
- Final Console preview reviewed against the live privacy policy.

Do not upload an automatically generated Data safety CSV from this draft. Resolve
the rows first and save the final Console export with the release record.
