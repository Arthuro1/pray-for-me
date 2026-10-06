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
    return <Loader2 size={16} className="animate-spin" style={{ color: 'var(--q-text-tertiary)' }} />;
  }

  // A quiet companion to "Carry this prayer": text and a bell, never a second
  // filled button competing with it.
  const Icon = following ? Bell : BellOff;
  return (
    <button
      type="button"
      onClick={toggle}
      disabled={busy}
      aria-pressed={following}
      className="quiet-button pressable"
      style={following ? undefined : { color: 'var(--q-text-secondary)' }}
    >
      <Icon size={16} aria-hidden="true" />
      <span>{t(lang, following ? 'following' : 'followPrayer')}</span>
    </button>
  );
}
