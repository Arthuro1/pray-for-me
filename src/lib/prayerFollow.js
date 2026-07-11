// Follow / unfollow an individual community prayer for notifications
// (prayer_notification_subscriptions). RLS restricts these to the current user's
// own rows and to prayers in groups they belong to, so no extra checks here.
import { supabase } from './supabase';

export async function isFollowingPrayer(userId, prayerId) {
  if (!userId || !prayerId) return false;
  const { data } = await supabase
    .from('prayer_notification_subscriptions')
    .select('user_id')
    .eq('user_id', userId)
    .eq('community_prayer_id', prayerId)
    .maybeSingle();
  return !!data;
}

export async function followPrayer(userId, prayerId, prefs = {}) {
  if (!userId || !prayerId) return { error: 'missing' };
  const { error } = await supabase
    .from('prayer_notification_subscriptions')
    .upsert(
      {
        user_id: userId,
        community_prayer_id: prayerId,
        notify_updates: prefs.notify_updates ?? true,
        notify_answered: prefs.notify_answered ?? true,
        notify_testimonies: prefs.notify_testimonies ?? true,
      },
      { onConflict: 'user_id,community_prayer_id' }
    );
  return { error };
}

export async function unfollowPrayer(userId, prayerId) {
  if (!userId || !prayerId) return { error: 'missing' };
  const { error } = await supabase
    .from('prayer_notification_subscriptions')
    .delete()
    .eq('user_id', userId)
    .eq('community_prayer_id', prayerId);
  return { error };
}

// Best-effort auto-follow used when a user taps "I'm praying". Silently ignored
// on failure — following is a convenience, never a blocker. Reversible from the
// prayer's follow toggle.
export async function autoFollowOnReaction(userId, prayerId) {
  try { await followPrayer(userId, prayerId); } catch { /* non-fatal */ }
}
