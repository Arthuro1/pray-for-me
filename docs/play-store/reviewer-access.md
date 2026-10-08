# App access for Google Play review

Prepared **8 October 2026**. Select the Console option that indicates **some or all
functionality is restricted**: a guest can begin a prayer, but account journal,
groups, invitations and other features require sign-in. Do not select unrestricted
access merely because the landing page works without an account.

Google needs reusable access from a fresh device, without depending on a private
mailbox, location, expiring OTP or the developer responding during review.
[Official reviewer credential guidance](https://support.google.com/googleplay/android-developer/answer/15748846?hl=en).

## Prepare a disposable account

1. Create a dedicated email/password review account and confirm its email before
   submission. Use synthetic information. Do not reuse a personal or tutorial/demo
   account. Do not add payment, moderation-administrator or service-role access.
2. On the app's actual production origin, add one synthetic private prayer, an
   update, a small media attachment, an answered prayer and a guided plan. Add
   the account to a synthetic group containing another synthetic member and a
   shared request so group report/block actions can be reviewed. Never seed real
   group conversations.
3. Configure the optional vault recovery/passphrase on this disposable account.
   Confirm the wrapped recovery record has synced to the server. Sign in and
   unlock on a **different browser profile/device with empty local storage**.
   A password alone does not recover client-side prayer encryption keys.
4. Verify all seeded content decrypts and group membership works on that new
   device. If prompted about an unavailable account key, repair the reviewer
   setup from its original device; do not instruct reviewers to start fresh and
   orphan the seeded data.
5. Enter the sign-in and vault-unlock details **only in Play Console App access**
   or the owner's credential manager. This repository deliberately contains no
   fabricated review credentials or vault secret.
6. Keep the account, recovery mechanism and gateway allowance working throughout
   review and later updates. Check credentials before each submission. Use a
   separate disposable account for destructive account-deletion testing.

## Copy into App access after filling the private fields

Instruction name: `Qetoret full review access`

Username/email: **OWNER MUST ENTER THE VERIFIED REVIEW ACCOUNT**

Password: **OWNER MUST ENTER THE WORKING PASSWORD**

Additional instructions:

```text
Qetoret is a prayer journal and guided-prayer app at https://qetoret.com.
The landing page's "Begin with a prayer" works without an account. To review
account and community features, choose "Sign in", select email/password and use
the credentials supplied in the App access fields. Do not choose Google sign-in
or an email magic link for this review account.

If the app shows the vault-unlock screen on your fresh device, use the dedicated
review vault passphrase provided below. The account's prayer content is encrypted,
so this step is required separately from the sign-in password.

On first account access, read the Terms of Use, tick the acceptance checkbox and
choose "Continue to Qetoret". This applies to existing and newly created accounts.

Review vault passphrase: [OWNER ENTERS SECRET IN CONSOLE ONLY]

After sign-in, Today shows scheduled synthetic prayers. Journal contains a
synthetic private prayer, an update and an answered prayer. Prayer plans can be
opened from the app navigation. Together contains the synthetic review group;
open its shared prayer and use its menu to review sharing/safety actions.

Settings contains language and Privacy & Security controls. Account deletion is
under Privacy & Security → Danger zone → Delete my account.
Account deletion permanently removes this account; please use the dedicated
deletion-test credentials below for that destructive test.

Deletion-test account and its vault instructions:
[OWNER ENTERS SEPARATE VERIFIED CREDENTIALS IN CONSOLE ONLY]

No subscription or payment is required. Optional AI assistance requires its
in-app consent; the review account has the normal permitted quota. Support:
[OWNER CONFIRMS MONITORED CONTACT]
```

Update menu labels and the seeded-content directions after testing the final
installed build. Remove any sentence that is untrue for the actual release.
Do not submit this template with placeholders remaining.
