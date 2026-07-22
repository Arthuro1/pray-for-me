-- ════════════════════════════════════════════════════════════════════════
-- Author edit of a personal update's TEXT, kept consistent with its fanned-out
-- community mirrors — the write-side twin of sync_remove_update_text() in
-- attachment_management.sql. Personal testimonies never fan out (edited with a
-- direct table write), and E2EE personal updates carry their text inside
-- encrypted_payload (re-encrypted client-side), so only PLAINTEXT updates need
-- this RPC.
--
-- Run in the Supabase SQL editor. Idempotent — safe to re-run.
-- ════════════════════════════════════════════════════════════════════════

create or replace function sync_set_update_text(p_update_id uuid, p_text text)
returns void language plpgsql security definer as $$
declare v_prayer uuid;
begin
  select prayer_id into v_prayer from prayer_updates where id = p_update_id;
  if v_prayer is null then return; end if;
  -- Author-only: the update must belong to a prayer this user owns.
  if not exists (select 1 from prayers where id = v_prayer and user_id = auth.uid()) then
    raise exception 'not allowed to edit this update';
  end if;

  update prayer_updates set text = p_text where id = p_update_id;

  -- sync_add_update copies plaintext updates into community_updates under
  -- md5(update_id || community_prayer_id) ids — keep those mirrors in step.
  update community_updates cu set text = p_text
   where cu.id in (
     select md5(p_update_id::text || cp.id::text)::uuid
     from community_prayers cp where cp.source_prayer_id = v_prayer
   );
end;
$$;
