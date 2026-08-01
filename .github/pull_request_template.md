## Summary

Describe the user-visible behavior and why this change is needed.

## Verification

- [ ] `npm run lint:strict`
- [ ] `npm run typecheck`
- [ ] `npm test`
- [ ] `npm run test:browser`
- [ ] `npm run build`
- [ ] Database reset/pgTAP run when schema, RLS, grants, or RPCs changed

## Security and privacy

- [ ] No prayer plaintext, prompts, tokens, keys, emails, invite codes, or
  attachment names were added to logs, analytics, caches, or push payloads.
- [ ] Auth/RLS/authorization and cross-account behavior were tested if relevant.
- [ ] Crypto changes are versioned, backward-compatible, context-bound, and do
  not rewrite data before verified decrypt.
- [ ] Service-worker/offline changes preserve account isolation.
- [ ] New data collection/sharing, subprocessors, or retention is documented.
- [ ] Migration order, compatibility, rollback, and destructive steps are stated.

## Release notes

Database-before-client steps, Edge/API deploys, feature flags, monitoring,
rollback target, and manual settings changes:
