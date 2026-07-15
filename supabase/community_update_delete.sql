-- Allow a member update ("word") on a community prayer to be deleted by its
-- author or by a group admin. Mirrors the community_prayers delete policy
-- ("Authors and admins can delete prayers"). Without this, community_updates
-- had SELECT + INSERT policies but no DELETE, so no one could remove a word.
-- get_my_admin_group_ids() is SECURITY DEFINER, so it doesn't recurse on RLS.
-- Run in the Supabase SQL editor.
drop policy if exists "Authors and admins can delete updates" on community_updates;
create policy "Authors and admins can delete updates" on community_updates
  for delete using (
    user_id = auth.uid()
    or community_prayer_id in (
      select id from community_prayers where group_id in (select get_my_admin_group_ids())
    )
  );
