# Production-readiness implementation plan

Verified 2026-07-31 against `main` before changes.

1. Remove authenticated Supabase Workbox caching, purge legacy caches on upgrade
   and sign-out, and add account-isolation browser coverage.
2. Correct recovery entropy/encoding with versioned compatibility and document
   the real IndexedDB, session, sign-out, and lock behavior.
3. Introduce version 2 AES-GCM context binding across every encrypted entity,
   retain v1 reads, and rewrite only after successful decrypt.
4. Move group-key creation/removal/rotation into retry-safe transactions with
   concurrency, failure, orphan detection, and repair tests.
5. Enforce strict lint/typecheck/browser/build gates and rebuild Supabase from
   ordered CLI migrations with pgTAP assertions.
6. Replace the open AI relay with structured server tasks and atomic quotas.
7. Add enforceable community reporting, blocking, sharing warnings, and spam
   limits, then complete governance, deployment, rollback, backup, and incident
   procedures.

Items 1–7 are implemented in this change set. Verification results and residual
work are tracked in [SECURITY_REVIEW.md](./SECURITY_REVIEW.md).
