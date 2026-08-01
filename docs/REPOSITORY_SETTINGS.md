# Manual repository and deployment controls

These controls cannot be truthfully enforced by committed files alone. A GitHub
or deployment administrator must apply and periodically audit them.

## GitHub

- [ ] Protect `main`; disallow direct pushes, force pushes, and branch deletion.
- [ ] Require pull requests, at least one independent approval, conversation
  resolution, and CODEOWNER review for owned paths.
- [ ] Dismiss stale approvals when new commits touch crypto, auth, RLS,
  migrations, service workers, API, or deployment configuration.
- [ ] Require both `CI / application` and `CI / database` checks and require the
  branch to be current before merge.
- [ ] Enable secret scanning, push protection, dependency graph, Dependabot
  alerts/updates, and CodeQL (JavaScript/TypeScript).
- [ ] Restrict Actions to trusted publishers and pin third-party actions by full
  commit SHA through a reviewed maintenance PR.
- [ ] Restrict repository/environment secrets and review access quarterly.
- [ ] Use signed, immutable release tags and update `CHANGELOG.md` per release.

## Production environment

- [ ] Require a named approver for the production Vercel environment and
  Supabase migration job; staging deploys automatically, production does not.
- [ ] Separate staging/production projects, keys, quotas, VAPID identities, and
  test accounts. Never restore production data to developer environments.
- [ ] Enable Supabase PITR/backups, audit access, set Auth redirect allow-lists,
  review Data API grants/RLS, and alert on Edge/cron failures.
- [ ] Configure AI daily/global budgets and an owner who can activate
  `AI_PROXY_DISABLED`.
- [ ] Run and record a restore exercise quarterly and an incident tabletop twice
  per year.
