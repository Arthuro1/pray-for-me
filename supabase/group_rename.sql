-- Allow group admins to rename their group. Run in the Supabase SQL editor.
-- (groups previously had only SELECT + INSERT policies, so updates were blocked.)
drop policy if exists "Admins can update their group" on groups;
create policy "Admins can update their group" on groups
  for update using (id in (select get_my_admin_group_ids()))
  with check (id in (select get_my_admin_group_ids()));
