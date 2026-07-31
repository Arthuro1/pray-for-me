import { useState, useEffect, useCallback } from 'react';
import { useShallow } from 'zustand/react/shallow';
import useCommunityStore from '../../store/communityStore';
import { unreadCounts } from '../../utils/community';
import { readSeen } from './seen';

// The Community hub's read-model, lifted out of CommunityTab so the component is
// left with mutations + layout. Loads and holds your friends, incoming friend
// requests, pending group + plan invitations, and per-group unread badges.
//
// The fetchers are stable Zustand actions, so listing them in `reload`'s deps is
// correct (no re-run churn) and satisfies exhaustive-deps honestly — the reason
// this data lived inline was the linter noise that inlining hid.
export default function useCommunityHubData(userId) {
  const {
    fetchFriends, fetchFriendRequests, fetchGroupInvitations,
    fetchPlanInvitations, fetchPendingCount, fetchGroupActivity,
  } = useCommunityStore(
    useShallow((s) => ({
      fetchFriends: s.fetchFriends,
      fetchFriendRequests: s.fetchFriendRequests,
      fetchGroupInvitations: s.fetchGroupInvitations,
      fetchPlanInvitations: s.fetchPlanInvitations,
      fetchPendingCount: s.fetchPendingCount,
      fetchGroupActivity: s.fetchGroupActivity,
    }))
  );
  const [friends, setFriends] = useState([]);
  const [friendRequests, setFriendRequests] = useState([]);
  const [groupInvitations, setGroupInvitations] = useState([]);
  const [planInvitations, setPlanInvitations] = useState([]);
  const [unread, setUnread] = useState({});
  const [loading, setLoading] = useState(true);

  const reload = useCallback(async () => {
    const [f, fr, gi, pi] = await Promise.all([
      fetchFriends(userId),
      fetchFriendRequests(userId),
      fetchGroupInvitations(userId),
      fetchPlanInvitations(userId),
    ]);
    setFriends(f.friends || []);
    setFriendRequests(fr.requests || []);
    setGroupInvitations(gi.invitations || []);
    setPlanInvitations(pi?.invitations || []);
    setLoading(false);
    fetchPendingCount(userId);
    fetchGroupActivity().then((rows) => setUnread(unreadCounts(rows, readSeen(), userId)));
  }, [userId, fetchFriends, fetchFriendRequests, fetchGroupInvitations, fetchPlanInvitations, fetchPendingCount, fetchGroupActivity]);

  useEffect(() => { reload(); }, [reload]);

  return { friends, friendRequests, groupInvitations, planInvitations, unread, loading, reload };
}
