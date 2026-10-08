import { useState, useEffect } from 'react';
import useCommunityStore from '../store/communityStore';
import { t, tp } from '../i18n';
import Avatar from './shared/Avatar';

// Who carries a community prayer, in one line: the faces of a few who carry it
// (the reader first) and a sentence that counts the reader as "you" rather than
// as a number — "You and 2 others are carrying it". The count is information
// only — nothing ranks, sorts or celebrates requests by it.
function carrySentence(count, carrying, lang) {
  if (count <= 0) return t(lang, 'beFirstToPray');
  if (!carrying) return tp(lang, 'carryCount', count);
  return count === 1 ? t(lang, 'carryOnlyYou') : tp(lang, 'carryYouAndOthers', count - 1);
}

export default function CarryPresence({ prayerId, count, carrying = false, user, lang, className = 'prayer-detail__fact' }) {
  const fetchReactors = useCommunityStore((s) => s.fetchReactors);
  const [reactors, setReactors] = useState([]);

  // Refetch whenever the count changes (own toggle or a live update from others).
  useEffect(() => {
    let alive = true;
    fetchReactors(prayerId).then((r) => { if (alive) setReactors(r.reactors || []); });
    return () => { alive = false; };
  }, [prayerId, count]); // eslint-disable-line react-hooks/exhaustive-deps

  const nameFor = (r) => (r.user_id === user?.id ? t(lang, 'you') : r.name);
  const faces = [...reactors]
    .sort((a, b) => (a.user_id === user?.id ? -1 : b.user_id === user?.id ? 1 : 0))
    .slice(0, 3);

  // A div, not a <p>: the avatars render block elements.
  return (
    <div className={`${className} carry-presence`}>
      {faces.length > 0 && (
        <span className="carry-presence__faces" title={faces.map(nameFor).join(', ')}>
          {faces.map((r) => <Avatar key={r.user_id} name={nameFor(r)} avatar={r.avatar} size={24} />)}
        </span>
      )}
      <span>{carrySentence(count, carrying, lang)}</span>
    </div>
  );
}
