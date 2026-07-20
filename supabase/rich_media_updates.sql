-- ════════════════════════════════════════════════════════════════════════
-- Rich updates & testimonies: media attachments (photos / audio / video) and
-- links on personal + community updates and testimonies.
--
-- Run in the Supabase SQL editor. Idempotent — safe to re-run.
--
-- Design:
--   • Each update/testimony row gains an `attachments jsonb` column holding an
--     array of { id, type, path, mime, name, size, key, iv } (media) or
--     { id, type: 'link', url } (links).
--   • Media blobs live in a PRIVATE `attachments` storage bucket, ALWAYS
--     encrypted client-side with a per-file AES-GCM key before upload — the
--     bucket never stores readable media, so members-wide read access leaks
--     nothing. The per-file key travels in the row's attachment metadata,
--     which is E2E-encrypted (account key / group key) whenever the row is;
--     for legacy plaintext rows it is protected by the same RLS as the text.
--   • For E2EE rows the `attachments` column itself is redacted to '[]' (the
--     real metadata lives inside encrypted_payload), mirroring text/content.
-- ════════════════════════════════════════════════════════════════════════

-- ── 1. attachments column on every update/testimony table ─────────────────
alter table prayer_updates      add column if not exists attachments jsonb not null default '[]'::jsonb;
alter table prayer_testimonies  add column if not exists attachments jsonb not null default '[]'::jsonb;
alter table community_updates   add column if not exists attachments jsonb not null default '[]'::jsonb;
alter table testimonies         add column if not exists attachments jsonb not null default '[]'::jsonb;

-- ── 2. sync_add_update learns attachments ─────────────────────────────────
-- Drop the old 5-arg overload FIRST: create-or-replace with a new defaulted
-- arg would otherwise leave two candidates and break PostgREST RPC resolution
-- with PGRST203 (same trap fix_sync_overloads.sql cleaned up before).
drop function if exists sync_add_update(uuid, uuid, text, text, boolean);

create or replace function sync_add_update(
  p_id uuid,
  p_source uuid,
  p_text text,
  p_author text,
  p_anon boolean,
  p_attachments jsonb default '[]'::jsonb
)
returns prayer_updates language plpgsql security definer as $$
declare new_row prayer_updates;
begin
  if not can_sync_prayer(p_source) then raise exception 'not allowed to update this prayer'; end if;

  insert into prayer_updates (id, prayer_id, text, author_name, is_anonymous, attachments)
  values (p_id, p_source, p_text, p_author, p_anon, coalesce(p_attachments, '[]'::jsonb))
  on conflict (id) do nothing;
  select * into new_row from prayer_updates where id = p_id;

  insert into community_updates (id, community_prayer_id, user_id, author_name, text, is_anonymous, attachments)
  select md5(p_id::text || cp.id::text)::uuid, cp.id, auth.uid(), p_author, p_text, p_anon, coalesce(p_attachments, '[]'::jsonb)
  from community_prayers cp where cp.source_prayer_id = p_source
  on conflict (id) do nothing;

  return new_row;
end;
$$;

-- ── 3. Private storage bucket for encrypted media ─────────────────────────
insert into storage.buckets (id, name, public)
values ('attachments', 'attachments', false)
on conflict (id) do nothing;

-- Objects are keyed <user_id>/<attachment_id>: users write only into their own
-- folder; any authenticated user may READ (every object is client-side
-- ciphertext — without the per-file key from the owning row, a download is
-- noise); only the uploader may delete.
drop policy if exists "attachments_insert_own_folder" on storage.objects;
create policy "attachments_insert_own_folder" on storage.objects
  for insert to authenticated
  with check (bucket_id = 'attachments' and (storage.foldername(name))[1] = auth.uid()::text);

drop policy if exists "attachments_read_authenticated" on storage.objects;
create policy "attachments_read_authenticated" on storage.objects
  for select to authenticated
  using (bucket_id = 'attachments');

drop policy if exists "attachments_delete_own_folder" on storage.objects;
create policy "attachments_delete_own_folder" on storage.objects
  for delete to authenticated
  using (bucket_id = 'attachments' and (storage.foldername(name))[1] = auth.uid()::text);
