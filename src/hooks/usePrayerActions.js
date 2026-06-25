import { CheckCircle, RotateCcw, Trash2, Pin } from 'lucide-react';
import usePrayerStore from '../store/prayerStore';
import useCommunityStore from '../store/communityStore';
import useAuthStore from '../store/authStore';
import { toast } from '../store/toastStore';
import { t } from '../i18n';

// Shared, reversible prayer actions for the lists and the detail page. Removing
// a prayer is optimistic + deferred: an "Undo" toast can restore it (and re-add
// the community reaction for a saved copy) before the delete commits.
export function usePrayerActions(lang) {
  const { softDeletePrayer, undoDelete, markAnswered, markActive, togglePin } = usePrayerStore();
  const { removeReaction, addReaction } = useCommunityStore();
  const { user } = useAuthStore();

  const removeWithUndo = (prayer) => {
    const savedCopy = !!prayer.community_origin_id;
    // A saved copy: drop the "I'm praying" reaction so the group count reflects it.
    if (savedCopy) removeReaction(prayer.community_origin_id, user?.id);
    softDeletePrayer(prayer.id);
    toast.success(t(lang, savedCopy ? 'removedFromList' : 'prayerDeleted'), {
      action: {
        label: t(lang, 'undo'),
        onClick: () => {
          undoDelete(prayer.id);
          if (savedCopy) addReaction(prayer.community_origin_id, user?.id);
        },
      },
    });
  };

  // Quick actions revealed when a card is swiped: pin, [mark answered/resume], remove.
  const swipeActions = (prayer) => {
    const actions = [
      { key: 'pin', icon: Pin, label: t(lang, prayer.pinned ? 'unpin' : 'pin'), bg: '#c07c2a', onClick: () => togglePin(prayer.id) },
    ];
    // Only the author can change a prayer's answered status. A saved-from-community
    // copy (community_origin_id set) follows someone else's prayer, so omit it.
    if (!prayer.community_origin_id) {
      actions.push(prayer.status === 'answered'
        ? { key: 'resume', icon: RotateCcw, label: t(lang, 'resume'), bg: 'var(--accent)', onClick: () => markActive(prayer.id) }
        : { key: 'answered', icon: CheckCircle, label: t(lang, 'answered2'), bg: 'var(--success)', onClick: () => markAnswered(prayer.id) });
    }
    actions.push({ key: 'remove', icon: Trash2, label: t(lang, 'remove'), bg: '#e53e3e', onClick: () => removeWithUndo(prayer) });
    return actions;
  };

  return { removeWithUndo, swipeActions };
}
