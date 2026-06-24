-- ════════════════════════════════════════════════════════════════════════
-- Offline support: let sync_add_update / sync_add_point accept a CLIENT-supplied
-- id so an optimistic local row keeps the same id as the eventual server row
-- (no duplicates after refetch), and make all sync_* writes idempotent so a
-- replayed mutation can't double-apply. Run in the Supabase SQL editor.
-- ════════════════════════════════════════════════════════════════════════

-- Drop the previous (no p_id) overloads first — otherwise two functions share a
-- name and PostgREST RPC calls fail with PGRST203 ("could not choose candidate").
drop function if exists sync_add_update(uuid, text, text, boolean);
drop function if exists sync_add_point(uuid, text, jsonb);

-- Member update / prayer "word": id supplied by the client; community fan-out
-- rows get a deterministic id so replay is a no-op.
create or replace function sync_add_update(p_id uuid, p_source uuid, p_text text, p_author text, p_anon boolean)
returns prayer_updates language plpgsql security definer as $$
declare new_row prayer_updates;
begin
  if not can_sync_prayer(p_source) then raise exception 'not allowed to update this prayer'; end if;

  insert into prayer_updates (id, prayer_id, text, author_name, is_anonymous)
  values (p_id, p_source, p_text, p_author, p_anon)
  on conflict (id) do nothing;
  select * into new_row from prayer_updates where id = p_id;

  insert into community_updates (id, community_prayer_id, user_id, author_name, text, is_anonymous)
  select md5(p_id::text || cp.id::text)::uuid, cp.id, auth.uid(), p_author, p_text, p_anon
  from community_prayers cp where cp.source_prayer_id = p_source
  on conflict (id) do nothing;

  return new_row;
end;
$$;

-- Prayer point: id supplied by the client; community array append is guarded so
-- a replay doesn't add the point twice.
create or replace function sync_add_point(p_id uuid, p_source uuid, p_title text, p_verses jsonb)
returns prayer_points language plpgsql security definer as $$
declare new_row prayer_points; point_json jsonb;
begin
  if not can_sync_prayer(p_source) then raise exception 'not allowed to update this prayer'; end if;

  insert into prayer_points (id, prayer_id, title, verses)
  values (p_id, p_source, p_title, coalesce(p_verses, '[]'::jsonb))
  on conflict (id) do nothing;
  select * into new_row from prayer_points where id = p_id;

  point_json := jsonb_build_object('id', p_id, 'title', p_title, 'verses', coalesce(p_verses, '[]'::jsonb));
  update community_prayers
  set prayer_points = array_append(prayer_points, point_json)
  where source_prayer_id = p_source
    and not exists (select 1 from unnest(prayer_points) e where e->>'id' = p_id::text);

  return new_row;
end;
$$;

-- Add verse: guard against appending a duplicate ref (idempotent on replay).
create or replace function sync_add_verse(p_source uuid, p_point_id uuid, p_verse jsonb)
returns void language plpgsql security definer as $$
begin
  if not can_sync_prayer(p_source) then raise exception 'not allowed to update this prayer'; end if;

  update prayer_points
  set verses = coalesce(verses, '[]'::jsonb) || jsonb_build_array(p_verse)
  where id = p_point_id and prayer_id = p_source
    and not exists (select 1 from jsonb_array_elements(coalesce(verses, '[]'::jsonb)) v where v->>'ref' = p_verse->>'ref');

  update community_prayers
  set prayer_points = (
    select coalesce(array_agg(
      case when elem->>'id' = p_point_id::text
        and not exists (select 1 from jsonb_array_elements(coalesce(elem->'verses', '[]'::jsonb)) v where v->>'ref' = p_verse->>'ref')
        then jsonb_set(elem, '{verses}', coalesce(elem->'verses', '[]'::jsonb) || jsonb_build_array(p_verse))
        else elem end
    ), '{}')
    from unnest(prayer_points) elem
  )
  where source_prayer_id = p_source;
end;
$$;

-- (sync_remove_point and sync_remove_verse are already idempotent — deleting an
--  absent row / filtering an absent ref is a no-op — so they're unchanged.)
