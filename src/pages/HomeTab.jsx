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
import { Sparkles, Loader2, Plus, HandHeart, Share2, ExternalLink } from 'lucide-react';
import Encouragement from '../components/Encouragement';
import { bibleLink } from '../utils/bibleLink';
import { toast } from '../store/toastStore';
import { t } from '../i18n';
import PrayerListSkeleton from '../components/Skeleton';
import PrayerListItem from '../components/PrayerListItem';
import SwipeableRow from '../components/SwipeableRow';
import PrayerSession from '../components/PrayerSession';
import { usePrayerActions } from '../hooks/usePrayerActions';
import { weeklyRecap } from '../utils/recap';
import { getPrayedDays, markPrayedToday, todayKey } from '../lib/prayedLog';
import { nextReminder } from '../utils/reminder';
import { groupBySlot, SLOT_ORDER } from '../lib/planner';
import { parseKey } from '../lib/schedule';
import { Clock, Check, Sunrise, Sun, Moon } from 'lucide-react';
import { getDayPlanSuggestions } from '../aiRecommendations';
import { verseOfDay } from '../content/dailyVerses';
import { fetchScriptureText } from '../lib/verseText';
import AiConsentModal from '../components/AiConsentModal';
import { hasAiConsent } from '../lib/aiConsent';
import AiDisclaimer from '../components/AiDisclaimer';

const DAY_NAMES = {
  fr: ['Dimanche', 'Lundi', 'Mardi', 'Mercredi', 'Jeudi', 'Vendredi', 'Samedi'],
  en: ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'],
  de: ['Sonntag', 'Montag', 'Dienstag', 'Mittwoch', 'Donnerstag', 'Freitag', 'Samstag'],
  pt: ['Domingo', 'Segunda', 'Terça', 'Quarta', 'Quinta', 'Sexta', 'Sábado'],
};

const DATE_LOCALES = { fr, en: enUS, de, pt: ptBR, zh: enUS, es: enUS, hi: enUS, ja: enUS, sw: enUS, am: enUS, id: enUS, tl: enUS, ko: enUS, ru: enUS, ar: enUS, fa: enUS };

export default function HomeTab({ onAdd }) {
  const navigate = useNavigate();
  const { getTodaysPrayers, getEntriesForDay, getCatchUp, markPrayedOn, categories, prayers, settings, addPrayer, loading } = usePrayerStore(
    useShallow((s) => ({
      getTodaysPrayers: s.getTodaysPrayers,
      getEntriesForDay: s.getEntriesForDay,
      getCatchUp: s.getCatchUp,
      markPrayedOn: s.markPrayedOn,
      categories: s.categories,
      prayers: s.prayers,
      settings: s.settings,
      addPrayer: s.addPrayer,
      loading: s.loading,
    }))
  );
  const { user } = useAuthStore();
  const { tr } = useTranslationStore();
  const prayerShares = useCommunityStore((s) => s.prayerShares);
  const fetchPrayerShares = useCommunityStore((s) => s.fetchPrayerShares);

  useEffect(() => { if (user?.id) fetchPrayerShares(user.id); }, [user?.id]);
  const [daySuggestions, setDaySuggestions] = useState([]);
  const [loadingSuggestions, setLoadingSuggestions] = useState(false);
  const [suggestError, setSuggestError] = useState(null);
  const [addedTitles, setAddedTitles] = useState(new Set());
  const [verse, setVerse] = useState(null);
  const [verseResolving, setVerseResolving] = useState(false);
  const [showAiConsent, setShowAiConsent] = useState(false);
  const [showSession, setShowSession] = useState(false);
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
  const todayCategories = categories.filter((c) => c.week_days && c.week_days.includes(dayIndex));
  const answeredCount = prayers.filter((p) => p.status === 'answered').length;
  const activeCount = prayers.filter((p) => p.status === 'active').length;
  const recap = weeklyRecap(prayers, today);
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

  useEffect(() => { setDaySuggestions([]); setSuggestError(null); }, [lang]);

  const displayName = user?.user_metadata?.full_name?.split(' ')[0]
    || user?.email?.split('@')[0]
    || '';

  const hour = today.getHours();
  const greeting = hour < 12 ? t(lang, 'greetingMorning') : hour < 18 ? t(lang, 'greetingAfternoon') : t(lang, 'greetingEvening');
  const greetingEmoji = hour < 12 ? '🌅' : hour < 18 ? '☀️' : '🌙';

  const fetchDaySuggestions = async () => {
    if (loadingSuggestions || todayCategories.length === 0) return;
    if (!hasAiConsent('home')) { setShowAiConsent(true); return; }
    setLoadingSuggestions(true);
    setSuggestError(null);
    const catNames = todayCategories.map(c => `${c.emoji} ${c.name}`).join(', ');
    const { recs, error } = await getDayPlanSuggestions({ categoryNames: catNames, lang });
    setDaySuggestions(recs);
    setSuggestError(error);
    setLoadingSuggestions(false);
  };

  const handleAddSuggestion = async (rec) => {
    const catIds = todayCategories.map(c => c.id);
    await addPrayer({ title: rec.title, description: rec.description || '', categoryIds: catIds });
    setAddedTitles(prev => new Set([...prev, rec.title]));
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
          onComplete={() => {
            setPrayedDays(markPrayedToday());
            // Per-prayer completion log: feeds catch-up, the calendar history
            // and rotation fairness (last_prayed_at).
            todaysPrayers.forEach((p) => markPrayedOn(p.id, todayKey()));
          }}
        />
      )}
      {showAiConsent && (
        <AiConsentModal
          lang={lang}
          context="home"
          onAccept={() => { setShowAiConsent(false); fetchDaySuggestions(); }}
          onCancel={() => setShowAiConsent(false)}
        />
      )}
      {/* Hero banner */}
      <div className="relative overflow-hidden px-5 md:px-8 pt-10 pb-8" style={{ background: 'var(--header)' }}>
        <div className="absolute inset-0" style={{ backgroundImage: "url('https://images.unsplash.com/photo-1447752875215-b2761acb3c5d?w=600&q=40')", backgroundSize: 'cover', backgroundPosition: 'center', opacity: 0.07 }} />
        <div className="relative">
          <p className="text-xs mb-1 uppercase tracking-widest" style={{ color: 'rgba(255,255,255,0.55)' }}>
            {DAY_NAMES[lang]?.[dayIndex]} · {format(today, 'd MMMM yyyy', { locale: dateLocale })}
          </p>
          <h2 className="text-xl font-semibold mb-5 text-white">
            {greeting}{displayName ? `, ${displayName}` : ''} {greetingEmoji}
          </h2>
          <div className="rounded-2xl p-4" style={{ background: 'rgba(255,255,255,0.1)', border: '1px solid rgba(255,255,255,0.15)' }}>
            <div className="flex items-center justify-between mb-2">
              <p className="text-xs font-semibold uppercase tracking-widest" style={{ color: 'rgba(255,255,255,0.5)' }}>
                {t(lang, 'verseOfDay')}
              </p>
              {verse && (
                <button
                  onClick={handleShareVerse}
                  aria-label={t(lang, 'shareVerse')}
                  title={t(lang, 'shareVerse')}
                  className="shrink-0 w-7 h-7 flex items-center justify-center rounded-full transition-colors"
                  style={{ background: 'rgba(255,255,255,0.12)', color: '#fff' }}
                >
                  <Share2 size={13} />
                </button>
              )}
            </div>
            {verse ? (
              <div>
                {verse.text
                  ? <p className="text-sm italic leading-relaxed" style={{ color: 'rgba(255,255,255,0.92)' }}>"{verse.text}"</p>
                  : verseResolving
                    ? (
                      <div className="flex items-center gap-2" style={{ color: 'rgba(255,255,255,0.7)' }}>
                        <Loader2 size={13} className="animate-spin" />
                        <span className="text-xs">{t(lang, 'loadingVerse')}</span>
                      </div>
                    )
                    : null}
                <p className="text-xs text-right mt-2" style={{ color: 'rgba(255,255,255,0.5)' }}>— {verse.ref}</p>
                <a
                  href={bibleLink(verse.ref, lang)}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center justify-end gap-1.5 mt-1.5 text-xs"
                  style={{ color: 'rgba(255,255,255,0.7)' }}
                >
                  <ExternalLink size={11} /> {t(lang, 'readWholeChapter')}
                </a>
              </div>
            ) : (
              <div className="flex items-center gap-2" style={{ color: 'rgba(255,255,255,0.5)' }}>
                <Loader2 size={14} className="animate-spin" />
                <span className="text-xs">...</span>
              </div>
            )}
          </div>
        </div>
      </div>

      <div className="px-4 md:px-8 pt-5">
        {/* Remembrance of God's faithfulness this week — answered prayers + testimonies (not a score) */}
        {(recap.answered > 0 || recap.testimonies > 0) && (
          <div className="rounded-2xl px-4 py-3 mb-3 flex items-center gap-2" style={{ background: 'var(--accent-soft)', border: '0.5px solid var(--accent-border)' }}>
            <span className="text-xs flex items-center gap-2 flex-wrap" style={{ color: 'var(--text-3)' }}>
              {recap.answered > 0 && <span>🙌 {recap.answered}</span>}
              {recap.testimonies > 0 && <span>🎉 {recap.testimonies}</span>}
              · {t(lang, 'thisWeek')}
            </span>
          </div>
        )}

        {/* Catch up — prayers missed the last few days. Grace, not guilt: one
            tap marks them prayed, or they quietly age out of the window. */}
        {catchUp.length > 0 && (
          <div className="rounded-2xl p-4 mb-3" style={{ background: 'var(--surface)', border: '0.5px solid var(--border)' }}>
            <p className="text-sm font-semibold mb-0.5" style={{ color: 'var(--text-1)' }}>🌿 {t(lang, 'catchUpTitle')}</p>
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

        {/* Gentle nudge — only when there's something to pray today and you haven't yet */}
        {!prayedToday && todaysPrayers.length > 0 && (
          <button
            onClick={() => setShowSession(true)}
            className="w-full flex items-center justify-between gap-3 rounded-2xl px-4 py-3 mb-3 text-left"
            style={{ background: 'var(--accent-soft)', border: '0.5px solid var(--accent-border)' }}
          >
            <span className="text-sm font-medium flex items-center gap-2" style={{ color: 'var(--accent)' }}>
              🙏 {t(lang, 'notPrayedToday')}
            </span>
            <span className="shrink-0 text-xs font-semibold px-3 py-1.5 rounded-lg text-white" style={{ background: 'var(--accent)' }}>
              {t(lang, 'prayNow')}
            </span>
          </button>
        )}

        {/* Stats */}
        <div className="grid grid-cols-3 gap-2.5 mb-5">
          {[
            { value: activeCount, label: t(lang, 'activePrayers'), color: 'var(--accent)' },
            { value: answeredCount, label: t(lang, 'answeredPrayers') + ' 🙌', color: 'var(--success)', onClick: () => navigate('/answered') },
            { value: todaysPrayers.length, label: t(lang, 'todayPrayers'), color: '#c07c2a' },
          ].map(({ value, label, color, onClick }) => {
            const Tag = onClick ? 'button' : 'div';
            return (
              <Tag key={label} onClick={onClick} className="rounded-2xl p-3 text-center transition-all" style={{ background: 'var(--surface)', border: '0.5px solid var(--border)', ...(onClick ? { cursor: 'pointer' } : {}) }}>
                <p className="text-2xl font-semibold" style={{ color }}>{value}</p>
                <p className="text-xs mt-0.5" style={{ color: 'var(--text-3)' }}>{label}</p>
              </Tag>
            );
          })}
        </div>

        {/* Today's categories */}
        {todayCategories.length > 0 && (
          <div className="mb-4">
            <p className="text-xs font-semibold uppercase tracking-widest mb-2" style={{ color: 'var(--text-3)' }}>
              {t(lang, 'todaysCategories')}
            </p>
            <div className="flex gap-2 flex-wrap">
              {todayCategories.map((cat) => (
                <span key={cat.id} className="text-xs px-3 py-1.5 rounded-full font-medium text-white" style={{ backgroundColor: cat.color }}>
                  {cat.emoji} {tr(cat.name, lang)}
                </span>
              ))}
            </div>
          </div>
        )}

        {/* Today's prayers header */}
        <div className="flex items-center justify-between mb-3">
          <h3 className="font-semibold" style={{ color: 'var(--text-1)' }}>{t(lang, 'todaysPrayers')}</h3>
          <div className="flex items-center gap-2">
            <span className="text-xs" style={{ color: 'var(--text-3)' }}>{todaysPrayers.length} {t(lang, 'subjects')}</span>
            {todayCategories.length > 0 && (
              <button
                onClick={fetchDaySuggestions}
                disabled={loadingSuggestions}
                title={t(lang, 'aiDaySuggest')}
                className="flex items-center gap-1.5 text-xs px-2.5 py-1.5 rounded-xl font-medium text-white disabled:opacity-60"
                style={{ background: 'var(--accent)' }}
              >
                {loadingSuggestions
                  ? <Loader2 size={12} className="animate-spin" />
                  : <Sparkles size={12} />}
                {t(lang, 'aiSuggest')}
              </button>
            )}
          </div>
        </div>

        {loading && prayers.length === 0 && (
          <div className="mb-4"><PrayerListSkeleton count={3} /></div>
        )}

        {!loading && todaysPrayers.length === 0 && (
          <div className="rounded-2xl p-6 mb-4 text-center" style={{ background: 'var(--surface)', border: '0.5px solid var(--border)' }}>
            <p className="text-4xl mb-3">🕊️</p>
            <p className="text-sm font-medium mb-1" style={{ color: 'var(--text-1)' }}>{t(lang, 'emptyEncourage')}</p>
            <p className="text-xs mb-5" style={{ color: 'var(--text-3)' }}>{t(lang, 'noPrayersToday')}</p>
            <div className="flex items-center justify-center gap-3">
              <button
                onClick={onAdd}
                className="flex items-center gap-1.5 px-4 py-2.5 rounded-xl text-sm font-medium text-white"
                style={{ background: 'var(--accent)' }}
              >
                <Plus size={15} /> {t(lang, 'emptyAddManual')}
              </button>
              {todayCategories.length > 0 && (
                <>
                  <span className="text-xs" style={{ color: 'var(--text-3)' }}>{t(lang, 'emptyOrLabel')}</span>
                  <button
                    onClick={fetchDaySuggestions}
                    disabled={loadingSuggestions}
                    className="flex items-center gap-1.5 px-4 py-2.5 rounded-xl text-sm font-medium disabled:opacity-60"
                    style={{ background: 'var(--accent-soft)', color: 'var(--accent)', border: '0.5px solid var(--accent-border)' }}
                  >
                    {loadingSuggestions
                      ? <Loader2 size={15} className="animate-spin" />
                      : <Sparkles size={15} />}
                    {t(lang, 'emptyAiGenerate')}
                  </button>
                </>
              )}
            </div>
            <Encouragement lang={lang} className="mt-5" />
          </div>
        )}

        {todaysPrayers.length > 0 && (
          <button
            onClick={() => setShowSession(true)}
            className="w-full flex items-center justify-center gap-2 py-3.5 rounded-2xl text-sm font-semibold text-white mb-3 transition-all"
            style={{ background: 'var(--accent)' }}
          >
            <HandHeart size={17} /> {t(lang, 'prayNow')}
          </button>
        )}

        {reminder && (
          <p className="text-xs text-center mb-4 flex items-center justify-center gap-1.5" style={{ color: 'var(--text-3)' }}>
            <Clock size={12} /> {t(lang, 'nextReminder')} · {reminder.tomorrow ? t(lang, 'tomorrow') : t(lang, 'today')} {reminder.time}
          </p>
        )}

        {todaysPrayers.length > 0 && (
          <div className="flex flex-col gap-3 mb-4">
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

        {/* Scripture suggestions — shown regardless of list state */}
        {suggestError && (
          <p className="text-xs text-center mt-2 mb-3" style={{ color: 'var(--text-3)' }}>{suggestError}</p>
        )}
        {daySuggestions.length > 0 && (
          <div className="space-y-2 pb-4">
            <p className="text-xs font-semibold uppercase tracking-widest mb-2" style={{ color: 'var(--text-3)' }}>
              <Sparkles size={11} className="inline mr-1" style={{ color: 'var(--accent)' }} />
              {t(lang, 'aiDaySuggestBtn')}
            </p>
            {daySuggestions.map((rec) => {
              const added = addedTitles.has(rec.title);
              return (
                <div key={rec.title} className="flex items-start gap-3 rounded-2xl px-4 py-3.5" style={{ background: 'var(--surface)', border: '0.5px solid var(--border)' }}>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium" style={{ color: 'var(--text-1)' }}>{rec.title}</p>
                    {rec.description && (
                      <p className="text-xs mt-0.5 line-clamp-2" style={{ color: 'var(--text-3)' }}>{rec.description}</p>
                    )}
                    <div className="flex gap-1.5 flex-wrap mt-1.5">
                      {todayCategories.map(c => (
                        <span key={c.id} className="text-xs px-2 py-0.5 rounded-full font-medium text-white" style={{ backgroundColor: c.color }}>
                          {c.emoji} {tr(c.name, lang)}
                        </span>
                      ))}
                    </div>
                  </div>
                  <button
                    onClick={() => handleAddSuggestion(rec)}
                    disabled={added}
                    title={t(lang, 'aiDayAdd')}
                    className="shrink-0 w-8 h-8 rounded-xl flex items-center justify-center text-white disabled:opacity-50 transition-all"
                    style={{ background: added ? 'var(--success)' : 'var(--accent)' }}
                  >
                    {added ? '✓' : <Plus size={15} />}
                  </button>
                </div>
              );
            })}
            <AiDisclaimer lang={lang} className="px-1 pt-1" />
          </div>
        )}
      </div>
    </div>
  );
}
