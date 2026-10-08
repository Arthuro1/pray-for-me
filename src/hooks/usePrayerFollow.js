import { useEffect, useState } from 'react';
import { isFollowingPrayer, followPrayer, unfollowPrayer } from '../lib/prayerFollow';
import { toast } from '../store/toastStore';
import { t } from '../i18n';

// Follow / unfollow a community prayer for update, answered and testimony
// notifications — the reversible side of the auto-follow that carrying a
// prayer does. `following` is null while the current state is loading.
export default function usePrayerFollow({ userId, prayerId, lang }) {
  const [following, setFollowing] = useState(null);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    if (!userId || !prayerId) return undefined;
    let cancelled = false;
    isFollowingPrayer(userId, prayerId).then((v) => { if (!cancelled) setFollowing(v); });
    return () => { cancelled = true; };
  }, [userId, prayerId]);

  const toggle = async () => {
    if (following === null || busy) return;
    setBusy(true);
    const next = !following;
    setFollowing(next); // optimistic
    const { error } = next ? await followPrayer(userId, prayerId) : await unfollowPrayer(userId, prayerId);
    setBusy(false);
    if (error) {
      setFollowing(!next);
      toast.error(t(lang, 'errorGeneric'));
      return;
    }
    toast.success(t(lang, next ? 'followingPrayer' : 'unfollowedPrayer'));
  };

  return { following, toggle };
}
