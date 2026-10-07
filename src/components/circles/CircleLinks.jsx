import { useEffect, useRef } from 'react';
import { Link } from 'react-router-dom';
import { t } from '../../i18n';
import { CIRCLES, circleLabelKey } from '../../lib/circles';
import CircleGlyph from '../shared/CircleGlyph';

// The seven circles as doors to their pages (/circles/:id), in their
// inner-to-outer order — the widening reach of prayer, never a ranking. Used by
// the Plans page ("Explore by circle") and by each circle page to move to
// another one. `returnTo` ({ from, fromState }) travels in router state so a
// circle page knows where its back link returns; moving between circles
// replaces the entry rather than stacking seven pages of history.
export default function CircleLinks({ lang, current = null, returnTo, label, labelledBy, className = '' }) {
  // Where the row scrolls sideways (a circle page on a phone), keep the
  // current circle in view.
  const currentRef = useRef(null);
  useEffect(() => {
    currentRef.current?.scrollIntoView?.({ block: 'nearest', inline: 'center' });
  }, [current]);

  return (
    <nav aria-label={labelledBy ? undefined : label} aria-labelledby={labelledBy} className={className}>
      <ul className="q-chips circle-links">
        {CIRCLES.map((circle) => {
          const isCurrent = circle === current;
          return (
            <li key={circle}>
              <Link
                to={`/circles/${circle}`}
                state={returnTo}
                replace={!!current}
                ref={isCurrent ? currentRef : undefined}
                aria-current={isCurrent ? 'page' : undefined}
                className="q-chip pressable no-underline"
              >
                <CircleGlyph circle={circle} size={18} selected={isCurrent} />
                <span>{t(lang, circleLabelKey(circle))}</span>
              </Link>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}
