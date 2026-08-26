import { useCallback } from 'react';
import useCommunityStore from '../store/communityStore';

// Resolves a group id to the caller's own membership record (name + avatar
// preset), or null when the id is absent or the user isn't in that group.
// Shared by the inbox surfaces so a notification can show which group it came
// from without either of them reaching into store shape.
export default function useGroupLookup() {
  const groups = useCommunityStore((s) => s.groups);
  return useCallback((groupId) => (groupId ? groups.find((g) => g.id === groupId) || null : null), [groups]);
}
