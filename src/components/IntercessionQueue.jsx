import { useState } from 'react';
import { HandHeart, Check } from 'lucide-react';
import { useShallow } from 'zustand/react/shallow';
import usePrayerStore from '../store/prayerStore';
import useTranslationStore from '../store/translationStore';
import PrayerSession from './PrayerSession';
import { t } from '../i18n';
import { todayKey } from '../lib/prayedLog';
import { intercessionQueue, queueSources, filterQueue, remainingInQueue } from '../lib/intercession';

const CARD_STYLE = { background: 'var(--surface)', border: '0.5px solid var(--border)' };

// The intercession queue, surfaced inside Community: one clear "Pray shared
// requests" action over the requests the user explicitly took on (personal
// prayers for someone, saved community requests). It reuses the ordinary
// PrayerSession and per-prayer completions — leaving midway keeps real
// progress, and reopening resumes with the first unfinished request. Renders
// nothing when the queue is empty, so Grace never sees it.
export default function IntercessionQueue({ lang }) {
  const { prayers, categories, completions, markPrayedOn } = usePrayerStore(
    useShallow((s) => ({
      prayers: s.prayers,
      categories: s.categories,
      completions: s.completions,
      markPrayedOn: s.markPrayedOn,
    }))
  );
  const { tr } = useTranslationStore();
  const [filter, setFilter] = useState('all');
  // Snapshot of the session's prayers, fixed when it starts — completions
  // recorded while praying must not reshuffle the walk mid-session.
  const [session, setSession] = useState(null);

  const dayKey = todayKey();
  const queue = intercessionQueue(prayers);
  if (queue.length === 0) return null;

  const sources = queueSources(queue);
  const filtered = filterQueue(queue, filter);
  const remaining = remainingInQueue(filtered, completions, dayKey);

  const FILTERS = [
    { id: 'all', label: t(lang, 'all') },
    { id: 'personal', label: t(lang, 'srcPersonal') },
    { id: 'groups', label: t(lang, 'srcGroups') },
  ];

  return (
    <div className="rounded-2xl p-4 mb-8" style={CARD_STYLE}>
      {session && session.length > 0 && (
        <PrayerSession
          prayers={session}
          categories={categories}
          lang={lang}
          tr={tr}
          onClose={() => setSession(null)}
          onPrayed={(id) => markPrayedOn(id, dayKey)}
        />
      )}

      <div className="flex items-center gap-2 mb-1">
        <HandHeart size={16} style={{ color: 'var(--accent)' }} aria-hidden="true" />
        <h2 className="text-sm font-semibold" style={{ color: 'var(--text-1)' }}>{t(lang, 'intercessionTitle')}</h2>
      </div>
      <p className="text-xs mb-3" style={{ color: 'var(--text-3)' }}>{t(lang, 'intercessionSub')}</p>

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
      ) : (
        <p className="text-sm flex items-center gap-2" style={{ color: 'var(--success)' }} role="status">
          <Check size={15} /> {t(lang, 'intercessionDone')}
        </p>
      )}
    </div>
  );
}
