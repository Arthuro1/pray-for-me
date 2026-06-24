-- ════════════════════════════════════════════════════════════════════════
-- Conflict hardening: mark-answered now APPENDS the testimony server-side
-- (idempotent by testimony id) instead of overwriting the whole testimonies
-- array — so a concurrent testimony from another device can't be lost.
-- Run in the Supabase SQL editor.
-- ════════════════════════════════════════════════════════════════════════
create or replace function answer_prayer(
  p_prayer uuid,
  p_status text,
  p_answered_at timestamptz,
  p_testimony_id uuid,
  p_content text,
  p_created_at timestamptz
)
returns void language plpgsql security definer as $$
begin
  if not exists (select 1 from prayers where id = p_prayer and user_id = auth.uid()) then
    raise exception 'not allowed to update this prayer';
  end if;

  update prayers set status = p_status, answered_at = p_answered_at where id = p_prayer;

  -- Append the testimony only if one with this id isn't already present (idempotent replay).
  if p_testimony_id is not null
     and not exists (
       select 1 from prayers p, unnest(coalesce(p.testimonies, '{}')) t
       where p.id = p_prayer and t->>'id' = p_testimony_id::text
     ) then
    update prayers
    set testimonies = array_append(
      coalesce(testimonies, '{}'),
      jsonb_build_object('id', p_testimony_id, 'content', p_content, 'created_at', p_created_at)
    )
    where id = p_prayer;
  end if;

  -- Mirror answered status onto any shared community copies.
  update community_prayers set is_answered = (p_status = 'answered') where source_prayer_id = p_prayer;
end;
$$;
