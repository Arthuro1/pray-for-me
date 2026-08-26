import { useState, useEffect, useRef } from 'react';
import { ArrowLeft, Plus, Trash2, Edit2, CheckCircle, Sparkles, Loader2, BookOpen, Share2, Languages, Users, Pin, Repeat, HandHeart, Bell, CalendarClock, Flag, UserX, Pencil } from 'lucide-react';
import { useShallow } from 'zustand/react/shallow';
import usePrayerStore from '../store/prayerStore';
import useTranslationStore from '../store/translationStore';
import useAuthStore from '../store/authStore';
import useCommunityStore from '../store/communityStore';
import { format } from 'date-fns';
import { dateLocale, timeAgo } from '../utils/date';
import { getAuthorName, communityAuthor } from '../utils/user';
import { testimonyList } from '../utils/prayer';
import { getAIRecommendations } from '../aiRecommendations';
import { t } from '../i18n';
import { toast } from '../store/toastStore';
import AiConsentModal from '../components/AiConsentModal';
import { hasAiConsent } from '../lib/aiConsent';
import AiDisclaimer from '../components/shared/AiDisclaimer';
import PrayerForm from '../components/PrayerForm';
import PrayerShareModal from '../components/PrayerShareModal';
import FollowUpBanner from '../components/FollowUpBanner';
import { scheduleSummary } from '../lib/scheduleDraft';
import { planWeekDays, scheduleEnded } from '../lib/planner';
import { planDayNumber } from '../lib/schedule';
import { todayKey } from '../lib/prayedLog';
import { getPlan } from '../content/prayerPlans';
import { pick, localizeRef } from '../content/teaching';
import { usePlanDay } from '../hooks/usePlanDay';
import PlanDayBody from '../components/PlanDayBody';
import PlanCompletionCard from '../components/PlanCompletionCard';
import PlanOnboardingModal from '../components/PlanOnboardingModal';
import { isCouplePlan } from '../lib/planPersonalization';
import { savePlanPersonalization } from '../lib/planPersonalizationStorage';
import { claimPlanCompletionReport, markPlanCompleted } from '../lib/planPrefs';
import { defaultNewSchedule } from '../lib/scheduleDraft';
import { track } from '../lib/analytics';
import { canUsePlan } from '../lib/planReview';
import GroupPrayerCalendar from '../components/GroupPrayerCalendar';
import SchedulePlanner from '../components/SchedulePlanner';
import PrayTogetherCard from '../components/PrayTogetherCard';
import FollowPrayerButton from '../components/FollowPrayerButton';
import ScriptureFirstStep from '../components/ScriptureFirstStep';
import VerseAccordion from '../components/VerseAccordion';
import CommunityUpdates from '../components/CommunityUpdates';
import useMemberAvatars from '../hooks/useMemberAvatars';
import CommunityTestimonies from '../components/CommunityTestimonies';
import UpdateComposer from '../components/rich/UpdateComposer';
import RichText from '../components/rich/RichText';
import RemovableText from '../components/rich/RemovableText';
import AttachmentList from '../components/rich/AttachmentList';
import { useSessionNoteIds } from '../hooks/useSessionNoteIds';
import DeleteButton from '../components/rich/DeleteButton';
import EditButton from '../components/rich/EditButton';
import MessageEditor from '../components/rich/MessageEditor';
import AnonymousToggle from '../components/AnonymousToggle';
import ConfirmDialog from '../components/shared/ConfirmDialog';
import LockedNotice from '../components/LockedNotice';
import AudienceBadge from '../components/shared/AudienceBadge';
import PrayerSession from '../components/PrayerSession';
import { PrimaryButton } from '../components/shared/Primitives';
import FollowUpField from '../components/FollowUpField';
import useFollowUpStore from '../store/followUpStore';
import { audienceOf, protectionOf } from '../lib/audience';
import { needsTranslationControl } from '../lib/langHint';
import { getTranslationPref, setTranslationPref, prayerScope } from '../lib/translationPrefs';
import { useEscapeKey } from '../hooks/useEscapeKey';
import { useFocusTrap } from '../hooks/useFocusTrap';
import { usePrayerActions } from '../hooks/usePrayerActions';
import { useLocalizedVerse } from '../hooks/useLocalizedVerse';
import OverflowMenu from '../components/shared/OverflowMenu';
import useCommunityPrayerUpdates from './prayerDetail/useCommunityPrayerUpdates';
import useCommunityPrayerActions from './prayerDetail/useCommunityPrayerActions';
import usePrayerSharing from './prayerDetail/usePrayerSharing';
import { safetyText } from '../lib/communitySafety';

// One verse pill in the point list. Verses are stored in the prayer's creation
// language; useLocalizedVerse swaps in authoritative text + a localized reference
// for the current language when one exists (offline bundle / YouVersion, never
// AI-translated). Otherwise the STORED reference and wording stay together as
// one consistent pair — Scripture is never routed through the AI translation
// toggle, so the citation always matches authoritative text.
function PrayerDetailVerse({ verse, lang, canRemove, onRemove }) {
  const resolved = useLocalizedVerse(verse.ref, lang);
  const ref = resolved?.ref ?? verse.ref;
  const text = resolved?.text ?? verse.text;

  return (
    <div className="group/verse inline-flex items-start gap-1">
      <VerseAccordion reference={ref} lang={lang} initialText={text} panelStyle={{ background: 'var(--gold-soft)', border: '1px solid color-mix(in srgb, var(--gold) 28%, var(--border))' }}>
        {({ toggle }) => (
          <button
            onClick={toggle}
            title={t(lang, 'tipVerseToggle')}
            className="flex items-center gap-1 text-xs px-2 py-1 rounded-full"
            style={{ background: 'var(--gold-soft)', color: 'var(--gold)' }}
          >
            <BookOpen size={9} /> {ref}
          </button>
        )}
      </VerseAccordion>
      {/* Hover-revealed, but also revealed on keyboard focus — otherwise a
          keyboard user tabs onto a control they cannot see. */}
      {canRemove && (
        <button
          onClick={onRemove}
          aria-label={t(lang, 'tipRemoveVerse')}
          title={t(lang, 'tipRemoveVerse')}
          className="opacity-0 group-hover/verse:opacity-100 focus-visible:opacity-100 transition-opacity mt-1.5 shrink-0"
          style={{ color: '#c04040' }}
        >
          <Trash2 size={11} aria-hidden="true" />
        </button>
      )}
    </div>
  );
}

// communityPrayer prop switches the component to community mode
export default function PrayerDetail({ prayer, communityPrayer, onBack, onEdit, lang = 'en' }) {
  const isCommunity = !!communityPrayer;

  // ── Personal mode state ──────────────────────────────────────────────────
  // The answered flow is a DISCLOSURE opened by the "Mark answered" action, not
  // a form standing permanently open — so the page shows one Mark answered
  // control, and confirming happens inside the thing it opened. Its (optional)
  // testimony text lives in the composer.
  const [showTestimony, setShowTestimony] = useState(false);
  // Adding a word of thanks to an already-answered prayer (remembrance).
  const [showThanks, setShowThanks] = useState(false);
  const [updateRecs, setUpdateRecs] = useState([]);
  const [loadingRecs, setLoadingRecs] = useState(false);
  const [recsError, setRecsError] = useState(null);
  const [manualPoint, setManualPoint] = useState({ title: '', verse: '' });
  const [showManualForm, setShowManualForm] = useState(false);
  const [showCatPicker, setShowCatPicker] = useState(false);
  const [editingTitle, setEditingTitle] = useState(false);
  const [titleDraft, setTitleDraft] = useState('');
  const titleCancelRef = useRef(false);
  // Which posted update / testimony is open in its inline editor (author-only,
  // one at a time — the same WhatsApp "edit message" gesture as the community).
  const [editingUpdateId, setEditingUpdateId] = useState(null);
  const [editingTestimonyId, setEditingTestimonyId] = useState(null);
  const [addingVerseTo, setAddingVerseTo] = useState(null);
  const [newVerse, setNewVerse] = useState({ ref: '', text: '' });
  const [showAiConsent, setShowAiConsent] = useState(false);
  const [showShareModal, setShowShareModal] = useState(false);
  const [showScripture, setShowScripture] = useState(false);
  // "Pray now" on this one prayer — a real session, so completion is recorded
  // through the same per-prayer completion log as Today's sessions.
  const [showPraySession, setShowPraySession] = useState(false);
  // Inline per-prayer follow-up editor (pastoral "check back on this" date).
  const [showFollowUpEdit, setShowFollowUpEdit] = useState(false);
  // Schedule editor, opened from the overflow menu — never a permanently
  // expanded configuration card in the main flow. Closing it hands focus back
  // to the ⋯ trigger it was opened from.
  const [showScheduleEdit, setShowScheduleEdit] = useState(false);
  const scheduleTriggerRef = useRef(null);

  // ── Community mode state ─────────────────────────────────────────────────
  // (The encouragement timeline — communityUpdates/loadingUpdates — now lives in
  // useCommunityPrayerUpdates.)
  const [showCommunityTestimony, setShowCommunityTestimony] = useState(false);
  const [communityTestimonyAnon, setCommunityTestimonyAnon] = useState(false);
  // testimonySent + togglingPraying now live in useCommunityPrayerActions.
  const [showCommunityEdit, setShowCommunityEdit] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [showReportConfirm, setShowReportConfirm] = useState(false);
  const [showBlockConfirm, setShowBlockConfirm] = useState(false);

  const { categories, addPrayer, markAnswered, markActive, markPrayedOn, addTestimony: addPersonalTestimony, addUpdate, removeUpdateAttachment, removeUpdateText, deleteUpdate, editUpdate, removeTestimonyAttachment, removeTestimonyText, deleteTestimony, editTestimony, addPrayerPoint, addVerseToPoint, removeVerseFromPoint, removePrayerPoint, togglePin, syncCategoriesFromCommunity, updatePrayer, prayers } = usePrayerStore(
    useShallow((s) => ({
      categories: s.categories,
      addPrayer: s.addPrayer,
      markAnswered: s.markAnswered,
      markActive: s.markActive,
      markPrayedOn: s.markPrayedOn,
      addTestimony: s.addTestimony,
      addUpdate: s.addUpdate,
      removeUpdateAttachment: s.removeUpdateAttachment,
      removeUpdateText: s.removeUpdateText,
      deleteUpdate: s.deleteUpdate,
      editUpdate: s.editUpdate,
      removeTestimonyAttachment: s.removeTestimonyAttachment,
      removeTestimonyText: s.removeTestimonyText,
      deleteTestimony: s.deleteTestimony,
      editTestimony: s.editTestimony,
      addPrayerPoint: s.addPrayerPoint,
      addVerseToPoint: s.addVerseToPoint,
      removeVerseFromPoint: s.removeVerseFromPoint,
      removePrayerPoint: s.removePrayerPoint,
      togglePin: s.togglePin,
      syncCategoriesFromCommunity: s.syncCategoriesFromCommunity,
      updatePrayer: s.updatePrayer,
      prayers: s.prayers,
    }))
  );
  const { tr, translateTexts, translating } = useTranslationStore();
  const [showTranslated, setShowTranslated] = useState(false);
  const { followUps, setFollowUp } = useFollowUpStore(
    useShallow((s) => ({ followUps: s.followUps, setFollowUp: s.setFollowUp }))
  );
  // Esc closes the delete overlay (the share modal handles its own Esc/focus
  // trap; ConfirmDialog handles its own).
  useEscapeKey(showDeleteConfirm ? () => setShowDeleteConfirm(false) : null);
  const deleteTrapRef = useFocusTrap(showDeleteConfirm);
  const { user } = useAuthStore();
  // (fetchPrayerUpdates, addUpdate, delete/editCommunityUpdate, subscribePrayerActivity,
  // refreshPrayer, fetchUserReactions moved into useCommunityPrayerUpdates.)
  const { groups, activeGroupId, prayers: communityPrayers, deleteCommunityTestimony, editCommunityTestimony, addTestimony, updatePrayer: updateCommunityPrayer, deleteCommunityPrayer, addCommunityPrayerPoint, removeCommunityPrayerPoint, addCommunityVerse, removeCommunityVerse, testimonies: communityTestimonies, setPrayerShares, reportCommunityContent, setUserBlocked } = useCommunityStore(
    useShallow((s) => ({
      groups: s.groups,
      activeGroupId: s.activeGroupId,
      prayers: s.prayers,
      deleteCommunityTestimony: s.deleteCommunityTestimony,
      editCommunityTestimony: s.editCommunityTestimony,
      addTestimony: s.addTestimony,
      updatePrayer: s.updatePrayer,
      deleteCommunityPrayer: s.deleteCommunityPrayer,
      addCommunityPrayerPoint: s.addCommunityPrayerPoint,
      removeCommunityPrayerPoint: s.removeCommunityPrayerPoint,
      addCommunityVerse: s.addCommunityVerse,
      removeCommunityVerse: s.removeCommunityVerse,
      testimonies: s.testimonies,
      setPrayerShares: s.setPrayerShares,
      reportCommunityContent: s.reportCommunityContent,
      setUserBlocked: s.setUserBlocked,
    }))
  );

  const locale = dateLocale(lang);
  const authorName = getAuthorName(user);
  const { removePrayer } = usePrayerActions(lang);

  // ── Community mode: encouragement timeline (fetch, live subscription, CRUD) ──
  const {
    communityUpdates, loadingUpdates, handleSendWord, handleDeleteWord, handleEditWord,
  } = useCommunityPrayerUpdates({ communityPrayer, isCommunity, user, authorName, lang });

  // ── Community mode: answered mirroring + "I'm praying" toggle ──────────────
  const {
    communityHasReacted, togglingPraying, testimonySent, setTestimonySent,
    handleConfirmCommunityAnswered, handleResumeCommunity, handleTogglePraying,
  } = useCommunityPrayerActions({ communityPrayer, isCommunity, user, authorName, lang });

  // Whole-testimony delete (author or group admin). The store drops it from the
  // testimonies list; CommunityTestimonies handles the author-only media cleanup.
  const handleDeleteCommunityTestimony = async (testimonyId) => {
    const res = await deleteCommunityTestimony(testimonyId);
    if (res?.error) toast.error(t(lang, 'errorGeneric'));
  };

  // Author-only testimony text edit. The store owns the testimonies list and
  // patches it (with a revert built into its own error path).
  const handleEditCommunityTestimony = async (testimonyId, content) => {
    const testimony = communityTestimonies.find((tm) => tm.id === testimonyId);
    if (!testimony) return;
    const res = await editCommunityTestimony(testimony, content);
    if (res?.error) {
      toast.error(t(lang, 'errorGeneric'));
      return false;
    }
    return true;
  };

  const handlePostCommunityTestimony = async (text, attachments) => {
    const result = await addTestimony({ groupId: activeGroupId, userId: user.id, authorName, content: text, isAnonymous: communityTestimonyAnon, communityPrayerId: communityPrayer.id, contentLanguage: lang, attachments });
    if (result?.error) {
      toast.error(t(lang, 'errorGeneric'));
      return false;
    }
    setTestimonySent(true);
    setShowCommunityTestimony(false);
    return true;
  };

  const handleDeleteCommunity = async () => {
    setDeleting(true);
    await deleteCommunityPrayer(communityPrayer.id);
    onBack();
  };

  const handleReportCommunity = async () => {
    const result = await reportCommunityContent('prayer', communityPrayer.id, 'other');
    setShowReportConfirm(false);
    if (result?.error) toast.error(t(lang, 'errorGeneric'));
    else toast.success(safetyText(lang, 'reported'));
  };

  const handleBlockCommunityAuthor = async () => {
    const result = await setUserBlocked(communityPrayer.user_id, true);
    setShowBlockConfirm(false);
    if (result?.error) toast.error(t(lang, 'errorGeneric'));
    else {
      toast.success(safetyText(lang, 'blocked'));
      onBack();
    }
  };

  // ── Personal mode: sharing to groups ──────────────────────────────────────
  // Personal-mode sharing sync: load the user's groups + share map, follow the
  // community copy's latest content, and surface member activity on shared copies.
  const { sharedGroups, sharedActivity } = usePrayerSharing({ prayer, isCommunity, user });

  // Clear pending AI suggestions when language changes so user can re-generate in new language
  useEffect(() => { setUpdateRecs([]); setRecsError(null); }, [lang]);

  // Reset the translation toggle when the prayer or language changes
  useEffect(() => { setShowTranslated(false); }, [communityPrayer?.id, prayer?.id, lang]);

  // In community mode, read from store so updates (prayer points, edits) reflect immediately
  const livePrayer = isCommunity
    ? (communityPrayers.find(p => p.id === communityPrayer.id) || communityPrayer)
    : (prayers.find(p => p.id === prayer.id) || prayer);
  // ── Guided plan ──────────────────────────────────────────────────────────
  // Which day of a running plan today is, the day's content with the reader's
  // language folded in, and any APPROVED resources for its topics. Called
  // unconditionally (a null plan id resolves to null) so the rules of hooks hold
  // for the many prayers that are not part of a plan.
  const planId = livePrayer.schedule?.plan?.id || null;
  const planDayNo = planId ? planDayNumber(livePrayer.schedule, todayKey()) : null;
  const planVersion = livePrayer.schedule?.plan?.version || null;
  const resolvedPlan = planId ? getPlan(planId, planVersion) : null;
  const plan = canUsePlan(resolvedPlan) ? resolvedPlan : null;
  const { day: planDay, prefs: planPrefs, role: planRole, resources: planResources, reloadPrefs } =
    usePlanDay(planId, planDayNo, lang, {
      prayerId: livePrayer.id, ownerId: livePrayer.user_id, planVersion,
    });
  // The last day is behind them: the series can produce no more occurrences.
  const planFinished = !!plan?.completion && !isCommunity && scheduleEnded(livePrayer, todayKey());
  // A couple plan's answers used to be capturable only at the moment it started,
  // so a mistyped name or a child born mid-plan meant deleting the prayer and
  // losing its history. They can be corrected here for the life of the run.
  const [editingPersonalization, setEditingPersonalization] = useState(false);
  const canEditPersonalization = !isCommunity && !planFinished
    && isCouplePlan(plan) && !!livePrayer.user_id;

  // Completion is reported when the last day is actually behind the reader, not
  // when they happen to tap a follow-up action. claimPlanCompletionReport()
  // makes it once per run, so re-opening the finished prayer counts nothing.
  const completedEvent = planFinished ? plan?.analyticsEvents?.completed : null;
  useEffect(() => {
    if (completedEvent && claimPlanCompletionReport(livePrayer.id)) track(completedEvent);
  }, [completedEvent, livePrayer.id]);

  const isAnswered = isCommunity ? !!livePrayer.is_answered : livePrayer.status === 'answered';
  // Rows whose content was fully deleted would render as bare author+date
  // shells — hide them. Locked E2EE rows stay visible with their placeholder.
  const hasContent = (row) => row._locked || row.text || row.content || (row.attachments || []).length > 0;
  const prayerTestimonies = isCommunity ? (communityTestimonies || []).filter(tm => tm.community_prayer_id === communityPrayer.id) : [];
  const personalTestimonies = (isCommunity ? [] : testimonyList(livePrayer)).filter(hasContent);
  const prayerCategoryIds = isCommunity ? (livePrayer.category_ids || []) : (livePrayer.prayer_categories || []).map(pc => pc.category_id);
  const prayerCategories = categories.filter(c => prayerCategoryIds.includes(c.id));
  const isGroupAdmin = isCommunity && groups.find(g => g.id === communityPrayer.group_id)?.role === 'admin';
  // Members' chosen avatars for this group, so an author tile here matches the
  // one on the group wall instead of falling back to the name-derived default.
  const memberAvatarFor = useMemberAvatars(isCommunity ? communityPrayer.group_id : null);
  const canEditCommunityPrayer = isCommunity && (communityPrayer.user_id === user?.id || isGroupAdmin);
  const communityReactionCount = isCommunity ? (livePrayer.prayer_reactions?.[0]?.count ?? 0) : 0;
  const constellationPrayerCount = isCommunity
    ? communityReactionCount
    : sharedGroups.reduce((total, share) => total + (share.prayingCount || 0), 0);

  // ── Shared (saved-from-community) prayer flags ───────────────────────────
  // A saved copy follows the shared content read-only: it pulls the author's/
  // group's latest, but isn't edited here (open it in Community to contribute).
  const savedCopy = !isCommunity && !!livePrayer.community_origin_id;
  const canAddContent = !isAnswered && (isCommunity || !savedCopy);
  const canRemoveContent = !isAnswered && (isCommunity || !savedCopy);
  // Author copies already have member updates synced into prayer_updates; saved
  // copies don't, so fold the group's updates into the displayed list for them.
  const allUpdates = (!isCommunity
    ? [...(livePrayer.prayer_updates || []), ...(savedCopy ? sharedActivity.updates : [])]
    : []).filter(hasContent);
  // You can post updates/testimonies and mark answered only on prayers you own —
  // a saved-from-community copy is read-only (you follow the author's prayer).
  const canManage = !savedCopy;
  const sessionNoteIds = useSessionNoteIds();

  // The translation control appears only on a KNOWN or probable language
  // mismatch — explicit `content_language` metadata (stamped at creation, so
  // even a three-word request is covered) decides first, the on-device
  // heuristic and any already-cached translation are the fallback for legacy
  // rows. Applies to BOTH community requests and personal prayers.
  const translationRelevant = !livePrayer._locked && needsTranslationControl(
    [livePrayer.title, livePrayer.description].filter(Boolean).join(' '),
    lang,
    {
      contentLanguage: livePrayer.content_language || null,
      hasCachedTranslation: !!livePrayer.title && tr(livePrayer.title, lang) !== livePrayer.title,
    }
  );

  // Where the remembered display choice lives: per group for community
  // requests, per prayer for personal ones.
  const translationPrefScope = isCommunity ? communityPrayer?.group_id : prayerScope(prayer?.id);

  // On a detected mismatch the ORIGINAL leads and translation is opt-in (and
  // clearly labelled); the toggle always returns to the original. Without a
  // mismatch, personal content keeps its cached-translation lookup (a no-op
  // for same-language content) and community content shows as written.
  const loc = (text) => {
    if (!text) return text;
    if (translationRelevant) return showTranslated ? tr(text, lang) : text;
    return isCommunity ? text : tr(text, lang);
  };

  const handleToggleTranslate = async () => {
    if (showTranslated) {
      setShowTranslated(false);
      setTranslationPref(translationPrefScope, 'original');
      return;
    }
    // Scripture is EXCLUDED: verse text never goes through AI translation —
    // authoritative verse text comes from useLocalizedVerse (bundle /
    // YouVersion) or stays with its original reference.
    const texts = [livePrayer.title, livePrayer.description];
    (livePrayer.prayer_points || []).forEach(pp => texts.push(pp.title));
    if (isCommunity) {
      communityUpdates.forEach(u => texts.push(u.text));
      prayerTestimonies.forEach(tm => texts.push(tm.content));
    } else {
      allUpdates.forEach(u => texts.push(u.text));
      personalTestimonies.forEach(tm => texts.push(tm.content));
    }
    await translateTexts(texts.filter(Boolean), lang, user?.id, isCommunity ? communityPrayer?.group_id : null);
    setShowTranslated(true);
    setTranslationPref(translationPrefScope, 'translated');
  };

  // Apply the scope's remembered display preference on open (cheap: earlier
  // translations are already cached — group-wide for community requests).
  useEffect(() => {
    if (!translationRelevant || showTranslated) return;
    if (getTranslationPref(translationPrefScope) !== 'translated') return;
    handleToggleTranslate();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [communityPrayer?.id, prayer?.id, lang, translationRelevant]);

  const handleAddUpdate = async (text, attachments) => {
    await addUpdate(livePrayer.id, text, authorName, attachments);
    setUpdateRecs([]);
  };

  // Author-only text edits of a posted update / testimony (the store re-encrypts
  // or rewrites the row, attachments preserved). Every personal row is the
  // owner's own, so canManage already gates the affordance.
  const handleEditUpdate = async (updateId, text) => {
    await editUpdate(livePrayer.id, updateId, text);
    setEditingUpdateId(null);
  };

  const handleEditTestimony = async (testimonyId, content) => {
    await editTestimony(livePrayer.id, testimonyId, content);
    setEditingTestimonyId(null);
  };

  // Point/verse mutations are mode-aware: community mode routes through the
  // community store (which syncs shared prayers); personal mode uses prayerStore.
  const handleRemovePoint = async (pointId) => {
    const result = isCommunity
      ? await removeCommunityPrayerPoint(communityPrayer.id, pointId, communityPrayer.source_prayer_id)
      : await removePrayerPoint(livePrayer.id, pointId);
    if (result?.error) toast.error(t(lang, 'errorGeneric'));
    return result;
  };

  const handleAddVerse = async (pointId, verse) => {
    const result = isCommunity
      ? await addCommunityVerse(communityPrayer.id, pointId, verse, communityPrayer.source_prayer_id)
      : await addVerseToPoint(livePrayer.id, pointId, verse);
    if (result?.error) toast.error(t(lang, 'errorGeneric'));
    return result;
  };

  const handleRemoveVerse = async (pointId, verseRef) => {
    const result = isCommunity
      ? await removeCommunityVerse(communityPrayer.id, pointId, verseRef, communityPrayer.source_prayer_id)
      : await removeVerseFromPoint(livePrayer.id, pointId, verseRef);
    if (result?.error) toast.error(t(lang, 'errorGeneric'));
    return result;
  };

  const handleAddPoint = async (point) => {
    const result = isCommunity
      ? await addCommunityPrayerPoint(communityPrayer.id, point, communityPrayer.source_prayer_id)
      : await addPrayerPoint(livePrayer.id, point);
    if (result?.error) toast.error(t(lang, 'errorGeneric'));
    return result;
  };

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

  const handleAddThanks = async (text, attachments) => {
    await addPersonalTestimony(livePrayer.id, text, attachments);
    setShowThanks(false);
    toast.success(t(lang, 'thanksSaved'));
  };

  // Two distinct steps of ONE workflow, so every entry point (the leading
  // action, the follow-up banner) opens the same disclosure and only the
  // disclosure's own button completes the prayer — the confirmation step is
  // never skipped, and there is no second copy of the completion logic.
  // Bring a section into view and put the cursor in it. Smooth scrolling is a
  // nicety, not a requirement — it's optional-called so environments without it
  // still land the focus, which is the part that matters.
  const revealAndFocus = (sectionId, field) => {
    const el = document.getElementById(sectionId);
    el?.scrollIntoView?.({ behavior: 'smooth', block: 'center' });
    el?.querySelector(field)?.focus({ preventScroll: true });
  };

  const openAnswerFlow = () => {
    setShowTestimony(true);
    requestAnimationFrame(() => revealAndFocus('pd-answer', '[contenteditable]'));
  };

  const closeAnswerFlow = () => setShowTestimony(false);

  const confirmAnswered = (text, attachments) => {
    markAnswered(livePrayer.id, text, attachments);
    closeAnswerFlow();
  };

  const focusUpdateField = () => revealAndFocus('pd-updates', '[contenteditable]');

  // Own prayer → warn first; saved copy → instant unfollow + Undo. Then navigate back.
  const handleDelete = () => removePrayer(livePrayer, onBack);

  // Inline title edit — own personal prayers only (community has its own edit;
  // a saved copy follows the author's title).
  const canEditTitle = !isCommunity && !savedCopy && !livePrayer._locked;
  const startEditTitle = () => { setTitleDraft(livePrayer.title || ''); titleCancelRef.current = false; setEditingTitle(true); };
  const saveTitle = () => {
    if (titleCancelRef.current) { titleCancelRef.current = false; setEditingTitle(false); return; }
    const next = titleDraft.trim();
    setEditingTitle(false);
    if (next && next !== livePrayer.title) updatePrayer(livePrayer.id, { title: next });
  };

  const [confirmRemovePoint, setConfirmRemovePoint] = useState(null);

  return (
    <div className="detail-page phase-page constellation-detail">
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
      {/* One-prayer session — same session, same per-prayer completion log as
          Today, so praying from here counts everywhere. */}
      {showPraySession && (
        <PrayerSession
          prayers={[livePrayer]}
          categories={categories}
          lang={lang}
          tr={tr}
          onClose={() => setShowPraySession(false)}
          onPrayed={(id) => markPrayedOn(id, todayKey())}
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
          onCommunitySubmit={async ({ title, description, isAnonymous, categoryIds, contentLanguage }) => {
            const result = await updateCommunityPrayer({ prayerId: communityPrayer.id, title, description, isAnonymous, categoryIds, contentLanguage, authorName });
            if (result?.error) {
              toast.error(t(lang, 'errorGeneric'));
              return result;
            }
            // If the owner edits a shared prayer, sync categories back to personal + siblings.
            if (communityPrayer.source_prayer_id && communityPrayer.user_id === user?.id) {
              await syncCategoriesFromCommunity(communityPrayer.source_prayer_id, categoryIds);
            }
            return result;
          }}
        />
      )}

      {/* Community delete confirm */}
      {showDeleteConfirm && (
        <div className="dialog-backdrop fixed inset-0 z-50 flex items-end sm:items-center justify-center p-4" onClick={() => setShowDeleteConfirm(false)}>
          <div ref={deleteTrapRef} tabIndex={-1} role="dialog" aria-modal="true" aria-label={t(lang, 'tipDeletePrayer')} className="editorial-dialog w-full max-w-sm p-5" onClick={e => e.stopPropagation()}>
            <h3 className="font-semibold text-base mb-2" style={{ color: 'var(--text-1)' }}>{t(lang, 'tipDeletePrayer')}</h3>
            <p className="text-sm mb-5" style={{ color: 'var(--text-3)' }}>{livePrayer.title}</p>
            <div className="flex gap-2">
              <button onClick={() => setShowDeleteConfirm(false)} className="flex-1 py-2.5 rounded-xl text-sm" style={{ background: 'var(--input-bg)', color: 'var(--text-2)', border: '0.5px solid var(--input-border)' }}>{t(lang, 'cancel')}</button>
              <button onClick={handleDeleteCommunity} disabled={deleting} className="flex-1 py-2.5 rounded-xl text-sm font-medium text-white disabled:opacity-40" style={{ background: 'var(--danger)' }}>
                {deleting ? <Loader2 size={14} className="animate-spin mx-auto" /> : t(lang, 'tipDeletePrayer')}
              </button>
            </div>
          </div>
        </div>
      )}
      {showReportConfirm && (
        <ConfirmDialog
          title={safetyText(lang, 'report')}
          message={safetyText(lang, 'reportConfirm')}
          confirmLabel={safetyText(lang, 'report')}
          cancelLabel={t(lang, 'cancel')}
          onConfirm={handleReportCommunity}
          onCancel={() => setShowReportConfirm(false)}
        />
      )}
      {showBlockConfirm && (
        <ConfirmDialog
          title={safetyText(lang, 'block')}
          message={safetyText(lang, 'blockConfirm')}
          confirmLabel={safetyText(lang, 'block')}
          cancelLabel={t(lang, 'cancel')}
          onConfirm={handleBlockCommunityAuthor}
          onCancel={() => setShowBlockConfirm(false)}
        />
      )}

      {/* The request itself has room to breathe in the constellation hero
          below; this sticky bar stays a quiet navigation rail. */}
      <div className="detail-header">
        <button
          onClick={onBack}
          aria-label={t(lang, 'tipBack')}
          title={t(lang, 'tipBack')}
          className="detail-header__icon shrink-0 w-11 h-11 flex items-center justify-center rounded-full transition-colors"
        >
          <ArrowLeft size={18} aria-hidden="true" />
        </button>
        <p className="constellation-detail__screen-title flex-1 min-w-0 text-center">
          {t(lang, 'prayer')}
        </p>
        <div className="flex items-center gap-2 shrink-0">
          {isCommunity ? (
            // Author/admin management only; the primary "I'm praying" action now
            // lives in the prominent Pray-together card below the request.
            <OverflowMenu
              lang={lang}
              ariaLabel={t(lang, 'options')}
              triggerStyle={{ background: 'var(--surface-muted)', color: 'var(--text-2)', border: '1px solid var(--border)' }}
              iconColor="var(--text-2)"
              items={[
                { key: 'edit', icon: Edit2, label: t(lang, 'edit'), onClick: () => setShowCommunityEdit(true), hidden: !canEditCommunityPrayer },
                { key: 'report', icon: Flag, label: safetyText(lang, 'report'), onClick: () => setShowReportConfirm(true), hidden: communityPrayer.user_id === user?.id },
                { key: 'block', icon: UserX, label: safetyText(lang, 'block'), danger: true, onClick: () => setShowBlockConfirm(true), hidden: communityPrayer.user_id === user?.id },
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
              triggerRef={scheduleTriggerRef}
              triggerStyle={{ background: 'var(--surface-muted)', color: 'var(--text-2)', border: '1px solid var(--border)' }}
              iconColor="var(--text-2)"
              items={[
                { key: 'scripture', icon: BookOpen, label: t(lang, 'viewScripture'), onClick: () => setShowScripture(true) },
                { key: 'pin', icon: Pin, label: t(lang, livePrayer.pinned ? 'unpin' : 'pin'), onClick: () => togglePin(livePrayer.id) },
                // Scheduling lives here, out of the main flow — selecting it
                // opens the planner as a contextual disclosure below the
                // actions. Saved copies keep it too: WHEN you pray for a
                // carried request is personal.
                { key: 'schedule', icon: CalendarClock, label: t(lang, livePrayer.schedule ? 'editSchedule' : 'addSchedule'), onClick: () => setShowScheduleEdit((v) => !v), hidden: isAnswered },
                { key: 'followup', icon: Bell, label: t(lang, 'followUpTitle'), onClick: () => setShowFollowUpEdit((v) => !v), hidden: savedCopy || isAnswered },
                { key: 'share', icon: Share2, label: sharedGroups.length > 0 ? `${t(lang, 'shareWithGroup')} (${sharedGroups.length})` : t(lang, 'shareWithGroup'), onClick: () => setShowShareModal(true), hidden: savedCopy || groups.length === 0 },
                { key: 'edit', icon: Edit2, label: t(lang, 'edit'), onClick: () => onEdit(livePrayer), hidden: savedCopy },
                { key: 'delete', icon: Trash2, label: t(lang, savedCopy ? 'removeFromList' : 'delete'), danger: true, onClick: handleDelete },
              ]}
            />
          )}
        </div>
      </div>

      <section className="constellation-detail__hero">
        <div className="constellation-detail__sky" aria-hidden="true">
          <img
            src="/assets/constellation/detail-sky-light-transparent.png"
            alt=""
            className="constellation-detail__sky-image constellation-detail__sky-image--light"
          />
          <img
            src="/assets/constellation/detail-sky-dark-transparent.png"
            alt=""
            className="constellation-detail__sky-image constellation-detail__sky-image--dark"
          />
        </div>

        <div className="constellation-detail__hero-copy">
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
              className="constellation-detail__title-input"
            />
          ) : (
            <h1
              onClick={canEditTitle ? startEditTitle : undefined}
              className={`constellation-detail__title ${canEditTitle ? 'cursor-text' : ''}`}
              style={{ textDecoration: isAnswered ? 'line-through' : 'none' }}
            >
              <span>{livePrayer._locked ? t(lang, 'contentLocked') : loc(livePrayer.title)}</span>
              {canEditTitle && <Edit2 size={15} className="shrink-0 opacity-40" aria-hidden="true" />}
            </h1>
          )}

          {livePrayer._locked ? (
            <LockedNotice lang={lang} />
          ) : livePrayer.description ? (
            <RichText text={loc(livePrayer.description)} className="constellation-detail__description" />
          ) : null}

          <div className="constellation-detail__meta">
            <span>
              {isCommunity
                ? `${communityAuthor(livePrayer, user?.id, lang)} · ${timeAgo(livePrayer.created_at, lang)}`
                : timeAgo(livePrayer.created_at, lang)}
            </span>
            {constellationPrayerCount > 0 && (
              <span className="constellation-detail__praying">
                <Users size={13} aria-hidden="true" />
                {constellationPrayerCount} {t(lang, 'prayingCount')}
              </span>
            )}
          </div>

          {!isCommunity && !isAnswered && !livePrayer._locked && (
            <PrimaryButton
              onClick={() => setShowPraySession(true)}
              icon={HandHeart}
              className="constellation-detail__pray mt-8 w-full whitespace-nowrap sm:w-auto sm:min-w-44"
            >
              {t(lang, 'prayNow')}
            </PrimaryButton>
          )}
        </div>
      </section>

      <div className="detail-page__content space-y-4">

        {/* On-demand translation toggle — only when the content's language
            plausibly differs from the interface's. Translated content is
            labelled, and the original always stays one tap away. */}
        {translationRelevant && (
          <div className="flex items-center gap-2">
            <button
              onClick={handleToggleTranslate}
              disabled={translating}
              className="flex items-center gap-1.5 min-h-[44px] text-xs font-medium disabled:opacity-50"
              style={{ color: 'var(--accent)' }}
            >
              {translating ? <Loader2 size={13} className="animate-spin" /> : <Languages size={13} />}
              {showTranslated ? t(lang, 'showOriginal') : t(lang, 'seeTranslation')}
            </button>
            {showTranslated && (
              <span className="text-[10px] px-2 py-0.5 rounded-full font-medium" style={{ background: 'var(--accent-soft)', color: 'var(--accent)' }}>
                {t(lang, 'translatedLabel')}
              </span>
            )}
          </div>
        )}

        {/* Audience at a glance — Private / Shared with … / From [group] — on
            every personal prayer, saved-from-community copies included, always
            visible (never buried in a menu). Encryption renders as a smaller
            separate protection status, never as a different audience. */}
        {!isCommunity && (
          <AudienceBadge
            audience={audienceOf(livePrayer, sharedGroups)}
            protection={protectionOf(livePrayer)}
            lang={lang}
          />
        )}

        {/* Categories — read-only chips, except on a saved copy where you can
            file it under your own categories (personal organisation). */}
        {!savedCopy && prayerCategories.length > 0 && (
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

        {/* The hero leads with prayer. Management stays secondary here. */}
        {!isCommunity && !isAnswered && !livePrayer._locked && (
          canManage && (
              // Beside Pray now on any width that fits, stacked when the
              // translated labels need the room — so the hierarchy stays
              // readable instead of the labels overflowing.
              <div className="constellation-detail__secondary-actions flex flex-col min-[380px]:flex-row gap-2">
                <button
                  onClick={focusUpdateField}
                  className="flex-1 min-w-0 flex items-center justify-center gap-1.5 py-2.5 min-h-[44px] rounded-xl text-xs font-medium"
                  style={{ background: 'var(--input-bg)', color: 'var(--text-2)', border: '0.5px solid var(--input-border)' }}
                >
                  <Plus size={13} aria-hidden="true" className="shrink-0" />
                  <span className="truncate">{t(lang, 'addUpdateBtn')}</span>
                </button>
                <button
                  onClick={showTestimony ? closeAnswerFlow : openAnswerFlow}
                  aria-expanded={showTestimony}
                  aria-controls="pd-answer"
                  className="flex-1 min-w-0 flex items-center justify-center gap-1.5 py-2.5 min-h-[44px] rounded-xl text-xs font-medium"
                  style={{ background: 'var(--card-answered-bg)', color: 'var(--success)', border: '0.5px solid var(--card-answered-border)' }}
                >
                  <CheckCircle size={13} aria-hidden="true" className="shrink-0" />
                  <span className="truncate">{t(lang, 'markAnswered')}</span>
                </button>
              </div>
          )
        )}

        {/* Scheduling stays OUT of the main flow: the ⋯ menu's Schedule action
            opens the planner here as a contextual disclosure; otherwise a set
            schedule reads as one quiet summary line. */}
        {!isCommunity && !isAnswered && showScheduleEdit ? (
          <SchedulePlanner
            schedule={livePrayer.schedule || null}
            lang={lang}
            planDays={planWeekDays(categories, prayerCategoryIds, livePrayer.week_days)}
            defaultEditing
            onDone={() => { setShowScheduleEdit(false); scheduleTriggerRef.current?.focus(); }}
            onSave={(schedule) => updatePrayer(livePrayer.id, { schedule })}
          />
        ) : (
          livePrayer.schedule && (() => {
            const ended = !isAnswered && scheduleEnded(livePrayer, todayKey());
            return (
              <p
                className="text-xs flex items-center gap-1.5 rounded-xl px-3 py-2"
                style={ended
                  ? { background: 'var(--input-bg)', color: 'var(--text-3)', border: '0.5px solid var(--input-border)' }
                  : { background: 'var(--accent-soft)', color: 'var(--accent)', border: '0.5px solid var(--accent-border)' }}
              >
                <Repeat size={12} className="shrink-0" /> {ended ? t(lang, 'seriesEnded') : scheduleSummary(livePrayer.schedule, lang)}
              </p>
            );
          })()
        )}

        {/* Guided plan: today's theme + passage (only on a plan day), and — for a
            rich plan — its reflection, prompts, practice and "Go deeper". */}
        {planDay && (
          <div className="rounded-2xl p-4 space-y-3" style={{ background: 'var(--surface)', border: '0.5px solid var(--border)' }}>
            <div>
              <p className="text-xs font-semibold uppercase tracking-widest mb-1" style={{ color: 'var(--accent)' }}>
                {t(lang, 'planDayOf', { n: planDayNo, total: livePrayer.schedule.end?.count || '' })}
              </p>
              <p className="text-sm font-medium mb-2" style={{ color: 'var(--text-1)' }}>{pick(planDay.theme, lang)}</p>
              <VerseAccordion reference={localizeRef(planDay.ref, lang)} lang={lang}>
                {({ toggle, expanded }) => (
                  <button
                    onClick={toggle}
                    aria-expanded={expanded}
                    className="text-xs flex items-center gap-1.5"
                    style={{ color: 'var(--accent)' }}
                  >
                    <BookOpen size={12} /> {localizeRef(planDay.ref, lang)}
                  </button>
                )}
              </VerseAccordion>
            </div>
            <PlanDayBody day={planDay} lang={lang} role={planRole} resources={planResources} idPrefix="detail-plan-day" />
            {canEditPersonalization && (
              <button
                type="button"
                onClick={() => setEditingPersonalization(true)}
                className="pressable flex min-h-11 items-center gap-1.5 text-xs font-medium"
                style={{ color: 'var(--text-3)' }}
              >
                <Pencil size={12} aria-hidden="true" /> {t(lang, 'planCoupleOnboardingTitle')}
              </button>
            )}
          </div>
        )}

        {editingPersonalization && (
          <PlanOnboardingModal
            plan={plan}
            lang={lang}
            initial={planPrefs}
            ctaKey="save"
            onClose={() => setEditingPersonalization(false)}
            onStart={async (prefs) => {
              setEditingPersonalization(false);
              try {
                await savePlanPersonalization(livePrayer.user_id, livePrayer.id, prefs);
                reloadPrefs();
              } catch {
                // Storage refused the private record. The run keeps the answers
                // it already had rather than losing them to a failed write.
                toast.error(t(lang, 'errorGeneric'));
              }
            }}
          />
        )}

        {/* The last day is behind them — a calm close, and an optional way to
            carry some of the themes on as ordinary recurring prayers. */}
        {planFinished && (
          <PlanCompletionCard
            plan={plan}
            lang={lang}
            onContinue={async (themes) => {
              for (const theme of themes) {
                await addPrayer({
                  title: t(lang, theme.titleKey),
                  description: t(lang, theme.descKey),
                  categoryIds: [],
                  schedule: defaultNewSchedule(),
                });
              }
              markPlanCompleted(plan.id);
              toast.success(t(lang, 'planContinueAdded'));
            }}
          />
        )}
        {savedCopy && categories.length > 0 && (
          <div>
            <div className="flex flex-wrap gap-1.5 items-center">
              {/* Categories you've filed this under — tap to remove. */}
              {prayerCategories.map(c => (
                <button
                  key={c.id}
                  onClick={() => updatePrayer(livePrayer.id, { categoryIds: prayerCategoryIds.filter(id => id !== c.id) })}
                  className="text-xs px-3 py-1.5 rounded-full font-medium text-white"
                  style={{ backgroundColor: c.color }}
                >
                  {c.emoji} {tr(c.name, lang)}
                </button>
              ))}
              <button
                onClick={() => setShowCatPicker(v => !v)}
                className="text-xs px-3 py-1.5 rounded-full font-medium flex items-center gap-1"
                style={{ background: 'var(--accent-soft)', color: 'var(--accent)', border: '0.5px solid var(--accent-border)' }}
              >
                <Plus size={11} /> {t(lang, 'addCategoryFull')}
              </button>
            </div>
            {/* The full choice list is revealed only after tapping "Add a category". */}
            {showCatPicker && (
              <div className="flex flex-wrap gap-1.5 mt-2">
                {categories.filter(c => !prayerCategoryIds.includes(c.id)).map(c => (
                  <button
                    key={c.id}
                    onClick={() => updatePrayer(livePrayer.id, { categoryIds: [...prayerCategoryIds, c.id] })}
                    className="text-xs px-3 py-1.5 rounded-full font-medium"
                    style={{ background: 'var(--input-bg)', color: 'var(--text-3)', border: '0.5px solid var(--input-border)' }}
                  >
                    {c.emoji} {tr(c.name, lang)}
                  </button>
                ))}
              </div>
            )}
          </div>
        )}

        {/* ── Prayer points + AI suggestions (both modes) — kept directly after
            the request details so the "how to pray" points read right off the
            description, before the pray-together / updates / calendar sections. ── */}
        <div className="prayer-points-panel rounded-2xl" style={{ background: 'var(--surface)', border: '0.5px solid var(--border)' }}>
          <div className="prayer-points-panel__header flex items-center justify-between">
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

          <div className="prayer-points-panel__list">
            {(livePrayer.prayer_points || []).map(pp => {
              // Support both new `verses` array and legacy `verse`/`verse_text` fields
              const verses = pp.verses?.length
                ? pp.verses
                : pp.verse ? [{ ref: pp.verse, text: pp.verse_text || '' }] : [];
              return (
                <div key={pp.id} className="prayer-point-card group rounded-xl">
                  <div className="flex items-start gap-2">
                    <p className="flex-1 text-sm leading-snug" style={{ color: 'var(--text-1)' }}>{loc(pp.title)}</p>
                    {canRemoveContent && (
                      <button
                        onClick={() => setConfirmRemovePoint(pp)}
                        aria-label={t(lang, 'tipRemovePoint')}
                        title={t(lang, 'tipRemovePoint')}
                        className="shrink-0 opacity-0 group-hover:opacity-100 focus-visible:opacity-100 transition-opacity"
                        style={{ color: 'var(--gold)' }}
                      >
                        <Trash2 size={13} aria-hidden="true" />
                      </button>
                    )}
                  </div>

                  {/* Verse pills */}
                  {verses.length > 0 && (
                    <div className="prayer-point-card__verses flex flex-wrap gap-1.5">
                      {verses.map((v, i) => (
                        <PrayerDetailVerse
                          key={i}
                          verse={v}
                          lang={lang}
                          canRemove={canRemoveContent}
                          onRemove={() => handleRemoveVerse(pp.id, v.ref)}
                        />
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
                          style={{ background: 'var(--input-bg)', border: '1px solid var(--input-border)', color: 'var(--text-1)' }}
                          autoFocus
                        />
                        <input
                          type="text"
                          value={newVerse.text}
                          onChange={e => setNewVerse(v => ({ ...v, text: e.target.value }))}
                          placeholder={t(lang, 'verseTextPlaceholder')}
                          className="w-full text-xs rounded-lg px-2.5 py-1.5 focus:outline-none"
                          style={{ background: 'var(--input-bg)', border: '1px solid var(--input-border)', color: 'var(--text-1)' }}
                        />
                        <div className="flex gap-1.5">
                          <button onClick={() => { setAddingVerseTo(null); setNewVerse({ ref: '', text: '' }); }} className="flex-1 text-xs rounded-lg py-1.5" style={{ background: 'var(--gold-soft)', color: 'var(--gold)' }}>{t(lang, 'cancel')}</button>
                          <button
                            onClick={() => {
                              if (!newVerse.ref.trim()) return;
                              handleAddVerse(pp.id, { ref: newVerse.ref.trim(), text: newVerse.text.trim() });
                              setAddingVerseTo(null);
                              setNewVerse({ ref: '', text: '' });
                            }}
                            title={t(lang, 'tipSaveVerse')}
                            className="flex-1 text-xs rounded-lg py-1.5 font-medium"
                            style={{ background: 'var(--gold)', color: 'var(--surface)' }}
                          >
                            {t(lang, 'addVerse')}
                          </button>
                        </div>
                      </div>
                    ) : (
                      <button
                        onClick={() => { setAddingVerseTo(pp.id); setNewVerse({ ref: '', text: '' }); }}
                        title={t(lang, 'tipAddVerse')}
                        className="prayer-point-card__add-verse flex items-center gap-1 text-xs"
                        style={{ color: 'var(--gold)' }}
                      >
                        <Plus size={11} /> {t(lang, 'addVerse')}
                      </button>
                    )
                  )}
                </div>
              );
            })}
          </div>

          {recsError && <p className="text-xs rounded-xl px-3 py-2 mt-2" style={{ color: 'var(--gold)', background: 'var(--gold-soft)' }}>{recsError}</p>}

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

        {/* ── Per-prayer follow-up reminder (own personal prayers only) ── */}
        {!isCommunity && !savedCopy && !isAnswered && (
          <FollowUpBanner
            prayer={livePrayer}
            lang={lang}
            onAddUpdate={focusUpdateField}
            onMarkAnswered={openAnswerFlow}
          />
        )}

        {/* Set / change this prayer's follow-up date (opened from the ⋯ menu). */}
        {showFollowUpEdit && !isCommunity && !savedCopy && !isAnswered && (
          <div className="rounded-2xl p-4" style={{ background: 'var(--surface)', border: '0.5px solid var(--border)' }}>
            <FollowUpField
              value={followUps[livePrayer.id]?.date || null}
              onChange={(date) => setFollowUp(livePrayer.id, date)}
              lang={lang}
            />
          </div>
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

        {/* Follow this prayer for update / answered / testimony notifications.
            Reversible surface for the auto-follow that happens on "I'm praying". */}
        {isCommunity && user?.id && (
          <div className="flex items-center justify-end mb-4">
            <FollowPrayerButton userId={user.id} prayerId={communityPrayer.id} lang={lang} />
          </div>
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
            isAdmin={isGroupAdmin}
            avatarFor={memberAvatarFor}
            onSend={handleSendWord}
            onDelete={handleDeleteWord}
            onEdit={handleEditWord}
          />
        )}

        {/* ── Community mode: testimonies posted for this prayer ── */}
        {isCommunity && (
          <CommunityTestimonies items={prayerTestimonies} loc={loc} lang={lang} userId={user?.id} isAdmin={isGroupAdmin} onDelete={handleDeleteCommunityTestimony} onEdit={handleEditCommunityTestimony} />
        )}

        {/* ── Community mode: mark answered (author/admin) — mirrors personal ── */}
        {isCommunity && canEditCommunityPrayer && (
          !isAnswered ? (
            <div className="prayer-activity-panel">
              <p className="prayer-activity-panel__title">{t(lang, 'testimony')}</p>
              {/* Confirm marks the request answered; the testimony (text and/or
                  media) is optional, so allowEmpty keeps Confirm available. */}
              <UpdateComposer
                lang={lang}
                rows={1}
                allowEmpty
                placeholder={`${t(lang, 'testimony')}…`}
                sendLabel={t(lang, 'confirm')}
                onSend={handleConfirmCommunityAnswered}
              />
            </div>
          ) : (
            <div className="flex gap-3">
              <button onClick={handleResumeCommunity} title={t(lang, 'tipResume')} className="flex items-center gap-2 text-sm px-4 py-3 rounded-xl font-medium" style={{ background: 'var(--accent-soft)', color: 'var(--accent)' }}>
                {t(lang, 'resumePrayer')}
              </button>
            </div>
          )
        )}

        {/* ── Community mode: testimony (members; author/admin use the answered flow) ── */}
        {isCommunity && !canEditCommunityPrayer && (
          testimonySent ? (
            <div className="prayer-activity-action rounded-xl px-4 py-3 text-sm text-center" style={{ background: 'var(--accent-soft)', color: 'var(--accent)' }}>
              🎉 {t(lang, 'testimony')}
            </div>
          ) : showCommunityTestimony ? (
            <div className="prayer-activity-panel">
              <p className="prayer-activity-panel__title">{t(lang, 'postTestimony')}</p>
              <UpdateComposer
                lang={lang}
                rows={3}
                autoFocus
                placeholder={`${t(lang, 'testimony')}…`}
                sendLabel={t(lang, 'postTestimony')}
                onSend={handlePostCommunityTestimony}
              />
              <AnonymousToggle checked={communityTestimonyAnon} onChange={setCommunityTestimonyAnon} lang={lang} className="mt-3 mb-3" />
              <button onClick={() => setShowCommunityTestimony(false)} className="w-full py-2.5 rounded-xl text-sm" style={{ background: 'var(--input-bg)', color: 'var(--text-2)', border: '0.5px solid var(--input-border)' }}>{t(lang, 'cancel')}</button>
            </div>
          ) : (
            <button onClick={() => setShowCommunityTestimony(true)} className="prayer-activity-action w-full py-3 rounded-xl text-sm font-medium" style={{ background: 'var(--accent-soft)', color: 'var(--accent)', border: '0.5px solid var(--accent-border)' }}>
              🎉 {t(lang, 'postTestimony')}
            </button>
          )
        )}

        {/* ── Personal mode: updates, testimony, actions. The per-prayer plan
            (recurrence) is edited via SchedulePlanner near the top; the old
            "prayer days" toggle here was redundant with it and has been removed. */}
        {!isCommunity && <>
        <div className="prayer-activity-panel">
          <p className="prayer-activity-panel__title">{t(lang, 'evolutions')}</p>

          {allUpdates.length === 0 && (
            <p className="text-sm italic mb-3" style={{ color: 'var(--text-3)' }}>{t(lang, 'noUpdate')}</p>
          )}

          <div className="prayer-activity-list">
            {allUpdates.map(u => (
              <div key={u.id} className="prayer-activity-item prayer-activity-item--personal group flex gap-3">
                <div className="w-0.5 rounded-full shrink-0 mt-1.5" style={{ background: 'var(--accent)', alignSelf: 'stretch', minHeight: '14px' }} />
                <div className="prayer-activity-item__body min-w-0 flex-1">
                  {/* An entry captured while praying reads as part of the
                      prayer's story, not as a different kind of thing — the same
                      row, with a quiet line saying where it came from. */}
                  {sessionNoteIds.has(u.id) && !u._locked && (
                    <p className="prayer-activity-item__meta mb-1">
                      {t(lang, 'noteLabel')} · {t(lang, 'noteDuringPrayer')}
                    </p>
                  )}
                  {u._locked ? (
                    <p className="text-sm italic leading-snug" style={{ color: 'var(--text-3)' }}>{t(lang, 'updateSyncing')}</p>
                  ) : editingUpdateId === u.id ? (
                    <MessageEditor
                      initialText={u.text}
                      onSave={(text) => handleEditUpdate(u.id, text)}
                      onCancel={() => setEditingUpdateId(null)}
                      lang={lang}
                    />
                  ) : (
                    <>
                      {/* canManage ⇒ not a saved copy ⇒ every row here is the owner's own prayer_updates row */}
                      <RemovableText
                        text={loc(u.text)}
                        lang={lang}
                        className="text-sm leading-snug"
                        style={{ color: 'var(--text-1)' }}
                        onRemove={canManage ? () => removeUpdateText(livePrayer.id, u.id) : null}
                      />
                      <AttachmentList
                        attachments={u.attachments}
                        lang={lang}
                        className={u.text ? 'mt-1.5' : ''}
                        onRemove={canManage ? (att) => removeUpdateAttachment(livePrayer.id, u.id, att.id) : null}
                      />
                    </>
                  )}
                  {editingUpdateId !== u.id && (
                    <p className="prayer-activity-item__meta mt-1">
                      {u.author_name ? `${u.is_anonymous ? t(lang, 'anonymous') : u.author_name} · ` : ''}{format(new Date(u.created_at), 'd MMM yy', { locale })}
                    </p>
                  )}
                </div>
                {/* Author-only edit + delete cluster (own personal updates), hidden
                    while this row's inline editor is open. Edit needs text to edit. */}
                {editingUpdateId !== u.id && canManage && !u._locked && (
                  <div className="prayer-activity-item__actions flex items-start gap-1.5 self-start mt-1.5">
                    {!!u.text && (
                      <EditButton onEdit={() => setEditingUpdateId(u.id)} label={t(lang, 'editUpdate')} />
                    )}
                    <DeleteButton
                      onDelete={() => deleteUpdate(livePrayer.id, u.id)}
                      lang={lang}
                      label={t(lang, 'deleteUpdate')}
                    />
                  </div>
                )}
              </div>
            ))}
          </div>

          {!isAnswered && canManage && (
            <div className="prayer-activity-composer">
              <UpdateComposer
                inputId="pd-updates"
                lang={lang}
                rows={1}
                placeholder={t(lang, 'newUpdate')}
                onSend={handleAddUpdate}
              />
            </div>
          )}
        </div>


        {/* Testimonies — the prayer's own (preserved across resume) plus any posted
            on its community copies (read-only). Always above the write field. */}
        {(personalTestimonies.length > 0 || sharedActivity.testimonies.length > 0) && (
          <div className="prayer-activity-panel">
            <p className="prayer-activity-panel__title">{t(lang, 'testimonies')}</p>
            <div className="prayer-activity-list">
              {personalTestimonies.map(tm => {
                // Legacy jsonb testimonies surface in the list without being
                // prayer_testimonies rows — nothing to delete server-side.
                const isRow = (livePrayer.prayer_testimonies || []).some(r => r.id === tm.id);
                const showDelete = canManage && isRow && !tm._locked;
                const canEditTm = showDelete && !!tm.content; // author-only text edit
                const editing = editingTestimonyId === tm.id;
                return (
                <div key={tm.id} className="prayer-activity-item prayer-activity-item--testimony group">
                  {(tm.created_at || ((showDelete || canEditTm) && !editing)) && (
                    <div className="prayer-activity-item__header">
                      {tm.created_at
                        ? <p className="prayer-activity-item__meta">🎉 {format(new Date(tm.created_at), 'd MMM yyyy', { locale })}</p>
                        : <span />}
                      {!editing && (showDelete || canEditTm) && (
                        <div className="prayer-activity-item__actions flex items-start gap-1.5">
                          {canEditTm && (
                            <EditButton onEdit={() => setEditingTestimonyId(tm.id)} label={t(lang, 'editTestimony')} />
                          )}
                          {showDelete && (
                            <DeleteButton
                              onDelete={() => deleteTestimony(livePrayer.id, tm.id)}
                              lang={lang}
                              label={t(lang, 'deleteTestimony')}
                            />
                          )}
                        </div>
                      )}
                    </div>
                  )}
                  {editing ? (
                    <MessageEditor
                      initialText={tm.content}
                      onSave={(content) => handleEditTestimony(tm.id, content)}
                      onCancel={() => setEditingTestimonyId(null)}
                      lang={lang}
                    />
                  ) : (
                    <>
                      <RemovableText
                        text={loc(tm.content)}
                        lang={lang}
                        className="text-sm leading-relaxed"
                        style={{ color: 'var(--text-1)' }}
                        onRemove={canManage && isRow ? () => removeTestimonyText(livePrayer.id, tm.id) : null}
                      />
                      <AttachmentList
                        attachments={tm.attachments}
                        lang={lang}
                        className={tm.content ? 'mt-1.5' : ''}
                        onRemove={canManage && isRow ? (att) => removeTestimonyAttachment(livePrayer.id, tm.id, att.id) : null}
                      />
                    </>
                  )}
                </div>
                );
              })}
              {sharedActivity.testimonies.filter(hasContent).map(tm => (
                <div key={tm.id} className="prayer-activity-item prayer-activity-item--testimony">
                  <p className="prayer-activity-item__meta">🎉 {communityAuthor(tm, user?.id, lang)} · {timeAgo(tm.created_at, lang)}</p>
                  {tm.content && <RichText text={loc(tm.content)} className="text-sm leading-relaxed" style={{ color: 'var(--text-1)' }} />}
                  <AttachmentList attachments={tm.attachments} lang={lang} className={tm.content ? 'mt-1.5' : ''} />
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Add a word of thanks to an already-answered prayer — remembrance,
            without changing the answered date */}
        {isAnswered && canManage && (
          showThanks ? (
            <div className="prayer-activity-panel">
              <p className="prayer-activity-panel__title">{t(lang, 'testimony')}</p>
              <UpdateComposer
                lang={lang}
                rows={3}
                autoFocus
                placeholder={`${t(lang, 'testimony')}…`}
                sendLabel={t(lang, 'addThanks')}
                onSend={handleAddThanks}
              />
              <button onClick={() => setShowThanks(false)} className="w-full mt-2 py-2.5 rounded-xl text-sm" style={{ background: 'var(--input-bg)', color: 'var(--text-2)', border: '0.5px solid var(--input-border)' }}>{t(lang, 'cancel')}</button>
            </div>
          ) : (
            <button onClick={() => setShowThanks(true)} className="prayer-activity-action w-full py-3 rounded-xl text-sm font-medium" style={{ background: 'var(--accent-soft)', color: 'var(--accent)', border: '0.5px solid var(--accent-border)' }}>
              🙏 {t(lang, 'addThanks')}
            </button>
          )
        )}

        {/* The answered flow, opened by the leading Mark answered action: an
            optional testimony and the confirm step, together in the disclosure
            they belong to. Nothing is marked answered without this confirm. */}
        {!isAnswered && showTestimony && canManage && (
          <div id="pd-answer" className="prayer-activity-panel">
            <p className="prayer-activity-panel__title">{t(lang, 'testimony')}</p>
            {/* The testimony is OPTIONAL — allowEmpty keeps Confirm available
                with nothing written, exactly like the old flow. */}
            <UpdateComposer
              lang={lang}
              rows={1}
              autoFocus
              allowEmpty
              placeholder={`${t(lang, 'testimony')}…`}
              sendLabel={t(lang, 'confirm')}
              onSend={confirmAnswered}
            />
            <button onClick={closeAnswerFlow} className="w-full mt-2 py-2.5 min-h-[44px] rounded-xl text-sm" style={{ background: 'var(--input-bg)', color: 'var(--text-2)', border: '0.5px solid var(--input-border)' }}>
              {t(lang, 'cancel')}
            </button>
          </div>
        )}

        {/* An answered prayer's only remaining state action — reopening it. */}
        {isAnswered && canManage && (
          <div className="flex gap-3 pb-6">
            <button onClick={() => markActive(livePrayer.id)} title={t(lang, "tipResume")} className="flex items-center gap-2 text-sm px-4 py-3 min-h-[44px] rounded-xl font-medium" style={{ background: 'var(--accent-soft)', color: 'var(--accent)' }}>
              {t(lang, 'resumePrayer')}
            </button>
          </div>
        )}
        </>}
      </div>
    </div>
  );
}
