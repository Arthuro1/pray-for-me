-- Let invitees read the name of a group they've been invited to, so the
-- invitation card can show the real group name instead of a placeholder "?".
-- The base "Members can read their groups" policy excludes not-yet-members,
-- which left group_invitations.groups(name) null for the person being invited.
-- Safe from RLS recursion: group_invitations' own SELECT policy is a plain
-- column check (invited_user_id = auth.uid()) and never references groups.
-- Run in the Supabase SQL editor.
drop policy if exists "Invitees can read groups they're invited to" on groups;
create policy "Invitees can read groups they're invited to" on groups
  for select using (
    id in (select group_id from group_invitations where invited_user_id = auth.uid())
  );
