-- ════════════════════════════════════════════════════════════════════════
-- Attachment management: let an author delete a single media attachment from
-- an already-posted update or testimony.
--
-- Run in the Supabase SQL editor. Idempotent — safe to re-run.
--
-- Design:
--   • community_updates / testimonies previously had NO UPDATE policy, so an
--     author could not shrink their row's attachments list. Authors (and only
--     authors — admins moderate by deleting the whole word, and could not
--     re-encrypt someone else's E2EE payload anyway) may now UPDATE their own
--     rows; the client re-encrypts the payload under the group key and
--     rewrites the row.
--   • sync_remove_update_attachment() removes one attachment (matched by its
--     json id) from a PLAINTEXT personal update AND from that update's
--     fanned-out community mirrors (sync_add_update copies plaintext updates
--     into community_updates under md5(update_id || community_prayer_id)
--     ids). E2EE personal updates never fan out and keep their metadata in
--     encrypted_payload, so the client updates those rows directly instead.
-- ════════════════════════════════════════════════════════════════════════

-- ── 1. Authors can edit their own community rows ──────────────────────────
drop policy if exists "Authors can update their updates" on community_updates;
create policy "Authors can update their updates" on community_updates
  for update using (user_id = auth.uid()) with check (user_id = auth.uid());

drop policy if exists "Authors can update their testimonies" on testimonies;
create policy "Authors can update their testimonies" on testimonies
  for update using (user_id = auth.uid()) with check (user_id = auth.uid());

-- ── 2. Remove one attachment from a personal update + its mirrors ─────────
create or replace function sync_remove_update_attachment(p_update_id uuid, p_att_id text)
returns void language plpgsql security definer as $$
declare v_prayer uuid;
begin
  select prayer_id into v_prayer from prayer_updates where id = p_update_id;
  if v_prayer is null then return; end if;
  if not exists (select 1 from prayers where id = v_prayer and user_id = auth.uid()) then
    raise exception 'not allowed to edit this update';
  end if;

  update prayer_updates
     set attachments = coalesce(
       (select jsonb_agg(a) from jsonb_array_elements(attachments) a where a->>'id' <> p_att_id),
       '[]'::jsonb)
   where id = p_update_id;

  update community_updates cu
     set attachments = coalesce(
       (select jsonb_agg(a) from jsonb_array_elements(cu.attachments) a where a->>'id' <> p_att_id),
       '[]'::jsonb)
   where cu.id in (
     select md5(p_update_id::text || cp.id::text)::uuid
     from community_prayers cp where cp.source_prayer_id = v_prayer
   );
end;
$$;
