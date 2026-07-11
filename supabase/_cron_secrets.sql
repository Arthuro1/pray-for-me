-- ════════════════════════════════════════════════════════════════════════
-- pg_cron → Edge Function credentials, stored ONCE in Supabase Vault.
--
-- WHY THIS FILE EXISTS: every scheduled job (send-daily-reminder,
-- send-follow-up-reminder, retry-/digest-event-notifications) needs the
-- project URL + a bearer to call its Edge Function. Previously each cron body
-- carried its own <PROJECT_REF>/<SERVICE_ROLE_KEY> placeholders, so a single
-- forgotten substitution scheduled a job that POSTs to
-- `https://<PROJECT_REF>.supabase.co/...` — which never resolves, and pg_net
-- swallows the error, so the job looks "successful" while delivering nothing.
--
-- Now the values live in Vault under two fixed names, and the cron bodies read
-- them at run time (see the *_reminders.sql / notifications.sql files). Nothing
-- secret is stored in cron.job.command, and the placeholders exist in exactly
-- ONE place: the two lines below.
--
-- BEARER = NOTIFY_FN_SECRET, not the service-role key. send-event-notifications
-- accepts either the injected SUPABASE_SERVICE_ROLE_KEY OR a dedicated
-- NOTIFY_FN_SECRET as its bearer; the two reminder functions check no bearer at
-- all. So the crons send NOTIFY_FN_SECRET — a purpose-scoped secret with a far
-- smaller blast radius than the full-DB service-role key, and it sidesteps the
-- service-role-string mismatch that returns 401. It MUST equal the value you set
-- with:  supabase secrets set NOTIFY_FN_SECRET=<value>
--
-- RUN THIS ONCE per project (safe to re-run — it updates in place). Edit the
-- two values at the top, then execute in the Supabase SQL editor.
-- ════════════════════════════════════════════════════════════════════════

create extension if not exists supabase_vault;

do $$
declare
  v_ref    text := '<PROJECT_REF>';         -- ← your project ref only, e.g. abcd1234efgh (NOT the full URL)
  v_secret text := '<NOTIFY_FN_SECRET>';    -- ← MUST match `supabase secrets set NOTIFY_FN_SECRET=...`
  v_id     uuid;
begin
  -- Hard-fail if the placeholders were left in place, instead of silently
  -- storing a broken value (the exact trap this file replaces).
  if v_ref like '%<PROJECT_REF>%' or v_secret like '%<NOTIFY_FN_SECRET>%' then
    raise exception 'Edit _cron_secrets.sql: replace <PROJECT_REF> and <NOTIFY_FN_SECRET> at the top before running.';
  end if;

  -- project_url — full base URL the cron bodies concatenate the function path onto.
  select id into v_id from vault.secrets where name = 'project_url';
  if v_id is null then
    perform vault.create_secret('https://' || v_ref || '.supabase.co', 'project_url',
      'Base URL for pg_cron → Edge Function HTTP calls');
  else
    perform vault.update_secret(v_id, 'https://' || v_ref || '.supabase.co', 'project_url');
  end if;

  -- notify_fn_secret — the bearer the cron bodies send. Must equal the function's
  -- NOTIFY_FN_SECRET env var so send-event-notifications' auth gate accepts it.
  select id into v_id from vault.secrets where name = 'notify_fn_secret';
  if v_id is null then
    perform vault.create_secret(v_secret, 'notify_fn_secret',
      'Bearer for pg_cron → Edge Function calls (== NOTIFY_FN_SECRET env)');
  else
    perform vault.update_secret(v_id, v_secret, 'notify_fn_secret');
  end if;
end $$;

-- Verify (names only — never select decrypted_secret into logs/output you keep):
--   select name, description, updated_at from vault.secrets order by name;
