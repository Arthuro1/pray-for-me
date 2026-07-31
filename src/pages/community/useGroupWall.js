import { useEffect, useRef } from 'react';
import { useShallow } from 'zustand/react/shallow';
import useCommunityStore from '../../store/communityStore';
import usePrayerStore from '../../store/prayerStore';
import { markGroupSeen } from './seen';

// GroupView's shared read-model + live sync, lifted out so GroupView is left with
// its tabs, modals and layout. Owns: the group's prayers/testimonies/loading, the
// live prayer-wall subscription, whether I've prayed here (for the leader
// checklist), and the "auto-add group requests to my list" reconciliation.
export default function useGroupWall({ groupId, user }) {
  const {
    groups, prayers, testimonies, loading, userReactions,
    setActiveGroup, subscribeGroupPrayers, fetchUserReactions, setGroupAutoAdd,
  } = useCommunityStore(
    useShallow((s) => ({
      groups: s.groups,
      prayers: s.prayers,
      testimonies: s.testimonies,
      loading: s.loading,
      userReactions: s.userReactions,
      setActiveGroup: s.setActiveGroup,
      subscribeGroupPrayers: s.subscribeGroupPrayers,
      fetchUserReactions: s.fetchUserReactions,
      setGroupAutoAdd: s.setGroupAutoAdd,
    }))
  );
  const addFromCommunity = usePrayerStore((s) => s.addFromCommunity);
  const reconciledRef = useRef(null);

  // Always (re)fetch on entering a group so freshly synced points/updates from
  // the personal side show up, even if this group was already the active one.
  // (setActiveGroup, subscribeGroupPrayers, fetchUserReactions are stable Zustand
  // actions — listing them satisfies exhaustive-deps without extra re-runs.)
  useEffect(() => {
    if (groupId) { setActiveGroup(groupId); markGroupSeen(groupId); }
  }, [groupId, setActiveGroup]);

  // Live prayer wall: reflect new/edited/answered requests from other members.
  useEffect(() => {
    if (!groupId) return undefined;
    return subscribeGroupPrayers(groupId);
  }, [groupId, subscribeGroupPrayers]);

  // The leader checklist's "begin praying" step ticks itself off once the user
  // has an "I'm praying" on any of this group's requests.
  useEffect(() => {
    if (groupId && user?.id) fetchUserReactions(groupId, user.id);
  }, [groupId, user?.id, fetchUserReactions]);

  const group = groups.find((g) => g.id === groupId);
  const isAdmin = group?.role === 'admin';
  const hasPrayedInGroup = prayers.some((p) => userReactions.has(p.id));

  // Copy group requests (not mine, not already linked) into the personal list.
  const reconcileAutoAdd = async () => {
    const mine = new Set(usePrayerStore.getState().prayers.map((p) => p.id));
    const groupName = groups.find((g) => g.id === groupId)?.name || null;
    for (const p of prayers) {
      if (p.user_id === user.id) continue;
      if (p.source_prayer_id && mine.has(p.source_prayer_id)) continue;
      await addFromCommunity(p, groupName); // idempotent: deduped by community_origin_id
    }
  };

  // When auto-add is on, reconcile once per group entry (after prayers load). The
  // ref guard makes this run-once-per-groupId, so reconcileAutoAdd (recreated each
  // render) is deliberately not a dependency.
  useEffect(() => {
    if (group?.autoAdd && !loading && prayers.length && reconciledRef.current !== groupId) {
      reconciledRef.current = groupId;
      reconcileAutoAdd();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [group?.autoAdd, loading, prayers, groupId]);

  const handleToggleAutoAdd = async () => {
    const next = !group?.autoAdd;
    await setGroupAutoAdd(groupId, user.id, next);
    if (next) await reconcileAutoAdd();
  };

  return { group, isAdmin, prayers, testimonies, loading, hasPrayedInGroup, handleToggleAutoAdd };
}
