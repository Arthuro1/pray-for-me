import { useEffect, useRef } from 'react';
import { Link } from 'react-router-dom';
import { t } from '../../i18n';
import { CIRCLES, circleLabelKey } from '../../lib/circles';
import CircleGlyph from '../shared/CircleGlyph';
import { CIRCLE_ICONS } from '../shared/circleIcons';

// The seven circles as doors to their pages (/circles/:id), in their
// inner-to-outer order — the widening reach of prayer, never a ranking. Used by
// the Plans page ("Explore by circle") and by each circle page to move to
// another one. `returnTo` ({ from, fromState }) travels in router state so a
// circle page knows where its back link returns; moving between circles
// replaces the entry rather than stacking seven pages of history.
//
// variant 'chips' — the circle page's switcher: ring glyphs in the chip voice.
// variant 'doors' — the Plans page: one row of small cards, each with its
//                   circle's icon in its circle's tone, as on prayer rows.
export default function CircleLinks({ lang, current = null, returnTo, label, labelledBy, variant = 'chips', className = '' }) {
  // Where the row scrolls sideways (a circle page on a phone), keep the
  // current circle in view.
  const currentRef = useRef(null);
  useEffect(() => {
    currentRef.current?.scrollIntoView?.({ block: 'nearest', inline: 'center' });
  }, [current]);

  const doors = variant === 'doors';
  return (
    <nav aria-label={labelledBy ? undefined : label} aria-labelledby={labelledBy} className={className}>
      <ul className={doors ? 'circle-doors' : 'q-chips circle-links'}>
        {CIRCLES.map((circle) => {
          const isCurrent = circle === current;
          const Icon = CIRCLE_ICONS[circle];
          return (
            <li key={circle}>
              <Link
                to={`/circles/${circle}`}
                state={returnTo}
                replace={!!current}
                ref={isCurrent ? currentRef : undefined}
                aria-current={isCurrent ? 'page' : undefined}
                className={doors ? 'circle-door q-card pressable no-underline' : 'q-chip pressable no-underline'}
              >
                {doors
                  ? <span className={`icon-tile tone-${circle}`} aria-hidden="true"><Icon size={18} strokeWidth={1.8} /></span>
                  : <CircleGlyph circle={circle} size={18} selected={isCurrent} />}
                <span className={doors ? 'circle-door__name' : undefined}>{t(lang, circleLabelKey(circle))}</span>
              </Link>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}
