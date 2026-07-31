import { useState, useEffect } from 'react';
import { useShallow } from 'zustand/react/shallow';
import useCommunityStore from '../../store/communityStore';
import { toast } from '../../store/toastStore';
import { t } from '../../i18n';

// The community-prayer "words of encouragement" timeline for PrayerDetail: the
// fetch-on-open, the live activity subscription (reactions + member updates), and
// the send / delete / edit handlers with optimistic patches and a re-fetch on
// failure. Lifted out of PrayerDetail (a 1500-line monolith) so the community
// timeline is one cohesive unit that feeds <CommunityUpdates>.
export default function useCommunityPrayerUpdates({ communityPrayer, isCommunity, user, authorName, lang }) {
  const [communityUpdates, setCommunityUpdates] = useState([]);
  const [loadingUpdates, setLoadingUpdates] = useState(false);

  const {
    fetchPrayerUpdates, addUpdate: addCommunityUpdate, deleteCommunityUpdate,
    editCommunityUpdate, subscribePrayerActivity, refreshPrayer, fetchUserReactions,
  } = useCommunityStore(
    useShallow((s) => ({
      fetchPrayerUpdates: s.fetchPrayerUpdates,
      addUpdate: s.addUpdate,
      deleteCommunityUpdate: s.deleteCommunityUpdate,
      editCommunityUpdate: s.editCommunityUpdate,
      subscribePrayerActivity: s.subscribePrayerActivity,
      refreshPrayer: s.refreshPrayer,
      fetchUserReactions: s.fetchUserReactions,
    }))
  );

  useEffect(() => {
    if (!isCommunity) return;
    setLoadingUpdates(true);
    fetchPrayerUpdates(communityPrayer.id).then((data) => {
      setCommunityUpdates(data);
      setLoadingUpdates(false);
    });
  }, [communityPrayer?.id, isCommunity, fetchPrayerUpdates]);

  // Live reactions + member updates on this open prayer.
  useEffect(() => {
    if (!isCommunity) return undefined;
    return subscribePrayerActivity(communityPrayer.id, {
      onReaction: () => {
        refreshPrayer(communityPrayer.id);
        if (user?.id) fetchUserReactions(communityPrayer.group_id, user.id);
      },
      onUpdate: () => {
        refreshPrayer(communityPrayer.id);
        fetchPrayerUpdates(communityPrayer.id).then(setCommunityUpdates);
      },
    });
  }, [communityPrayer?.id, communityPrayer?.group_id, isCommunity, subscribePrayerActivity, refreshPrayer, fetchUserReactions, fetchPrayerUpdates, user?.id]);

  const handleSendWord = async (text, attachments, isAnonymous) => {
    await addCommunityUpdate({ prayerId: communityPrayer.id, sourcePrayerId: communityPrayer.source_prayer_id, userId: user.id, authorName, text, isAnonymous, contentLanguage: lang, attachments });
    // Re-fetch so the timeline reflects the (possibly synced) update.
    setCommunityUpdates(await fetchPrayerUpdates(communityPrayer.id));
  };

  const handleDeleteWord = async (updateId) => {
    // Optimistically drop it so the row disappears without waiting on the refetch.
    setCommunityUpdates((prev) => prev.filter((u) => u.id !== updateId));
    const res = await deleteCommunityUpdate(updateId, communityPrayer.id);
    if (res?.error) {
      toast.error(t(lang, 'errorGeneric'));
      setCommunityUpdates(await fetchPrayerUpdates(communityPrayer.id));
      return;
    }
    toast.success(t(lang, 'wordDeleted'));
  };

  // Author-only text edit. Optimistically patch the local timeline; the store
  // re-encrypts and rewrites the row (attachments preserved). On failure the
  // authoritative refetch restores the original text.
  const handleEditWord = async (updateId, text) => {
    const update = communityUpdates.find((u) => u.id === updateId);
    if (!update) return;
    setCommunityUpdates((prev) => prev.map((u) => (u.id === updateId ? { ...u, text } : u)));
    const res = await editCommunityUpdate(communityPrayer.id, update, text);
    if (res?.error) {
      toast.error(t(lang, 'errorGeneric'));
      setCommunityUpdates(await fetchPrayerUpdates(communityPrayer.id));
    }
  };

  return { communityUpdates, loadingUpdates, handleSendWord, handleDeleteWord, handleEditWord };
}
