import { useState, useEffect } from 'react';
import useCommunityStore from '../store/communityStore';
import { t, tp } from '../i18n';
import Avatar from './shared/Avatar';
import CarryButton from './shared/CarryButton';

// The primary "pray together" affordance on a community prayer: "Carry this
// prayer" — deliberately taking a request into one's own life of intercession
// (it joins "Prayers you're carrying"), never a like, and one action only (the
// carrier's own circle is offered in the confirmation toast). Beneath,
// quietly, the faces of a few who carry it too and how many they are. The
// count is information only: nothing ranks, sorts or celebrates requests by how
// many carry them. Toggle side effects (the saved copy, following) stay in the
// parent; this only renders.
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
  // The current user first, then up to two more faces.
  const ordered = [...reactors].sort((a, b) => (a.user_id === user?.id ? -1 : b.user_id === user?.id ? 1 : 0));
  const faces = ordered.slice(0, 3);

  return (
    <section className="carry-section" aria-labelledby="carry-section-label">
      <p id="carry-section-label" className="section-label">{t(lang, 'prayTogether')}</p>
      <CarryButton carrying={hasReacted} busy={busy} onToggle={onTogglePraying} lang={lang} className="carry-section__button" />
      {/* A div, not a <p>: the avatars render block elements. */}
      <div className="carry-section__presence">
        {faces.length > 0 && (
          <span className="carry-section__faces" title={faces.map(nameFor).join(', ')}>
            {faces.map((r) => <Avatar key={r.user_id} name={nameFor(r)} avatar={r.avatar} size={24} />)}
          </span>
        )}
        <span>{count > 0 ? tp(lang, 'carryCount', count) : t(lang, 'beFirstToPray')}</span>
      </div>
    </section>
  );
}
