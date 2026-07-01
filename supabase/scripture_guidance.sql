-- ════════════════════════════════════════════════════════════════════════
-- Persist ScriptureFirstStep's AI guidance on the prayer itself, so it can be
-- recalled later without firing a new AI request. Idempotent and
-- NON-BREAKING — nullable column, matches supabase/e2ee_migration.sql.
--
-- For a PRIVATE (vault-unlocked) prayer, this column is redacted to null and
-- the guidance instead travels inside the prayer's existing encrypted_payload
-- alongside title/description (see SENSITIVE_JSON_FIELDS in
-- src/lib/crypto/prayerCrypto.js). Shared / legacy / no-vault prayers store
-- the guidance object here in plaintext, exactly like title/description do.
-- ════════════════════════════════════════════════════════════════════════

alter table prayers add column if not exists scripture_guidance jsonb;
