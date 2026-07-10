import { useState, useEffect, useRef } from 'react';
import { ArrowLeft, Plus, Trash2, Edit2, CheckCircle, Sparkles, Loader2, BookOpen, Share2, Languages, Users, Pin, Repeat } from 'lucide-react';
import { useShallow } from 'zustand/react/shallow';
import usePrayerStore from '../store/prayerStore';
import useTranslationStore from '../store/translationStore';
import useAuthStore from '../store/authStore';
import useCommunityStore from '../store/communityStore';
import { format } from 'date-fns';
import { dateLocale, timeAgo } from '../utils/date';
import { getAuthorName, originAuthor, communityAuthor } from '../utils/user';
import { testimonyList } from '../utils/prayer';
import { getAIRecommendations } from '../aiRecommendations';
import { t } from '../i18n';
import { toast } from '../store/toastStore';
import AiConsentModal from '../components/AiConsentModal';
import { hasAiConsent } from '../lib/aiConsent';
import AiDisclaimer from '../components/AiDisclaimer';
import PrayerForm from '../components/PrayerForm';
import PrayerShareModal from '../components/PrayerShareModal';
import FollowUpBanner from '../components/FollowUpBanner';
import { scheduleSummary } from '../lib/scheduleDraft';
import { planDayNumber } from '../lib/schedule';
import { todayKey } from '../lib/prayedLog';
import { planDayContent } from '../content/prayerPlans';
import { pick } from '../content/teaching';
import GroupPrayerCalendar from '../components/GroupPrayerCalendar';
import SchedulePlanner from '../components/SchedulePlanner';
import CategorySelector from '../components/CategorySelector';
import PrayTogetherCard from '../components/PrayTogetherCard';
import ScriptureFirstStep from '../components/ScriptureFirstStep';
import VerseAccordion from '../components/VerseAccordion';
import CommunityUpdates from '../components/CommunityUpdates';
import CommunityTestimonies from '../components/CommunityTestimonies';
import AnonymousToggle from '../components/AnonymousToggle';
import ConfirmDialog from '../components/ConfirmDialog';
import { useEscapeKey } from '../hooks/useEscapeKey';
import { useFocusTrap } from '../hooks/useFocusTrap';
import { usePrayerActions } from '../hooks/usePrayerActions';
import OverflowMenu from '../components/OverflowMenu';

// communityPrayer prop switches the component to community mode
export default function PrayerDetail({ prayer, communityPrayer, onBack, onEdit, lang = 'en' }) {
  const isCommunity = !!communityPrayer;

  // ── Personal mode state ──────────────────────────────────────────────────
  const [newUpdate, setNewUpdate] = useState('');
  const [showTestimony, setShowTestimony] = useState(true);
  const [testimony, setTestimony] = useState('');
  // Adding a word of thanks to an already-answered prayer (remembrance).
  const [showThanks, setShowThanks] = useState(false);
  const [thanksText, setThanksText] = useState('');
  const [savingThanks, setSavingThanks] = useState(false);
  const [updateRecs, setUpdateRecs] = useState([]);
  const [loadingRecs, setLoadingRecs] = useState(false);
  const [recsError, setRecsError] = useState(null);
  const [manualPoint, setManualPoint] = useState({ title: '', verse: '' });
  const [showManualForm, setShowManualForm] = useState(false);
  const [editingTitle, setEditingTitle] = useState(false);
  const [titleDraft, setTitleDraft] = useState('');
  const titleCancelRef = useRef(false);
  const [addingVerseTo, setAddingVerseTo] = useState(null);
  const [newVerse, setNewVerse] = useState({ ref: '', text: '' });
  const [showAiConsent, setShowAiConsent] = useState(false);
  const [showShareModal, setShowShareModal] = useState(false);
  const [showScripture, setShowScripture] = useState(false);

  // ── Community mode state ─────────────────────────────────────────────────
  const [communityUpdates, setCommunityUpdates] = useState([]);
  const [loadingUpdates, setLoadingUpdates] = useState(false);
  const [showCommunityTestimony, setShowCommunityTestimony] = useState(false);
  const [communityTestimonyText, setCommunityTestimonyText] = useState('');
  const [communityTestimonyAnon, setCommunityTestimonyAnon] = useState(false);
  const [postingTestimony, setPostingTestimony] = useState(false);
  const [testimonySent, setTestimonySent] = useState(false);
  const [showCommunityEdit, setShowCommunityEdit] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [togglingPraying, setTogglingPraying] = useState(false);

  const { categories, markAnswered, markActive, addTestimony: addPersonalTestimony, addUpdate, addPrayerPoint, addVerseToPoint, removeVerseFromPoint, removePrayerPoint, togglePin, addFromCommunity, syncCategoriesFromCommunity, updatePrayer, prayers, refreshFromCommunity, fetchSharedActivity } = usePrayerStore(
    useShallow((s) => ({
      categories: s.categories,
      markAnswered: s.markAnswered,
      markActive: s.markActive,
      addTestimony: s.addTestimony,
      addUpdate: s.addUpdate,
      addPrayerPoint: s.addPrayerPoint,
      addVerseToPoint: s.addVerseToPoint,
      removeVerseFromPoint: s.removeVerseFromPoint,
      removePrayerPoint: s.removePrayerPoint,
      togglePin: s.togglePin,
      addFromCommunity: s.addFromCommunity,
      syncCategoriesFromCommunity: s.syncCategoriesFromCommunity,
      updatePrayer: s.updatePrayer,
      prayers: s.prayers,
      refreshFromCommunity: s.refreshFromCommunity,
      fetchSharedActivity: s.fetchSharedActivity,
    }))
  );
  const { tr, translateTexts, translating } = useTranslationStore();
  const [showTranslated, setShowTranslated] = useState(false);
  // Esc closes the delete overlay (the share modal handles its own Esc/focus
  // trap; ConfirmDialog handles its own).
  useEscapeKey(showDeleteConfirm ? () => setShowDeleteConfirm(false) : null);
  const deleteTrapRef = useFocusTrap(showDeleteConfirm);
  const { user } = useAuthStore();
  const { groups, activeGroupId, prayers: communityPrayers, userReactions, toggleReaction, fetchUserReactions, fetchPrayerUpdates, addUpdate: addCommunityUpdate, addTestimony, updatePrayer: updateCommunityPrayer, deleteCommunityPrayer, addCommunityPrayerPoint, removeCommunityPrayerPoint, addCommunityVerse, removeCommunityVerse, setCommunityAnswered, testimonies: communityTestimonies, prayerShares, fetchGroups, fetchPrayerShares, setPrayerShares, refreshPrayer, subscribePrayerActivity } = useCommunityStore(
    useShallow((s) => ({
      groups: s.groups,
      activeGroupId: s.activeGroupId,
      prayers: s.prayers,
      userReactions: s.userReactions,
      toggleReaction: s.toggleReaction,
      fetchUserReactions: s.fetchUserReactions,
      fetchPrayerUpdates: s.fetchPrayerUpdates,
      addUpdate: s.addUpdate,
      addTestimony: s.addTestimony,
      updatePrayer: s.updatePrayer,
      deleteCommunityPrayer: s.deleteCommunityPrayer,
      addCommunityPrayerPoint: s.addCommunityPrayerPoint,
      removeCommunityPrayerPoint: s.removeCommunityPrayerPoint,
      addCommunityVerse: s.addCommunityVerse,
      removeCommunityVerse: s.removeCommunityVerse,
      setCommunityAnswered: s.setCommunityAnswered,
      testimonies: s.testimonies,
      prayerShares: s.prayerShares,
      fetchGroups: s.fetchGroups,
      fetchPrayerShares: s.fetchPrayerShares,
      setPrayerShares: s.setPrayerShares,
      refreshPrayer: s.refreshPrayer,
      subscribePrayerActivity: s.subscribePrayerActivity,
    }))
  );

  const locale = dateLocale(lang);
  const authorName = getAuthorName(user);
  const { removePrayer } = usePrayerActions(lang);

  // ── Community mode effects & handlers ────────────────────────────────────
  useEffect(() => {
    if (!isCommunity) return;
    setLoadingUpdates(true);
    fetchPrayerUpdates(communityPrayer.id).then(data => {
      setCommunityUpdates(data);
      setLoadingUpdates(false);
    });
  }, [communityPrayer?.id]);

  // Live reactions + member updates on this open prayer.
  useEffect(() => {
    if (!isCommunity) return;
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
  }, [communityPrayer?.id, isCommunity]);

  const handleSendWord = async (text, isAnonymous) => {
    await addCommunityUpdate({ prayerId: communityPrayer.id, sourcePrayerId: communityPrayer.source_prayer_id, userId: user.id, authorName, text, isAnonymous });
    // Re-fetch so the timeline reflects the (possibly synced) update.
    setCommunityUpdates(await fetchPrayerUpdates(communityPrayer.id));
  };

  const handlePostCommunityTestimony = async () => {
    if (!communityTestimonyText.trim() || postingTestimony) return;
    setPostingTestimony(true);
    await addTestimony({ groupId: activeGroupId, userId: user.id, authorName, content: communityTestimonyText.trim(), isAnonymous: communityTestimonyAnon, communityPrayerId: communityPrayer.id });
    setTestimonySent(true);
    setPostingTestimony(false);
    setShowCommunityTestimony(false);
  };

  const handleDeleteCommunity = async () => {
    setDeleting(true);
    await deleteCommunityPrayer(communityPrayer.id);
    onBack();
  };

  const handleConfirmCommunityAnswered = async () => {
    await setCommunityAnswered(communityPrayer.id, true);
    if (testimony.trim()) {
      await addTestimony({ groupId: communityPrayer.group_id, userId: user.id, authorName, content: testimony.trim(), isAnonymous: false, communityPrayerId: communityPrayer.id });
      setTestimony('');
      setTestimonySent(true);
    }
  };

  const handleResumeCommunity = () => setCommunityAnswered(communityPrayer.id, false);

  // True when this community prayer is already in the user's personal list —
  // either saved as a copy, or it was originally shared from their own prayer.
  const alreadyInPersonal = isCommunity && (
    prayers.some(p => p.community_origin_id === communityPrayer.id) ||
    (communityPrayer.source_prayer_id && prayers.some(p => p.id === communityPrayer.source_prayer_id))
  );

  // Tapping "I'm praying" toggles the reaction (praying count) and, when turning
  // it on, also adds the prayer to the user's personal list (if not already there).
  const handleTogglePraying = async () => {
    if (togglingPraying) return;
    setTogglingPraying(true);
    const wasReacted = communityHasReacted;
    await toggleReaction(communityPrayer.id, user.id);
    if (!wasReacted && !alreadyInPersonal) {
      const groupName = groups.find(g => g.id === communityPrayer.group_id)?.name || null;
      const res = await addFromCommunity(communityPrayer, groupName);
      if (!res?.error) toast.success(t(lang, 'addedToMyPrayers'));
    }
    setTogglingPraying(false);
  };

  // ── Personal mode: sharing to groups ──────────────────────────────────────
  // Load the user's groups and existing share map so the share button and
  // badges reflect reality even if the Community tab was never opened.
  useEffect(() => {
    if (isCommunity || !user?.id) return;
    if (groups.length === 0) fetchGroups(user.id);
    fetchPrayerShares(user.id);
  }, [isCommunity, user?.id]);

  const sharedGroups = isCommunity ? [] : (prayerShares[prayer.id] || []);

  // Clear pending AI suggestions when language changes so user can re-generate in new language
  useEffect(() => { setUpdateRecs([]); setRecsError(null); }, [lang]);

  // Reset the community translation toggle when the prayer or language changes
  useEffect(() => { setShowTranslated(false); }, [communityPrayer?.id, lang]);

  // For a prayer saved from the community, pull the author's/group's latest
  // shared content into this copy on open (one-way follow).
  useEffect(() => {
    if (!isCommunity && prayer?.community_origin_id) refreshFromCommunity(prayer.id);
  }, [isCommunity, prayer?.id]);

  // Surface testimonies + member updates posted on the community copies of this
  // personal prayer (shared source or saved copy).
  const [sharedActivity, setSharedActivity] = useState({ testimonies: [], updates: [] });
  const isShared = !isCommunity && (!!prayer?.community_origin_id || (prayerShares[prayer?.id]?.length > 0));
  useEffect(() => {
    if (isShared) fetchSharedActivity(prayer).then(setSharedActivity);
  }, [isShared, prayer?.id]);

  // In community mode, read from store so updates (prayer points, edits) reflect immediately
  const livePrayer = isCommunity
    ? (communityPrayers.find(p => p.id === communityPrayer.id) || communityPrayer)
    : (prayers.find(p => p.id === prayer.id) || prayer);
  const isAnswered = isCommunity ? !!livePrayer.is_answered : livePrayer.status === 'answered';
  const prayerTestimonies = isCommunity ? (communityTestimonies || []).filter(tm => tm.community_prayer_id === communityPrayer.id) : [];
  const personalTestimonies = isCommunity ? [] : testimonyList(livePrayer);
  const prayerCategoryIds = isCommunity ? (livePrayer.category_ids || []) : (livePrayer.prayer_categories || []).map(pc => pc.category_id);
  const prayerCategories = categories.filter(c => prayerCategoryIds.includes(c.id));
  const isGroupAdmin = isCommunity && groups.find(g => g.id === communityPrayer.group_id)?.role === 'admin';
  const canEditCommunityPrayer = isCommunity && (communityPrayer.user_id === user?.id || isGroupAdmin);
  const communityHasReacted = isCommunity && userReactions.has(communityPrayer.id);
  const communityReactionCount = isCommunity ? (livePrayer.prayer_reactions?.[0]?.count ?? 0) : 0;

  // ── Shared (saved-from-community) prayer flags ───────────────────────────
  // A saved copy follows the shared content read-only: it pulls the author's/
  // group's latest, but isn't edited here (open it in Community to contribute).
  const savedCopy = !isCommunity && !!livePrayer.community_origin_id;
  const canAddContent = !isAnswered && (isCommunity || !savedCopy);
  const canRemoveContent = !isAnswered && (isCommunity || !savedCopy);
  // Author copies already have member updates synced into prayer_updates; saved
  // copies don't, so fold the group's updates into the displayed list for them.
  const allUpdates = !isCommunity
    ? [...(livePrayer.prayer_updates || []), ...(savedCopy ? sharedActivity.updates : [])]
    : [];
  // You can post updates/testimonies and mark answered only on prayers you own —
  // a saved-from-community copy is read-only (you follow the author's prayer).
  const canManage = !savedCopy;

  // Personal content auto-translates; community content translates on demand
  // (the "See translation" toggle) so members can read requests in any language.
  const loc = (text) => {
    if (!text) return text;
    if (!isCommunity) return tr(text, lang);
    return showTranslated ? tr(text, lang) : text;
  };

  const handleToggleTranslate = async () => {
    if (showTranslated) { setShowTranslated(false); return; }
    const texts = [livePrayer.title, livePrayer.description];
    (livePrayer.prayer_points || []).forEach(pp => {
      texts.push(pp.title, pp.verse_text);
      (pp.verses || []).forEach(v => texts.push(v.text));
    });
    communityUpdates.forEach(u => texts.push(u.text));
    prayerTestimonies.forEach(tm => texts.push(tm.content));
    await translateTexts(texts.filter(Boolean), lang, user?.id, communityPrayer?.group_id);
    setShowTranslated(true);
  };

  const handleAddUpdate = () => {
    if (!newUpdate.trim()) return;
    addUpdate(livePrayer.id, newUpdate.trim(), authorName);
    setNewUpdate('');
    setUpdateRecs([]);
  };

  // Categories are personal organisation, so they stay editable inline for your
  // own prayers and for copies saved from the community alike.
  const toggleCategory = (id) => {
    const next = prayerCategoryIds.includes(id)
      ? prayerCategoryIds.filter((x) => x !== id)
      : [...prayerCategoryIds, id];
    updatePrayer(livePrayer.id, { categoryIds: next });
  };

  // Point/verse mutations are mode-aware: community mode routes through the
  // community store (which syncs shared prayers); personal mode uses prayerStore.
  const handleRemovePoint = (pointId) => isCommunity
    ? removeCommunityPrayerPoint(communityPrayer.id, pointId, communityPrayer.source_prayer_id)
    : removePrayerPoint(livePrayer.id, pointId);

  const handleAddVerse = (pointId, verse) => isCommunity
    ? addCommunityVerse(communityPrayer.id, pointId, verse, communityPrayer.source_prayer_id)
    : addVerseToPoint(livePrayer.id, pointId, verse);

  const handleRemoveVerse = (pointId, verseRef) => isCommunity
    ? removeCommunityVerse(communityPrayer.id, pointId, verseRef, communityPrayer.source_prayer_id)
    : removeVerseFromPoint(livePrayer.id, pointId, verseRef);

  const handleAddPoint = (point) => isCommunity
    ? addCommunityPrayerPoint(communityPrayer.id, point, communityPrayer.source_prayer_id)
    : addPrayerPoint(livePrayer.id, point);

  const fetchRecs = async () => {
    if (loadingRecs) return;
    if (!hasAiConsent('prayer')) { setShowAiConsent(true); return; }
    const lastUpdate = isCommunity
      ? (livePrayer.description || livePrayer.title)
      : ((livePrayer.prayer_updates || []).slice(-1)[0]?.text || livePrayer.title);
    setLoadingRecs(true);
    setRecsError(null);
    const { recs, error } = await getAIRecommendations({ title: livePrayer.title, description: lastUpdate, type: 'evolution', lang });
    setUpdateRecs(recs);
    setRecsError(error);
    setLoadingRecs(false);
  };

  const handleAddThanks = async () => {
    const text = thanksText.trim();
    if (!text || savingThanks) return;
    setSavingThanks(true);
    await addPersonalTestimony(livePrayer.id, text);
    setSavingThanks(false);
    setThanksText('');
    setShowThanks(false);
    toast.success(t(lang, 'thanksSaved'));
  };

  const handleMarkAnswered = () => {
    if (showTestimony) {
      markAnswered(livePrayer.id, testimony);
      setShowTestimony(false);
      setTestimony('');
    } else {
      setShowTestimony(true);
    }
  };

  // Own prayer → warn first; saved copy → instant unfollow + Undo. Then navigate back.
  const handleDelete = () => removePrayer(livePrayer, onBack);

  // Inline title edit — own personal prayers only (community has its own edit;
  // a saved copy follows the author's title).
  const canEditTitle = !isCommunity && !savedCopy;
  const startEditTitle = () => { setTitleDraft(livePrayer.title || ''); titleCancelRef.current = false; setEditingTitle(true); };
  const saveTitle = () => {
    if (titleCancelRef.current) { titleCancelRef.current = false; setEditingTitle(false); return; }
    const next = titleDraft.trim();
    setEditingTitle(false);
    if (next && next !== livePrayer.title) updatePrayer(livePrayer.id, { title: next });
  };

  const [confirmRemovePoint, setConfirmRemovePoint] = useState(null);

  return (
    <div style={{ minHeight: '100vh', background: 'var(--bg)' }}>
      {showScripture && (
        <ScriptureFirstStep
          prayerId={livePrayer.id}
          title={livePrayer.title}
          description={livePrayer.description}
          lang={lang}
          initialGuidance={livePrayer.scripture_guidance || null}
          onClose={() => setShowScripture(false)}
        />
      )}
      {confirmRemovePoint && (
        <ConfirmDialog
          title={t(lang, 'tipRemovePoint')}
          message={`${tr(confirmRemovePoint.title, lang)} — ${t(lang, 'deleteWarning')}`}
          confirmLabel={t(lang, 'delete')}
          cancelLabel={t(lang, 'cancel')}
          onConfirm={() => { handleRemovePoint(confirmRemovePoint.id); setConfirmRemovePoint(null); }}
          onCancel={() => setConfirmRemovePoint(null)}
        />
      )}
      {showAiConsent && (
        <AiConsentModal
          lang={lang}
          onAccept={() => { setShowAiConsent(false); fetchRecs(); }}
          onCancel={() => setShowAiConsent(false)}
        />
      )}
      {showShareModal && (
        <PrayerShareModal
          prayer={livePrayer}
          groups={groups}
          sharedGroups={sharedGroups}
          authorName={authorName}
          userId={user.id}
          setPrayerShares={setPrayerShares}
          lang={lang}
          onClose={() => setShowShareModal(false)}
        />
      )}
      {/* Community edit modal */}
      {showCommunityEdit && (
        <PrayerForm
          communityMode
          editPrayer={communityPrayer}
          onClose={() => setShowCommunityEdit(false)}
          onCommunitySubmit={async ({ title, description, isAnonymous, categoryIds }) => {
            await updateCommunityPrayer({ prayerId: communityPrayer.id, title, description, isAnonymous, categoryIds });
            // If the owner edits a shared prayer, sync categories back to personal + siblings.
            if (communityPrayer.source_prayer_id && communityPrayer.user_id === user?.id) {
              await syncCategoriesFromCommunity(communityPrayer.source_prayer_id, categoryIds);
            }
          }}
        />
      )}

      {/* Community delete confirm */}
      {showDeleteConfirm && (
        <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-4" style={{ background: 'rgba(0,0,0,0.5)' }} onClick={() => setShowDeleteConfirm(false)}>
          <div ref={deleteTrapRef} tabIndex={-1} role="dialog" aria-modal="true" aria-label={t(lang, 'tipDeletePrayer')} className="w-full max-w-sm rounded-2xl p-5" style={{ background: 'var(--surface)', border: '0.5px solid var(--border)' }} onClick={e => e.stopPropagation()}>
            <h3 className="font-semibold text-base mb-2" style={{ color: 'var(--text-1)' }}>{t(lang, 'tipDeletePrayer')}</h3>
            <p className="text-sm mb-5" style={{ color: 'var(--text-3)' }}>{livePrayer.title}</p>
            <div className="flex gap-2">
              <button onClick={() => setShowDeleteConfirm(false)} className="flex-1 py-2.5 rounded-xl text-sm" style={{ background: 'var(--input-bg)', color: 'var(--text-2)', border: '0.5px solid var(--input-border)' }}>{t(lang, 'cancel')}</button>
              <button onClick={handleDeleteCommunity} disabled={deleting} className="flex-1 py-2.5 rounded-xl text-sm font-medium text-white disabled:opacity-40" style={{ background: '#e53e3e' }}>
                {deleting ? <Loader2 size={14} className="animate-spin mx-auto" /> : t(lang, 'tipDeletePrayer')}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Sticky header */}
      <div
        className="sticky top-0 z-10 px-4 md:px-8 py-4 flex items-center gap-3"
        style={{ background: isAnswered ? 'var(--header-answered)' : 'var(--header)', backdropFilter: 'blur(12px)' }}
      >
        <button
          onClick={onBack}
          title={t(lang, 'tipBack')}
          className="shrink-0 w-9 h-9 flex items-center justify-center rounded-full transition-colors"
          style={{ background: 'rgba(255,255,255,0.15)', color: '#fff' }}
        >
          <ArrowLeft size={18} />
        </button>
        <div className="flex-1 min-w-0">
          {canEditTitle && editingTitle ? (
            <input
              autoFocus
              value={titleDraft}
              onChange={(e) => setTitleDraft(e.target.value)}
              onBlur={saveTitle}
              onKeyDown={(e) => {
                if (e.key === 'Enter') { e.preventDefault(); e.currentTarget.blur(); }
                else if (e.key === 'Escape') { titleCancelRef.current = true; e.currentTarget.blur(); }
              }}
              aria-label={t(lang, 'tipEditPrayer')}
              className="w-full text-base font-semibold bg-transparent border-b outline-none"
              style={{ color: '#fff', borderColor: 'rgba(255,255,255,0.6)' }}
            />
          ) : (
            <h1
              onClick={canEditTitle ? startEditTitle : undefined}
              className={`text-base font-semibold text-white truncate flex items-center gap-1.5 ${canEditTitle ? 'cursor-text' : ''}`}
              style={{ textDecoration: isAnswered ? 'line-through' : 'none' }}
            >
              <span className="truncate">{loc(livePrayer.title)}</span>
              {canEditTitle && <Edit2 size={12} className="shrink-0 opacity-50" />}
            </h1>
          )}
          <p className="text-xs" style={{ color: 'rgba(255,255,255,0.6)' }}>
            {isCommunity
              ? communityAuthor(livePrayer, user?.id, lang) + ' · ' + timeAgo(livePrayer.created_at, lang)
              : (() => {
                  const oa = originAuthor(livePrayer);
                  const author = oa ? `${oa.anonymous ? t(lang, 'anonymous') : oa.name} · ` : '';
                  const group = livePrayer.origin_group_name ? `👥 ${livePrayer.origin_group_name} · ` : '';
                  const date = format(new Date(livePrayer.created_at), 'd MMMM yyyy', { locale });
                  const answered = livePrayer.answered_at ? ` · ${t(lang, 'answeredOn')} ${format(new Date(livePrayer.answered_at), 'd MMM yyyy', { locale })}` : '';
                  return author + group + date + answered;
                })()
            }
          </p>
        </div>
        <div className="flex items-center gap-2 shrink-0">
          {isCommunity ? (
            // Author/admin management only; the primary "I'm praying" action now
            // lives in the prominent Pray-together card below the request.
            <OverflowMenu
              lang={lang}
              ariaLabel={t(lang, 'options')}
              triggerStyle={{ background: 'rgba(255,255,255,0.15)', color: '#fff' }}
              iconColor="#fff"
              items={[
                { key: 'edit', icon: Edit2, label: t(lang, 'edit'), onClick: () => setShowCommunityEdit(true), hidden: !canEditCommunityPrayer },
                { key: 'delete', icon: Trash2, label: t(lang, 'delete'), danger: true, onClick: () => setShowDeleteConfirm(true), hidden: !canEditCommunityPrayer },
              ]}
            />
          ) : (
            // All personal-prayer actions in one labelled menu — pin, share, edit,
            // and (separated) delete/remove. A saved-from-community copy only gets
            // pin + remove (it follows the author's content).
            <OverflowMenu
              lang={lang}
              ariaLabel={t(lang, 'options')}
              triggerStyle={{ background: 'rgba(255,255,255,0.15)', color: '#fff' }}
              iconColor="#fff"
              items={[
                { key: 'scripture', icon: BookOpen, label: t(lang, 'viewScripture'), onClick: () => setShowScripture(true) },
                { key: 'pin', icon: Pin, label: t(lang, livePrayer.pinned ? 'unpin' : 'pin'), onClick: () => togglePin(livePrayer.id) },
                { key: 'share', icon: Share2, label: sharedGroups.length > 0 ? `${t(lang, 'shareWithGroup')} (${sharedGroups.length})` : t(lang, 'shareWithGroup'), onClick: () => setShowShareModal(true), hidden: savedCopy || groups.length === 0 },
                { key: 'edit', icon: Edit2, label: t(lang, 'edit'), onClick: () => onEdit(livePrayer), hidden: savedCopy },
                { key: 'delete', icon: Trash2, label: t(lang, savedCopy ? 'removeFromList' : 'delete'), danger: true, onClick: handleDelete },
              ]}
            />
          )}
        </div>
      </div>

      <div className="px-4 md:px-8 py-5 max-w-2xl mx-auto space-y-4">

        {/* On-demand translation toggle (community content can be in any language) */}
        {isCommunity && (
          <button
            onClick={handleToggleTranslate}
            disabled={translating}
            className="flex items-center gap-1.5 text-xs font-medium disabled:opacity-50"
            style={{ color: 'var(--accent)' }}
          >
            {translating ? <Loader2 size={13} className="animate-spin" /> : <Languages size={13} />}
            {showTranslated ? t(lang, 'showOriginal') : t(lang, 'seeTranslation')}
          </button>
        )}

        {/* ── Organise this prayer: first the categories, then when to pray it.
            In your own list (own prayers and saved community copies) both are
            editable inline; in community mode they stay read-only. */}
        {isCommunity ? (
          prayerCategories.length > 0 && (
            <div className="flex flex-wrap gap-2">
              {prayerCategories.map(c => (
                <span key={c.id} className="text-xs px-3 py-1.5 rounded-full font-medium text-white" style={{ backgroundColor: c.color }}>
                  {c.emoji} {tr(c.name, lang)}
                </span>
              ))}
            </div>
          )
        ) : (
          <>
            <CategorySelector
              categories={categories}
              selectedIds={prayerCategoryIds}
              onToggle={toggleCategory}
              tr={tr}
              lang={lang}
            />
            {livePrayer.for_other && livePrayer.person_name && (
              <span className="inline-flex text-xs px-3 py-1.5 rounded-full font-medium" style={{ background: 'var(--accent-soft)', color: 'var(--accent)', border: '0.5px solid var(--accent-border)' }}>
                👤 {livePrayer.person_name}
              </span>
            )}
          </>
        )}

        {/* Prayer plan (recurrence) — editable inline on any active prayer in your
            own list, so a plan can be added or changed after creation. This
            includes prayers saved from the community: when you pray for them is
            personal (stored on your copy) and independent of the author's content,
            which the saved copy still follows read-only. */}
        {!isCommunity && !isAnswered ? (
          <SchedulePlanner
            schedule={livePrayer.schedule || null}
            lang={lang}
            onSave={(schedule) => updatePrayer(livePrayer.id, { schedule })}
          />
        ) : (
          livePrayer.schedule && (
            <p className="text-xs flex items-center gap-1.5 rounded-xl px-3 py-2" style={{ background: 'var(--accent-soft)', color: 'var(--accent)', border: '0.5px solid var(--accent-border)' }}>
              <Repeat size={12} className="shrink-0" /> {scheduleSummary(livePrayer.schedule, lang)}
            </p>
          )
        )}

        {/* Guided plan: today's theme + passage (only on a plan day) */}
        {livePrayer.schedule?.plan && (() => {
          const n = planDayNumber(livePrayer.schedule, todayKey());
          const content = n ? planDayContent(livePrayer.schedule.plan.id, n) : null;
          if (!content) return null;
          return (
            <div className="rounded-2xl p-4" style={{ background: 'var(--surface)', border: '0.5px solid var(--border)' }}>
              <p className="text-xs font-semibold uppercase tracking-widest mb-1" style={{ color: 'var(--accent)' }}>
                {t(lang, 'planDayOf', { n, total: livePrayer.schedule.end?.count || '' })}
              </p>
              <p className="text-sm font-medium mb-2" style={{ color: 'var(--text-1)' }}>{pick(content.theme, lang)}</p>
              <VerseAccordion reference={content.ref} lang={lang}>
                {({ toggle }) => (
                  <button
                    onClick={toggle}
                    className="text-xs flex items-center gap-1.5"
                    style={{ color: 'var(--accent)' }}
                  >
                    <BookOpen size={12} /> {content.ref}
                  </button>
                )}
              </VerseAccordion>
            </div>
          );
        })()}
        {/* Description */}
        {livePrayer.description && (
          <div className="rounded-2xl p-4" style={{ background: 'var(--surface)', border: '0.5px solid var(--border)' }}>
            <p className="text-xs font-semibold uppercase tracking-widest mb-2" style={{ color: 'var(--text-3)' }}>{t(lang, 'details')}</p>
            <p className="text-sm leading-relaxed" style={{ color: 'var(--text-2)', lineHeight: 1.7 }}>
              {loc(livePrayer.description)}
            </p>
          </div>
        )}


        {/* ── Per-prayer follow-up reminder (own personal prayers only) ── */}
        {!isCommunity && !savedCopy && !isAnswered && (
          <FollowUpBanner
            prayer={livePrayer}
            lang={lang}
            onAddUpdate={() => {
              const el = document.getElementById('pd-updates');
              el?.scrollIntoView({ behavior: 'smooth', block: 'center' });
              el?.querySelector('input')?.focus();
            }}
            onMarkAnswered={handleMarkAnswered}
          />
        )}

        {/* ── Saved-from-community: read-only follow indicator ── */}
        {savedCopy && (
          <p className="flex items-center gap-1.5 text-xs" style={{ color: 'var(--text-3)' }}>
            <Users size={12} style={{ color: 'var(--accent)' }} /> {t(lang, 'followsGroup')}
          </p>
        )}

        {/* ── Community mode: pray-together (primary action + who's praying) ── */}
        {isCommunity && (
          <PrayTogetherCard
            communityPrayer={communityPrayer}
            count={communityReactionCount}
            hasReacted={communityHasReacted}
            busy={togglingPraying}
            lang={lang}
            user={user}
            onTogglePraying={handleTogglePraying}
          />
        )}

        {/* ── Community mode: prayer-chain calendar (claim a day) ── */}
        {isCommunity && (
          <GroupPrayerCalendar
            communityPrayer={communityPrayer}
            groupId={communityPrayer.group_id}
            lang={lang}
            user={user}
          />
        )}

        {/* ── Community mode: member updates ── */}
        {isCommunity && (
          <CommunityUpdates
            updates={communityUpdates}
            loading={loadingUpdates}
            loc={loc}
            lang={lang}
            userId={user?.id}
            onSend={handleSendWord}
          />
        )}

        {/* ── Prayer points + AI suggestions (both modes) ── */}
        <div className="rounded-2xl p-4" style={{ background: 'var(--surface)', border: '0.5px solid var(--border)' }}>
          <div className="flex items-center justify-between mb-3">
            <p className="text-xs font-semibold uppercase tracking-widest" style={{ color: 'var(--text-3)' }}>{t(lang, 'aiSubjects')}</p>
            {(isCommunity || canAddContent) && (
              <div className="flex items-center gap-1.5">
                <button
                  onClick={fetchRecs}
                  disabled={loadingRecs}
                  title={t(lang, 'tipAiSuggest')}
                  className="flex items-center gap-1.5 text-xs rounded-full px-3 py-1.5 font-medium disabled:opacity-50 text-white"
                  style={{ background: 'var(--accent)' }}
                >
                  {loadingRecs ? <Loader2 size={11} className="animate-spin" /> : <Sparkles size={11} />}
                  {t(lang, 'aiSuggest')}
                </button>
              </div>
            )}
          </div>

          {(livePrayer.prayer_points || []).length === 0 && !loadingRecs && updateRecs.length === 0 && (
            <p className="text-sm italic" style={{ color: 'var(--text-3)' }}>{t(lang, 'aiPlaceholder')}</p>
          )}

          <div className="space-y-2">
            {(livePrayer.prayer_points || []).map(pp => {
              // Support both new `verses` array and legacy `verse`/`verse_text` fields
              const verses = pp.verses?.length
                ? pp.verses
                : pp.verse ? [{ ref: pp.verse, text: pp.verse_text || '' }] : [];
              return (
                <div key={pp.id} className="group rounded-xl p-3" style={{ background: '#fff8e6', borderLeft: '3px solid #f5c842' }}>
                  <div className="flex items-start gap-2">
                    <p className="flex-1 text-sm leading-snug" style={{ color: '#5a4500' }}>{loc(pp.title)}</p>
                    {canRemoveContent && (
                      <button onClick={() => setConfirmRemovePoint(pp)} title={t(lang, 'tipRemovePoint')} className="shrink-0 opacity-0 group-hover:opacity-100 transition-opacity" style={{ color: '#c4a020' }}>
                        <Trash2 size={13} />
                      </button>
                    )}
                  </div>

                  {/* Verse pills */}
                  {verses.length > 0 && (
                    <div className="flex flex-wrap gap-1.5 mt-2">
                      {verses.map((v, i) => (
                        <div key={i} className="group/verse inline-flex items-start gap-1">
                          <VerseAccordion reference={v.ref} lang={lang} initialText={loc(v.text)} panelStyle={{ background: '#fffbf0', border: '0.5px solid #f0dfa0' }}>
                            {({ toggle }) => (
                              <button
                                onClick={toggle}
                                title={t(lang, 'tipVerseToggle')}
                                className="flex items-center gap-1 text-xs px-2 py-1 rounded-full"
                                style={{ background: '#f5e8a0', color: '#7a5e00' }}
                              >
                                <BookOpen size={9} /> {v.ref}
                              </button>
                            )}
                          </VerseAccordion>
                          {canRemoveContent && (
                            <button onClick={() => handleRemoveVerse(pp.id, v.ref)} title={t(lang, 'tipRemoveVerse')} className="opacity-0 group-hover/verse:opacity-100 transition-opacity mt-1.5 shrink-0" style={{ color: '#c04040' }}>
                              <Trash2 size={11} />
                            </button>
                          )}
                        </div>
                      ))}
                    </div>
                  )}

                  {/* Add verse inline form */}
                  {canAddContent && (
                    addingVerseTo === pp.id ? (
                      <div className="mt-2 space-y-1.5">
                        <input
                          type="text"
                          value={newVerse.ref}
                          onChange={e => setNewVerse(v => ({ ...v, ref: e.target.value }))}
                          placeholder={t(lang, 'verseRefPlaceholder')}
                          className="w-full text-xs rounded-lg px-2.5 py-1.5 focus:outline-none"
                          style={{ background: '#fffbf0', border: '0.5px solid #f0dfa0', color: '#5a4500' }}
                          autoFocus
                        />
                        <input
                          type="text"
                          value={newVerse.text}
                          onChange={e => setNewVerse(v => ({ ...v, text: e.target.value }))}
                          placeholder={t(lang, 'verseTextPlaceholder')}
                          className="w-full text-xs rounded-lg px-2.5 py-1.5 focus:outline-none"
                          style={{ background: '#fffbf0', border: '0.5px solid #f0dfa0', color: '#5a4500' }}
                        />
                        <div className="flex gap-1.5">
                          <button onClick={() => { setAddingVerseTo(null); setNewVerse({ ref: '', text: '' }); }} className="flex-1 text-xs rounded-lg py-1.5" style={{ background: '#f5e8a0', color: '#7a5e00' }}>{t(lang, 'cancel')}</button>
                          <button
                            onClick={() => {
                              if (!newVerse.ref.trim()) return;
                              handleAddVerse(pp.id, { ref: newVerse.ref.trim(), text: newVerse.text.trim() });
                              setAddingVerseTo(null);
                              setNewVerse({ ref: '', text: '' });
                            }}
                            title={t(lang, 'tipSaveVerse')}
                            className="flex-1 text-xs rounded-lg py-1.5 font-medium"
                            style={{ background: '#f5c842', color: '#5a4500' }}
                          >
                            {t(lang, 'addVerse')}
                          </button>
                        </div>
                      </div>
                    ) : (
                      <button
                        onClick={() => { setAddingVerseTo(pp.id); setNewVerse({ ref: '', text: '' }); }}
                        title={t(lang, 'tipAddVerse')}
                        className="mt-1.5 flex items-center gap-1 text-xs"
                        style={{ color: '#c4a020' }}
                      >
                        <Plus size={11} /> {t(lang, 'addVerse')}
                      </button>
                    )
                  )}
                </div>
              );
            })}
          </div>

          {recsError && <p className="text-xs rounded-xl px-3 py-2 mt-2" style={{ color: '#a07010', background: '#fff8e0' }}>{recsError}</p>}

          <div className="space-y-2 mt-2">
            {updateRecs.map(rec => (
              <div key={rec.title} className="rounded-xl p-3" style={{ background: 'var(--accent-soft)', border: '0.5px solid var(--accent-border)' }}>
                <div className="flex gap-2 items-start">
                  <p className="flex-1 text-sm leading-snug font-medium" style={{ color: 'var(--text-1)' }}>{rec.title}</p>
                  <button
                    onClick={async () => {
                      await handleAddPoint({ title: rec.title, verses: rec.verses });
                      setUpdateRecs(prev => prev.filter(r => r.title !== rec.title));
                    }}
                    title={t(lang, 'tipAddPoint')}
                    className="shrink-0 rounded-xl p-1.5 text-white"
                    style={{ background: 'var(--accent)' }}
                  >
                    <Plus size={13} />
                  </button>
                </div>
                {(rec.verses || []).length > 0 && (
                  <div className="flex flex-wrap gap-1.5 mt-2">
                    {rec.verses.map((v, i) => (
                      <VerseAccordion key={i} reference={v.ref} lang={lang} initialText={v.text} panelStyle={{ background: 'var(--surface)', border: '0.5px solid var(--accent-border)' }}>
                        {({ toggle }) => (
                          <button
                            onClick={toggle}
                            title={t(lang, 'tipVerseToggle')}
                            className="flex items-center gap-1 text-xs px-2 py-1 rounded-full"
                            style={{ background: 'var(--accent-border)', color: 'var(--accent)' }}
                          >
                            <BookOpen size={9} /> {v.ref}
                          </button>
                        )}
                      </VerseAccordion>
                    ))}
                  </div>
                )}
              </div>
            ))}
          </div>

          {updateRecs.length > 0 && <AiDisclaimer lang={lang} className="mt-2" />}

          {/* Manual prayer point input */}
          {canAddContent && (
            showManualForm ? (
              <div className="mt-3 rounded-xl p-3 space-y-2" style={{ background: 'var(--surface-2)', border: '0.5px solid var(--border)' }}>
                <input
                  type="text"
                  value={manualPoint.title}
                  onChange={e => setManualPoint(p => ({ ...p, title: e.target.value }))}
                  placeholder={t(lang, 'pointTitlePlaceholder')}
                  className="w-full text-sm rounded-xl px-3 py-2 focus:outline-none"
                  style={{ background: 'var(--input-bg)', border: '0.5px solid var(--input-border)', color: 'var(--text-1)' }}
                  autoFocus
                />
                <input
                  type="text"
                  value={manualPoint.verse}
                  onChange={e => setManualPoint(p => ({ ...p, verse: e.target.value }))}
                  placeholder={t(lang, 'pointVersePlaceholder')}
                  className="w-full text-sm rounded-xl px-3 py-2 focus:outline-none"
                  style={{ background: 'var(--input-bg)', border: '0.5px solid var(--input-border)', color: 'var(--text-1)' }}
                />
                <div className="flex gap-2">
                  <button
                    onClick={() => setShowManualForm(false)}
                    className="flex-1 text-sm rounded-xl py-2"
                    style={{ background: 'var(--input-bg)', color: 'var(--text-2)', border: '0.5px solid var(--input-border)' }}
                  >
                    {t(lang, 'cancel')}
                  </button>
                  <button
                    onClick={() => {
                      if (!manualPoint.title.trim()) return;
                      handleAddPoint({ title: manualPoint.title.trim(), verse: manualPoint.verse.trim() });
                      setManualPoint({ title: '', verse: '' });
                      setShowManualForm(false);
                    }}
                    title={t(lang, 'tipAddManualPoint')}
                    className="flex-1 text-sm rounded-xl py-2 font-medium text-white"
                    style={{ background: 'var(--accent)' }}
                  >
                    {t(lang, 'addBtn')}
                  </button>
                </div>
              </div>
            ) : (
              <button
                onClick={() => setShowManualForm(true)}
                className="mt-3 flex items-center gap-1.5 text-xs font-medium"
                style={{ color: 'var(--accent)' }}
              >
                <Plus size={13} /> {t(lang, 'addPointManually')}
              </button>
            )
          )}
        </div>

        {/* ── Community mode: testimonies posted for this prayer ── */}
        {isCommunity && (
          <CommunityTestimonies items={prayerTestimonies} loc={loc} lang={lang} userId={user?.id} />
        )}

        {/* ── Community mode: mark answered (author/admin) — mirrors personal ── */}
        {isCommunity && canEditCommunityPrayer && (
          <>
            {!isAnswered && (
              <div className="rounded-2xl p-4" style={{ background: 'var(--surface)', border: '0.5px solid var(--border)' }}>
                <p className="text-xs font-semibold uppercase tracking-widest mb-2" style={{ color: 'var(--text-3)' }}>{t(lang, 'testimony')}</p>
                <textarea
                  value={testimony}
                  onChange={e => setTestimony(e.target.value)}
                  placeholder={t(lang, 'testimonyPlaceholder')}
                  rows={3}
                  className="w-full text-sm rounded-xl px-3 py-2.5 resize-none focus:outline-none"
                  style={{ background: 'var(--input-bg)', border: '0.5px solid var(--input-border)', color: 'var(--text-1)' }}
                />
              </div>
            )}
            <div className="flex gap-3">
              {!isAnswered ? (
                <button onClick={handleConfirmCommunityAnswered} title={t(lang, 'tipConfirm')} className="flex items-center gap-2 text-sm px-4 py-3 rounded-xl font-medium" style={{ background: 'var(--card-answered-bg)', color: 'var(--success)', border: '0.5px solid var(--card-answered-border)' }}>
                  <CheckCircle size={15} /> {t(lang, 'confirm')}
                </button>
              ) : (
                <button onClick={handleResumeCommunity} title={t(lang, 'tipResume')} className="flex items-center gap-2 text-sm px-4 py-3 rounded-xl font-medium" style={{ background: 'var(--accent-soft)', color: 'var(--accent)' }}>
                  {t(lang, 'resumePrayer')}
                </button>
              )}
            </div>
          </>
        )}

        {/* ── Community mode: testimony (members; author/admin use the answered flow) ── */}
        {isCommunity && !canEditCommunityPrayer && (
          testimonySent ? (
            <div className="rounded-xl px-4 py-3 text-sm text-center" style={{ background: 'var(--accent-soft)', color: 'var(--accent)' }}>
              🎉 {t(lang, 'testimony')}
            </div>
          ) : showCommunityTestimony ? (
            <div className="rounded-2xl p-4" style={{ background: 'var(--surface)', border: '0.5px solid var(--border)' }}>
              <p className="text-xs font-semibold uppercase tracking-widest mb-3" style={{ color: 'var(--text-3)' }}>{t(lang, 'postTestimony')}</p>
              <textarea
                value={communityTestimonyText}
                onChange={e => setCommunityTestimonyText(e.target.value)}
                rows={3}
                className="w-full text-sm rounded-xl px-3 py-2.5 resize-none focus:outline-none mb-3"
                style={{ background: 'var(--input-bg)', border: '0.5px solid var(--input-border)', color: 'var(--text-1)' }}
                autoFocus
              />
              <AnonymousToggle checked={communityTestimonyAnon} onChange={setCommunityTestimonyAnon} lang={lang} className="mb-3" />
              <div className="flex gap-2">
                <button onClick={() => setShowCommunityTestimony(false)} className="flex-1 py-2.5 rounded-xl text-sm" style={{ background: 'var(--input-bg)', color: 'var(--text-2)', border: '0.5px solid var(--input-border)' }}>{t(lang, 'cancel')}</button>
                <button onClick={handlePostCommunityTestimony} disabled={!communityTestimonyText.trim() || postingTestimony} className="flex-1 py-2.5 rounded-xl text-sm font-medium text-white disabled:opacity-40" style={{ background: 'var(--accent)' }}>
                  {postingTestimony ? <Loader2 size={14} className="animate-spin mx-auto" /> : t(lang, 'postTestimony')}
                </button>
              </div>
            </div>
          ) : (
            <button onClick={() => setShowCommunityTestimony(true)} className="w-full py-3 rounded-xl text-sm font-medium" style={{ background: 'var(--accent-soft)', color: 'var(--accent)', border: '0.5px solid var(--accent-border)' }}>
              🎉 {t(lang, 'postTestimony')}
            </button>
          )
        )}

        {/* ── Personal mode: updates, testimony, actions. The per-prayer plan
            (recurrence) is edited via SchedulePlanner near the top; the old
            "prayer days" toggle here was redundant with it and has been removed. */}
        {!isCommunity && <>
        <div className="rounded-2xl p-4" style={{ background: 'var(--surface)', border: '0.5px solid var(--border)' }}>
          <p className="text-xs font-semibold uppercase tracking-widest mb-3" style={{ color: 'var(--text-3)' }}>{t(lang, 'evolutions')}</p>

          {allUpdates.length === 0 && (
            <p className="text-sm italic mb-3" style={{ color: 'var(--text-3)' }}>{t(lang, 'noUpdate')}</p>
          )}

          <div className="space-y-3 mb-3">
            {allUpdates.map(u => (
              <div key={u.id} className="flex gap-3">
                <div className="w-0.5 rounded-full shrink-0 mt-1.5" style={{ background: 'var(--accent)', alignSelf: 'stretch', minHeight: '14px' }} />
                <div>
                  <p className="text-sm leading-snug" style={{ color: 'var(--text-1)' }}>{tr(u.text, lang)}</p>
                  <p className="text-xs mt-0.5" style={{ color: 'var(--text-3)' }}>
                    {u.author_name ? `${u.is_anonymous ? t(lang, 'anonymous') : u.author_name} · ` : ''}{format(new Date(u.created_at), 'd MMM yy', { locale })}
                  </p>
                </div>
              </div>
            ))}
          </div>

          {!isAnswered && canManage && (
            <div className="flex gap-2" id="pd-updates">
              <input
                type="text"
                value={newUpdate}
                onChange={e => setNewUpdate(e.target.value)}
                placeholder={t(lang, 'newUpdate')}
                className="flex-1 text-sm rounded-xl px-3 py-2 focus:outline-none"
                style={{ background: 'var(--input-bg)', border: '0.5px solid var(--input-border)', color: 'var(--text-1)' }}
                onKeyDown={e => e.key === 'Enter' && handleAddUpdate()}
              />
              <button onClick={handleAddUpdate} title={t(lang, "tipSaveUpdate")} className="rounded-xl px-4 flex items-center justify-center text-white text-sm font-medium" style={{ background: 'var(--accent)' }}>
                <Plus size={16} />
              </button>
            </div>
          )}
        </div>


        {/* Testimonies — the prayer's own (preserved across resume) plus any posted
            on its community copies (read-only). Always above the write field. */}
        {(personalTestimonies.length > 0 || sharedActivity.testimonies.length > 0) && (
          <div className="rounded-2xl p-4" style={{ background: 'var(--surface)', border: '0.5px solid var(--border)' }}>
            <p className="text-xs font-semibold uppercase tracking-widest mb-3" style={{ color: 'var(--text-3)' }}>{t(lang, 'testimonies')}</p>
            <div className="space-y-3">
              {personalTestimonies.map(tm => (
                <div key={tm.id} className="rounded-xl p-3" style={{ background: 'var(--accent-soft)', border: '0.5px solid var(--accent-border)' }}>
                  {tm.created_at && (
                    <p className="text-xs mb-1" style={{ color: 'var(--text-3)' }}>🎉 {format(new Date(tm.created_at), 'd MMM yyyy', { locale })}</p>
                  )}
                  <p className="text-sm italic leading-relaxed" style={{ color: 'var(--text-1)' }}>"{tr(tm.content, lang)}"</p>
                </div>
              ))}
              {sharedActivity.testimonies.map(tm => (
                <div key={tm.id} className="rounded-xl p-3" style={{ background: 'var(--accent-soft)', border: '0.5px solid var(--accent-border)' }}>
                  <p className="text-xs mb-1" style={{ color: 'var(--text-3)' }}>🎉 {communityAuthor(tm, user?.id, lang)} · {timeAgo(tm.created_at, lang)}</p>
                  <p className="text-sm italic leading-relaxed" style={{ color: 'var(--text-1)' }}>"{tr(tm.content, lang)}"</p>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Add a word of thanks to an already-answered prayer — remembrance,
            without changing the answered date */}
        {isAnswered && canManage && (
          showThanks ? (
            <div className="rounded-2xl p-4" style={{ background: 'var(--surface)', border: '0.5px solid var(--border)' }}>
              <p className="text-xs font-semibold uppercase tracking-widest mb-2" style={{ color: 'var(--text-3)' }}>{t(lang, 'testimony')}</p>
              <textarea
                value={thanksText}
                onChange={e => setThanksText(e.target.value)}
                placeholder={t(lang, 'testimonyPlaceholder')}
                rows={3}
                className="w-full text-sm rounded-xl px-3 py-2.5 resize-none focus:outline-none"
                style={{ background: 'var(--input-bg)', border: '0.5px solid var(--input-border)', color: 'var(--text-1)' }}
                autoFocus
              />
              <div className="flex gap-2 mt-3">
                <button onClick={() => { setShowThanks(false); setThanksText(''); }} className="flex-1 py-2.5 rounded-xl text-sm" style={{ background: 'var(--input-bg)', color: 'var(--text-2)', border: '0.5px solid var(--input-border)' }}>{t(lang, 'cancel')}</button>
                <button onClick={handleAddThanks} disabled={!thanksText.trim() || savingThanks} className="flex-1 py-2.5 rounded-xl text-sm font-medium text-white disabled:opacity-40" style={{ background: 'var(--accent)' }}>
                  {savingThanks ? <Loader2 size={14} className="animate-spin mx-auto" /> : t(lang, 'addThanks')}
                </button>
              </div>
            </div>
          ) : (
            <button onClick={() => setShowThanks(true)} className="w-full py-3 rounded-xl text-sm font-medium" style={{ background: 'var(--accent-soft)', color: 'var(--accent)', border: '0.5px solid var(--accent-border)' }}>
              🙏 {t(lang, 'addThanks')}
            </button>
          )
        )}

        {/* Testimony input (writing) */}
        {!isAnswered && showTestimony && canManage && (
          <div className="rounded-2xl p-4" style={{ background: 'var(--surface)', border: '0.5px solid var(--border)' }}>
            <p className="text-xs font-semibold uppercase tracking-widest mb-2" style={{ color: 'var(--text-3)' }}>{t(lang, 'testimony')}</p>
            <textarea
              value={testimony}
              onChange={e => setTestimony(e.target.value)}
              placeholder={t(lang, 'testimonyPlaceholder')}
              className="w-full text-sm rounded-xl px-3 py-2.5 resize-none focus:outline-none"
              style={{ background: 'var(--input-bg)', border: '0.5px solid var(--input-border)', color: 'var(--text-1)' }}
              rows={3}
              autoFocus
            />
          </div>
        )}

        {/* Actions */}
        <div className="flex gap-3 pb-6">
          {!isAnswered && canManage && (
            <button onClick={handleMarkAnswered} title={showTestimony ? t(lang, "tipConfirm") : t(lang, "tipMarkAnswered")} className="flex items-center gap-2 text-sm px-4 py-3 rounded-xl font-medium" style={{ background: 'var(--card-answered-bg)', color: 'var(--success)', border: '0.5px solid var(--card-answered-border)' }}>
              <CheckCircle size={15} />
              {showTestimony ? t(lang, 'confirm') : t(lang, 'markAnswered')}
            </button>
          )}
          {isAnswered && canManage && (
            <button onClick={() => markActive(livePrayer.id)} title={t(lang, "tipResume")} className="flex items-center gap-2 text-sm px-4 py-3 rounded-xl font-medium" style={{ background: 'var(--accent-soft)', color: 'var(--accent)' }}>
              {t(lang, 'resumePrayer')}
            </button>
          )}
        </div>
        </>}
      </div>
    </div>
  );
}
