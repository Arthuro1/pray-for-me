import { useState, useEffect } from 'react';
import { ArrowLeft, Plus, Trash2, Edit2, CheckCircle, Sparkles, Loader2, BookOpen, ExternalLink, Share2, HandHeart, Send, BookmarkPlus, BookmarkCheck, Languages } from 'lucide-react';
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
import AiConsentModal, { hasAiConsent } from '../components/AiConsentModal';
import PrayerForm from '../components/PrayerForm';
import Avatar from '../components/Avatar';
import ConfirmDialog from '../components/ConfirmDialog';
import { useEscapeKey } from '../hooks/useEscapeKey';

// communityPrayer prop switches the component to community mode
export default function PrayerDetail({ prayer, communityPrayer, onBack, onEdit, lang = 'en' }) {
  const isCommunity = !!communityPrayer;

  // ── Personal mode state ──────────────────────────────────────────────────
  const [newUpdate, setNewUpdate] = useState('');
  const [showTestimony, setShowTestimony] = useState(true);
  const [testimony, setTestimony] = useState('');
  const [updateRecs, setUpdateRecs] = useState([]);
  const [loadingRecs, setLoadingRecs] = useState(false);
  const [recsError, setRecsError] = useState(null);
  const [expandedVerse, setExpandedVerse] = useState(null);
  const [manualPoint, setManualPoint] = useState({ title: '', verse: '' });
  const [showManualForm, setShowManualForm] = useState(false);
  const [addingVerseTo, setAddingVerseTo] = useState(null);
  const [newVerse, setNewVerse] = useState({ ref: '', text: '' });
  const [showAiConsent, setShowAiConsent] = useState(false);
  const [showShareModal, setShowShareModal] = useState(false);
  const [sharing, setSharing] = useState(false);
  const [shareGroupIds, setShareGroupIds] = useState(new Set());
  const [shareAnon, setShareAnon] = useState(false);

  // ── Community mode state ─────────────────────────────────────────────────
  const [communityUpdates, setCommunityUpdates] = useState([]);
  const [loadingUpdates, setLoadingUpdates] = useState(false);
  const [wordText, setWordText] = useState('');
  const [wordAnon, setWordAnon] = useState(false);
  const [sendingWord, setSendingWord] = useState(false);
  const [showCommunityTestimony, setShowCommunityTestimony] = useState(false);
  const [communityTestimonyText, setCommunityTestimonyText] = useState('');
  const [communityTestimonyAnon, setCommunityTestimonyAnon] = useState(false);
  const [postingTestimony, setPostingTestimony] = useState(false);
  const [testimonySent, setTestimonySent] = useState(false);
  const [showCommunityEdit, setShowCommunityEdit] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [savingToPersonal, setSavingToPersonal] = useState(false);

  const { categories, markAnswered, markActive, addUpdate, addPrayerPoint, addVerseToPoint, removeVerseFromPoint, removePrayerPoint, deletePrayer, addFromCommunity, syncCategoriesFromCommunity, updatePrayer, prayers } = usePrayerStore();
  const { tr, translateTexts, translating } = useTranslationStore();
  const [showTranslated, setShowTranslated] = useState(false);
  // Esc closes whichever inline overlay is open (ConfirmDialog handles its own).
  useEscapeKey(
    showShareModal ? () => setShowShareModal(false)
      : showDeleteConfirm ? () => setShowDeleteConfirm(false)
      : null
  );
  const { user } = useAuthStore();
  const { groups, activeGroupId, prayers: communityPrayers, userReactions, toggleReaction, fetchUserReactions, fetchPrayerUpdates, addUpdate: addCommunityUpdate, addTestimony, updatePrayer: updateCommunityPrayer, deleteCommunityPrayer, addCommunityPrayerPoint, removeCommunityPrayerPoint, addCommunityVerse, removeCommunityVerse, setCommunityAnswered, testimonies: communityTestimonies, prayerShares, fetchGroups, fetchPrayerShares, setPrayerShares, refreshPrayer, subscribePrayerActivity } = useCommunityStore();

  const locale = dateLocale(lang);
  const authorName = getAuthorName(user);

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

  const handleSendWord = async () => {
    if (!wordText.trim() || sendingWord) return;
    setSendingWord(true);
    await addCommunityUpdate({ prayerId: communityPrayer.id, sourcePrayerId: communityPrayer.source_prayer_id, userId: user.id, authorName, text: wordText.trim(), isAnonymous: wordAnon });
    // Re-fetch so the timeline reflects the (possibly synced) update.
    setCommunityUpdates(await fetchPrayerUpdates(communityPrayer.id));
    setWordText('');
    setSendingWord(false);
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

  const handleAddToPersonal = async () => {
    if (savingToPersonal || alreadyInPersonal) return;
    setSavingToPersonal(true);
    const groupName = groups.find(g => g.id === communityPrayer.group_id)?.name || null;
    const res = await addFromCommunity(communityPrayer, groupName);
    setSavingToPersonal(false);
    if (res?.error) toast.error(t(lang, 'errorGeneric'));
    else toast.success(t(lang, 'addedToMyPrayers'));
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

  const openShareModal = () => {
    setShareGroupIds(new Set(sharedGroups.map(g => g.groupId)));
    setShareAnon(sharedGroups.some(g => g.isAnonymous));
    setShowShareModal(true);
  };

  const toggleShareGroup = (groupId) => {
    setShareGroupIds(prev => {
      const next = new Set(prev);
      next.has(groupId) ? next.delete(groupId) : next.add(groupId);
      return next;
    });
  };

  const handleSaveShares = async () => {
    if (sharing) return;
    setSharing(true);
    const res = await setPrayerShares({ prayer: livePrayer, groupIds: [...shareGroupIds], userId: user.id, authorName, isAnonymous: shareAnon });
    setSharing(false);
    if (res?.error) { toast.error(t(lang, 'errorGeneric')); return; }
    setShowShareModal(false);
  };

  // Clear pending AI suggestions when language changes so user can re-generate in new language
  useEffect(() => { setUpdateRecs([]); setRecsError(null); }, [lang]);

  // Reset the community translation toggle when the prayer or language changes
  useEffect(() => { setShowTranslated(false); }, [communityPrayer?.id, lang]);

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
    await translateTexts(texts.filter(Boolean), lang, user?.id);
    setShowTranslated(true);
  };

  const bibleUrl = verse => `https://www.bible.com/search/bible?q=${encodeURIComponent(verse)}&version_id=93`;

  const handleAddUpdate = () => {
    if (!newUpdate.trim()) return;
    addUpdate(livePrayer.id, newUpdate.trim(), authorName);
    setNewUpdate('');
    setUpdateRecs([]);
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

  const handleMarkAnswered = () => {
    if (showTestimony) {
      markAnswered(livePrayer.id, testimony);
      setShowTestimony(false);
      setTestimony('');
    } else {
      setShowTestimony(true);
    }
  };

  const handleDelete = () => {
    deletePrayer(livePrayer.id);
    onBack();
  };

  const [showPersonalDelete, setShowPersonalDelete] = useState(false);
  const [confirmRemovePoint, setConfirmRemovePoint] = useState(null);

  return (
    <div style={{ minHeight: '100vh', background: 'var(--bg)' }}>
      {showPersonalDelete && (
        <ConfirmDialog
          title={t(lang, 'tipDeletePrayer')}
          message={`${livePrayer.title} — ${t(lang, 'deleteWarning')}`}
          confirmLabel={t(lang, 'delete')}
          cancelLabel={t(lang, 'cancel')}
          onConfirm={handleDelete}
          onCancel={() => setShowPersonalDelete(false)}
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
        <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-4" style={{ background: 'rgba(0,0,0,0.5)' }}>
          <div className="w-full max-w-sm rounded-2xl p-5" style={{ background: 'var(--surface)', border: '0.5px solid var(--border)' }}>
            <h3 className="font-semibold text-base mb-1" style={{ color: 'var(--text-1)' }}>{t(lang, 'shareWithGroup')}</h3>
            <p className="text-sm mb-4" style={{ color: 'var(--text-3)' }}>{livePrayer.title}</p>
            <div className="space-y-2 mb-5 max-h-60 overflow-y-auto">
              {groups.map(g => {
                const checked = shareGroupIds.has(g.id);
                return (
                  <label key={g.id} className="flex items-center gap-3 p-2.5 rounded-xl cursor-pointer" style={{ background: 'var(--input-bg)', border: '0.5px solid var(--input-border)' }}>
                    <input type="checkbox" checked={checked} onChange={() => toggleShareGroup(g.id)} className="rounded" />
                    <span className="text-sm" style={{ color: 'var(--text-1)' }}>{g.name}</span>
                  </label>
                );
              })}
            </div>
            <label className="flex items-center gap-2 text-sm mb-5 cursor-pointer" style={{ color: 'var(--text-2)' }}>
              <input type="checkbox" checked={shareAnon} onChange={e => setShareAnon(e.target.checked)} className="rounded" />
              {t(lang, 'anonymous')}
            </label>
            <div className="flex gap-2">
              <button onClick={() => setShowShareModal(false)} className="flex-1 py-2.5 rounded-xl text-sm font-medium" style={{ background: 'var(--input-bg)', color: 'var(--text-2)', border: '0.5px solid var(--input-border)' }}>
                {t(lang, 'cancel')}
              </button>
              <button onClick={handleSaveShares} disabled={sharing} className="flex-1 py-2.5 rounded-xl text-sm font-medium text-white disabled:opacity-40" style={{ background: 'var(--accent)' }}>
                {sharing ? <Loader2 size={14} className="animate-spin mx-auto" /> : t(lang, 'save')}
              </button>
            </div>
          </div>
        </div>
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
        <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-4" style={{ background: 'rgba(0,0,0,0.5)' }}>
          <div className="w-full max-w-sm rounded-2xl p-5" style={{ background: 'var(--surface)', border: '0.5px solid var(--border)' }}>
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
          <h1 className="text-base font-semibold text-white truncate" style={{ textDecoration: isAnswered ? 'line-through' : 'none' }}>
            {loc(livePrayer.title)}
          </h1>
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
            <>
              {canEditCommunityPrayer && (
                <>
                  <button onClick={() => setShowCommunityEdit(true)} title={t(lang, 'tipEditPrayer')} className="w-9 h-9 flex items-center justify-center rounded-full" style={{ background: 'rgba(255,255,255,0.15)', color: '#fff' }}>
                    <Edit2 size={15} />
                  </button>
                  <button onClick={() => setShowDeleteConfirm(true)} title={t(lang, 'tipDeletePrayer')} className="w-9 h-9 flex items-center justify-center rounded-full" style={{ background: 'rgba(255,255,255,0.15)', color: '#fff' }}>
                    <Trash2 size={15} />
                  </button>
                </>
              )}
              <button
                onClick={handleAddToPersonal}
                disabled={alreadyInPersonal || savingToPersonal}
                title={alreadyInPersonal ? t(lang, 'addedToMyPrayers') : t(lang, 'addToMyPrayers')}
                className="w-9 h-9 flex items-center justify-center rounded-full disabled:opacity-100"
                style={{ background: alreadyInPersonal ? '#fff' : 'rgba(255,255,255,0.15)', color: alreadyInPersonal ? 'var(--accent)' : '#fff' }}
              >
                {savingToPersonal ? <Loader2 size={15} className="animate-spin" /> : alreadyInPersonal ? <BookmarkCheck size={15} /> : <BookmarkPlus size={15} />}
              </button>
              <button
                onClick={() => toggleReaction(communityPrayer.id, user.id)}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-medium transition-all"
                style={{ background: communityHasReacted ? '#fff' : 'rgba(255,255,255,0.15)', color: communityHasReacted ? 'var(--accent)' : '#fff' }}
              >
                <HandHeart size={14} />
                {communityReactionCount > 0 && <span>{communityReactionCount}</span>}
                <span>{t(lang, 'iAmPraying')}</span>
              </button>
            </>
          ) : (
            <>
              {groups.length > 0 && (
                <button onClick={openShareModal} title={t(lang, 'shareWithGroup')} className="relative w-9 h-9 flex items-center justify-center rounded-full" style={{ background: sharedGroups.length > 0 ? '#fff' : 'rgba(255,255,255,0.15)', color: sharedGroups.length > 0 ? 'var(--accent)' : '#fff' }}>
                  <Share2 size={15} />
                </button>
              )}
              <button onClick={() => onEdit(livePrayer)} title={t(lang, 'tipEditPrayer')} className="w-9 h-9 flex items-center justify-center rounded-full" style={{ background: 'rgba(255,255,255,0.15)', color: '#fff' }}>
                <Edit2 size={15} />
              </button>
              <button onClick={() => setShowPersonalDelete(true)} title={t(lang, 'tipDeletePrayer')} className="w-9 h-9 flex items-center justify-center rounded-full" style={{ background: 'rgba(255,255,255,0.15)', color: '#fff' }}>
                <Trash2 size={15} />
              </button>
            </>
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

        {/* Categories */}
        {prayerCategories.length > 0 && (
          <div className="flex flex-wrap gap-2">
            {prayerCategories.map(c => (
              <span key={c.id} className="text-xs px-3 py-1.5 rounded-full font-medium text-white" style={{ backgroundColor: c.color }}>
                {c.emoji} {tr(c.name, lang)}
              </span>
            ))}
            {livePrayer.for_other && livePrayer.person_name && (
              <span className="text-xs px-3 py-1.5 rounded-full font-medium" style={{ background: 'var(--accent-soft)', color: 'var(--accent)', border: '0.5px solid var(--accent-border)' }}>
                👤 {livePrayer.person_name}
              </span>
            )}
          </div>
        )}

        {/* Description */}
        {livePrayer.description && (
          <div className="rounded-2xl p-4" style={{ background: 'var(--surface)', border: '0.5px solid var(--border)' }}>
            <p className="text-xs font-semibold uppercase tracking-widest mb-2" style={{ color: 'var(--text-3)' }}>{t(lang, 'details')}</p>
            <p className="text-sm leading-relaxed" style={{ color: 'var(--text-2)', lineHeight: 1.7 }}>
              {loc(livePrayer.description)}
            </p>
          </div>
        )}


        {/* ── Prayer points + AI suggestions (both modes) ── */}
        <div className="rounded-2xl p-4" style={{ background: 'var(--surface)', border: '0.5px solid var(--border)' }}>
          <div className="flex items-center justify-between mb-3">
            <p className="text-xs font-semibold uppercase tracking-widest" style={{ color: 'var(--text-3)' }}>{t(lang, 'aiSubjects')}</p>
            {(!isAnswered || isCommunity) && (
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
                    {!isAnswered && (
                      <button onClick={() => setConfirmRemovePoint(pp)} title={t(lang, 'tipRemovePoint')} className="shrink-0 opacity-0 group-hover:opacity-100 transition-opacity" style={{ color: '#c4a020' }}>
                        <Trash2 size={13} />
                      </button>
                    )}
                  </div>

                  {/* Verse pills */}
                  {verses.length > 0 && (
                    <div className="flex flex-wrap gap-1.5 mt-2">
                      {verses.map((v, i) => (
                        <div key={i} className="group/verse">
                          <button
                            onClick={() => setExpandedVerse(expandedVerse === `${pp.id}-${i}` ? null : `${pp.id}-${i}`)}
                            title={t(lang, 'tipVerseToggle')}
                            className="flex items-center gap-1 text-xs px-2 py-1 rounded-full"
                            style={{ background: '#f5e8a0', color: '#7a5e00' }}
                          >
                            <BookOpen size={9} /> {v.ref}
                          </button>
                          {expandedVerse === `${pp.id}-${i}` && (
                            <div className="mt-1.5 rounded-xl p-3" style={{ background: '#fffbf0', border: '0.5px solid #f0dfa0' }}>
                              {v.text && <p className="text-sm italic leading-relaxed mb-2" style={{ color: '#5a4500' }}>"{loc(v.text)}"</p>}
                              <div className="flex items-center justify-between">
                                <a href={bibleUrl(v.ref)} target="_blank" rel="noopener noreferrer" className="flex items-center gap-1 text-xs font-medium" style={{ color: 'var(--accent)' }}>
                                  <ExternalLink size={11} /> {t(lang, 'openBible')}
                                </a>
                                {!isAnswered && (
                                  <button onClick={() => handleRemoveVerse(pp.id, v.ref)} title={t(lang, 'tipRemoveVerse')} className="text-xs" style={{ color: '#c04040' }}>
                                    <Trash2 size={11} />
                                  </button>
                                )}
                              </div>
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                  )}

                  {/* Add verse inline form */}
                  {!isAnswered && (
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
                      <div key={i}>
                        <button
                          onClick={() => setExpandedVerse(expandedVerse === `rec-${rec.title}-${i}` ? null : `rec-${rec.title}-${i}`)}
                          title={t(lang, 'tipVerseToggle')}
                          className="flex items-center gap-1 text-xs px-2 py-1 rounded-full"
                          style={{ background: 'var(--accent-border)', color: 'var(--accent)' }}
                        >
                          <BookOpen size={9} /> {v.ref}
                        </button>
                        {expandedVerse === `rec-${rec.title}-${i}` && (
                          <div className="mt-1.5 rounded-xl p-2" style={{ background: 'var(--surface)', border: '0.5px solid var(--accent-border)' }}>
                            {v.text && <p className="text-xs italic leading-relaxed mb-1.5" style={{ color: 'var(--text-2)' }}>"{v.text}"</p>}
                            <a href={bibleUrl(v.ref)} target="_blank" rel="noopener noreferrer" className="flex items-center gap-1 text-xs font-medium" style={{ color: 'var(--accent)' }}>
                              <ExternalLink size={10} /> {t(lang, 'openBible')}
                            </a>
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            ))}
          </div>

          {/* Manual prayer point input */}
          {!isAnswered && (
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

        {/* ── Community mode: member updates ── */}
        {isCommunity && (
          <div className="rounded-2xl p-4" style={{ background: 'var(--surface)', border: '0.5px solid var(--border)' }}>
            <p className="text-xs font-semibold uppercase tracking-widest mb-3" style={{ color: 'var(--text-3)' }}>{t(lang, 'memberUpdates')}</p>

            {loadingUpdates ? (
              <div className="flex justify-center py-6"><Loader2 size={18} className="animate-spin" style={{ color: 'var(--text-3)' }} /></div>
            ) : communityUpdates.length === 0 ? (
              <p className="text-sm italic mb-3" style={{ color: 'var(--text-3)' }}>{t(lang, 'beFirst')}</p>
            ) : (
              <div className="space-y-3 mb-3">
                {communityUpdates.map(u => (
                  <div key={u.id} className="flex gap-2.5">
                    <Avatar name={u.is_anonymous ? '?' : u.author_name} size={28} anonymous={u.is_anonymous} />
                    <div className="min-w-0">
                      <p className="text-xs mb-0.5 font-medium" style={{ color: 'var(--text-3)' }}>
                        {communityAuthor(u, user?.id, lang)}
                        {' · '}{timeAgo(u.created_at, lang)}
                      </p>
                      <p className="text-sm leading-snug" style={{ color: 'var(--text-1)' }}>{loc(u.text)}</p>
                    </div>
                  </div>
                ))}
              </div>
            )}

            <div className="flex gap-2 mt-2">
              <input
                type="text"
                value={wordText}
                onChange={e => setWordText(e.target.value)}
                placeholder={t(lang, 'wordPlaceholder')}
                className="flex-1 text-sm rounded-xl px-3 py-2 focus:outline-none"
                style={{ background: 'var(--input-bg)', border: '0.5px solid var(--input-border)', color: 'var(--text-1)' }}
                onKeyDown={e => e.key === 'Enter' && handleSendWord()}
              />
              <button onClick={handleSendWord} disabled={!wordText.trim() || sendingWord} className="rounded-xl px-4 flex items-center justify-center text-white text-sm font-medium disabled:opacity-40" style={{ background: 'var(--accent)' }}>
                {sendingWord ? <Loader2 size={14} className="animate-spin" /> : <Send size={14} />}
              </button>
            </div>
            <label className="flex items-center gap-2 text-xs mt-2 cursor-pointer" style={{ color: 'var(--text-3)' }}>
              <input type="checkbox" checked={wordAnon} onChange={e => setWordAnon(e.target.checked)} className="rounded" />
              {t(lang, 'anonymous')}
            </label>
          </div>
        )}

        {/* ── Community mode: testimonies posted for this prayer ── */}
        {isCommunity && prayerTestimonies.length > 0 && (
          <div className="rounded-2xl p-4" style={{ background: 'var(--surface)', border: '0.5px solid var(--border)' }}>
            <p className="text-xs font-semibold uppercase tracking-widest mb-3" style={{ color: 'var(--text-3)' }}>{t(lang, 'testimonies')}</p>
            <div className="space-y-3">
              {prayerTestimonies.map(tm => (
                <div key={tm.id} className="rounded-xl p-3" style={{ background: 'var(--accent-soft)', border: '0.5px solid var(--accent-border)' }}>
                  <p className="text-xs mb-1" style={{ color: 'var(--text-3)' }}>
                    🎉 {communityAuthor(tm, user?.id, lang)} · {timeAgo(tm.created_at, lang)}
                  </p>
                  <p className="text-sm leading-relaxed" style={{ color: 'var(--text-1)' }}>{loc(tm.content)}</p>
                </div>
              ))}
            </div>
          </div>
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
              <label className="flex items-center gap-2 text-xs mb-3 cursor-pointer" style={{ color: 'var(--text-3)' }}>
                <input type="checkbox" checked={communityTestimonyAnon} onChange={e => setCommunityTestimonyAnon(e.target.checked)} className="rounded" />
                {t(lang, 'anonymous')}
              </label>
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

        {/* ── Personal mode: per-prayer schedule, updates, testimony, actions ── */}
        {!isCommunity && <>
        {!isAnswered && (
          <div className="rounded-2xl p-4" style={{ background: 'var(--surface)', border: '0.5px solid var(--border)' }}>
            <p className="text-xs font-semibold uppercase tracking-widest mb-2" style={{ color: 'var(--text-3)' }}>{t(lang, 'prayerDays')}</p>
            <div className="flex gap-1">
              {(t(lang, 'days')).map((day, idx) => {
                const active = (livePrayer.week_days || []).includes(idx);
                return (
                  <button key={idx}
                    onClick={() => {
                      const days = livePrayer.week_days || [];
                      const next = days.includes(idx) ? days.filter((d) => d !== idx) : [...days, idx];
                      updatePrayer(livePrayer.id, { weekDays: next });
                    }}
                    className="flex-1 text-xs py-1.5 rounded-lg font-medium transition-colors"
                    style={active ? { background: 'var(--accent)', color: '#fff' } : { background: 'var(--input-bg)', color: 'var(--text-3)' }}>
                    {day}
                  </button>
                );
              })}
            </div>
            <p className="text-[11px] mt-2" style={{ color: 'var(--text-3)' }}>
              {(livePrayer.week_days || []).length ? t(lang, 'prayerDaysCustom') : t(lang, 'prayerDaysHint')}
            </p>
          </div>
        )}
        <div className="rounded-2xl p-4" style={{ background: 'var(--surface)', border: '0.5px solid var(--border)' }}>
          <p className="text-xs font-semibold uppercase tracking-widest mb-3" style={{ color: 'var(--text-3)' }}>{t(lang, 'evolutions')}</p>

          {(livePrayer.prayer_updates || []).length === 0 && (
            <p className="text-sm italic mb-3" style={{ color: 'var(--text-3)' }}>{t(lang, 'noUpdate')}</p>
          )}

          <div className="space-y-3 mb-3">
            {(livePrayer.prayer_updates || []).map(u => (
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

          {!isAnswered && (
            <div className="flex gap-2">
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


        {/* Saved testimonies — always above the write field, preserved across resume / re-answer */}
        {personalTestimonies.length > 0 && (
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
            </div>
          </div>
        )}

        {/* Testimony input (writing) */}
        {!isAnswered && showTestimony && (
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
          {!isAnswered && (
            <button onClick={handleMarkAnswered} title={showTestimony ? t(lang, "tipConfirm") : t(lang, "tipMarkAnswered")} className="flex items-center gap-2 text-sm px-4 py-3 rounded-xl font-medium" style={{ background: 'var(--card-answered-bg)', color: 'var(--success)', border: '0.5px solid var(--card-answered-border)' }}>
              <CheckCircle size={15} />
              {showTestimony ? t(lang, 'confirm') : t(lang, 'markAnswered')}
            </button>
          )}
          {isAnswered && (
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
