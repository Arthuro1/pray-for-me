import { useState } from 'react';
import { useShallow } from 'zustand/react/shallow';
import useCommunityStore from '../../store/communityStore';
import usePrayerStore from '../../store/prayerStore';
import { toast } from '../../store/toastStore';
import { t } from '../../i18n';
import { canPlaceCarried, placeCarriedPrayer } from '../../store/carryPlacementStore';

// Long enough to read the confirmation and reach its one button; placing the
// prayer stays possible later from its own page in the Journal.
const CHOOSE_CIRCLE_TTL = 10000;

// Actions on an open COMMUNITY prayer: marking it answered / resuming (mirrored
// onto the viewer's personal source or saved copy), and the "I'm praying" toggle
// (which symmetrically adds/removes the personal copy, and offers to place a new
// copy in one of the carrier's own circles). Owns the togglingPraying flag.
// No-op in personal mode.
export default function useCommunityPrayerActions({ communityPrayer, isCommunity, user, authorName, lang }) {
  const [togglingPraying, setTogglingPraying] = useState(false);

  const { userReactions, groups, toggleReaction, setCommunityAnswered, addTestimony } = useCommunityStore(
    useShallow((s) => ({
      userReactions: s.userReactions,
      groups: s.groups,
      toggleReaction: s.toggleReaction,
      setCommunityAnswered: s.setCommunityAnswered,
      addTestimony: s.addTestimony,
    }))
  );
  const { prayers, markAnswered, markActive, addFromCommunity, softDeletePrayer } = usePrayerStore(
    useShallow((s) => ({
      prayers: s.prayers,
      markAnswered: s.markAnswered,
      markActive: s.markActive,
      addFromCommunity: s.addFromCommunity,
      softDeletePrayer: s.softDeletePrayer,
    }))
  );

  const communityHasReacted = isCommunity && userReactions.has(communityPrayer?.id);

  // The viewer's own carried copy of this request, if they carry it.
  const carriedCopy = isCommunity ? prayers.find((p) => p.community_origin_id === communityPrayer.id) || null : null;

  // True when this community prayer is already in the user's personal list —
  // either saved as a copy, or it was originally shared from their own prayer.
  const alreadyInPersonal = isCommunity && (
    !!carriedCopy
    || (communityPrayer.source_prayer_id && prayers.some((p) => p.id === communityPrayer.source_prayer_id))
  );

  // A community request can correspond to a prayer in the viewer's OWN list in
  // two ways, and answering / resuming the group request must keep that personal
  // copy in sync — otherwise an answered group request lingers as "active" on the
  // Journal (and a "until answered" schedule never ends). markAnswered/markActive
  // are idempotent and already fan back out to every shared copy.
  const mirrorPersonalAnswered = async (answered) => {
    const apply = async (pid) => {
      const p = prayers.find((x) => x.id === pid);
      if (p && (p.status === 'answered') === answered) return; // already in sync
      if (answered) await markAnswered(pid);
      else await markActive(pid);
    };
    // (1) Shared FROM the viewer's own prayer → keep that source in sync. Ownership
    //     guard: a group admin toggling someone else's request must not touch a
    //     stranger's list, so their action stays a community-only edit.
    if (communityPrayer.source_prayer_id && communityPrayer.user_id === user?.id) {
      await apply(communityPrayer.source_prayer_id);
    }
    // (2) SAVED to the viewer's list via "I'm praying" → complete/resume that copy
    //     too. A saved copy is always the viewer's own, so it needs no guard.
    const savedCopy = prayers.find((p) => p.community_origin_id === communityPrayer.id);
    if (savedCopy) await apply(savedCopy.id);
  };

  const handleConfirmCommunityAnswered = async (text, attachments = []) => {
    const answered = await setCommunityAnswered(communityPrayer.id, true);
    if (answered?.error) {
      toast.error(t(lang, 'errorGeneric'));
      return false;
    }
    await mirrorPersonalAnswered(true);
    if (text.trim() || attachments.length) {
      const testimony = await addTestimony({ groupId: communityPrayer.group_id, userId: user.id, authorName, content: text.trim(), isAnonymous: false, communityPrayerId: communityPrayer.id, contentLanguage: lang, attachments });
      if (testimony?.error) {
        toast.error(t(lang, 'errorGeneric'));
        return false;
      }
    }
    return true;
  };

  const handleResumeCommunity = async () => {
    const resumed = await setCommunityAnswered(communityPrayer.id, false);
    if (resumed?.error) {
      toast.error(t(lang, 'errorGeneric'));
      return false;
    }
    await mirrorPersonalAnswered(false);
    return true;
  };

  // Tapping "I'm praying" toggles the reaction (praying count) and mirrors it onto
  // the user's personal list: turning it ON adds the prayer (if not already there),
  // turning it OFF removes the saved copy that auto-add created — so the toggle is
  // symmetric. Only a saved copy (community_origin_id) is ever removed here, never
  // the user's own prayer that they merely shared to the group (source_prayer_id).
  const handleTogglePraying = async () => {
    if (togglingPraying) return;
    setTogglingPraying(true);
    const wasReacted = communityHasReacted;
    await toggleReaction(communityPrayer.id, user.id);
    if (!wasReacted && !alreadyInPersonal) {
      const groupName = groups.find((g) => g.id === communityPrayer.group_id)?.name || null;
      const res = await addFromCommunity(communityPrayer, groupName);
      if (!res?.error) {
        // Carrying is done. Placing it on one's own altar is offered once, in
        // the confirmation itself — never a second step on the group's wall.
        const copy = res?.prayer;
        toast.success(t(lang, 'carryAdded'), canPlaceCarried(copy)
          ? { ttl: CHOOSE_CIRCLE_TTL, action: { label: t(lang, 'carryChooseCircle'), onClick: () => placeCarriedPrayer(copy.id) } }
          : undefined);
      }
    } else if (wasReacted) {
      if (carriedCopy) {
        softDeletePrayer(carriedCopy.id);
        toast.success(t(lang, 'carryRemoved'));
      }
    }
    setTogglingPraying(false);
  };

  return {
    communityHasReacted, togglingPraying,
    handleConfirmCommunityAnswered, handleResumeCommunity, handleTogglePraying,
  };
}
