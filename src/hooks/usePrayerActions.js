import { CheckCircle, RotateCcw, Trash2, Pin } from 'lucide-react';
import usePrayerStore from '../store/prayerStore';
import useCommunityStore from '../store/communityStore';
import useAuthStore from '../store/authStore';
import { toast } from '../store/toastStore';
import { confirm } from '../store/confirmStore';
import { t } from '../i18n';

// Shared prayer actions for the lists and the detail page. Removal matches the
// stakes: deleting a prayer you CREATED warns first (real content loss), while
// removing a saved-from-community copy (low-stakes unfollow) happens instantly
// with an "Undo" toast.
export function usePrayerActions(lang) {
  const { deletePrayer, softDeletePrayer, undoDelete, markAnswered, markActive, togglePin } = usePrayerStore();
  const { removeReaction, addReaction } = useCommunityStore();
  const { user } = useAuthStore();

  // `onDone` runs once the prayer is gone (e.g. navigate back from the detail).
  const removePrayer = (prayer, onDone) => {
    if (prayer.community_origin_id) {
      // Saved copy → instant unfollow + Undo. Drop the reaction so the group
      // praying count reflects it; restore both if the user undoes.
      removeReaction(prayer.community_origin_id, user?.id);
      softDeletePrayer(prayer.id);
      onDone?.();
      toast.success(t(lang, 'removedFromList'), {
        action: {
          label: t(lang, 'undo'),
          onClick: () => {
            undoDelete(prayer.id);
            addReaction(prayer.community_origin_id, user?.id);
          },
        },
      });
      return;
    }
    // Own prayer → warn before the irreversible delete.
    confirm({
      title: t(lang, 'tipDeletePrayer'),
      message: `${prayer.title} — ${t(lang, 'deleteWarning')}`,
      confirmLabel: t(lang, 'delete'),
      cancelLabel: t(lang, 'cancel'),
      onConfirm: () => { deletePrayer(prayer.id); onDone?.(); },
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
    actions.push({ key: 'remove', icon: Trash2, label: t(lang, 'remove'), bg: '#e53e3e', onClick: () => removePrayer(prayer) });
    return actions;
  };

  return { removePrayer, swipeActions };
}
