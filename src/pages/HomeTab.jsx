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
import { Loader2, Plus, HandHeart, Share2, ExternalLink, ChevronDown } from 'lucide-react';
import Encouragement from '../components/shared/Encouragement';
import { bibleLink } from '../utils/bibleLink';
import { toast } from '../store/toastStore';
import { t } from '../i18n';
import PrayerListSkeleton from '../components/shared/Skeleton';
import PrayerListItem from '../components/PrayerListItem';
import SwipeableRow from '../components/shared/SwipeableRow';
import PrayerSession from '../components/PrayerSession';
import { usePrayerActions } from '../hooks/usePrayerActions';
import { getPrayedDays, markPrayedToday, todayKey } from '../lib/prayedLog';
import { nextReminder } from '../utils/reminder';
import { groupBySlot, SLOT_ORDER } from '../lib/planner';
import { parseKey } from '../lib/schedule';
import { Clock, Check, Sunrise, Sun, Moon } from 'lucide-react';
import { verseOfDay } from '../content/dailyVerses';
import { fetchScriptureText } from '../lib/verseText';

const DAY_NAMES = {
  fr: ['Dimanche', 'Lundi', 'Mardi', 'Mercredi', 'Jeudi', 'Vendredi', 'Samedi'],
  en: ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'],
  de: ['Sonntag', 'Montag', 'Dienstag', 'Mittwoch', 'Donnerstag', 'Freitag', 'Samstag'],
  pt: ['Domingo', 'Segunda', 'Terça', 'Quarta', 'Quinta', 'Sexta', 'Sábado'],
};

const DATE_LOCALES = { fr, en: enUS, de, pt: ptBR, zh: enUS, es: enUS, hi: enUS, ja: enUS, sw: enUS, am: enUS, id: enUS, tl: enUS, ko: enUS, ru: enUS, ar: enUS, fa: enUS };

// Today is built for one thing: praying. Compact greeting → today's count →
// one large "Pray now" → the list itself → add. Catch-up sits AFTER the list,
// collapsed (grace, not guilt), and the daily verse closes the page as a small
// card. Statistics live in the Journal; planning and everything else in More.
export default function HomeTab({ onAdd }) {
  const navigate = useNavigate();
  const { getTodaysPrayers, getEntriesForDay, getCatchUp, markPrayedOn, categories, prayers, settings, loading } = usePrayerStore(
    useShallow((s) => ({
      getTodaysPrayers: s.getTodaysPrayers,
      getEntriesForDay: s.getEntriesForDay,
      getCatchUp: s.getCatchUp,
      markPrayedOn: s.markPrayedOn,
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

  useEffect(() => { if (user?.id) fetchPrayerShares(user.id); }, [user?.id]);
  const [verse, setVerse] = useState(null);
  const [verseResolving, setVerseResolving] = useState(false);
  const [showSession, setShowSession] = useState(false);
  const [catchUpOpen, setCatchUpOpen] = useState(false);
  const [prayedDays, setPrayedDays] = useState(getPrayedDays);
  const lang = settings.language || 'fr';
  const dateLocale = DATE_LOCALES[lang] || fr;
  const { swipeActions } = usePrayerActions(lang);

  const todaysPrayers = getTodaysPrayers();
  const todayEntries = getEntriesForDay(todayKey());
  const slotGroups = groupBySlot(todayEntries);
  const useSlots = todayEntries.some((e) => e.slot); // headers only once slots are in use
  const catchUp = getCatchUp();
  const today = new Date();
  const dayIndex = today.getDay();
  const prayedToday = prayedDays.includes(todayKey());
  const reminder = settings.dailyReminderEnabled ? nextReminder(settings.dailyReminderTime, today) : null;

  // Verse of the day: a curated, deterministic pick that's the same for everyone
  // on a given day, shown in full immediately (no tap needed). Core verses ship
  // embedded text (instant + offline); the rest resolve their text through the
  // authoritative pipeline (cache → shared cache → YouVersion) and are cached
  // forever after the first view, so the daily verse stays zero-cost and works
  // offline thereafter. This never touches the AI path.
  useEffect(() => {
    const v = verseOfDay(lang, today);
    setVerse(v);
    if (v.text) { setVerseResolving(false); return undefined; }
    let cancelled = false;
    setVerseResolving(true);
    fetchScriptureText({ reference: v.ref, lang, usfm: v.usfm }).then((res) => {
      if (cancelled) return;
      if (res?.text) {
        setVerse((cur) => (cur && cur.ref === v.ref ? { ...cur, text: res.text } : cur));
      }
      // Resolve either way — YouVersion being disabled, misconfigured, or
      // offline must not leave the placeholder spinning forever.
      setVerseResolving(false);
    });
    return () => { cancelled = true; };
  }, [lang]);

  const displayName = user?.user_metadata?.full_name?.split(' ')[0]
    || user?.email?.split('@')[0]
    || '';

  const hour = today.getHours();
  const greeting = hour < 12 ? t(lang, 'greetingMorning') : hour < 18 ? t(lang, 'greetingAfternoon') : t(lang, 'greetingEvening');
  const greetingEmoji = hour < 12 ? '🌅' : hour < 18 ? '☀️' : '🌙';

  // After a completed session, offer a reminder ONCE — in context, never during
  // onboarding, and only while reminders are off. A quiet toast with an action,
  // not a permission prompt.
  const maybeSuggestReminder = () => {
    if (settings.dailyReminderEnabled || localStorage.getItem('pfm_reminder_suggested')) return;
    localStorage.setItem('pfm_reminder_suggested', '1');
    toast.success(t(lang, 'reminderNudge'), {
      action: { label: t(lang, 'setReminderCta'), onClick: () => navigate('/settings#notifications') },
    });
  };

  // Share the verse of the day via the native share sheet, or copy it as a fallback.
  const handleShareVerse = async () => {
    if (!verse) return;
    const text = verse.text ? `"${verse.text}" — ${verse.ref}` : verse.ref;
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
    <div>
      {showSession && todaysPrayers.length > 0 && (
        <PrayerSession
          prayers={todaysPrayers}
          categories={categories}
          lang={lang}
          tr={tr}
          onClose={() => setShowSession(false)}
          // Per-prayer completion is logged as the user advances PAST each
          // prayer (feeds catch-up, calendar history and rotation fairness), so
          // leaving halfway never loses genuine progress. The day itself counts
          // as prayed once the whole session finishes.
          onPrayed={(id) => markPrayedOn(id, todayKey())}
          onComplete={() => { setPrayedDays(markPrayedToday()); maybeSuggestReminder(); }}
        />
      )}

      {/* Compact greeting */}
      <div className="px-5 md:px-8 pt-8 pb-6" style={{ background: 'var(--header)' }}>
        <div className="max-w-2xl mx-auto">
          <p className="text-xs mb-1 uppercase tracking-widest" style={{ color: 'rgba(255,255,255,0.55)' }}>
            {DAY_NAMES[lang]?.[dayIndex]} · {format(today, 'd MMMM yyyy', { locale: dateLocale })}
          </p>
          <h2 className="text-xl font-semibold text-white">
            {greeting}{displayName ? `, ${displayName}` : ''} {greetingEmoji}
          </h2>
        </div>
      </div>

      <div className="px-4 md:px-8 pt-5 max-w-2xl mx-auto">
        {/* Today · N prayers */}
        {!loading || prayers.length > 0 ? (
          <p className="text-sm font-semibold mb-3" style={{ color: 'var(--text-1)' }}>
            {t(lang, 'today')} · {todaysPrayers.length} {todaysPrayers.length !== 1 ? t(lang, 'prayers2') : t(lang, 'prayer')}
          </p>
        ) : null}

        {/* Single primary action — reflects whether today's prayer has been done */}
        {todaysPrayers.length > 0 && (
          <button
            onClick={() => setShowSession(true)}
            className="w-full flex items-center justify-center gap-2 py-4 rounded-2xl text-base font-semibold mb-2 transition-all active:scale-95"
            style={prayedToday
              ? { background: 'var(--surface)', color: 'var(--success)', border: '0.5px solid var(--border)' }
              : { background: 'var(--accent)', color: '#fff' }}
          >
            {prayedToday
              ? <><Check size={18} /> {t(lang, 'prayedOnDay')}</>
              : <><HandHeart size={19} /> {t(lang, 'prayNow')}</>}
          </button>
        )}

        {reminder && (
          <p className="text-xs text-center mb-4 flex items-center justify-center gap-1.5" style={{ color: 'var(--text-3)' }}>
            <Clock size={12} /> {t(lang, 'nextReminder')} · {reminder.tomorrow ? t(lang, 'tomorrow') : t(lang, 'today')} {reminder.time}
          </p>
        )}

        {loading && prayers.length === 0 && (
          <div className="mb-4"><PrayerListSkeleton count={3} /></div>
        )}

        {!loading && todaysPrayers.length === 0 && (
          <div className="rounded-2xl p-6 mb-4 text-center" style={{ background: 'var(--surface)', border: '0.5px solid var(--border)' }}>
            <p className="text-4xl mb-3">🕊️</p>
            <p className="text-sm font-medium mb-1" style={{ color: 'var(--text-1)' }}>{t(lang, 'emptyEncourage')}</p>
            <p className="text-xs mb-5" style={{ color: 'var(--text-3)' }}>{t(lang, 'noPrayersToday')}</p>
            <button
              onClick={onAdd}
              className="inline-flex items-center gap-1.5 px-4 py-2.5 rounded-xl text-sm font-medium text-white"
              style={{ background: 'var(--accent)' }}
            >
              <Plus size={15} /> {t(lang, 'emptyAddManual')}
            </button>
            <Encouragement lang={lang} className="mt-5" />
          </div>
        )}

        {/* Today's prayer list */}
        {todaysPrayers.length > 0 && (
          <div className="flex flex-col gap-3 mb-3 mt-2">
            {/* Grouped by prayer-time slot once any prayer uses one; flat list otherwise */}
            {(useSlots ? SLOT_ORDER : ['anytime']).map((slot) => {
              const slotEntries = useSlots ? slotGroups[slot] : todayEntries;
              if (!slotEntries || slotEntries.length === 0) return null;
              const SlotIcon = { morning: Sunrise, midday: Sun, evening: Moon, anytime: Clock }[slot];
              return (
                <div key={slot} className="flex flex-col gap-3">
                  {useSlots && (
                    <p className="text-xs font-semibold uppercase tracking-widest flex items-center gap-1.5 mt-1" style={{ color: 'var(--text-3)' }}>
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
                      />
                    </SwipeableRow>
                  ))}
                </div>
              );
            })}
          </div>
        )}

        {/* Add a prayer — always one tap from the list itself */}
        {todaysPrayers.length > 0 && (
          <button
            onClick={onAdd}
            className="w-full flex items-center justify-center gap-1.5 py-3 rounded-2xl text-sm font-medium mb-4"
            style={{ background: 'var(--surface)', border: '1px dashed var(--input-border)', color: 'var(--text-2)' }}
          >
            <Plus size={15} /> {t(lang, 'emptyAddManual')}
          </button>
        )}

        {/* Catch up — prayers missed the last few days, AFTER today's list and
            collapsed by default. Grace, not guilt: one tap marks them prayed,
            or they quietly age out of the window. */}
        {catchUp.length > 0 && (
          <div className="rounded-2xl mb-4" style={{ background: 'var(--surface)', border: '0.5px solid var(--border)' }}>
            <button
              onClick={() => setCatchUpOpen((v) => !v)}
              aria-expanded={catchUpOpen}
              className="w-full flex items-center justify-between gap-2 p-4 text-left"
            >
              <span className="text-sm font-semibold" style={{ color: 'var(--text-1)' }}>
                🌿 {t(lang, 'catchUpTitle')} · {catchUp.length}
              </span>
              <ChevronDown size={15} style={{ color: 'var(--text-3)', transform: catchUpOpen ? 'rotate(180deg)' : 'none', transition: 'transform 0.15s' }} />
            </button>
            {catchUpOpen && (
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
                        className="w-7 h-7 rounded-full flex items-center justify-center shrink-0"
                        style={{ background: 'var(--surface)', border: '1.5px solid var(--input-border)', color: 'var(--text-3)' }}
                      >
                        <Check size={13} />
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}

        {/* Verse of the day — a small closing card, not the headline */}
        <div className="rounded-2xl p-4 mb-4" style={{ background: 'var(--surface)', border: '0.5px solid var(--border)' }}>
          <div className="flex items-center justify-between mb-2">
            <p className="text-xs font-semibold uppercase tracking-widest" style={{ color: 'var(--text-3)' }}>
              {t(lang, 'verseOfDay')}
            </p>
            {verse && (
              <button
                onClick={handleShareVerse}
                aria-label={t(lang, 'shareVerse')}
                title={t(lang, 'shareVerse')}
                className="shrink-0 w-7 h-7 flex items-center justify-center rounded-full transition-colors"
                style={{ background: 'var(--accent-soft)', color: 'var(--accent)' }}
              >
                <Share2 size={13} />
              </button>
            )}
          </div>
          {verse ? (
            <div>
              {verse.text
                ? <p className="text-sm italic leading-relaxed" style={{ color: 'var(--text-2)' }}>"{verse.text}"</p>
                : verseResolving
                  ? (
                    <div className="flex items-center gap-2" style={{ color: 'var(--text-3)' }}>
                      <Loader2 size={13} className="animate-spin" />
                      <span className="text-xs">{t(lang, 'loadingVerse')}</span>
                    </div>
                  )
                  : null}
              <p className="text-xs text-right mt-2" style={{ color: 'var(--text-3)' }}>— {verse.ref}</p>
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
        </div>
      </div>
    </div>
  );
}
