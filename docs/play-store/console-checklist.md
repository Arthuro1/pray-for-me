# Console checklist and release gate

Repository review and official-policy checks: **8 October 2026**. Check off items
only after recording evidence. This checklist supersedes historical Praystead
listing text; it does not certify production readiness. Paul’s explicit
**8 October 2026** content and release-material approval is recorded in
[paul-approval-2026-10-08.md](paul-approval-2026-10-08.md).

## Resolve these launch gates first

- [ ] **Observed live mismatch:** the 8 October live preflight reached
  qetoret.com but found an old Praystead manifest and responses without Qetoret
  branding at the root/privacy/terms/deletion URLs. Deploy the prepared web release,
  then rerun `npm run check:release -- --live` and the full live smoke checks.
  All six local static release checks passed; they do not close this live blocker.
- [ ] **Live domain and vault migration:** deploy the intended app to
  `qetoret.com`, complete [domain-migration.md](domain-migration.md), and test a
  real old-origin account. Device encryption keys and unsent drafts do not cross
  origins automatically. Keep a recovery path on the old origin before redirecting
  existing users.
- [ ] **Signing and Android association:** verify the final signed bundle's
  package `space.praystead.twa`, version `5` / `1.0.4`, minSdk `24`, target `36`;
  confirm version `5` is unused. Add the **Play app-signing** certificate to the live Digital Asset
  Links file. The upload certificate alone does not verify Play-installed builds.
- [ ] **Terms acceptance before community posting:** source now includes
  `CommunityTermsGate` around every signed-in route/composer, including existing
  accounts and Google/email-link sign-in. Acceptance is scoped locally to the
  account, origin and terms version. Verify the deployed flow before all UGC
  creation/upload routes; deletion instructions and sign-out remain accessible
  without accepting. This is not a server-side legal acceptance audit trail.
- [ ] **Complete report/block coverage:** source now exposes report/block on
  shared prayers, updates and testimonies. Update/testimony menus target their
  actual row type and author, with explicit confirmation; backend block success
  immediately hides that author in both mounted lists. Verify these deployed
  controls and user reports, group/friend interaction and block management.
- [ ] **Operate moderation:** name the report-monitoring and safeguarding owners,
  review frequency, takedown/escalation procedure and retention. Verify a group
  admin can receive, review and resolve a synthetic report without service-role
  credentials. `docs/COMMUNITY_SAFETY.md` describes a workflow; a document does not
  prove staffing or a working review interface. Keep content out of support logs.
- [ ] **AI output safety:** generated-output reporting is now wired through the
  AI disclaimer/feedback flow in source. Test it on the actual generated guidance
  and runtime-translation surfaces and verify report triage. Confirm
  gateway filtering, limits and human response ownership; otherwise withhold the
  AI feature until this gate passes. See [AI policy](https://support.google.com/googleplay/android-developer/answer/14094294?hl=en).
- [ ] **Privacy and deletion match production:** publish the updated legal pages,
  confirm the responsible developer/contact, data recipients, retention and
  account-erasure process. Verify avatar cleanup and attachment deletion through
  the Storage API, provider/log/backup retention, and the external email request
  workflow. Do not promise immediate deletion from all backups.
- [x] **Apply the verified feedback ownership migration:** local database reset,
  all 20 migrations, 138 pgTAP assertions and the advisor error gate passed.
  Production version `20261008151537` is applied; restrictive ownership guard,
  RLS and role grants are verified. See [database-verification.md](database-verification.md).
- [ ] **Production account smoke test:** verify owned reporting, forged-owner
  denial and attributed report erasure using controlled synthetic accounts.
- [ ] **Analytics audit:** automatic Vercel Analytics/SpeedInsights mounting and
  custom-event transmission are disabled for this release in source. Verify the
  deployed network trace and older active Play versions. Hosting/provider request
  logs remain separate; confirm their identifiers, inferred location and retention.
- [ ] **Review access:** complete [reviewer-access.md](reviewer-access.md) with
  working credentials and vault recovery on a fresh device. Never use the
  existing tutorial/demo account.
- [ ] **Physical-device and policy testing:** complete
  [test-plan.md](test-plan.md), review the Play pre-launch report and capture the
  real installed app for the final listing.

The source review is supplemented by isolated database tests, the user-approved
production ownership migration and event-notification deployment (version 40).
See [release-follow-up.md](release-follow-up.md). Recheck final source and deployment.
The focused terms/UGC/edit/delete regression run passed 46 tests in five files;
narrow ESLint checks passed. These results do not test actual moderator staffing,
production RPC migrations or Play-installed behavior.
Strict repository lint, type checking, locales, content baseline, production build
and the 13-file/44-test browser suite also passed. The initial full unit run still
had 10 failing tests across 9 files; see the follow-up result below. Database
verification passes locally and the ownership migration is applied to production.
Live account smoke tests and the unit failures remain open. See
[validation.md](validation.md) for the exact record and final follow-up status.

The final focused release follow-up passed 67 tests in nine files; the key-manager
timeout did not recur. Strict lint and local release preflight passed again.
Four resource guard suites remain under review; no clean full unit run is claimed.
Google requires accepted terms, content/user reporting, appropriate blocking and
ongoing moderation for UGC. This applies to sharing with a subset of users too.
[Official UGC policy](https://support.google.com/googleplay/android-developer/answer/9876937?hl=en).

## Owner information required

| Field | Enter / confirm |
| --- | --- |
| Existing Play Console app | App for package `space.praystead.twa` |
| Developer legal identity and verification | OWNER REQUIRED; complete account and Android developer verification tasks shown in Console |
| Account type and creation date | Personal or organization; OWNER REQUIRED |
| Production access | Already granted, or required closed-test application; OWNER REQUIRED |
| Public support email | Existing legal contact is `arthur.meteng@gmail.com`; owner must confirm it is monitored |
| Website | `https://qetoret.com` after live checks |
| Support phone/address/trader status | Actual owner details where Console requires them; never invent |
| Default language | Suggested English (United States); French listing provided |
| Countries and rollout percentage | OWNER REQUIRED |
| Target audience | OWNER REQUIRED; current terms say minimum age 13, which is not by itself an audience selection |
| Moderation/safeguarding contact | OWNER REQUIRED |
| AI hosting operator, recipients and retention | OWNER REQUIRED; gateway implementation is not in this repository |

For a personal developer account created after **13 November 2023**, production
access requires at least **12 testers opted in continuously for 14 days**, followed
by an application. A completed internal test does not meet that gate. Record real
engagement, feedback and fixes. [Official testing requirements](https://support.google.com/googleplay/android-developer/answer/14151465?hl=en).

## Prepare and upload

1. Complete additive database migrations and edge-function deployments required by
   the selected web release; see `docs/MIGRATIONS.md` and `docs/OPERATIONS.md`.
   Record exact versions and perform a synthetic account/group/deletion smoke test.
   This release includes `20261008151537_feedback_report_ownership.sql`, already applied before the
   reporter-enabled client. Production has 20 migrations; policy/grants verified.
   The isolated local gate passed all 138 pgTAP assertions, including 15 feedback
   assertions. Live synthetic-account mutation and erasure checks remain open.
   Retain the apply/verification record; see
   [database-verification.md](database-verification.md).
2. Deploy and verify the web release and legal URLs on `qetoret.com`. Finish DNS,
   auth callbacks, recovery and Digital Asset Links first.
3. Build the wrapper, sign using the existing upload key, verify the signature
   and inspect the actual bundle metadata. Keep a SHA-256 of the final upload.
   New submissions/updates currently require **API 36** for this phone app.
   [Official target API requirement](https://support.google.com/googleplay/android-developer/answer/11926878?hl=en).
4. Upload to internal testing and install **from Play** on a fresh test device.
   Fix build warnings and pre-launch issues; test TWA trust, notifications,
   edge-to-edge layout and the full release gate above.
5. Complete the main listing with the plain-text listing copy and reviewed final artwork.
   Use `Qetoret` for the store title and launcher label. Suggested category:
   Lifestyle. Set free distribution if that is the owner's chosen model.
6. App content: provide the privacy/deletion URLs; restricted app-access
   instructions; accurate Data safety; IARC content rating; audience; ads,
   financial/health/news and other declarations Console requests. Do not choose
   blanket "No" answers based on an old runbook. Read each current question.
7. Declare **user interaction and user-generated content** in IARC. Review the
   actual authored library and optional AI output, including sensitive pastoral
   themes, rather than assuming the lowest rating. IARC assigns the rating.
8. If treated as a social app, complete the child-safety standards declaration:
   published CSAE prohibition, reporting/takedown handling and a designated point
   of contact. A Lifestyle category does not settle policy applicability. Confirm
   with the actual Console declaration. [Child safety guidance](https://support.google.com/googleplay/android-developer/answer/14747720?hl=en).
9. Resolve external donation-link eligibility before enabling it. Do not infer
   that every voluntary tip is a tax-exempt donation or an exemption from Play
   Billing. Verify the real `VITE_DONATION_URL` and current Payments policy; remove
   any placeholder. No paid feature/subscription is currently described in the
   supplied listing. [Payments policy](https://support.google.com/googleplay/android-developer/answer/9858738?hl=en).
10. Run any required closed test, apply for production access, resolve policy
    feedback, then submit the signed release with the localized release notes.
    Keep managed publishing on if the owner wants control of the launch time.

## Listing assets

- [x] Local app icon: 512 × 512, 32-bit RGBA PNG with alpha, 21,894 bytes;
  generator and preflight enforce the format. Console upload remains pending.
- [ ] Feature graphic: 1024 × 500 JPEG or 24-bit PNG without alpha.
- [ ] At least 2 phone screenshots, up to 8 for the phone listing; JPEG or
  24-bit PNG without alpha, 320–3840 px per side, longest side at most twice the
  shortest. Use current app UI, synthetic content and consistent localization.
- [ ] For fuller presentation, capture Today, private journal/detail, guided
  prayer plans, together/group sharing, and privacy/settings after gates pass.
  Avoid showing secrets, real prayers, misleading guarantees or incomplete UI.
- [ ] Inspect every screenshot against the installed release. Local preview
  captures are useful drafts; they do not prove Android/TWA behavior.
- [ ] Review the AI-label declaration for each submitted visual asset according
  to how it was created. Do not mark a screenshot as an actual device capture
  unless it was captured that way.

[Official asset specifications](https://support.google.com/googleplay/android-developer/answer/9866151?hl=en),
[AI asset declaration](https://support.google.com/googleplay/android-developer/answer/17262077?hl=en).

## Final go / no-go record

| Gate | Evidence | Owner / date |
| --- | --- | --- |
| Human content and source release-material approval | APPROVED from explicit user instruction; closed records and history preserved | Paul / 2026-10-08 |
| Final signed AAB + package/version/SDK | VERIFIED LOCALLY; Console version history/signing association pending | |
| Full unit follow-up / resource content guard failures | OPEN; see validation.md | |
| Isolated ownership migration and database tests | PASS: 20 migrations, 8 files / 138 assertions; local advisor error gate passed | |
| Production ownership migration and smoke test | APPLIED `20261008151537`; policy/grants verified; live account smoke pending | |
| Live site, auth and old-origin recovery | PENDING | |
| Play-installed trust + Android 15/16 layout | PENDING | |
| Privacy/deletion/Data safety | PENDING | |
| Terms, UGC moderation and AI reporting | PENDING | |
| Reviewer credentials and new-device vault | PENDING | |
| Listing copy + actual installed screenshots | Current local copy/artwork APPROVED; installed comparison pending | Paul / 2026-10-08 |
| Pre-launch report and required closed test | PENDING | |
| Production approval and rollout choice | Human approval recorded; unresolved technical gates and actual rollout choice remain | Paul / 2026-10-08 |
