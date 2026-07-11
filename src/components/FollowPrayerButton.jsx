import { useEffect, useState } from 'react';
import { Bell, BellOff, Loader2 } from 'lucide-react';
import { isFollowingPrayer, followPrayer, unfollowPrayer } from '../lib/prayerFollow';
import { toast } from '../store/toastStore';
import { t } from '../i18n';

// Follow / unfollow a community prayer for update, answered and testimony
// notifications. Also the reversible surface for the auto-follow that happens
// when a user taps "I'm praying".
export default function FollowPrayerButton({ userId, prayerId, lang }) {
  const [following, setFollowing] = useState(null); // null = loading
  const [busy, setBusy] = useState(false);

  useEffect(() => {
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
    if (error) { setFollowing(!next); toast.error(t(lang, 'errorGeneric')); return; }
    toast.success(t(lang, next ? 'followingPrayer' : 'unfollowedPrayer'));
  };

  if (following === null) {
    return <Loader2 size={16} className="animate-spin" style={{ color: 'var(--text-3)' }} />;
  }

  const Icon = following ? Bell : BellOff;
  return (
    <button
      onClick={toggle}
      disabled={busy}
      aria-pressed={following}
      className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium disabled:opacity-50"
      style={following
        ? { background: 'var(--accent)', color: '#fff' }
        : { background: 'var(--input-bg)', color: 'var(--text-2)', border: '0.5px solid var(--input-border)' }}
    >
      <Icon size={13} />
      {t(lang, following ? 'following' : 'followPrayer')}
    </button>
  );
}
