-- The local church anchor and the Sunday preparation reminder.
--
-- private_payload holds account-level preferences that are personal enough to
-- stay end-to-end encrypted (today: the name of the user's church and small
-- group). The client encrypts it under the account key before writing; the
-- server only ever stores ciphertext and never reads it.
--
-- sunday_prep_enabled is a plain opt-in read by send-daily-reminder: on a
-- Sunday, an account that turned it on gets the "prepare your heart for
-- worship" wording instead of the usual daily reminder. Off by default.
--
-- Both columns are additive and nullable/defaulted, so existing rows and older
-- clients are unaffected. The table's "own settings" RLS policy already
-- restricts every row to its owner.
alter table public.user_settings add column if not exists private_payload jsonb;
alter table public.user_settings add column if not exists sunday_prep_enabled boolean not null default false;

comment on column public.user_settings.private_payload is
  'Client-side encrypted account preferences (AES-GCM, account key). Ciphertext only.';
comment on column public.user_settings.sunday_prep_enabled is
  'Opt-in: the Sunday daily reminder uses the worship-preparation wording.';
