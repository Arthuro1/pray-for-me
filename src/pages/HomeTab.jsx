import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useShallow } from 'zustand/react/shallow';
import usePrayerStore from '../store/prayerStore';
import useAuthStore from '../store/authStore';
import useTranslationStore from '../store/translationStore';
import useCommunityStore from '../store/communityStore';
import { format } from 'date-fns';
import { fr, enUS, de, ptBR } from 'date-fns/locale';
import { Loader2, Plus, Share2, ExternalLink } from 'lucide-react';
import { bibleLink } from '../utils/bibleLink';
import { t } from '../i18n';
import PrayerListSkeleton from '../components/shared/Skeleton';
import PrayerListItem from '../components/PrayerListItem';
import SwipeableRow from '../components/shared/SwipeableRow';
import PrayerSession from '../components/PrayerSession';
import { usePrayerActions } from '../hooks/usePrayerActions';
import { useSuppressFab } from '../store/layoutStore';
import { todayKey } from '../lib/prayedLog';
import { nextReminder } from '../utils/reminder';
import { groupBySlot, SLOT_ORDER } from '../lib/planner';
import { planRowContext, planRowSummary } from '../lib/planRow';
import { PLAN_SOURCES } from '../lib/planAnalytics';
import { parseKey } from '../lib/schedule';
import { Clock, Check } from 'lucide-react';
import { verseOfDay } from '../content/dailyVerses';
import { fetchScriptureText } from '../lib/verseText';
import VerseVersion from '../components/VerseVersion';
import VerseShareModal from '../components/VerseShareModal';
import EmptyState from '../components/shared/EmptyState';
import { Disclosure, PageHeader, PrimaryButton, QuietButton, SecondaryButton, SectionHeader } from '../components/shared/Primitives';
import RiseMark from '../components/shared/RiseMark';
import ActivationNudge from '../components/ActivationNudge';
import PwaInstallNudge from '../components/PwaInstallNudge';
import { readActivationProgress } from '../lib/activationProgress';
import { nextActivationStep, pwaInstallAllowed } from '../lib/activationPolicy';
import RemainWithGod from '../components/RemainWithGod';

const DAY_NAMES = {
  fr: ['Dimanche', 'Lundi', 'Mardi', 'Mercredi', 'Jeudi', 'Vendredi', 'Samedi'],
  en: ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'],
  de: ['Sonntag', 'Montag', 'Dienstag', 'Mittwoch', 'Donnerstag', 'Freitag', 'Samstag'],
  pt: ['Domingo', 'Segunda', 'Terça', 'Quarta', 'Quinta', 'Sexta', 'Sábado'],
};

const DATE_LOCALES = { fr, en: enUS, de, pt: ptBR, zh: enUS, es: enUS, hi: enUS, ja: enUS, sw: enUS, am: enUS, id: enUS, tl: enUS, ko: enUS, ru: enUS, ar: enUS, fa: enUS };

// Today is "your altar today": built for one thing, coming before God. Compact
// greeting → what REMAINS today → one large "Begin prayer" → the list itself → add. Completed prayers fold into a
// quiet "Prayed today" row, catch-up sits AFTER the list, collapsed (grace, not
// guilt), and the daily verse closes the page as a small card. Statistics live
// in the Journal; planning and everything else in More.
export default function HomeTab({ onAdd, onEdit }) {
  const navigate = useNavigate();
  const { getEntriesForDay, getCompletedPrayersForDay, getCatchUp, markPrayedOn, completions, categories, prayers, settings, loading } = usePrayerStore(
    useShallow((s) => ({
      getEntriesForDay: s.getEntriesForDay,
      getCompletedPrayersForDay: s.getCompletedPrayersForDay,
      getCatchUp: s.getCatchUp,
      markPrayedOn: s.markPrayedOn,
      completions: s.completions,
      categories: s.categories,
      prayers: s.prayers,
      settings: s.settings,
      loading: s.loading,
    }))
  );
  const { user } = useAuthStore();
  const { tr } = useTranslationStore();
  const prayerShares = useCommunityStore((s) => s.prayerShares);
  const fetchPrayerShares = useCommunityStore((s) => s.fetchPrayerShares);

  useEffect(() => { if (user?.id) fetchPrayerShares(user.id); }, [fetchPrayerShares, user?.id]);
  const [verse, setVerse] = useState(null);
  const [verseResolving, setVerseResolving] = useState(false);
  const [sharingVerse, setSharingVerse] = useState(false);
  // The open session's prayer list, snapshotted when it starts: completions
  // recorded while praying must not reshuffle the walk mid-session. null = no
  // session open.
  const [session, setSession] = useState(null);
  const [catchUpOpen, setCatchUpOpen] = useState(false);
  const [remaining, setRemaining] = useState(false);
  const [prayedOpen, setPrayedOpen] = useState(false);
  const lang = settings.language || 'fr';
  const dateLocale = DATE_LOCALES[lang] || fr;
  const { swipeActions } = usePrayerActions(lang);

  // Completion state drives everything on this page: what remains, what's been
  // prayed, and whether the day is complete — all derived from the per-prayer
  // completion records (there is no separate day-level flag to disagree with).
  const dayKey = todayKey();
  const todayEntries = getEntriesForDay(dayKey);
  const isDoneToday = (id) => (completions[id] || []).includes(dayKey);
  const remainingEntries = todayEntries.filter((e) => !isDoneToday(e.prayer.id));
  const remainingPrayers = remainingEntries.map((e) => e.prayer);
  const completedToday = getCompletedPrayersForDay(dayKey);
  const dayComplete = remainingPrayers.length === 0 && completedToday.length > 0;
  const dayEmpty = todayEntries.length === 0 && completedToday.length === 0;
  const slotGroups = groupBySlot(remainingEntries);
  const useSlots = remainingEntries.some((e) => e.slot); // headers only once slots are in use
  const catchUp = getCatchUp();
  const today = new Date();
  const dayIndex = today.getDay();
  const reminder = settings.dailyReminderEnabled ? nextReminder(settings.dailyReminderTime, today) : null;
  const activationStep = nextActivationStep({
    prayers,
    completions,
    dailyReminderEnabled: !!settings.dailyReminderEnabled,
    progress: readActivationProgress(),
  });

  // The empty state below carries its own prominent Add CTA — hide the floating
  // Add button while it's what the visitor sees, so there's exactly one.
  useSuppressFab(dayEmpty);

  // Verse of the day: a curated, deterministic pick that's the same for everyone
  // on a given day, shown in full immediately (no tap needed). Core verses ship
  // embedded text (instant + offline); the rest resolve their text through the
  // authoritative pipeline (cache → shared cache → YouVersion) and are cached
  // forever after the first view, so the daily verse stays zero-cost and works
  // offline thereafter. This never touches the AI path.
  useEffect(() => {
    const v = verseOfDay(lang, parseKey(dayKey));
    setVerse(v);
    if (v.text) { setVerseResolving(false); return undefined; }
    let cancelled = false;
    setVerseResolving(true);
    fetchScriptureText({ reference: v.ref, lang, usfm: v.usfm }).then((res) => {
      if (cancelled) return;
      if (res?.text) {
        // Keep the source so the verse can be attributed to its exact edition.
        // (Embedded SEED text carries no source and stays unlabelled — its wording
        // is hand-vetted, not from a single named edition.)
        setVerse((cur) => (cur && cur.ref === v.ref ? { ...cur, text: res.text, source: res.source } : cur));
      }
      // Resolve either way — YouVersion being disabled, misconfigured, or
      // offline must not leave the placeholder spinning forever.
      setVerseResolving(false);
    });
    return () => { cancelled = true; };
  }, [dayKey, lang]);

  const displayName = user?.user_metadata?.full_name?.split(' ')[0]
    || user?.email?.split('@')[0]
    || '';

  const hour = today.getHours();
  const greeting = hour < 12 ? t(lang, 'greetingMorning') : hour < 18 ? t(lang, 'greetingAfternoon') : t(lang, 'greetingEvening');

  // A guided plan run reads by its day, not by the name it was started under
  // (see lib/planRow.js). The compact lists below want only the plan's name —
  // they are a receipt and a to-do, not a place to read the day's theme.
  const planName = (prayer) => planRowSummary(prayer, lang, dayKey)?.name || tr(prayer.title, lang);
  // The hero leads the page, so when a plan day is what remains it says which
  // plan and which day, and headlines the day's theme — the same reading as the
  // row beneath it and the session its button opens.
  const heroPlan = remainingPrayers.length > 0 ? planRowSummary(remainingPrayers[0], lang, dayKey) : null;

  // Open the immersive walk. A normal list marks each prayer prayed TODAY;
  // a catch-up walk passes dayById so each is recorded on the day it was
  // missed — the same day the per-item catch-up buttons record.
  const openSession = (prayers, dayById = null) => setSession({ prayers, dayById });
  const startCatchUpSession = () =>
    openSession(catchUp.map((c) => c.prayer), Object.fromEntries(catchUp.map((c) => [c.prayer.id, c.day])));

  // The first remaining prayer is the one brought forward; the list beneath
  // holds the others, so nothing is said twice. Its one line of detail is who
  // it is for — what helps someone pray, not how the prayer is filed (circles
  // live in the Journal and on the prayer's own page).
  const focusPrayer = remainingPrayers[0] || null;
  const focusDetail = focusPrayer && !heroPlan && focusPrayer.for_other && focusPrayer.person_name
    ? t(lang, 'forPersonLabel', { name: focusPrayer.person_name })
    : '';
  const otherEntries = remainingEntries.filter((e) => e.prayer.id !== focusPrayer?.id);
  const showFocus = remainingPrayers.length > 0 && (!loading || prayers.length > 0);

  return (
    <div className="phase-page today">
      {sharingVerse && verse && (
        <VerseShareModal verse={verse} lang={lang} dayKey={dayKey} onClose={() => setSharingVerse(false)} />
      )}
      {remaining && <RemainWithGod lang={lang} onFinish={() => setRemaining(false)} />}
      {session && session.prayers.length > 0 && (
        <PrayerSession
          prayers={session.prayers}
          categories={categories}
          lang={lang}
          tr={tr}
          doneTitle={session.dayById ? undefined : t(lang, 'altarPrayedThrough')}
          onClose={() => setSession(null)}
          // Per-prayer completion is logged as the user advances PAST each
          // prayer (feeds Home's remaining count, catch-up, calendar history
          // and rotation fairness), so leaving halfway never loses genuine
          // progress — reopening resumes with the first unfinished request.
          // A catch-up walk records each prayer on the day it was MISSED
          // (session.dayById), matching the per-item catch-up buttons; a
          // normal walk records today.
          onPrayed={(id) => markPrayedOn(id, session.dayById?.[id] ?? dayKey)}
        />
      )}

      <div className="phase-page__shell">
        <PageHeader
          eyebrow={`${DAY_NAMES[lang]?.[dayIndex] ? `${DAY_NAMES[lang][dayIndex]} · ` : ''}${format(today, 'd MMMM yyyy', { locale: dateLocale })}`}
          title={`${greeting}${displayName ? `, ${displayName}` : ''}`}
        />
      </div>

      <div className="phase-content">
        {/* "Your altar today" names what this page is for, once, and only when
            there is something to bring — an empty day has its own invitation.
            Three words; the page itself shows what coming before God means. */}
        {!dayEmpty && (!loading || prayers.length > 0) && (
          <SectionHeader eyebrow={t(lang, 'altarTodayTitle')} sacred className="mb-5" />
        )}

        {/* One doorway into prayer: a deep-violet space, one prayer, one action. */}
        {showFocus && (
          <section className="today-focus q-immersive" aria-labelledby="today-focus-title">
            <RiseMark motion="still" size={180} className="today-focus__rise" />
            <p className="today-focus__context">
              {planRowContext(heroPlan) || t(lang, 'todayRemainingLabel', { n: remainingPrayers.length })}
            </p>
            <h2 id="today-focus-title" className="today-focus__title">
              {heroPlan?.theme || heroPlan?.name || tr(focusPrayer.title, lang)}
            </h2>
            {focusDetail && <p className="today-focus__detail">{focusDetail}</p>}
            <PrimaryButton onClick={() => openSession(remainingPrayers)} className="today-focus__begin">
              {t(lang, 'beginPrayer')}
            </PrimaryButton>
            {reminder && (
              <p className="today-focus__reminder">
                <Clock size={12} aria-hidden="true" /> {t(lang, 'nextReminder')} · {reminder.tomorrow ? t(lang, 'tomorrow') : t(lang, 'today')} {reminder.time}
              </p>
            )}
          </section>
        )}

        {/* All of today prayed: a calm status — not a reward, not a green card —
            and two optional ways to stay: be still, or walk the day once more. */}
        {dayComplete && (
          <section className="today-complete">
            <RiseMark motion="still" size={40} />
            <p className="today-complete__title" role="status">{t(lang, 'todayCompleteTitle')}</p>
            <div className="today-complete__actions">
              <SecondaryButton onClick={() => setRemaining(true)}>
                {t(lang, 'remainWithGod')}
              </SecondaryButton>
              {todayEntries.length > 0 && (
                <QuietButton onClick={() => openSession(todayEntries.map((e) => e.prayer))}>
                  {t(lang, 'prayAgain')}
                </QuietButton>
              )}
            </div>
          </section>
        )}

        {reminder && remainingPrayers.length === 0 && (
          <p className="q-meta mb-6 flex items-center justify-center gap-1.5">
            <Clock size={12} aria-hidden="true" /> {t(lang, 'nextReminder')} · {reminder.tomorrow ? t(lang, 'tomorrow') : t(lang, 'today')} {reminder.time}
          </p>
        )}

        {!loading && prayers.length > 0 && (
          <>
            <ActivationNudge
              prayers={prayers}
              completions={completions}
              settings={settings}
              lang={lang}
              onEditPrayer={onEdit}
              onOpenReminders={() => navigate('/settings#notifications')}
              onAddPrayer={onAdd}
              onOpenPlans={(openPlanId) => navigate('/plans', { state: { source: PLAN_SOURCES.TODAY_CARD, openPlanId } })}
            />
            {pwaInstallAllowed({ activationStep }) && <PwaInstallNudge lang={lang} />}
          </>
        )}

        {loading && prayers.length === 0 && (
          <div className="mb-4"><PrayerListSkeleton count={3} /></div>
        )}

        {!loading && dayEmpty && (
          <EmptyState
            title={t(lang, 'emptyTodayTitle')}
            subtitle={t(lang, 'emptyTodaySub')}
            actionLabel={t(lang, 'emptyAddManual')}
            onAction={onAdd}
            actionIcon={Plus}
            secondaryLabel={t(lang, 'explorePlan')}
            onSecondary={() => navigate('/plans', { state: { source: PLAN_SOURCES.EMPTY_DAY } })}
          />
        )}

        {/* The rest of today, as flat rows — no cards. */}
        {otherEntries.length > 0 && (
          <section className="today-list" aria-label={t(lang, 'today')}>
            {/* Grouped by prayer-time slot once any prayer uses one; flat list otherwise */}
            {(useSlots ? SLOT_ORDER : ['anytime']).map((slot) => {
              const slotEntries = (useSlots ? slotGroups[slot] : otherEntries)?.filter((e) => e.prayer.id !== focusPrayer?.id);
              if (!slotEntries || slotEntries.length === 0) return null;
              return (
                <div key={slot}>
                  {useSlots && (
                    <p className="section-label today-list__slot">
                      {t(lang, slot === 'anytime' ? 'slotAnytime' : `slot_${slot}`)}
                    </p>
                  )}
                  {slotEntries.map(({ prayer }) => (
                    <SwipeableRow key={prayer.id} actions={swipeActions(prayer)}>
                      <PrayerListItem
                        prayer={prayer}
                        lang={lang}
                        tr={tr}
                        shares={prayerShares[prayer.id]}
                        onClick={() => navigate(`/prayers/${prayer.id}`)}
                        variant="today"
                        showCircle={false}
                      />
                    </SwipeableRow>
                  ))}
                </div>
              );
            })}
          </section>
        )}

        {/* Prayed today — completed prayers fold into one quiet, collapsed row
            so the main list only ever shows what remains. */}
        {completedToday.length > 0 && (
          <div className="today-fold">
            <Disclosure
              id="today-prayed"
              label={t(lang, 'prayedTodayLabel')}
              count={completedToday.length}
              open={prayedOpen}
              onToggle={() => setPrayedOpen((v) => !v)}
            >
              <ul className="today-fold__list">
                {completedToday.map((prayer) => (
                  <li key={prayer.id}>
                    <button type="button" onClick={() => navigate(`/prayers/${prayer.id}`)} className="today-fold__row pressable">
                      <Check size={14} aria-hidden="true" />
                      <span>{planName(prayer)}</span>
                    </button>
                  </li>
                ))}
              </ul>
            </Disclosure>
          </div>
        )}

        {/* Return to prayer — prayers missed the last few days, AFTER today's
            list and collapsed by default. Grace, not guilt: never an "overdue"
            count up front; one tap marks them prayed, or they quietly age out. */}
        {catchUp.length > 0 && (
          <div className="today-fold">
            <Disclosure
              id="today-catch-up"
              label={t(lang, 'catchUpTitle')}
              count={catchUp.length}
              open={catchUpOpen}
              onToggle={() => setCatchUpOpen((v) => !v)}
            >
              <div className="pb-4">
                <p className="q-meta mb-3">{t(lang, 'catchUpSub')}</p>
                {/* Pray through all the missed requests in one walk, the same
                    immersive session as Today — each is recorded on the day it
                    was missed. The per-item checkmarks below stay for catching
                    up one at a time. */}
                <SecondaryButton onClick={startCatchUpSession} className="mb-2 w-full">
                  {t(lang, 'prayNow')}
                </SecondaryButton>
                <ul className="today-fold__list">
                  {catchUp.map(({ prayer, day }) => (
                    <li key={prayer.id} className="today-fold__catch-up">
                      <button type="button" onClick={() => navigate(`/prayers/${prayer.id}`)} className="min-w-0 flex-1 text-start">
                        <span className="block truncate text-sm font-medium" style={{ color: 'var(--q-text)' }}>{planName(prayer)}</span>
                        <span className="q-meta block">
                          {t(lang, 'missedOn', { date: parseKey(day).toLocaleDateString(lang, { weekday: 'short', day: 'numeric', month: 'short' }) })}
                        </span>
                      </button>
                      <button
                        type="button"
                        onClick={() => markPrayedOn(prayer.id, day)}
                        title={t(lang, 'markPrayed')}
                        aria-label={t(lang, 'markPrayed')}
                        className="icon-button pressable"
                      >
                        <Check size={16} aria-hidden="true" />
                      </button>
                    </li>
                  ))}
                </ul>
              </div>
            </Disclosure>
          </div>
        )}

        {/* Verse of the day — Scripture closes the page, quoted, never generated. */}
        <section className="today-verse" aria-labelledby="today-verse-label">
          <div className="today-verse__head">
            <p id="today-verse-label" className="section-label section-label--sacred">{t(lang, 'verseOfDay')}</p>
            {verse && (
              <button
                type="button"
                onClick={() => setSharingVerse(true)}
                aria-label={t(lang, 'shareVerse')}
                title={t(lang, 'shareVerse')}
                className="icon-button pressable"
              >
                <Share2 size={16} aria-hidden="true" />
              </button>
            )}
          </div>
          {verse ? (
            <div className="scripture-block">
              {verse.text
                ? <p className="scripture-block__text">“{verse.text}”</p>
                : verseResolving
                  ? (
                    <p className="q-meta flex items-center gap-2">
                      <Loader2 size={13} className="animate-spin" aria-hidden="true" /> {t(lang, 'loadingVerse')}
                    </p>
                  )
                  : null}
              {/* The reference itself opens the chapter in the reader's Bible
                  (the Bible App on a phone, Bible.com elsewhere). */}
              <div className="today-verse__foot">
                <p className="scripture-block__reference">
                  <a
                    href={bibleLink(verse.ref, lang)}
                    target="_blank"
                    rel="noopener noreferrer"
                    aria-label={`${verse.ref} — ${t(lang, 'readWholeChapter')}`}
                    title={t(lang, 'readWholeChapter')}
                    className="today-verse__ref"
                  >
                    {verse.ref}
                    <ExternalLink size={11} aria-hidden="true" />
                  </a>
                  {verse.source && <VerseVersion source={verse.source} reference={verse.ref} lang={lang} />}
                </p>
              </div>
            </div>
          ) : (
            <p className="q-meta flex items-center gap-2">
              <Loader2 size={14} className="animate-spin" aria-hidden="true" /> …
            </p>
          )}
        </section>
      </div>
    </div>
  );
}
