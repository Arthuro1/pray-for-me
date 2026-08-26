-- Restore EXECUTE on the two group-membership helpers for `authenticated`.
--
-- `20260731190400_explicit_data_api_grants.sql` revoked EXECUTE on every public
-- function from `authenticated` and then re-granted an allow-list of the RPCs the
-- client calls directly. get_my_group_ids() and get_my_admin_group_ids() are never
-- called from the client, so they were left off that list — but they are called by
-- 31 RLS policies, and a policy expression is evaluated with the privileges of the
-- querying role. Without EXECUTE, every read of groups, group_members,
-- community_prayers, community_updates, prayer_reactions and testimonies failed
-- with `permission denied for function get_my_group_ids`, so a member's own groups
-- came back as an error the client surfaced as an empty list — while
-- join_group_by_code(), being SECURITY DEFINER, still saw the membership row and
-- answered "already member".
--
-- These are the same grants the avatar migration already makes for its own policy
-- predicates (can_view_group_avatar and friends); this brings the older helpers in
-- line. `anon` is deliberately left without EXECUTE: it has no memberships, and
-- keeping it off the list preserves the hardening intent of the grants migration.

grant execute on function public.get_my_group_ids() to authenticated;
grant execute on function public.get_my_admin_group_ids() to authenticated;
