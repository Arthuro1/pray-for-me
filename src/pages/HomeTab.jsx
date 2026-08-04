import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useShallow } from 'zustand/react/shallow';
import usePrayerStore from '../store/prayerStore';
import useAuthStore from '../store/authStore';
import useTranslationStore from '../store/translationStore';
import useCommunityStore from '../store/communityStore';
import { getAuthorName } from '../utils/user';
import { format } from 'date-fns';
import { fr, enUS, de, ptBR } from 'date-fns/locale';
import { Loader2, Plus, HandHeart, Share2, ExternalLink } from 'lucide-react';
import Encouragement from '../components/shared/Encouragement';
import { bibleLink } from '../utils/bibleLink';
import { toast } from '../store/toastStore';
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
import { parseKey } from '../lib/schedule';
import { Clock, Check, Sunrise, Sun, Moon } from 'lucide-react';
import { verseOfDay } from '../content/dailyVerses';
import { fetchScriptureText } from '../lib/verseText';
import VerseVersion from '../components/VerseVersion';
import { versionForSource } from '../lib/bibleVersions';
import EmptyState from '../components/shared/EmptyState';
import { Disclosure, PageHeader, PrayerSurface, PrimaryButton, QuietButton, SectionLabel, StatusPill } from '../components/shared/Primitives';
import ActivationNudge from '../components/ActivationNudge';
import PwaInstallNudge from '../components/PwaInstallNudge';
import { nextActivationStep, readActivationProgress } from '../lib/activationProgress';

const DAY_NAMES = {
  fr: ['Dimanche', 'Lundi', 'Mardi', 'Mercredi', 'Jeudi', 'Vendredi', 'Samedi'],
  en: ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'],
  de: ['Sonntag', 'Montag', 'Dienstag', 'Mittwoch', 'Donnerstag', 'Freitag', 'Samstag'],
  pt: ['Domingo', 'Segunda', 'Terça', 'Quarta', 'Quinta', 'Sexta', 'Sábado'],
};

const DATE_LOCALES = { fr, en: enUS, de, pt: ptBR, zh: enUS, es: enUS, hi: enUS, ja: enUS, sw: enUS, am: enUS, id: enUS, tl: enUS, ko: enUS, ru: enUS, ar: enUS, fa: enUS };

// Today is built for one thing: praying. Compact greeting → what REMAINS today
// → one large "Pray now" → the list itself → add. Completed prayers fold into a
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
  // The open session's prayer list, snapshotted when it starts: completions
  // recorded while praying must not reshuffle the walk mid-session. null = no
  // session open.
  const [session, setSession] = useState(null);
  const [catchUpOpen, setCatchUpOpen] = useState(false);
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
  // After a completed session, offer a reminder ONCE — in context, never during
  // Share the verse of the day via the native share sheet, or copy it as a fallback.
  const handleShareVerse = async () => {
    if (!verse) return;
    // Cite the edition alongside the reference when we know it (never for the
    // unlabelled embedded SEED wording), so the shared verse can be verified.
    const version = verse.source ? versionForSource(verse.source, lang) : null;
    const ref = version ? `${verse.ref} (${version.abbr})` : verse.ref;
    const text = verse.text ? `"${verse.text}" — ${ref}` : ref;
    try {
      if (navigator.share) {
        await navigator.share({ title: t(lang, 'verseOfDay'), text, url: window.location.origin });
      } else {
        await navigator.clipboard.writeText(`${text}\n${window.location.origin}`);
        toast.success(t(lang, 'verseCopied'));
      }
    } catch {
      // user dismissed the share sheet, or share/clipboard was blocked — ignore
    }
  };

  return (
    <div className="phase-page constellation-home">
      {session && session.length > 0 && (
        <PrayerSession
          prayers={session}
          categories={categories}
          lang={lang}
          tr={tr}
          onClose={() => setSession(null)}
          // Per-prayer completion is logged as the user advances PAST each
          // prayer (feeds Home's remaining count, catch-up, calendar history
          // and rotation fairness), so leaving halfway never loses genuine
          // progress — reopening resumes with the first unfinished request.
          onPrayed={(id) => markPrayedOn(id, dayKey)}
        />
      )}

      <div className="constellation-home__shell mx-auto max-w-3xl px-5 md:px-8">
        <PageHeader
          eyebrow={`${DAY_NAMES[lang]?.[dayIndex]} · ${format(today, 'd MMMM yyyy', { locale: dateLocale })}`}
          title={`${greeting}${displayName ? `, ${displayName}` : ''}`}
        />

        {/* One clear doorway into prayer. The first request gives the card a
            human focus; schedules and community metadata wait below. */}
        {remainingPrayers.length > 0 && (!loading || prayers.length > 0) && (
          <PrayerSurface tone="focus" className="constellation-home__focus mb-6 p-6 sm:p-8">
            <div className="relative z-10">
              <p className="mb-5 text-[11px] font-bold uppercase tracking-[.16em]" style={{ color: 'rgba(255,255,255,.6)' }}>
                {t(lang, 'todayRemainingLabel', { n: remainingPrayers.length })}
              </p>
              <p className="editorial max-w-xl text-2xl leading-snug sm:text-3xl" style={{ color: '#fff' }}>
                {tr(remainingPrayers[0].title, lang)}
              </p>
              {remainingPrayers.length > 1 && (
                <p className="mt-2 text-xs" style={{ color: 'rgba(255,255,255,.5)' }}>
                  + {remainingPrayers.length - 1}
                </p>
              )}
              <PrimaryButton
                onClick={() => setSession(remainingPrayers)}
                icon={HandHeart}
                className="first-prayer-primary mt-8 w-full whitespace-nowrap sm:w-auto sm:min-w-44"
              >
                {t(lang, 'prayNow')}
              </PrimaryButton>
              {reminder && (
                <p className="mt-5 flex items-center gap-1.5 text-xs" style={{ color: 'rgba(255,255,255,.48)' }}>
                  <Clock size={12} /> {t(lang, 'nextReminder')} · {reminder.tomorrow ? t(lang, 'tomorrow') : t(lang, 'today')} {reminder.time}
                </p>
              )}
            </div>
          </PrayerSurface>
        )}

        {/* All of today prayed: a clear status (not a button), with "Pray again"
            as an explicit, secondary way to walk the whole day once more. */}
        {dayComplete && (
          <PrayerSurface tone="answered" className="mb-6 p-6 text-center">
            <StatusPill tone="answered" icon={Check} className="mb-3" role="status">
              {t(lang, 'todayCompleteTitle')}
            </StatusPill>
            <p className="editorial-heading mb-4 text-2xl" style={{ color: 'var(--text-1)' }}>{t(lang, 'sessionDoneTitle')}</p>
            {todayEntries.length > 0 && (
              <QuietButton
                onClick={() => setSession(todayEntries.map((e) => e.prayer))}
                icon={HandHeart}
              >
                {t(lang, 'prayAgain')}
              </QuietButton>
            )}
          </PrayerSurface>
        )}

        {reminder && remainingPrayers.length === 0 && (
          <p className="text-xs text-center mb-4 flex items-center justify-center gap-1.5" style={{ color: 'var(--text-3)' }}>
            <Clock size={12} /> {t(lang, 'nextReminder')} · {reminder.tomorrow ? t(lang, 'tomorrow') : t(lang, 'today')} {reminder.time}
          </p>
        )}

        {!loading && prayers.length > 0 && (
          <>
            <ActivationNudge
              prayers={prayers}
              settings={settings}
              lang={lang}
              onEditPrayer={onEdit}
              onOpenReminders={() => navigate('/settings#notifications')}
            />
            {!activationStep && <PwaInstallNudge lang={lang} />}
          </>
        )}

        {loading && prayers.length === 0 && (
          <div className="mb-4"><PrayerListSkeleton count={3} /></div>
        )}

        {!loading && dayEmpty && (
          <PrayerSurface className="mb-6">
            <EmptyState
              emoji="🕊️"
              title={t(lang, 'emptyEncourage')}
              subtitle={t(lang, 'noPrayersToday')}
              actionLabel={t(lang, 'emptyAddManual')}
              onAction={onAdd}
              actionIcon={Plus}
              secondaryLabel={t(lang, 'growTitle')}
              onSecondary={() => navigate('/grow')}
            />
            <Encouragement lang={lang} className="mx-auto mb-7 max-w-sm px-6 text-center" />
          </PrayerSurface>
        )}

        {/* What remains to pray today (completed prayers fold away below) */}
        {remainingEntries.length > 0 && (
          <section className="constellation-home__today mb-7">
            <SectionLabel className="mb-2">{t(lang, 'today')}</SectionLabel>
            {/* Grouped by prayer-time slot once any prayer uses one; flat list otherwise */}
            {(useSlots ? SLOT_ORDER : ['anytime']).map((slot) => {
              const slotEntries = useSlots ? slotGroups[slot] : remainingEntries;
              if (!slotEntries || slotEntries.length === 0) return null;
              const SlotIcon = { morning: Sunrise, midday: Sun, evening: Moon, anytime: Clock }[slot];
              return (
                <div key={slot}>
                  {useSlots && (
                    <p className="mt-5 flex items-center gap-1.5 text-xs font-semibold" style={{ color: 'var(--text-3)' }}>
                      <SlotIcon size={12} /> {t(lang, slot === 'anytime' ? 'slotAnytime' : `slot_${slot}`)}
                    </p>
                  )}
                  {slotEntries.map(({ prayer }) => (
                    <SwipeableRow key={prayer.id} actions={swipeActions(prayer)}>
                      <PrayerListItem
                        prayer={prayer}
                        categories={categories}
                        lang={lang}
                        tr={tr}
                        shares={prayerShares[prayer.id]}
                        currentUserName={getAuthorName(user)}
                        onClick={() => navigate(`/prayers/${prayer.id}`)}
                        variant="journal"
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
          <div className="mb-5 border-block" style={{ borderColor: 'var(--border)' }}>
            <Disclosure
              id="today-prayed"
              label={t(lang, 'prayedTodayLabel')}
              count={completedToday.length}
              open={prayedOpen}
              onToggle={() => setPrayedOpen((v) => !v)}
              className="py-1"
            >
              <div className="px-4 pb-4 space-y-1.5">
                {completedToday.map((prayer) => (
                  <button
                    key={prayer.id}
                    onClick={() => navigate(`/prayers/${prayer.id}`)}
                    className="w-full flex items-center gap-2.5 rounded-xl px-3 py-2 text-left"
                    style={{ background: 'var(--input-bg)' }}
                  >
                    <Check size={13} className="shrink-0" style={{ color: 'var(--success)' }} />
                    <span className="flex-1 min-w-0 text-sm truncate" style={{ color: 'var(--text-2)' }}>{tr(prayer.title, lang)}</span>
                  </button>
                ))}
              </div>
            </Disclosure>
          </div>
        )}

        {/* Add a prayer — always one tap from the list itself */}
        {!dayEmpty && (
          <QuietButton onClick={onAdd} icon={Plus} className="mb-6 w-full border-dashed">
            {t(lang, 'emptyAddManual')}
          </QuietButton>
        )}

        {/* Catch up — prayers missed the last few days, AFTER today's list and
            collapsed by default. Grace, not guilt: one tap marks them prayed,
            or they quietly age out of the window. */}
        {catchUp.length > 0 && (
          <div className="mb-6 border-block" style={{ borderColor: 'var(--border)' }}>
            <Disclosure
              id="today-catch-up"
              label={`🌿 ${t(lang, 'catchUpTitle')}`}
              count={catchUp.length}
              open={catchUpOpen}
              onToggle={() => setCatchUpOpen((v) => !v)}
              className="py-1"
            >
              <div className="px-4 pb-4">
                <p className="text-xs mb-3" style={{ color: 'var(--text-3)' }}>{t(lang, 'catchUpSub')}</p>
                <div className="space-y-1.5">
                  {catchUp.map(({ prayer, day }) => (
                    <div key={prayer.id} className="flex items-center gap-2.5 rounded-xl px-3 py-2" style={{ background: 'var(--input-bg)' }}>
                      <button onClick={() => navigate(`/prayers/${prayer.id}`)} className="flex-1 min-w-0 text-left">
                        <p className="text-sm font-medium truncate" style={{ color: 'var(--text-1)' }}>{tr(prayer.title, lang)}</p>
                        <p className="text-[10px]" style={{ color: 'var(--text-3)' }}>
                          {t(lang, 'missedOn', { date: parseKey(day).toLocaleDateString(lang, { weekday: 'short', day: 'numeric', month: 'short' }) })}
                        </p>
                      </button>
                      <button
                        onClick={() => markPrayedOn(prayer.id, day)}
                        title={t(lang, 'markPrayed')}
                        aria-label={t(lang, 'markPrayed')}
                        className="pressable flex h-11 w-11 shrink-0 items-center justify-center rounded-full"
                        style={{ background: 'var(--surface)', border: '1.5px solid var(--input-border)', color: 'var(--text-3)' }}
                      >
                        <Check size={13} />
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            </Disclosure>
          </div>
        )}

        {/* Verse of the day — a small closing card, not the headline */}
        <section className="scripture-block mb-6">
          <div className="flex items-center justify-between mb-2">
            <p className="text-xs font-semibold uppercase tracking-widest" style={{ color: 'var(--text-3)' }}>
              {t(lang, 'verseOfDay')}
            </p>
            {verse && (
              <button
                onClick={handleShareVerse}
                aria-label={t(lang, 'shareVerse')}
                title={t(lang, 'shareVerse')}
                className="pressable flex h-11 w-11 shrink-0 items-center justify-center rounded-full transition-colors"
                style={{ background: 'var(--accent-soft)', color: 'var(--accent)' }}
              >
                <Share2 size={13} />
              </button>
            )}
          </div>
          {verse ? (
            <div>
              {verse.text
                ? <p className="scripture-text text-lg leading-relaxed" style={{ color: 'var(--text-1)' }}>“{verse.text}”</p>
                : verseResolving
                  ? (
                    <div className="flex items-center gap-2" style={{ color: 'var(--text-3)' }}>
                      <Loader2 size={13} className="animate-spin" />
                      <span className="text-xs">{t(lang, 'loadingVerse')}</span>
                    </div>
                  )
                  : null}
              <p className="text-xs text-right mt-2" style={{ color: 'var(--text-3)' }}>
                — {verse.ref}
                {verse.source && <VerseVersion source={verse.source} reference={verse.ref} lang={lang} />}
              </p>
              <a
                href={bibleLink(verse.ref, lang)}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center justify-end gap-1.5 mt-1.5 text-xs"
                style={{ color: 'var(--accent)' }}
              >
                <ExternalLink size={11} /> {t(lang, 'readWholeChapter')}
              </a>
            </div>
          ) : (
            <div className="flex items-center gap-2" style={{ color: 'var(--text-3)' }}>
              <Loader2 size={14} className="animate-spin" />
              <span className="text-xs">...</span>
            </div>
          )}
        </section>
      </div>
    </div>
  );
}
