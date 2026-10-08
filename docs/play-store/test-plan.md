# Installed-release acceptance plan

Prepared **8 October 2026**. Record PASS/FAIL, device/Android/Chrome versions,
source commit, web deployment ID, AAB SHA-256, track, tester and date. Everything
below is **unverified until executed**. Use synthetic accounts and content only.

## Minimum device matrix

| Device | What it resolves |
| --- | --- |
| Physical Android 16 / API 36 with current stable Chrome | Target-SDK behavior, status/navigation bars, edge-to-edge, back navigation, splash, keyboard, trust and push |
| Physical Android 15 / API 35 | Previous major OS, notification permission flow and upgrade |
| Older supported Android device with an available compatible browser | Actual support boundary, performance, crypto/storage/media limitations |
| Fresh browser profile and second device | New-origin sign-in, recovery, review access and group-key distribution |
| Existing Play installation upgraded in place | Stable package/signing, new domain launch and recovery for existing users |

`minSdk 21` is the wrapper's installation floor, not proof that every modern web
feature works on Android 5. Test the actual browser/runtime combination and
document any support adjustment before publishing.

## App and migration checks

- [ ] Install from the internal Play track. Verify launcher says Qetoret and the
  app launches `https://qetoret.com/`. With validated Digital Asset Links, no
  unexpected browser address bar appears. External links open appropriately.
- [ ] Verify the Play-installed package/version/target against the release record.
  Test cold start, background/resume, process death, offline launch and app update.
- [ ] On Android 15/16 inspect safe areas, system bars, splash, keyboard, modal
  focus/scroll, system Back and predictive Back. Test large fonts, TalkBack, dark
  mode, small screen and at least one RTL locale.
- [ ] Old-origin user: synchronize pending changes, establish vault recovery,
  then move to the new origin. Private content and group keys remain readable.
  No silent replacement encryption key is minted for existing ciphertext.
- [ ] Recover an old-origin guest draft/export before moving. Verify drafts,
  settings, mutation queues and notification permission do not silently appear
  migrated when they were origin-local.
- [ ] Sign-up/confirmation, email/password, Google sign-in, magic link, reset and
  resend work on the new origin and preserve invite/shared-plan destinations.
- [ ] Guest first prayer stays on device. Saving after sign-in imports it once
  through encryption. Switching accounts does not expose cached content.
- [ ] Create/edit/delete a private prayer, rhythm, follow-up, note, voice recording,
  image/audio/video attachment; reopen after restart and offline sync. Inspect
  queued writes for successful recovery and clear failures.
- [ ] Start and complete a guided plan/day. Check scripture display, language,
  calendar/export/share behavior and legacy route redirects.
- [ ] Create/join a synthetic group, share a prayer, post updates/testimony, carry
  a prayer and remove a member. Future content uses the rotated group key.

## Privacy, safety and deletion checks

- [ ] Accept terms before first UGC contribution on every auth and posting route.
  Terms and privacy links are readable from the app.
- [ ] Report each shared type and author; an authorized moderator can find the
  report, act and close it. Unprivileged/non-member accounts cannot review it.
- [ ] Block an author of a prayer, update and testimony. Confirm already loaded
  content, refreshed pages and later updates respect the block. Test friend/group
  interaction and an accessible way to manage the block.
- [ ] With AI consent off, no private content goes to AI. With consent on, the
  outgoing preview matches the selected input. Withdrawal takes effect; quota,
  unavailable gateway and disabled-proxy errors stay usable. Test reporting a
  synthetic objectionable generated result and its moderation response.
- [ ] Inspect actual network requests to Vercel, Supabase, the gateway and enabled
  scripture services. No prayer text, raw key, auth token, invitation code, full
  sensitive URL or third-party personal information enters analytics/logs.
- [ ] Notification permission decline is respected. Enable new-origin reminders,
  receive generic notifications, open the intended screen, disable them and
  remove an old-origin subscription without duplicate reminders.
- [ ] Delete a disposable populated account via Settings. Confirm auth/profile,
  private/shared data, memberships, notification subscriptions and owned storage
  are removed or handled under the documented retention exception. Drain
  `avatar_cleanup_queue` through a Storage API workflow and verify orphaned
  encrypted attachments are reclaimed. Test a storage failure too.
- [ ] Open `https://qetoret.com/delete-account.html` while logged out with the app
  uninstalled. Send a synthetic request through the documented email route and
  verify the identity check, response, erasure tracking and completion workflow.
- [ ] Confirm the live privacy policy and Data safety describe the observed network
  and retention behavior. Check deletion results on a second device and provider
  logs/backups without claiming removal of copies other recipients already kept.

## Play checks and evidence

- [ ] Run Play's pre-launch report; triage crashes, accessibility, compatibility,
  security and screenshots. Document any false positives with reproduction data.
- [ ] Capture final phone screenshots from the installed app using synthetic data.
  Verify EN/FR copy lengths, artwork dimensions and AI asset-label choices.
- [ ] Review every Console app-content declaration and reviewer credential on a
  completely fresh device immediately before submission.
- [ ] If the account requires a closed test, retain at least 12 continuously
  opted-in testers for 14 days, collect real usage feedback, fix issues and apply
  for production access. Track opt-ins and dropouts; elapsed time alone is not a
  passed production gate. [Official closed-test requirements](https://support.google.com/googleplay/android-developer/answer/14151465?hl=en).

Suggested closed-test cadence: start with installation/auth/recovery, exercise
journal/plans/offline during the first week, test community/media/push/safety in
the second week, then retest fixes and prepare the production-access answers.
Record actual testing and feedback; do not invent usage or survey results.

## Evidence record

| Check / defect | Result | Device / versions | Tester / date | Evidence or fix |
| --- | --- | --- | --- | --- |
| | NOT RUN | | | |

Production rollout requires all material failures fixed and the owner to approve
the actual evidence. Recheck the same flow after each live web change, because
the wrapper always loads that deployment.
