import { useState, useEffect } from 'react';
import { useShallow } from 'zustand/react/shallow';
import useCommunityStore from '../../store/communityStore';
import usePrayerStore from '../../store/prayerStore';

// Personal-mode (non-community) prayer sharing sync for PrayerDetail: loads the
// user's groups + share map (so the share button/badges are accurate even if the
// Community tab was never opened), follows the community copy's latest content
// into a saved-from-community prayer, and surfaces member testimonies/updates
// posted on the shared copies. A no-op in community mode.
export default function usePrayerSharing({ prayer, isCommunity, user }) {
  const { groups, prayerShares, fetchGroups, fetchPrayerShares } = useCommunityStore(
    useShallow((s) => ({
      groups: s.groups,
      prayerShares: s.prayerShares,
      fetchGroups: s.fetchGroups,
      fetchPrayerShares: s.fetchPrayerShares,
    }))
  );
  const { refreshFromCommunity, fetchSharedActivity } = usePrayerStore(
    useShallow((s) => ({
      refreshFromCommunity: s.refreshFromCommunity,
      fetchSharedActivity: s.fetchSharedActivity,
    }))
  );
  const [sharedActivity, setSharedActivity] = useState({ prayers: [], testimonies: [], updates: [] });

  // Load the user's groups and existing share map so the share button and badges
  // reflect reality even if the Community tab was never opened. `groups.length` is
  // deliberately not a dependency: this is a one-shot load on open, and depending
  // on it would refetch the share map on every wall change.
  useEffect(() => {
    if (isCommunity || !user?.id) return;
    if (groups.length === 0) fetchGroups(user.id);
    fetchPrayerShares(user.id);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isCommunity, user?.id, fetchGroups, fetchPrayerShares]);

  const sharedGroups = isCommunity ? [] : (prayerShares[prayer?.id] || []);

  // For a prayer saved from the community, pull the author's/group's latest shared
  // content into this copy on open (one-way follow).
  useEffect(() => {
    if (!isCommunity && prayer?.community_origin_id) refreshFromCommunity(prayer.id);
  }, [isCommunity, prayer?.community_origin_id, prayer?.id, refreshFromCommunity]);

  // Surface testimonies + member updates posted on the community copies of this
  // personal prayer (shared source or saved copy). Keyed by isShared + prayer.id;
  // the `prayer` object itself is not a dependency (its identity changes each
  // render, which would refetch endlessly).
  const isShared = !isCommunity && (!!prayer?.community_origin_id || (prayerShares[prayer?.id]?.length > 0));
  useEffect(() => {
    if (isShared) fetchSharedActivity(prayer).then(setSharedActivity);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isShared, prayer?.id, fetchSharedActivity]);

  return { sharedGroups, sharedActivity };
}
