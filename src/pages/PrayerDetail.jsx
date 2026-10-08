import { useState, useEffect, useMemo, useRef } from 'react';
import { ArrowLeft, Plus, Trash2, Edit2, CheckCircle, Lightbulb, Loader2, BookOpen, Share2, Languages, Users, Pin, Repeat, Bell, BellOff, CalendarClock, Flag, UserX, Pencil, Lock, ShieldCheck, Sparkles } from 'lucide-react';
import { useShallow } from 'zustand/react/shallow';
import usePrayerStore from '../store/prayerStore';
import useTranslationStore from '../store/translationStore';
import useAuthStore from '../store/authStore';
import useCommunityStore from '../store/communityStore';
import { format } from 'date-fns';
import { dateLocale, timeAgo } from '../utils/date';
import { getAuthorName, communityAuthor } from '../utils/user';
import { testimonyList, recoverLockedPrayerPoints, mergeSharedPrayerUpdates } from '../utils/prayer';
import { getAIRecommendations } from '../aiRecommendations';
import { t, tp } from '../i18n';
import { carriedSinceLabel, prayedDayCount, showsCarriedSince } from '../lib/carried';
import { toast } from '../store/toastStore';
import AiConsentModal from '../components/AiConsentModal';
import AiOutgoingPreview from '../components/AiOutgoingPreview';
import { hasAiConsent } from '../lib/aiConsent';
import { hasReviewedOutgoing, markOutgoingReviewed } from '../lib/aiCore';
import AiDisclaimer from '../components/shared/AiDisclaimer';
import AiOutputReport from '../components/AiOutputReport';
import PrayerForm from '../components/PrayerForm';
import PrayerShareModal from '../components/PrayerShareModal';
import FollowUpBanner from '../components/FollowUpBanner';
import { scheduleSummary } from '../lib/scheduleDraft';
import { planWeekDays, scheduleEnded } from '../lib/planner';
import { isPlanDay, planDayNumber, restingPlanDay, toKey } from '../lib/schedule';
import { todayKey } from '../lib/prayedLog';
import { getPlan } from '../content/prayerPlans';
import { pick, localizeRef } from '../content/teaching';
import { usePlanDay } from '../hooks/usePlanDay';
import { usePlanDayPager } from '../hooks/usePlanDayPager';
import PlanDayBody from '../components/PlanDayBody';
import ReportWordingLink from '../components/ReportWordingLink';
import PlanDayDeck from '../components/plan/PlanDayDeck';
import DisclosureRow from '../components/shared/DisclosureRow';
import PlanDayTrace from '../components/plan/PlanDayTrace';
import PlanCompletionCard from '../components/PlanCompletionCard';
import PlanShareSheet from '../components/plan/PlanShareSheet';
import PlanPersonalizeModal from '../components/PlanPersonalizeModal';
import { hasPersonalization, isCouplePlan, planPeopleFrom } from '../lib/planPersonalization';
import { savePlanPersonalization } from '../lib/planPersonalizationStorage';
import { claimPlanCompletionReport, markPlanCompleted, savePlanPrefs } from '../lib/planPrefs';
import { track } from '../lib/analytics';
import { canUsePlan } from '../lib/planReview';
import { isPlanShareable } from '../lib/planShareLink';
import { planPrayerText } from '../lib/guidedPlan';
import { PACE_LABEL_KEYS, paceOf, planTotal } from '../lib/planTempo';
import SchedulePlanner from '../components/SchedulePlanner';
import CarryPresence from '../components/CarryPresence';
import CarryButton from '../components/shared/CarryButton';
import Avatar from '../components/shared/Avatar';
import usePrayerFollow from '../hooks/usePrayerFollow';
import ScriptureFirstStep from '../components/ScriptureFirstStep';
import VerseAccordion from '../components/VerseAccordion';
import useMemberAvatars from '../hooks/useMemberAvatars';
import UpdateComposer from '../components/rich/UpdateComposer';
import RichText from '../components/rich/RichText';
import RemovableText from '../components/rich/RemovableText';
import AttachmentList from '../components/rich/AttachmentList';
import { useSessionNoteIds } from '../hooks/useSessionNoteIds';
import DeleteButton from '../components/rich/DeleteButton';
import EditButton from '../components/rich/EditButton';
import MessageEditor from '../components/rich/MessageEditor';
import ConfirmDialog from '../components/shared/ConfirmDialog';
import LockedNotice from '../components/LockedNotice';
import PrayerSession from '../components/PrayerSession';
import { PrimaryButton, QuietButton, SecondaryButton, StatusLabel } from '../components/shared/Primitives';
import CircleGlyph from '../components/shared/CircleGlyph';
import { CIRCLE_ICONS } from '../components/shared/circleIcons';
import PlaceCircleModal from '../components/circles/PlaceCircleModal';
import { canHoldPrivateMetadata } from '../lib/crypto/prayerCrypto';
import { circleLabelKey, circleOf } from '../lib/circles';
import FollowUpField from '../components/FollowUpField';
import useFollowUpStore from '../store/followUpStore';
import { audienceLabel, audienceOf, protectionLabel, protectionOf } from '../lib/audience';
import { needsTranslationControl } from '../lib/langHint';
import { getTranslationPref, setTranslationPref, prayerScope } from '../lib/translationPrefs';
import { usePrayerActions } from '../hooks/usePrayerActions';
import OverflowMenu from '../components/shared/OverflowMenu';
import PrayerPointItem from '../components/PrayerPointItem';
import useCommunityPrayerUpdates from './prayerDetail/useCommunityPrayerUpdates';
import useCommunityPrayerActions from './prayerDetail/useCommunityPrayerActions';
import CommunityActivity from './prayerDetail/CommunityActivity';
import usePrayerSharing from './prayerDetail/usePrayerSharing';
import { safetyText } from '../lib/communitySafety';

// The facts line under a prayer's title — circle, rhythm, audience — is read
// at a glance: each fact a small icon and a word, the prayer itself the hero.

// The Intercession Circle, in its own tone. Where the circle can be kept
// encrypted (`onChange`) it opens the picker, which also leads to the circle's
// teaching; elsewhere a placed circle is plain text and an unplaced one absent.
function CircleFact({ circle, lang, onChange }) {
  const name = circle ? t(lang, circleLabelKey(circle)) : null;
  const Icon = circle ? CIRCLE_ICONS[circle] : null;
  const content = (
    <>
      {Icon
        ? <span className={`icon-tile icon-tile--sm tone-${circle}`} aria-hidden="true"><Icon size={13} strokeWidth={2} /></span>
        : <CircleGlyph circle="nations" size={16} />}
      <span>{name || t(lang, 'circleFieldLabel')}</span>
    </>
  );
  if (!onChange) return circle ? <span className="prayer-detail__fact">{content}</span> : null;
  return (
    <button
      type="button"
      onClick={onChange}
      aria-haspopup="dialog"
      aria-label={`${t(lang, 'circleFieldLabel')}: ${name || t(lang, 'circleNotSet')}`}
      className={`prayer-detail__fact prayer-detail__fact--button ${circle ? '' : 'prayer-detail__fact--unset'} pressable`}
    >
      {content}
    </button>
  );
}

// How often it comes back — a tap opens the scheduler, as the ⋯ menu does.
function RhythmFact({ label, open, onToggle }) {
  const content = <><Repeat size={14} aria-hidden="true" />{label}</>;
  if (!onToggle) return <span className="prayer-detail__fact">{content}</span>;
  return (
    <button type="button" onClick={onToggle} aria-expanded={open} className="prayer-detail__fact prayer-detail__fact--button pressable">
      {content}
    </button>
  );
}

// Who can read it — Private / Shared with … / From [group]. Encryption is
// never a different audience: it is a small shield beside it, and a tap says
// what it means. A plaintext prayer gets no shield, and no claim.
function AudienceFact({ audience, protection, lang }) {
  const [open, setOpen] = useState(false);
  const { key, vars } = audienceLabel(audience);
  const shared = audience.kind !== 'private';
  const Icon = shared ? Users : Lock;
  const prot = protectionLabel(protection);
  const label = <><Icon size={14} aria-hidden="true" />{t(lang, key, vars)}</>;
  if (!prot) return <span className="prayer-detail__fact">{label}</span>;
  return (
    <>
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        aria-expanded={open}
        aria-controls="pd-protection"
        className="prayer-detail__fact prayer-detail__fact--button pressable"
      >
        {label}
        <ShieldCheck size={13} className="prayer-detail__shield" aria-hidden="true" />
        <span className="sr-only">{t(lang, prot.key)}</span>
      </button>
      {open && (
        <p id="pd-protection" className="prayer-detail__fact-note">
          {t(lang, shared ? 'pcSharedBody' : 'pcPrivateBody')}
        </p>
      )}
    </>
  );
}

// Who is asking, before what they ask: the author's face and name, then the
// group it was brought to, when, and its labels — a group's request reads as a
// word from someone, not as a record.
function CommunityByline({ prayer, author, avatar, groupName, labels, answered, lang }) {
  const anonymous = !!prayer.is_anonymous;
  return (
    <div className="prayer-detail__byline">
      <Avatar name={anonymous ? '?' : author} avatar={avatar} anonymous={anonymous} size={40} />
      <div className="min-w-0">
        <p className="prayer-detail__byline-author">{author}</p>
        <div className="prayer-detail__byline-meta">
          {groupName && (
            <AudienceFact audience={{ kind: 'fromGroup', groupName }} protection={protectionOf(prayer)} lang={lang} />
          )}
          <span>{timeAgo(prayer.created_at, lang)}</span>
          {labels && <span>{labels}</span>}
          {answered && <StatusLabel tone="answered">{t(lang, 'answered')}</StatusLabel>}
        </div>
      </div>
    </div>
  );
}

// communityPrayer prop switches the component to community mode
// `?day=` arrives from a URL, so it is checked for shape before it is asked
// about: without this a hand-typed value walks the occurrence scan to its guard
// before being rejected.
const DAY_KEY = /^\d{4}-\d{2}-\d{2}$/;

// A stable identity for "no exceptions", so a prayer that has never had a day
// skipped or moved doesn't hand the memos below a fresh object every render.
const EMPTY_OVERRIDES = {};

export default function PrayerDetail({ prayer, communityPrayer, onBack, onEdit, lang = 'en', planDayKey = null, onShowToday = null, onGoToDay = null, onOpenCircle = null, onPrayInCircle = null, initialFocus = null }) {
  const isCommunity = !!communityPrayer;

  // ── Personal mode state ──────────────────────────────────────────────────
  // The answered flow is a DISCLOSURE opened by the "Mark answered" action, not
  // a form standing permanently open — so the page shows one Mark answered
  // control, and confirming happens inside the thing it opened. Its (optional)
  // testimony text lives in the composer.
  const [showTestimony, setShowTestimony] = useState(false);
  // Set only in the moment a prayer is marked answered here — the optional
  // "Is there a faithful next step?" question is never shown again later.
  const [justAnswered, setJustAnswered] = useState(false);
  const [addingNextStep, setAddingNextStep] = useState(false);
  // Adding a word of thanks to an already-answered prayer (remembrance).
  const [showThanks, setShowThanks] = useState(false);
  const [updateComposerOpen, setUpdateComposerOpen] = useState(false);
  const [updateRecs, setUpdateRecs] = useState([]);
  const [loadingRecs, setLoadingRecs] = useState(false);
  const [recsError, setRecsError] = useState(null);
  const [manualPoint, setManualPoint] = useState({ title: '', verse: '' });
  const [showManualForm, setShowManualForm] = useState(false);
  const [showCatPicker, setShowCatPicker] = useState(false);
  const [showCirclePicker, setShowCirclePicker] = useState(false);
  const [editingTitle, setEditingTitle] = useState(false);
  const [titleDraft, setTitleDraft] = useState('');
  const titleCancelRef = useRef(false);
  // Which posted update / testimony is open in its inline editor (author-only,
  // one at a time — the same WhatsApp "edit message" gesture as the community).
  const [editingUpdateId, setEditingUpdateId] = useState(null);
  const [editingTestimonyId, setEditingTestimonyId] = useState(null);
  const [showAiConsent, setShowAiConsent] = useState(false);
  const [showAiPreview, setShowAiPreview] = useState(false);
  const [showShareModal, setShowShareModal] = useState(false);
  const [showPlanShare, setShowPlanShare] = useState(false);
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
  // (The encouragement timeline lives in useCommunityPrayerUpdates, the carry
  // toggle in useCommunityPrayerActions.) Which entry flow the action row
  // opened: 'word', 'answer' or 'testimony' — one at a time, like personal.
  const [communityFlow, setCommunityFlow] = useState(null);
  const [showCommunityEdit, setShowCommunityEdit] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [showReportConfirm, setShowReportConfirm] = useState(false);
  const [showBlockConfirm, setShowBlockConfirm] = useState(false);

  const { categories, markAnswered, markActive, markPrayedOn, addTestimony: addPersonalTestimony, addUpdate, removeUpdateAttachment, removeUpdateText, deleteUpdate, editUpdate, removeTestimonyAttachment, removeTestimonyText, deleteTestimony, editTestimony, addPrayerPoint, addVerseToPoint, removeVerseFromPoint, removePrayerPoint, togglePin, syncCategoriesFromCommunity, updatePrayer, prayers, completions } = usePrayerStore(
    useShallow((s) => ({
      categories: s.categories,
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
      completions: s.completions,
    }))
  );
  const { tr, translateTexts, translating } = useTranslationStore();
  const [showTranslated, setShowTranslated] = useState(false);
  const { followUps, setFollowUp } = useFollowUpStore(
    useShallow((s) => ({ followUps: s.followUps, setFollowUp: s.setFollowUp }))
  );
  const { user } = useAuthStore();
  // (fetchPrayerUpdates, addUpdate, delete/editCommunityUpdate, subscribePrayerActivity,
  // refreshPrayer, fetchUserReactions moved into useCommunityPrayerUpdates.)
  const { groups, prayers: communityPrayers, updatePrayer: updateCommunityPrayer, deleteCommunityPrayer, addCommunityPrayerPoint, removeCommunityPrayerPoint, addCommunityVerse, removeCommunityVerse, testimonies: communityTestimonies, setPrayerShares, reportCommunityContent, setUserBlocked } = useCommunityStore(
    useShallow((s) => ({
      groups: s.groups,
      prayers: s.prayers,
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

  // ── Community mode: answered mirroring + "Carry this prayer" toggle ────────
  const {
    communityHasReacted, togglingPraying,
    handleConfirmCommunityAnswered, handleResumeCommunity, handleTogglePraying,
  } = useCommunityPrayerActions({ communityPrayer, isCommunity, user, authorName, lang });

  // Following lives in the ⋯ menu; carrying a prayer already follows it.
  const { following, toggle: toggleFollow } = usePrayerFollow({
    userId: isCommunity ? user?.id : null,
    prayerId: communityPrayer?.id,
    lang,
  });

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
  const prayedDays = isCommunity ? 0 : prayedDayCount(completions, livePrayer.id);
  // An owned prayer can contain older child rows encrypted under an account key
  // this device no longer holds, while its group-key snapshot remains readable.
  // Recover matching points for display only; the original ciphertext is never
  // overwritten and every recovered row stays read-only below.
  const visiblePrayerPoints = isCommunity
    ? (livePrayer.prayer_points || [])
    : recoverLockedPrayerPoints(livePrayer.prayer_points || [], sharedActivity.prayers || []);
  const displayPrayer = visiblePrayerPoints === livePrayer.prayer_points
    ? livePrayer
    : { ...livePrayer, prayer_points: visiblePrayerPoints };
  // ── Guided plan ──────────────────────────────────────────────────────────
  // Which day of a running plan today is, the day's content with the reader's
  // language folded in, and any APPROVED resources for its topics. Called
  // unconditionally (a null plan id resolves to null) so the rules of hooks hold
  // for the many prayers that are not part of a plan.
  const planId = livePrayer.schedule?.plan?.id || null;
  // WHICH day of the plan is on screen. Today's, unless the calendar handed over
  // another day of the same run (`?day=` → planDayKey): that is how a reader
  // returns to a day they missed, or reads the next one, without leaving the
  // plan. Only a real day of THIS run is accepted — on its calendar, or walked
  // before its pace last changed — so a stale link or a hand-typed date quietly
  // falls back to today rather than showing a day the run does not have.
  // Overrides travel with the schedule everywhere below: a day the reader
  // SKIPPED or MOVED is a fact about where the run has got to, and reading the
  // pattern without them reports a day the calendar will not open.
  const planOverrides = livePrayer.schedule_overrides || EMPTY_OVERRIDES;
  const requestedDay = planId && DAY_KEY.test(planDayKey || '')
    && isPlanDay(livePrayer.schedule, planDayKey, planOverrides)
    ? planDayKey : null;
  const planVersion = livePrayer.schedule?.plan?.version || null;
  const resolvedPlan = planId ? getPlan(planId, planVersion) : null;
  const plan = canUsePlan(resolvedPlan) ? resolvedPlan : null;
  // HOW LONG THE RUN IS, from the plan's own content first. The schedule's
  // count is only what REMAINS once a run has been re-paced, and an older run
  // may carry no count at all — either way the pager would then walk past the
  // last day of the plan, where there is no content and the card simply
  // vanishes. One number, so what the card prints and where paging stops can
  // never disagree.
  const planLength = (planId && (plan?.count || planTotal(livePrayer.schedule))) || null;
  // WHERE THE RUN IS SITTING today, which is only the same thing as "today's
  // day" for a plan running daily. Every other rhythm — and any skipped or moved
  // day — leaves most dates off the run, and the plan's whole card used to
  // vanish on them: no theme, no passage, no way back in. It rests on the last
  // day it reached instead (or the first still to come, or the day it was
  // paused holding).
  const resting = useMemo(
    () => (planId ? restingPlanDay(livePrayer.schedule, todayKey(), planOverrides) : null),
    [planId, livePrayer.schedule, planOverrides],
  );
  const viewedDayKey = requestedDay || resting?.dayKey || todayKey();
  const planDayNo = requestedDay
    ? planDayNumber(livePrayer.schedule, requestedDay, planOverrides)
    : (resting?.dayNo ?? null);
  // Everything else on this page — marking prayed, the follow-up, the series
  // summary — stays about TODAY. Only the plan day itself moves.
  const viewingOtherDay = planDayNo != null && viewedDayKey !== todayKey();
  // A paused run holds a day without holding a date: nothing to date-stamp
  // until it is given a rhythm again — though the days it already walked still
  // have theirs, and can be paged back to.
  const deckDayKey = requestedDay || (resting?.state === 'paused' ? null : viewedDayKey);
  // The days on either side of the one on screen, so the reader can read back
  // over what a day held or look ahead at what is coming without going out to
  // the calendar and back for each one.
  const { prevKey: prevDayKey, nextKey: nextDayKey } =
    usePlanDayPager(livePrayer.schedule, planOverrides, deckDayKey, planDayNo, planLength);
  const {
    day: planDay, prefs: planPrefs, role: planRole, resources: planResources, resourceOffers: planResourceOffers, reloadPrefs,
  } =
    usePlanDay(planId, planDayNo, lang, {
      prayerId: livePrayer.id, ownerId: livePrayer.user_id, planVersion,
    });
  // The last day is behind them: the series can produce no more occurrences.
  const planFinished = !!plan?.completion && !isCommunity && scheduleEnded(livePrayer, todayKey());
  // "Not today" has several honest meanings, and the card should say which one
  // rather than claiming the reader paged here themselves.
  const planDayNoteKey = (() => {
    if (requestedDay) {
      if (!viewingOtherDay) return null;
      return requestedDay > todayKey() ? 'planDayUpcoming' : 'planViewingOtherDay';
    }
    if (!resting || resting.state === 'today') return null;
    if (resting.state === 'paused') return 'planPacePausedNote';
    return resting.state === 'upcoming' ? 'planDayUpcoming' : 'planPaceResting';
  })();
  // A plan's answers used to be capturable only at the moment it started, behind
  // a sheet that stood between "Start" and the first day. They are asked here
  // instead — on the day itself, where the reader can see what an answer
  // changes — and stay correctable for the life of the run.
  const [editingPersonalization, setEditingPersonalization] = useState(false);
  const canEditPersonalization = !isCommunity && !planFinished
    && hasPersonalization(plan) && (!isCouplePlan(plan) || !!livePrayer.user_id);
  // A couple run's answers are private to that run; a single reader's stay on
  // the device under the plan's own id.
  const savePersonalization = async (prefs) => {
    if (!isCouplePlan(plan)) { savePlanPrefs(plan.id, prefs); return; }
    await savePlanPersonalization(livePrayer.user_id, livePrayer.id, prefs);
  };
  // The husband/wife question, offered inline on the first day that actually
  // carries such a reflection — and only until it has been answered, so
  // "keep it general" silences it just as firmly as choosing one.
  const offerRoleChoice = canEditPersonalization && !isCouplePlan(plan) && !planPrefs?.role;

  // Completion is reported when the last day is actually behind the reader, not
  // when they happen to tap a follow-up action. claimPlanCompletionReport()
  // makes it once per run, so re-opening the finished prayer counts nothing.
  const completedEvent = planFinished ? plan?.analyticsEvents?.completed : null;
  useEffect(() => {
    if (completedEvent && claimPlanCompletionReport(livePrayer.id)) track(completedEvent);
  }, [completedEvent, livePrayer.id]);

  const isAnswered = isCommunity ? !!livePrayer.is_answered : livePrayer.status === 'answered';
  // The run's rhythm is the reader's own to set: never on a community prayer,
  // and not once the prayer is answered or the plan is finished.
  const canEditPace = !!planId && !isCommunity && !isAnswered && !planFinished;
  // ── What a guided plan run does NOT need ─────────────────────────────────
  // A plan run is a different kind of page. Its day already names the theme,
  // the passage and the prompts; it comes back on the run's own rhythm; and not
  // one word on it was written by the reader. So most of the generic prayer
  // machinery around it was either duplicated ceremony or a question a plan
  // cannot answer. Each flag below hides only what a plan cannot use: anything
  // the reader actually put there stays visible and stays editable.
  const isPlanRun = !isCommunity && !!planDay;
  // The series can produce no more days. Read once, because it decides both
  // whether the rhythm is still worth asking about and what the quiet summary
  // line says.
  const seriesEnded = !isAnswered && scheduleEnded(livePrayer, todayKey());
  // Rhythm is asked ONCE, on the plan's own card, and what that row opens is the
  // ordinary scheduler — which for a plan-linked draft already drops "Pray once",
  // offers Pause in its place, and re-anchors so the day on screen survives the
  // change (see ScheduleEditor's PLAN_MODE_ROWS). There is no second pace editor,
  // and while this row is showing the ⋯ menu's Schedule action stands down.
  const planScheduleRow = isPlanRun && canEditPace && !seriesEnded;
  // The plan's day is the way to pray, so a plan run is never invited to author
  // prayer points beside it. Points an older run already carries still render —
  // decluttering hides affordances, never what someone wrote.
  const offerPointAuthoring = !isPlanRun;
  // An answered prayer is not asked how to pray for it: its points stay, the
  // empty invitation and the authoring tools go — on a group's request too.
  const showWaysToPray = (!isPlanRun && !isAnswered) || (displayPrayer.prayer_points || []).length > 0;
  // Same rule for the per-prayer follow-up: not offered on a run that already
  // returns by itself, but never taken away from one that has a date set.
  const followUpRelevant = !isPlanRun || !!followUps[livePrayer.id];
  // A plan run's name and subtitle belong to the PLAN, not to the reader. They
  // are read in the language being read — the copy written into the prayer at
  // creation is stuck in whichever language it was started in — so they are not
  // edited here and never routed through the AI translation toggle.
  const planText = isPlanRun ? planPrayerText(plan, lang) : null;
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
  // The circle is one quiet row under the prayer, changed in place without
  // rebuilding it (its rhythm, labels and history are untouched). Only a prayer
  // that can keep the circle inside its ciphertext can be placed.
  const heroCircle = circleOf(livePrayer);
  const heroContext = [
    livePrayer.for_other && livePrayer.person_name ? t(lang, 'forPersonLabel', { name: livePrayer.person_name }) : '',
    livePrayer.origin_group_name || '',
  ].filter(Boolean).join(' · ');
  const carryingCount = isCommunity
    ? communityReactionCount
    : sharedGroups.reduce((total, share) => total + (share.prayingCount || 0), 0);
  // A community request is prayed through the reader's OWN copy of it — the one
  // carrying added, or the prayer they shared it from — so a session here counts
  // in the same per-prayer log as Today. Without an open copy there is nothing
  // to record against, and the action row offers Carry instead.
  const communityCopy = isCommunity
    ? prayers.find((p) => p.community_origin_id === communityPrayer.id)
      || (communityPrayer.user_id === user?.id && communityPrayer.source_prayer_id
        ? prayers.find((p) => p.id === communityPrayer.source_prayer_id)
        : null)
      || null
    : null;
  const communityPrayable = communityHasReacted && !!communityCopy && communityCopy.status !== 'answered' && !communityCopy._locked;
  const communityGroupName = isCommunity ? (groups.find((g) => g.id === communityPrayer.group_id)?.name || '') : '';

  // ── Shared (saved-from-community) prayer flags ───────────────────────────
  // A saved copy follows the shared content read-only: it pulls the author's/
  // group's latest, but isn't edited here (open it in Community to contribute).
  const savedCopy = !isCommunity && !!livePrayer.community_origin_id;
  // A carried copy can be placed too: the circle is the carrier's own, on their
  // own encrypted copy, and never reaches the group.
  const canPlaceCircle = !isCommunity && !livePrayer._locked && canHoldPrivateMetadata(livePrayer);
  // Any run of a plan — upcoming, in progress or finished — can pass the plan
  // on. What is shared is the plan, never this run or anything prayed in it.
  const planShareable = !isCommunity && !savedCopy && !!user?.id && isPlanShareable(plan);
  const canAddContent = !isAnswered && (isCommunity || !savedCopy);
  const canRemoveContent = !isAnswered && (isCommunity || !savedCopy);
  // Fold in group activity for both saved copies and owned source prayers. For an
  // older locked personal row, a matching readable group mirror supplies a
  // display-only fallback instead of the misleading permanent sync placeholder.
  const allUpdates = (!isCommunity
    ? mergeSharedPrayerUpdates(livePrayer.prayer_updates || [], sharedActivity.updates || [])
    : []).filter(hasContent);
  // You can post updates/testimonies and mark answered only on prayers you own —
  // a saved-from-community copy is read-only (you follow the author's prayer).
  const canManage = !savedCopy;
  const showUpdateComposer = updateComposerOpen && !isAnswered && canManage;
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

  // ── What a past plan day held ────────────────────────────────────────────
  // Paging back to a day already walked shows more than the day's reading: that
  // it was prayed, and whatever was written that day. Locked rows are left to
  // the activity list below, which knows how to explain them.
  const pastPlanDay = viewingOtherDay && viewedDayKey < todayKey();
  const planDayPrayed = pastPlanDay && (completions[livePrayer.id] || []).includes(viewedDayKey);
  const planDayUpdates = !pastPlanDay ? [] : allUpdates
    .filter((u) => u.text && !u._locked && u.created_at && toKey(new Date(u.created_at)) === viewedDayKey)
    .map((u) => ({ id: u.id, text: loc(u.text) }));

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
    (displayPrayer.prayer_points || []).forEach(pp => texts.push(pp.title));
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
    setUpdateComposerOpen(false);
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

  // The two optional context fields the outgoing-text preview labels separately:
  // the prayer's own description, and its latest update (evolution recommendations
  // lean on the update). Each is opt-in; the title is always sent, so no title
  // fallback is needed here.
  const recsDescription = () => livePrayer.description || '';
  const recsLatestUpdate = () =>
    isCommunity ? '' : ((livePrayer.prayer_updates || []).slice(-1)[0]?.text || '');

  // Gate: require consent, then a one-time review of the exact outgoing text for
  // this prayer, before the first AI request.
  const fetchRecs = () => {
    if (loadingRecs) return;
    if (!hasAiConsent('prayer')) { setShowAiConsent(true); return; }
    if (!hasReviewedOutgoing(livePrayer.id)) { setShowAiPreview(true); return; }
    runRecs();
  };

  const runRecs = async () => {
    setLoadingRecs(true);
    setRecsError(null);
    const { recs, error } = await getAIRecommendations({ title: livePrayer.title, description: recsDescription(), update: recsLatestUpdate(), type: 'evolution', lang });
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

  // On a group's request each tool opens its own flow and brings it into
  // view; pressing the same tool again folds it away.
  const openCommunityFlow = (flow, sectionId) => {
    if (communityFlow === flow) { setCommunityFlow(null); return; }
    setCommunityFlow(flow);
    requestAnimationFrame(() => revealAndFocus(sectionId, '[contenteditable]'));
  };

  const openAnswerFlow = () => {
    setShowTestimony(true);
    requestAnimationFrame(() => revealAndFocus('pd-answer', '[contenteditable]'));
  };

  const closeAnswerFlow = () => setShowTestimony(false);

  const confirmAnswered = (text, attachments) => {
    markAnswered(livePrayer.id, text, attachments);
    closeAnswerFlow();
    setJustAnswered(true);
  };

  // The update field is not standing open on every prayer: it unfolds when
  // asked for ("Add an update", a plan day's note, a follow-up nudge) and
  // folds away again once sent or cancelled.
  const focusUpdateField = () => {
    setUpdateComposerOpen(true);
    requestAnimationFrame(() => revealAndFocus('pd-updates', '[contenteditable]'));
  };

  // Arriving from "Tend your altar" with a purpose: open that part once.
  const initialFocusDone = useRef(false);
  useEffect(() => {
    if (initialFocusDone.current || !initialFocus || isCommunity) return;
    initialFocusDone.current = true;
    if (initialFocus === 'answer') openAnswerFlow();
    else if (initialFocus === 'update') requestAnimationFrame(focusUpdateField);
  });

  // Own prayer → warn first; saved copy → instant unfollow + Undo. Then navigate back.
  const handleDelete = () => removePrayer(livePrayer, onBack);

  // Inline title edit — own personal prayers only (community has its own edit;
  // a saved copy follows the author's title).
  const canEditTitle = !isCommunity && !savedCopy && !livePrayer._locked && !isPlanRun;
  const startEditTitle = () => { setTitleDraft(livePrayer.title || ''); titleCancelRef.current = false; setEditingTitle(true); };
  const saveTitle = () => {
    if (titleCancelRef.current) { titleCancelRef.current = false; setEditingTitle(false); return; }
    const next = titleDraft.trim();
    setEditingTitle(false);
    if (next && next !== livePrayer.title) updatePrayer(livePrayer.id, { title: next });
  };

  const [confirmRemovePoint, setConfirmRemovePoint] = useState(null);
  const [confirmRemoveVerse, setConfirmRemoveVerse] = useState(null);

  // The recurrence editor, declared once and placed twice: on a plan run it sits
  // inside the plan's own card (where the pace question used to be), otherwise
  // in the main flow under the ⋯ menu's Schedule action. Only the menu needs its
  // focus handed back — the plan card's disclosure keeps focus on its own row.
  const schedulePlanner = (
    <SchedulePlanner
      schedule={livePrayer.schedule || null}
      lang={lang}
      planDays={planWeekDays(categories, prayerCategoryIds, livePrayer.week_days)}
      defaultEditing
      onDone={() => {
        setShowScheduleEdit(false);
        if (!planScheduleRow) scheduleTriggerRef.current?.focus();
      }}
      onSave={(schedule) => updatePrayer(livePrayer.id, { schedule })}
    />
  );

  return (
    <div className="detail-page phase-page prayer-detail">
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
          prayers={[isCommunity ? communityCopy : displayPrayer]}
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
      {confirmRemoveVerse && (
        <ConfirmDialog
          title={t(lang, 'tipRemoveVerse')}
          message={`${localizeRef(confirmRemoveVerse.ref, lang)} — ${t(lang, 'deleteWarning')}`}
          confirmLabel={t(lang, 'delete')}
          cancelLabel={t(lang, 'cancel')}
          onConfirm={() => { handleRemoveVerse(confirmRemoveVerse.pointId, confirmRemoveVerse.ref); setConfirmRemoveVerse(null); }}
          onCancel={() => setConfirmRemoveVerse(null)}
        />
      )}
      {showAiConsent && (
        <AiConsentModal
          lang={lang}
          onAccept={() => { setShowAiConsent(false); fetchRecs(); }}
          onCancel={() => setShowAiConsent(false)}
        />
      )}
      {showAiPreview && (
        <AiOutgoingPreview
          lang={lang}
          title={livePrayer.title}
          description={recsDescription()}
          update={recsLatestUpdate()}
          onSend={() => { setShowAiPreview(false); markOutgoingReviewed(livePrayer.id); runRecs(); }}
          onCancel={() => setShowAiPreview(false)}
        />
      )}
      {showPlanShare && (
        <PlanShareSheet plan={plan} lang={lang} userId={user.id} onClose={() => setShowPlanShare(false)} />
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

      {showDeleteConfirm && (
        <ConfirmDialog
          title={t(lang, 'tipDeletePrayer')}
          message={livePrayer.title}
          confirmLabel={t(lang, 'tipDeletePrayer')}
          cancelLabel={t(lang, 'cancel')}
          loading={deleting}
          onConfirm={handleDeleteCommunity}
          onCancel={() => setShowDeleteConfirm(false)}
        />
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

      {/* The request itself has room to breathe below; this sticky bar is a
          quiet navigation rail: back, and one menu for everything else. */}
      <div className="detail-header">
        <button
          type="button"
          onClick={onBack}
          aria-label={t(lang, 'tipBack')}
          title={t(lang, 'tipBack')}
          className="icon-button pressable"
        >
          <ArrowLeft size={20} className="rtl-mirror" aria-hidden="true" />
        </button>
        <div className="flex items-center gap-2 shrink-0">
          {isCommunity ? (
            // Following, then author/admin management and safety. Carrying
            // leads in the action row under the request.
            <OverflowMenu
              lang={lang}
              ariaLabel={t(lang, 'options')}
              triggerStyle={{ background: 'transparent', color: 'var(--q-text-secondary)', border: 0 }}
              iconColor="var(--q-text-secondary)"
              items={[
                { key: 'follow', icon: following ? BellOff : Bell, label: t(lang, following ? 'unfollowPrayerMenu' : 'followPrayerMenu'), onClick: toggleFollow, hidden: following === null },
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
              triggerStyle={{ background: 'transparent', color: 'var(--q-text-secondary)', border: 0 }}
              iconColor="var(--q-text-secondary)"
              items={[
                // The plan day leads with its own passage and its Go deeper —
                // an AI scripture hunt for the run's title would only compete.
                { key: 'scripture', icon: BookOpen, label: t(lang, 'viewScripture'), onClick: () => setShowScripture(true), hidden: isPlanRun },
                { key: 'pin', icon: Pin, label: t(lang, livePrayer.pinned ? 'unpin' : 'pin'), onClick: () => togglePin(livePrayer.id) },
                // Scheduling lives here, out of the main flow — selecting it
                // opens the planner as a contextual disclosure below the
                // actions. Saved copies keep it too: WHEN you pray for a
                // carried request is personal.
                { key: 'schedule', icon: CalendarClock, label: t(lang, livePrayer.schedule ? 'editSchedule' : 'addSchedule'), onClick: () => setShowScheduleEdit((v) => !v), hidden: isAnswered || planScheduleRow },
                { key: 'followup', icon: Bell, label: t(lang, 'followUpTitle'), onClick: () => setShowFollowUpEdit((v) => !v), hidden: savedCopy || isAnswered || !followUpRelevant },
                // A plan run shares the PLAN (link, friends, groups), not a copy
                // of this prayer into a group wall — unless it already was, which
                // stays manageable here.
                { key: 'sharePlan', icon: Share2, label: t(lang, 'planShareAction'), onClick: () => setShowPlanShare(true), hidden: !planShareable },
                { key: 'share', icon: Share2, label: sharedGroups.length > 0 ? `${t(lang, 'shareWithGroup')} (${sharedGroups.length})` : t(lang, 'shareWithGroup'), onClick: () => setShowShareModal(true), hidden: savedCopy || groups.length === 0 || (!!plan && sharedGroups.length === 0) },
                // A plan run's words are the plan's own — there is nothing here to edit.
                { key: 'edit', icon: Edit2, label: t(lang, 'edit'), onClick: () => onEdit(livePrayer), hidden: savedCopy || isPlanRun },
                { key: 'delete', icon: Trash2, label: t(lang, savedCopy ? 'removeFromList' : 'delete'), danger: true, onClick: handleDelete },
              ]}
            />
          )}
        </div>
      </div>

      <section className="prayer-detail__hero">
        {heroContext && (
          <div className="prayer-detail__context">
            <span className="section-label">{heroContext}</span>
          </div>
        )}
        {isCommunity && (
          <CommunityByline
            prayer={livePrayer}
            author={communityAuthor(livePrayer, user?.id, lang)}
            avatar={memberAvatarFor?.(livePrayer.user_id)}
            groupName={communityGroupName}
            labels={prayerCategories.map((c) => tr(c.name, lang)).join(' · ')}
            answered={isAnswered}
            lang={lang}
          />
        )}
        {showCirclePicker && (
          <PlaceCircleModal
            value={heroCircle}
            onPlace={(circle) => updatePrayer(livePrayer.id, { circle })}
            onClose={() => setShowCirclePicker(false)}
            onAbout={onOpenCircle}
            lang={lang}
            carried={savedCopy}
            idPrefix="detail-circle"
          />
        )}
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
            className="prayer-detail__title-input"
          />
        ) : (
          <h1
            onClick={canEditTitle ? startEditTitle : undefined}
            className={`prayer-detail__title ${canEditTitle ? 'cursor-text' : ''}`}
          >
            <span>{livePrayer._locked ? t(lang, 'contentLocked') : (planText?.title || loc(livePrayer.title))}</span>
            {canEditTitle && <Edit2 size={16} className="prayer-detail__edit-hint" aria-hidden="true" />}
          </h1>
        )}

        {livePrayer._locked ? (
          <LockedNotice lang={lang} />
        ) : (planText?.description || livePrayer.description) ? (
          <RichText
            text={planText?.description || loc(livePrayer.description)}
            className={`prayer-detail__description ${isCommunity ? 'prayer-detail__description--request' : ''}`}
          />
        ) : null}

        {/* One line of facts — its circle, its rhythm, who can read it — each
            a small icon and a word, never a pill. (A group's request says where
            it is from in its byline, and who carries it in its carry band.) */}
        {!isCommunity && (
          <div className="prayer-detail__facts">
            <CircleFact circle={heroCircle} lang={lang} onChange={canPlaceCircle ? () => setShowCirclePicker(true) : null} />
            {livePrayer.schedule && !planScheduleRow && (
              <RhythmFact
                label={seriesEnded ? t(lang, 'seriesEnded') : scheduleSummary(livePrayer.schedule, lang)}
                open={showScheduleEdit}
                onToggle={isAnswered ? null : () => setShowScheduleEdit((v) => !v)}
              />
            )}
            {!isPlanRun && (
              <AudienceFact audience={audienceOf(livePrayer, sharedGroups)} protection={protectionOf(livePrayer)} lang={lang} />
            )}
          </div>
        )}

        {/* Then one quiet line of memory: its labels ("Marriage · Healing"),
            how long it has been carried and how often prayed. A saved copy
            files its labels further down, under your own categories. */}
        {!isCommunity && (
        <div className="prayer-detail__meta">
          {!savedCopy && prayerCategories.length > 0 && (
            <span>{prayerCategories.map((c) => tr(c.name, lang)).join(' · ')}</span>
          )}
          <span>
            {showsCarriedSince(livePrayer)
              // Long-carried prayer as memory, never merit: a date and,
              // once there is one, a plain count of the days it was prayed.
              ? [
                t(lang, 'carriedSince', { date: carriedSinceLabel(livePrayer, lang) }),
                prayedDays > 0 ? tp(lang, 'prayedDays', prayedDays) : null,
              ].filter(Boolean).join(' · ')
              : timeAgo(livePrayer.created_at, lang)}
          </span>
          {isAnswered && <StatusLabel tone="answered">{t(lang, 'answered')}</StatusLabel>}
          {carryingCount > 0 && (
            <span className="prayer-detail__praying">
              {carryingCount} {t(lang, 'prayingCount')}
            </span>
          )}
        </div>
        )}

        {/* Pray now leads. Adding news and marking answered sit beside it as
            two compact tools — labelled where there is room, icons on a phone —
            and a plan run has neither: a plan is walked, not updated and
            answered. Anything written while praying still lands below. */}
        {!isCommunity && !isAnswered && !livePrayer._locked && (
          <div className="prayer-detail__actions">
            <PrimaryButton
              onClick={() => setShowPraySession(true)}
              className="prayer-detail__pray"
            >
              {t(lang, 'prayNow')}
            </PrimaryButton>
            {canManage && !isPlanRun && (
              <div className="prayer-detail__secondary-actions">
                <SecondaryButton onClick={focusUpdateField} icon={Plus} iconSize={18} title={t(lang, 'addUpdateBtn')}>
                  {t(lang, 'addUpdateBtn')}
                </SecondaryButton>
                <SecondaryButton
                  onClick={showTestimony ? closeAnswerFlow : openAnswerFlow}
                  aria-expanded={showTestimony}
                  aria-controls="pd-answer"
                  title={t(lang, 'markAnswered')}
                  icon={CheckCircle}
                  iconSize={18}
                >
                  {t(lang, 'markAnswered')}
                </SecondaryButton>
              </div>
            )}
          </div>
        )}

        {/* Who carries a group's request: their faces and one sentence that
            counts the reader as "you". Once the reader prays it through their
            own copy, the band also holds the mark that lays it down again. */}
        {isCommunity && (
          <div className="carry-band">
            <CarryPresence
              prayerId={communityPrayer.id}
              count={communityReactionCount}
              carrying={communityHasReacted}
              user={user}
              lang={lang}
              className="carry-band__presence"
            />
            {!isAnswered && !livePrayer._locked && communityPrayable && (
              <CarryButton variant="icon" carrying busy={togglingPraying} onToggle={handleTogglePraying} lang={lang} />
            )}
          </div>
        )}

        {/* Then the actions, stacked: Carry leads until the reader carries it,
            then Pray now (through their own copy), across the full width. A
            word for the group and marking answered — or, for members, a
            testimony — sit on one row beneath, each opening its own flow. */}
        {isCommunity && !livePrayer._locked && (
          <div className="prayer-detail__actions prayer-detail__actions--stacked">
            {!isAnswered && (communityPrayable ? (
              <PrimaryButton onClick={() => setShowPraySession(true)} className="prayer-detail__pray">
                {t(lang, 'prayNow')}
              </PrimaryButton>
            ) : (
              <CarryButton carrying={communityHasReacted} busy={togglingPraying} onToggle={handleTogglePraying} lang={lang} className="prayer-detail__pray" />
            ))}
            <div className="prayer-detail__secondary-actions">
              {!isAnswered && (
                <SecondaryButton onClick={() => openCommunityFlow('word', 'pd-word')} aria-expanded={communityFlow === 'word'} aria-controls="pd-word" icon={Plus} iconSize={18} title={t(lang, 'addUpdateBtn')}>
                  {t(lang, 'addUpdateBtn')}
                </SecondaryButton>
              )}
              {canEditCommunityPrayer ? !isAnswered && (
                <SecondaryButton onClick={() => openCommunityFlow('answer', 'pd-answer')} aria-expanded={communityFlow === 'answer'} aria-controls="pd-answer" icon={CheckCircle} iconSize={18} title={t(lang, 'markAnswered')}>
                  {t(lang, 'markAnswered')}
                </SecondaryButton>
              ) : (
                <SecondaryButton onClick={() => openCommunityFlow('testimony', 'pd-testimony')} aria-expanded={communityFlow === 'testimony'} aria-controls="pd-testimony" icon={Sparkles} iconSize={18} title={t(lang, 'postTestimony')}>
                  {t(lang, 'postTestimony')}
                </SecondaryButton>
              )}
            </div>
          </div>
        )}
      </section>

      <div className="detail-page__content space-y-4">

        {/* On-demand translation toggle — only when the content's language
            plausibly differs from the interface's. Translated content is
            labelled, and the original always stays one tap away. */}
        {translationRelevant && !isPlanRun && (
          <div className="flex flex-wrap items-center gap-2">
            <QuietButton
              onClick={handleToggleTranslate}
              disabled={translating}
              icon={translating ? Loader2 : Languages}
              iconSize={14}
              className="-ms-3"
            >
              {showTranslated ? t(lang, 'showOriginal') : t(lang, 'seeTranslation')}
            </QuietButton>
            {showTranslated && <StatusLabel plain>{t(lang, 'translatedLabel')}</StatusLabel>}
            {showTranslated && <AiOutputReport lang={lang} />}
          </div>
        )}

        {/* Scheduling stays OUT of the main flow: the ⋯ menu's Schedule action
            (or a tap on the rhythm under the title) opens the planner here as a
            contextual disclosure. A plan run asks the same question on its own
            card instead, so this stands down. */}
        {!isCommunity && !isAnswered && !planScheduleRow && showScheduleEdit && schedulePlanner}

        {/* Guided plan: this day's theme + passage, and — for a rich plan — its
            reflection, prompts, practice and "Go deeper". Arrows and a swipe
            move between the days of the run: today's to begin with, any day
            already walked, and the ones still to come. */}
        {planDay && (
          <PlanDayDeck
            lang={lang}
            dayNo={planDayNo}
            total={planLength}
            dayKey={deckDayKey}
            note={planDayNoteKey ? t(lang, planDayNoteKey) : null}
            homeLabel={t(lang, resting?.state === 'today' ? 'planBackToToday' : 'planBackToCurrentDay')}
            prevKey={onGoToDay ? prevDayKey : null}
            nextKey={onGoToDay ? nextDayKey : null}
            onGoToDay={onGoToDay}
            onShowToday={requestedDay ? onShowToday : null}
          >
            <div className="space-y-4">
              <div>
                <p className="plan-deck__theme">{pick(planDay.theme, lang)}</p>
                <VerseAccordion reference={localizeRef(planDay.ref, lang)} lang={lang}>
                  {({ toggle, expanded }) => (
                    <button type="button" onClick={toggle} aria-expanded={expanded} className="scripture-ref">
                      <BookOpen size={13} aria-hidden="true" /> {localizeRef(planDay.ref, lang)}
                    </button>
                  )}
                </VerseAccordion>
              </div>
              <PlanDayBody
                day={planDay}
                lang={lang}
                role={planRole}
                resources={planResources}
                resourceOffers={planResourceOffers}
                idPrefix={`detail-plan-day-${viewedDayKey}`}
                onAddNote={focusUpdateField}
                onChooseRole={offerRoleChoice ? (chosen) => { savePlanPrefs(plan.id, { role: chosen }); reloadPrefs(); } : undefined}
              />
              <PlanDayTrace lang={lang} prayed={planDayPrayed} updates={planDayUpdates} />
              {/* Sharing the plan lives in the ⋯ menu only: on the day card it
                  competed with the day itself for the reader's attention. */}
              {canEditPersonalization && (
                <QuietButton icon={Pencil} iconSize={15} onClick={() => setEditingPersonalization(true)} className="-ms-3">
                  {t(lang, 'planPersonalizeTitle')}
                </QuietButton>
              )}
              {/* How often this comes back, kept WITH the day it paces — a
                  reader who finds a plan too fast is looking at the day, not
                  hunting the ⋯ menu for a recurrence editor. It opens the one
                  scheduler the rest of the app uses, which for a run offers
                  Pause where "Pray once" would be and keeps the day on screen
                  whatever rhythm is chosen. Folded away behind its own answer,
                  so the day stays the point of the card. */}
              {planScheduleRow && (
                <div className="space-y-2 pt-1">
                  {/* The row reports the PACE vocabulary, not the full schedule
                      summary: the card already prints "Day 16 of 30", so
                      repeating the run’s length here would only be noise. */}
                  <DisclosureRow
                    label={t(lang, 'planPaceTitle')}
                    value={t(lang, PACE_LABEL_KEYS[paceOf(livePrayer.schedule)] || 'planPaceCustom')}
                    action={t(lang, 'schedChange')}
                    open={showScheduleEdit}
                    onToggle={() => setShowScheduleEdit((v) => !v)}
                    controlsId="detail-plan-schedule"
                  />
                  {showScheduleEdit && <div id="detail-plan-schedule">{schedulePlanner}</div>}
                </div>
              )}
              <ReportWordingLink lang={lang} surface={`plans/${plan.id}`} />
            </div>
          </PlanDayDeck>
        )}

        {editingPersonalization && (
          <PlanPersonalizeModal
            plan={plan}
            lang={lang}
            initial={isCouplePlan(plan) ? planPrefs : null}
            people={planPeopleFrom(prayers)}
            onClose={() => setEditingPersonalization(false)}
            onSave={async (prefs) => {
              setEditingPersonalization(false);
              try {
                await savePersonalization(prefs);
                reloadPrefs();
              } catch {
                // Storage refused the private record. The run keeps the answers
                // it already had rather than losing them to a failed write.
                toast.error(t(lang, 'errorGeneric'));
              }
            }}
          />
        )}

        {/* The last day is behind them — a calm close, and "What do you want
            to keep carrying?": a theme opens the composer in the plan's circle,
            where the person writes the lasting prayer themselves. */}
        {planFinished && (
          <PlanCompletionCard
            plan={plan}
            lang={lang}
            onShare={planShareable ? () => setShowPlanShare(true) : undefined}
            onKeepCarrying={onPrayInCircle ? ({ circle, prompt }) => {
              markPlanCompleted(plan.id);
              onPrayInCircle(circle, { prompt });
            } : undefined}
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
                style={{ background: 'var(--q-selected)', color: 'var(--q-royal-text)', border: '0.5px solid var(--q-selected-border)' }}
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
                    style={{ background: 'var(--q-field)', color: 'var(--q-text-tertiary)', border: '0.5px solid var(--q-field-border)' }}
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
            description, before the pray-together / updates / calendar sections.
            A guided plan run is the exception: the day above already says how to
            pray, so this panel appears only if that run carries points of its
            own — and then without the affordances to author more. ── */}
        {showWaysToPray && (
        <div className="prayer-points-panel">
          <div className="prayer-points-panel__header flex items-center justify-between">
            <p className="section-label">{t(lang, 'waysToPray')}</p>
            {offerPointAuthoring && canAddContent && (
              <div className="flex items-center gap-1.5">
                <QuietButton
                  onClick={fetchRecs}
                  disabled={loadingRecs}
                  title={t(lang, 'tipAiSuggest')}
                  icon={loadingRecs ? Loader2 : Lightbulb}
                  iconSize={14}
                >
                  {t(lang, 'prayerSuggestionsCta')}
                </QuietButton>
              </div>
            )}
          </div>

          {(displayPrayer.prayer_points || []).length === 0 && !loadingRecs && updateRecs.length === 0 && (
            <p className="text-sm" style={{ color: 'var(--q-text-tertiary)' }}>{t(lang, 'needHelpFindingWords')}</p>
          )}

          <ol className="prayer-points-panel__list">
            {(displayPrayer.prayer_points || []).map((pp) => (
              <PrayerPointItem
                key={pp.id}
                point={pp}
                title={pp._locked ? t(lang, 'contentLocked') : loc(pp.title)}
                lang={lang}
                canAdd={canAddContent}
                canRemove={canRemoveContent}
                onAddVerse={(verse) => handleAddVerse(pp.id, verse)}
                onRemoveVerse={(ref) => setConfirmRemoveVerse({ pointId: pp.id, ref })}
                onRemove={() => setConfirmRemovePoint(pp)}
              />
            ))}
          </ol>

          {recsError && <p className="text-xs rounded-xl px-3 py-2 mt-2" style={{ color: 'var(--q-gold-text)', background: 'var(--q-gold-soft)' }}>{recsError}</p>}

          <div className="space-y-2 mt-2">
            {updateRecs.map(rec => {
              const recWhy = (rec.verses || []).find(v => v.why)?.why || '';
              return (
              <div key={rec.title} className="rounded-xl p-3" style={{ background: 'var(--q-selected)', border: '0.5px solid var(--q-selected-border)' }}>
                <div className="flex gap-2 items-start">
                  <p className="flex-1 text-sm leading-snug font-medium" style={{ color: 'var(--q-text)' }}>{rec.title}</p>
                  <button
                    onClick={async () => {
                      await handleAddPoint({ title: rec.title, verses: rec.verses });
                      setUpdateRecs(prev => prev.filter(r => r.title !== rec.title));
                    }}
                    title={t(lang, 'tipAddPoint')}
                    aria-label={t(lang, 'tipAddPoint')}
                    className="shrink-0 rounded-xl p-1.5 text-white"
                    style={{ background: 'var(--q-action-primary)' }}
                  >
                    <Plus size={13} />
                  </button>
                </div>
                {recWhy && (
                  <p className="text-xs leading-relaxed mt-1" style={{ color: 'var(--q-text-tertiary)' }}>{recWhy}</p>
                )}
                {(rec.verses || []).length > 0 && (
                  <div className="prayer-point__verses">
                    {rec.verses.map((v, i) => (
                      <VerseAccordion key={i} reference={v.ref} lang={lang} className="prayer-point__verse">
                        {({ toggle, expanded }) => (
                          <button type="button" onClick={toggle} aria-expanded={expanded} title={t(lang, 'tipVerseToggle')} className="scripture-chip">
                            <BookOpen size={12} aria-hidden="true" /> {v.ref}
                          </button>
                        )}
                      </VerseAccordion>
                    ))}
                  </div>
                )}
              </div>
              );
            })}
          </div>

          {updateRecs.length > 0 && <AiDisclaimer lang={lang} className="mt-2" />}

          {/* Manual prayer point input */}
          {offerPointAuthoring && canAddContent && (
            showManualForm ? (
              <div className="mt-3 rounded-xl p-3 space-y-2" style={{ background: 'var(--q-surface-muted)', border: '0.5px solid var(--q-border)' }}>
                <input
                  type="text"
                  value={manualPoint.title}
                  onChange={e => setManualPoint(p => ({ ...p, title: e.target.value }))}
                  placeholder={t(lang, 'pointTitlePlaceholder')}
                  className="w-full text-sm rounded-xl px-3 py-2 focus:outline-none"
                  style={{ background: 'var(--q-field)', border: '0.5px solid var(--q-field-border)', color: 'var(--q-text)' }}
                  autoFocus
                />
                <input
                  type="text"
                  value={manualPoint.verse}
                  onChange={e => setManualPoint(p => ({ ...p, verse: e.target.value }))}
                  placeholder={t(lang, 'pointVersePlaceholder')}
                  className="w-full text-sm rounded-xl px-3 py-2 focus:outline-none"
                  style={{ background: 'var(--q-field)', border: '0.5px solid var(--q-field-border)', color: 'var(--q-text)' }}
                />
                <div className="flex gap-2">
                  <button
                    onClick={() => setShowManualForm(false)}
                    className="flex-1 text-sm rounded-xl py-2"
                    style={{ background: 'var(--q-field)', color: 'var(--q-text-secondary)', border: '0.5px solid var(--q-field-border)' }}
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
                    style={{ background: 'var(--q-action-primary)' }}
                  >
                    {t(lang, 'addBtn')}
                  </button>
                </div>
              </div>
            ) : (
              <button
                onClick={() => setShowManualForm(true)}
                className="mt-3 flex items-center gap-1.5 text-xs font-medium"
                style={{ color: 'var(--q-royal-text)' }}
              >
                <Plus size={13} /> {t(lang, 'addPointManually')}
              </button>
            )
          )}
        </div>
        )}

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
        {showFollowUpEdit && !isCommunity && !savedCopy && !isAnswered && followUpRelevant && (
          <div className="prayer-detail__section">
            <FollowUpField
              value={followUps[livePrayer.id]?.date || null}
              onChange={(date) => setFollowUp(livePrayer.id, date)}
              lang={lang}
            />
          </div>
        )}

        {/* ── Saved-from-community: read-only follow indicator ── */}
        {savedCopy && (
          <p className="flex items-center gap-1.5 text-xs" style={{ color: 'var(--q-text-tertiary)' }}>
            <Users size={12} style={{ color: 'var(--q-royal-text)' }} /> {t(lang, 'followsGroup')}
          </p>
        )}

        {/* ── Community mode: words, testimonies and the flow the action row
            opened — the same order and voice as a personal prayer. ── */}
        {isCommunity && (
          <CommunityActivity
            communityPrayer={communityPrayer}
            lang={lang}
            user={user}
            authorName={authorName}
            loc={loc}
            flow={communityFlow}
            onCloseFlow={() => setCommunityFlow(null)}
            isAnswered={isAnswered}
            canManage={canEditCommunityPrayer}
            isAdmin={isGroupAdmin}
            avatarFor={memberAvatarFor}
            updates={communityUpdates}
            loadingUpdates={loadingUpdates}
            onSendWord={handleSendWord}
            onDeleteWord={handleDeleteWord}
            onEditWord={handleEditWord}
            testimonies={prayerTestimonies}
            onConfirmAnswered={handleConfirmCommunityAnswered}
            onResume={handleResumeCommunity}
          />
        )}

        {/* ── Personal mode: updates, testimony, actions. The per-prayer plan
            (recurrence) is edited via SchedulePlanner near the top; the old
            "prayer days" toggle here was redundant with it and has been removed. */}
        {!isCommunity && <>
        {/* Updates: titled only once there is one — no empty heading. */}
        {allUpdates.length > 0 && (
        <div className="prayer-activity-panel">
          <p className="prayer-activity-panel__title">{t(lang, 'evolutions')}</p>

          <div className="prayer-activity-list">
            {allUpdates.map(u => (
              <div key={u.id} className="prayer-activity-item prayer-activity-item--personal group flex gap-3">
                <div className="w-0.5 rounded-full shrink-0 mt-1.5" style={{ background: 'var(--q-border-strong)', alignSelf: 'stretch', minHeight: '14px' }} />
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
                    <p className="text-sm italic leading-snug" style={{ color: 'var(--q-text-tertiary)' }}>{t(lang, 'updateSyncing')}</p>
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
                        style={{ color: 'var(--q-text)' }}
                        onRemove={canManage && !u._communityFallback ? () => removeUpdateText(livePrayer.id, u.id) : null}
                      />
                      <AttachmentList
                        attachments={u.attachments}
                        lang={lang}
                        className={u.text ? 'mt-1.5' : ''}
                        onRemove={canManage && !u._communityFallback ? (att) => removeUpdateAttachment(livePrayer.id, u.id, att.id) : null}
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
                {editingUpdateId !== u.id && canManage && !u._locked && !u._communityFallback && (
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

        </div>
        )}

        {/* Adding an update is its own titled flow, like a testimony: a word
            on what it is for, then the field — opened only when asked for and
            folded away once sent or cancelled. */}
        {showUpdateComposer && (
          <div className="prayer-activity-panel entry-flow">
            <p className="section-label">{t(lang, 'updateFlowLabel')}</p>
            <h2 className="entry-flow__title">{t(lang, 'updateFlowTitle')}</h2>
            <p className="entry-flow__body">{t(lang, 'updateFlowBody')}</p>
            <UpdateComposer
              inputId="pd-updates"
              lang={lang}
              rows={2}
              placeholder={t(lang, 'newUpdate')}
              onSend={handleAddUpdate}
            />
            <QuietButton onClick={() => setUpdateComposerOpen(false)} className="mt-2 w-full" style={{ color: 'var(--q-text-secondary)' }}>
              {t(lang, 'cancel')}
            </QuietButton>
          </div>
        )}


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
                        ? <p className="prayer-activity-item__meta">{format(new Date(tm.created_at), 'd MMM yyyy', { locale })}</p>
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
                        style={{ color: 'var(--q-text)' }}
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
                  <p className="prayer-activity-item__meta">{communityAuthor(tm, user?.id, lang)} · {timeAgo(tm.created_at, lang)}</p>
                  {tm.content && <RichText text={loc(tm.content)} className="text-sm leading-relaxed" style={{ color: 'var(--q-text)' }} />}
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
            <div className="prayer-activity-panel entry-flow">
              <p className="section-label section-label--sacred">{t(lang, 'rememberLabel')}</p>
              <h2 className="entry-flow__title">{t(lang, 'testimony')}</h2>
              <UpdateComposer
                lang={lang}
                rows={3}
                autoFocus
                placeholder={`${t(lang, 'testimony')}…`}
                sendLabel={t(lang, 'addThanks')}
                onSend={handleAddThanks}
              />
              <QuietButton onClick={() => setShowThanks(false)} className="mt-2 w-full" style={{ color: 'var(--q-text-secondary)' }}>{t(lang, 'cancel')}</QuietButton>
            </div>
          ) : (
            <SecondaryButton onClick={() => setShowThanks(true)} className="prayer-activity-action">
              {t(lang, 'addThanks')}
            </SecondaryButton>
          )
        )}

        {/* The answered flow, opened by the leading Mark answered action: an
            optional testimony and the confirm step, together in the disclosure
            they belong to. Nothing is marked answered without this confirm. */}
        {!isAnswered && showTestimony && canManage && (
          <div id="pd-answer" className="prayer-activity-panel entry-flow">
            {/* The person testifies; the app only records. It asks what
                happened — it never declares on its own that God answered. */}
            <p className="section-label section-label--sacred">{t(lang, 'rememberLabel')}</p>
            <h2 className="entry-flow__title">{t(lang, 'answerWhatHappened')}</h2>
            <p className="entry-flow__body">{t(lang, 'answerHowGodWorked')}</p>
            {/* The testimony is OPTIONAL — allowEmpty keeps Confirm available
                with nothing written, exactly like the old flow. */}
            <UpdateComposer
              lang={lang}
              rows={1}
              autoFocus
              allowEmpty
              placeholder={`${t(lang, 'recordTestimony')}…`}
              sendLabel={t(lang, 'confirm')}
              onSend={confirmAnswered}
            />
            <QuietButton onClick={closeAnswerFlow} className="mt-2 w-full" style={{ color: 'var(--q-text-secondary)' }}>
              {t(lang, 'cancel')}
            </QuietButton>
          </div>
        )}

        {/* Answer → mission (Luke 1: John's life served a purpose larger than
            the prayer). Right after a prayer is marked answered, ONE optional
            question. Private stays the default; nothing is shared unless the
            person chooses to. */}
        {isAnswered && justAnswered && canManage && (
          <div className="prayer-activity-panel" data-testid="answer-next-step">
            <p className="text-xs" role="status" style={{ color: 'var(--q-text-tertiary)' }}>{t(lang, 'answerMarked')}</p>
            <p className="prayer-activity-panel__title mt-2">{t(lang, 'answerNextTitle')}</p>
            <p className="mb-3 text-xs" style={{ color: 'var(--q-text-tertiary)' }}>{t(lang, 'answerNextBody')}</p>
            {addingNextStep ? (
              <UpdateComposer
                lang={lang}
                rows={2}
                autoFocus
                placeholder={`${t(lang, 'answerNextPlaceholder')}…`}
                sendLabel={t(lang, 'save')}
                onSend={async (text, attachments) => {
                  await handleAddUpdate(text, attachments);
                  setJustAnswered(false);
                  toast.success(t(lang, 'answerNextSaved'));
                }}
              />
            ) : (
              <div className="flex flex-wrap gap-2">
                <SecondaryButton onClick={() => setAddingNextStep(true)}>
                  {t(lang, 'answerNextAdd')}
                </SecondaryButton>
                {!savedCopy && groups.length > 0 && !plan && (
                  <SecondaryButton onClick={() => { setJustAnswered(false); setShowShareModal(true); }}>
                    {t(lang, 'answerNextShare')}
                  </SecondaryButton>
                )}
                <QuietButton onClick={() => setJustAnswered(false)} style={{ color: 'var(--q-text-secondary)' }}>
                  {t(lang, 'answerNextPrivate')}
                </QuietButton>
              </div>
            )}
          </div>
        )}

        {/* An answered prayer's only remaining state action — reopening it. */}
        {isAnswered && canManage && (
          <div className="flex gap-3 pb-6 pt-2">
            <QuietButton onClick={() => markActive(livePrayer.id)} title={t(lang, "tipResume")} className="-ms-3">
              {t(lang, 'resumePrayer')}
            </QuietButton>
          </div>
        )}
        </>}
      </div>
    </div>
  );
}
