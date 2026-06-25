-- ════════════════════════════════════════════════════════════════════════
-- Fully shared prayers: a saved copy (prayers.community_origin_id) is now a
-- first-class participant. Edits to prayer points/verses from ANY participant
-- (author or a member's saved copy) fan out to the author's prayer and every
-- group copy. Run in the Supabase SQL editor.
--
-- Mechanism: the sync_* functions resolve the canonical "source" prayer from
-- whatever prayer id is passed (a member copy → its community prayer's source),
-- then fan out from there as before. Member copies don't store synced rows —
-- they MIRROR the community prayer's content (pulled client-side).
-- ════════════════════════════════════════════════════════════════════════

-- Opt-in flag: a saved copy only participates in full two-way sharing when the
-- owner turns on "Co-edit". Off (default) = read-only follow.
alter table prayers add column if not exists co_edit boolean default false;

-- Given any participant prayer id, return the canonical source prayer id:
-- a CO-EDITING saved copy resolves to its community prayer's source; anything
-- else (including a follow-only copy) is itself, so its edits stay local.
create or replace function resolve_source_prayer(p_prayer uuid)
returns uuid language sql security definer stable as $$
  select coalesce(
    (select cp.source_prayer_id
       from prayers pr
       join community_prayers cp on cp.id = pr.community_origin_id
      where pr.id = p_prayer and pr.co_edit = true and cp.source_prayer_id is not null
      limit 1),
    p_prayer
  );
$$;

-- Removing points/verses group-wide is limited to the source author or a group
-- admin — members can add but not delete shared content.
create or replace function can_remove_shared(p_source uuid)
returns boolean language sql security definer stable as $$
  select exists (select 1 from prayers where id = p_source and user_id = auth.uid())
      or exists (
        select 1 from community_prayers cp
        join group_members gm on gm.group_id = cp.group_id
        where cp.source_prayer_id = p_source and gm.user_id = auth.uid() and gm.role = 'admin'
      );
$$;

create or replace function sync_add_point(p_id uuid, p_source uuid, p_title text, p_verses jsonb)
returns prayer_points language plpgsql security definer as $$
declare v_source uuid := resolve_source_prayer(p_source); new_row prayer_points; point_json jsonb;
begin
  if not can_sync_prayer(v_source) then raise exception 'not allowed to update this prayer'; end if;
  insert into prayer_points (id, prayer_id, title, verses)
  values (p_id, v_source, p_title, coalesce(p_verses, '[]'::jsonb))
  on conflict (id) do nothing;
  select * into new_row from prayer_points where id = p_id;
  point_json := jsonb_build_object('id', p_id, 'title', p_title, 'verses', coalesce(p_verses, '[]'::jsonb));
  update community_prayers set prayer_points = array_append(prayer_points, point_json)
  where source_prayer_id = v_source
    and not exists (select 1 from unnest(prayer_points) e where e->>'id' = p_id::text);
  return new_row;
end;
$$;

create or replace function sync_remove_point(p_source uuid, p_point_id uuid)
returns void language plpgsql security definer as $$
declare v_source uuid := resolve_source_prayer(p_source);
begin
  if not can_remove_shared(v_source) then raise exception 'not allowed to remove from this prayer'; end if;
  delete from prayer_points where id = p_point_id and prayer_id = v_source;
  update community_prayers set prayer_points = (
    select coalesce(array_agg(elem), '{}') from unnest(prayer_points) elem where elem->>'id' <> p_point_id::text
  )
  where source_prayer_id = v_source;
end;
$$;

create or replace function sync_add_verse(p_source uuid, p_point_id uuid, p_verse jsonb)
returns void language plpgsql security definer as $$
declare v_source uuid := resolve_source_prayer(p_source);
begin
  if not can_sync_prayer(v_source) then raise exception 'not allowed to update this prayer'; end if;
  update prayer_points
  set verses = coalesce(verses, '[]'::jsonb) || jsonb_build_array(p_verse)
  where id = p_point_id and prayer_id = v_source
    and not exists (select 1 from jsonb_array_elements(coalesce(verses, '[]'::jsonb)) v where v->>'ref' = p_verse->>'ref');
  update community_prayers set prayer_points = (
    select coalesce(array_agg(
      case when elem->>'id' = p_point_id::text
        and not exists (select 1 from jsonb_array_elements(coalesce(elem->'verses', '[]'::jsonb)) v where v->>'ref' = p_verse->>'ref')
        then jsonb_set(elem, '{verses}', coalesce(elem->'verses', '[]'::jsonb) || jsonb_build_array(p_verse))
        else elem end
    ), '{}')
    from unnest(prayer_points) elem
  )
  where source_prayer_id = v_source;
end;
$$;

create or replace function sync_remove_verse(p_source uuid, p_point_id uuid, p_verse_ref text)
returns void language plpgsql security definer as $$
declare v_source uuid := resolve_source_prayer(p_source);
begin
  if not can_remove_shared(v_source) then raise exception 'not allowed to remove from this prayer'; end if;
  update prayer_points set verses = (
    select coalesce(jsonb_agg(v), '[]'::jsonb) from jsonb_array_elements(coalesce(verses, '[]'::jsonb)) v where v->>'ref' <> p_verse_ref
  )
  where id = p_point_id and prayer_id = v_source;
  update community_prayers set prayer_points = (
    select coalesce(array_agg(
      case when elem->>'id' = p_point_id::text
        then jsonb_set(elem, '{verses}', (
          select coalesce(jsonb_agg(v), '[]'::jsonb) from jsonb_array_elements(coalesce(elem->'verses', '[]'::jsonb)) v where v->>'ref' <> p_verse_ref
        ))
        else elem end
    ), '{}')
    from unnest(prayer_points) elem
  )
  where source_prayer_id = v_source;
end;
$$;
