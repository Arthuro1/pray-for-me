# Deployment

The former hand-ordered SQL checklist is retired. Timestamped files under
`supabase/migrations/` are the database source of truth.

- New and existing database procedure: [MIGRATIONS.md](./MIGRATIONS.md)
- Release, rollback, backups, monitoring, and incidents: [OPERATIONS.md](./OPERATIONS.md)
- Required GitHub/Vercel/Supabase controls: [REPOSITORY_SETTINGS.md](./REPOSITORY_SETTINGS.md)
- Android / Google Play release: [PLAY_STORE_RELEASE.md](./PLAY_STORE_RELEASE.md)

Never deploy a client that writes a new database shape before its additive
migration is applied and verified. Never run the legacy baseline against an
existing production database.
