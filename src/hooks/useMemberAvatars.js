import { useEffect } from 'react';
import { useShallow } from 'zustand/react/shallow';
import useCommunityStore from '../store/communityStore';

// Avatars for the members of one group, as a resolver keyed by user id.
//
// One relationship-scoped lookup per group (the store de-duplicates, so several
// components asking at once share it), and an unknown id simply returns null —
// the Avatar component then derives a stable one from the display name. That is
// what keeps this safe to call from any community surface: a missing entry is a
// normal outcome, never an error.
export default function useMemberAvatars(groupId) {
  const { memberAvatars, fetchMemberAvatars } = useCommunityStore(
    useShallow((s) => ({ memberAvatars: s.memberAvatars, fetchMemberAvatars: s.fetchMemberAvatars }))
  );

  useEffect(() => {
    if (groupId) fetchMemberAvatars(groupId);
  }, [groupId, fetchMemberAvatars]);

  return (userId) => memberAvatars[userId] || null;
}
