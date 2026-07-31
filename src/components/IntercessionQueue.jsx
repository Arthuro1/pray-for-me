import { useEffect, useState } from 'react';
import { HandHeart, Check, ChevronDown } from 'lucide-react';
import { useShallow } from 'zustand/react/shallow';
import usePrayerStore from '../store/prayerStore';
import useCommunityStore from '../store/communityStore';
import useAuthStore from '../store/authStore';
import useTranslationStore from '../store/translationStore';
import PrayerSession from './PrayerSession';
import { t } from '../i18n';
import { todayKey } from '../lib/prayedLog';
import { intercessionQueue, dueIntercessionQueue, queueSources, filterQueue, remainingInQueue } from '../lib/intercession';

const CARD_STYLE = { background: 'var(--surface)', border: '0.5px solid var(--border)' };

// The intercession queue, surfaced inside Community: one clear "Pray shared
// requests" action over the requests the user explicitly took on (personal
// prayers for someone, saved community requests). The DEFAULT session covers
// only what is DUE today — per-prayer schedules and claimed prayer-chain days,
// via the ordinary planner — while everything carried stays reachable behind a
// collapsed disclosure. It reuses the ordinary PrayerSession and per-prayer
// completions — leaving midway keeps real progress, and reopening resumes with
// the first unfinished request. Renders nothing when the queue is empty, so
// Grace never sees it.
export default function IntercessionQueue({ lang }) {
  const { prayers, categories, completions, markPrayedOn } = usePrayerStore(
    useShallow((s) => ({
      prayers: s.prayers,
      categories: s.categories,
      completions: s.completions,
      markPrayedOn: s.markPrayedOn,
    }))
  );
  const { myCommitments, fetchMyCommitments } = useCommunityStore(
    useShallow((s) => ({ myCommitments: s.myCommitments, fetchMyCommitments: s.fetchMyCommitments }))
  );
  const userId = useAuthStore((s) => s.user?.id);
  const { tr } = useTranslationStore();
  const [filter, setFilter] = useState('all');
  // Snapshot of the session's prayers, fixed when it starts — completions
  // recorded while praying must not reshuffle the walk mid-session.
  const [session, setSession] = useState(null);
  const [allOpen, setAllOpen] = useState(false);
  // The compact "prayed today" row can be expanded for a quiet Pray again.
  const [doneOpen, setDoneOpen] = useState(false);

  const dayKey = todayKey();

  // Claimed prayer-chain days feed the due queue. Best-effort: offline just
  // means claims can't ADD to today's queue; scheduled prayers still appear.
  // fetchMyCommitments is a stable Zustand action.
  useEffect(() => {
    if (userId) fetchMyCommitments(userId, dayKey);
  }, [userId, dayKey, fetchMyCommitments]);

  const carried = intercessionQueue(prayers);
  if (carried.length === 0) return null;

  const due = dueIntercessionQueue(prayers, categories, dayKey, myCommitments);
  const sources = queueSources(due);
  const filtered = filterQueue(due, filter);
  const remaining = remainingInQueue(filtered, completions, dayKey);
  const allRemaining = remainingInQueue(filterQueue(carried, filter), completions, dayKey);
  const dueDone = due.length > 0 && remainingInQueue(due, completions, dayKey).length === 0;

  const FILTERS = [
    { id: 'all', label: t(lang, 'all') },
    { id: 'personal', label: t(lang, 'srcPersonal') },
    { id: 'groups', label: t(lang, 'srcGroups') },
  ];

  const sessionOverlay = session && session.length > 0 && (
    <PrayerSession
      prayers={session}
      categories={categories}
      lang={lang}
      tr={tr}
      onClose={() => setSession(null)}
      onPrayed={(id) => markPrayedOn(id, dayKey)}
    />
  );

  // Everything due today is prayed → a quiet status row instead of a large
  // completed card sitting above the user's groups. Expanding it offers a
  // gentle Pray again and keeps the all-carried disclosure reachable.
  if (dueDone && !doneOpen) {
    return (
      <div className="rounded-2xl px-4 py-1 mb-8" style={CARD_STYLE}>
        {sessionOverlay}
        <button
          onClick={() => setDoneOpen(true)}
          aria-expanded={false}
          aria-controls="intercession-done"
          className="w-full min-h-[44px] flex items-center gap-2 text-sm"
          style={{ color: 'var(--success)' }}
        >
          <Check size={15} aria-hidden="true" />
          <span className="flex-1 text-start" role="status">{t(lang, 'intercessionDone')}</span>
          <ChevronDown size={14} aria-hidden="true" style={{ color: 'var(--text-3)' }} />
        </button>
      </div>
    );
  }

  return (
    <div className="rounded-2xl p-4 mb-8" style={CARD_STYLE} id="intercession-done">
      {sessionOverlay}

      <div className="flex items-center gap-2 mb-1">
        <HandHeart size={16} style={{ color: 'var(--accent)' }} aria-hidden="true" />
        <h2 className="text-sm font-semibold" style={{ color: 'var(--text-1)' }}>{t(lang, 'intercessionTitle')}</h2>
      </div>
      <p className="text-xs mb-3" style={{ color: 'var(--text-3)' }}>{t(lang, 'intercessionDueSub')}</p>

      {/* Source filters exist only when there is more than one source to
          filter between — no permanent filter bar for a single-source queue.
          Filtering changes only what the session walks, never completion data. */}
      {sources.count > 1 && (
        <div className="flex gap-2 mb-3" role="group" aria-label={t(lang, 'intercessionTitle')}>
          {FILTERS.map((f) => (
            <button
              key={f.id}
              onClick={() => setFilter(f.id)}
              aria-pressed={filter === f.id}
              className="min-h-[44px] text-xs px-3 py-1.5 rounded-full font-medium"
              style={filter === f.id
                ? { background: 'var(--accent)', color: '#fff' }
                : { background: 'var(--input-bg)', color: 'var(--text-2)', border: '0.5px solid var(--input-border)' }}
            >
              {f.label}
            </button>
          ))}
        </div>
      )}

      {remaining.length > 0 ? (
        <>
          <p className="text-xs mb-2" style={{ color: 'var(--text-3)' }}>
            {t(lang, 'intercessionRemaining', { n: remaining.length })}
          </p>
          <button
            onClick={() => setSession(remaining)}
            className="w-full flex items-center justify-center gap-2 py-3 rounded-xl text-sm font-semibold text-white"
            style={{ background: 'var(--accent)' }}
          >
            <HandHeart size={16} /> {t(lang, 'praySharedBtn')}
          </button>
        </>
      ) : due.length === 0 ? (
        // Nothing due today at all — schedules carry the load on other days.
        <p className="text-sm" style={{ color: 'var(--text-3)' }} role="status">
          {t(lang, 'intercessionNoneDue')}
        </p>
      ) : (
        <div className="flex items-center gap-3">
          <p className="flex-1 text-sm flex items-center gap-2" style={{ color: 'var(--success)' }} role="status">
            <Check size={15} aria-hidden="true" /> {t(lang, 'intercessionDone')}
          </p>
          {/* Quiet Pray again over today's due queue — completions are
              idempotent per day, so walking it again never double-counts. */}
          {due.length > 0 && (
            <button
              onClick={() => setSession(filterQueue(due, filter))}
              className="min-h-[44px] text-xs font-medium px-3 rounded-xl"
              style={{ background: 'var(--input-bg)', color: 'var(--text-2)', border: '0.5px solid var(--input-border)' }}
            >
              {t(lang, 'prayAgainBtn')}
            </button>
          )}
        </div>
      )}

      {/* Every carried request stays one tap away — but it is never the
          default session. */}
      {carried.length > due.length && (
        <>
          <button
            onClick={() => setAllOpen((v) => !v)}
            aria-expanded={allOpen}
            aria-controls="intercession-all"
            className="w-full min-h-[44px] flex items-center justify-between gap-2 mt-2 text-xs font-medium"
            style={{ color: 'var(--text-2)' }}
          >
            <span>{t(lang, 'intercessionAllCarried', { n: carried.length })}</span>
            <ChevronDown size={14} aria-hidden="true" style={{ transform: allOpen ? 'rotate(180deg)' : 'none', transition: 'transform 0.15s' }} />
          </button>
          {allOpen && (
            <div id="intercession-all" className="mt-1 space-y-1">
              {carried.map((p) => (
                <div key={p.id} className="flex items-center gap-2 px-2 py-1.5 rounded-lg text-xs" style={{ background: 'var(--input-bg)' }}>
                  {(completions[p.id] || []).includes(dayKey)
                    ? <Check size={12} className="shrink-0" aria-hidden="true" style={{ color: 'var(--success)' }} />
                    : <HandHeart size={12} className="shrink-0" aria-hidden="true" style={{ color: 'var(--accent)' }} />}
                  <span className="flex-1 truncate" style={{ color: 'var(--text-1)' }}>{tr(p.title, lang)}</span>
                  {p.origin_group_name && (
                    <span className="shrink-0 truncate max-w-[35%]" style={{ color: 'var(--text-3)' }}>{p.origin_group_name}</span>
                  )}
                </div>
              ))}
              {allRemaining.length > 0 && (
                <button
                  onClick={() => setSession(allRemaining)}
                  className="w-full min-h-[44px] text-xs font-medium rounded-xl mt-1"
                  style={{ background: 'var(--input-bg)', color: 'var(--text-2)', border: '0.5px solid var(--input-border)' }}
                >
                  {t(lang, 'prayAllCarriedBtn', { n: allRemaining.length })}
                </button>
              )}
            </div>
          )}
        </>
      )}
    </div>
  );
}
