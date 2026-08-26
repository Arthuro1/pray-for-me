import { useState, useEffect } from 'react';
import { HandHeart, Loader2 } from 'lucide-react';
import useCommunityStore from '../store/communityStore';
import { t } from '../i18n';
import Avatar from './shared/Avatar';

// The primary "pray together" affordance on a community prayer: a prominent
// "I'm praying" action, a presence row that shows who else is praying (reusing
// Avatar), and a shortcut into the prayer-chain calendar. This keeps the page's
// core purpose — praying together — as its most visible element instead of a
// small header chip. Toggle side effects (adding to the personal list) stay in
// the parent; this component only renders and delegates.
export default function PrayTogetherCard({ communityPrayer, count, hasReacted, busy, lang, user, onTogglePraying }) {
  const fetchReactors = useCommunityStore((s) => s.fetchReactors);
  const [reactors, setReactors] = useState([]);

  // Refetch whenever the count changes (own toggle or a live update from others).
  useEffect(() => {
    let alive = true;
    fetchReactors(communityPrayer.id).then((r) => { if (alive) setReactors(r.reactors || []); });
    return () => { alive = false; };
  }, [communityPrayer.id, count]); // eslint-disable-line react-hooks/exhaustive-deps

  const nameFor = (r) => (r.user_id === user?.id ? t(lang, 'you') : r.name);
  // Show the current user first, then up to two more faces.
  const ordered = [...reactors].sort((a, b) => (a.user_id === user?.id ? -1 : b.user_id === user?.id ? 1 : 0));
  const faces = ordered.slice(0, 3);
  const namedFaces = faces.slice(0, 2).map(nameFor);
  const extra = Math.max(0, count - namedFaces.length);
  const summary = namedFaces.length
    ? namedFaces.join(', ') + (extra > 0 ? ` ${t(lang, 'andNMore', { n: extra })}` : '')
    : t(lang, 'beFirstToPray');

  return (
    <div className="rounded-2xl p-4" style={{ background: 'var(--surface)', border: '0.5px solid var(--accent-border)' }}>
      <p className="text-xs font-semibold uppercase tracking-widest mb-3" style={{ color: 'var(--accent)' }}>{t(lang, 'prayTogether')}</p>

      <div className="flex items-center gap-2.5 mb-3">
        {faces.length > 0 && (
          <div className="flex">
            {faces.map((r, i) => (
              <div key={r.user_id} className="rounded-full" style={{ marginInlineStart: i === 0 ? 0 : -8, boxShadow: '0 0 0 2px var(--surface)' }}>
                <Avatar name={nameFor(r)} avatar={r.avatar} size={28} />
              </div>
            ))}
          </div>
        )}
        <p className="text-xs min-w-0 truncate" style={{ color: 'var(--text-3)' }}>{summary}</p>
      </div>

      <button
        onClick={onTogglePraying}
        disabled={busy}
        className="w-full flex items-center justify-center gap-2 py-3 rounded-xl text-sm font-semibold transition-all disabled:opacity-60"
        style={hasReacted
          ? { background: 'var(--accent-soft)', color: 'var(--accent)', border: '0.5px solid var(--accent-border)' }
          : { background: 'var(--accent)', color: '#fff' }}
      >
        {busy ? <Loader2 size={16} className="animate-spin" /> : <HandHeart size={16} />}
        {t(lang, 'iAmPraying')}
        {count > 0 && <span style={{ opacity: 0.85 }}>· {count}</span>}
      </button>
    </div>
  );
}
