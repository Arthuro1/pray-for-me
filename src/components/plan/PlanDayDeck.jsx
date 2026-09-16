import { useRef, useState } from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { t, isRtl } from '../../i18n';
import { parseKey } from '../../lib/schedule';

// The card around ONE day of a running plan, and the way to move to the day
// before or the day after it.
//
// Two ways in, on purpose: arrows that are always visible (the only ones a
// keyboard, a screen reader or a desktop pointer can use) and a swipe on the
// card (what a phone reaches for first). Both do exactly what selecting the day
// on the calendar does — the host turns the chosen key into `?day=` — so paging
// never reaches a day the run does not contain.
//
// Only the day on screen is mounted. Neighbouring days are one state change
// away and their content is already in memory (a plan's prose overlay is loaded
// once per plan, not per day), so rendering two more of them would buy nothing
// but three times the work on every drag.
//
// Pure presentation: the host owns which day is shown and what its neighbours
// are.

// A quarter of the card is a deliberate drag; a flick commits much earlier,
// which is what makes the gesture feel light rather than heavy. A flick still
// has to travel FLICK_MIN first, and speed is only sampled over a real interval
// — two pointer events in the same millisecond otherwise read as an enormous
// velocity and turn a twitch into a page turn.
const COMMIT_FRACTION = 0.25;
const COMMIT_VELOCITY = 0.35; // px per ms
const FLICK_MIN = 24; // px before speed alone may commit
const SAMPLE_MS = 4; // shortest interval speed is measured over
const AXIS_LOCK = 6; // px of movement before the gesture picks an axis
const RUBBER_BAND = 0.35; // resistance when there is no day that way

export default function PlanDayDeck({
  lang, dayNo, total, dayKey, isToday, upcoming, prevKey, nextKey,
  onGoToDay, onShowToday, children,
}) {
  const rtl = isRtl(lang);
  const [dx, setDx] = useState(0);
  const [dragging, setDragging] = useState(false);
  // Which side the day now on screen came in from, so it enters the way the
  // reader sent it. Null until they have actually paged.
  const [enterFrom, setEnterFrom] = useState(null);
  const drag = useRef(null);
  const swiped = useRef(false);
  const viewportRef = useRef(null);

  const keyFor = (dir) => (dir === 'next' ? nextKey : prevKey);
  // Dragging AGAINST the reading direction asks for the next day, in LTR and
  // RTL alike — so the gesture means the same thing to an Arabic reader.
  const dirOf = (delta) => ((rtl ? delta > 0 : delta < 0) ? 'next' : 'prev');

  const go = (dir) => {
    const key = keyFor(dir);
    if (!key) return;
    // Which physical side the incoming day slides from: forward is always from
    // the far edge of the reading direction.
    setEnterFrom((dir === 'next') !== rtl ? 'right' : 'left');
    setDx(0);
    onGoToDay(key);
  };

  const onPointerDown = (e) => {
    // A mouse has the arrows; a drag there would only fight text selection.
    if (e.pointerType === 'mouse') return;
    const now = performance.now();
    drag.current = { x: e.clientX, y: e.clientY, axis: null, dx: 0, last: e.clientX, lastT: now, v: 0 };
    swiped.current = false;
    setDragging(true);
  };

  const onPointerMove = (e) => {
    const d = drag.current;
    if (!d) return;
    const mdx = e.clientX - d.x;
    const mdy = e.clientY - d.y;
    if (!d.axis) {
      if (Math.abs(mdx) < AXIS_LOCK && Math.abs(mdy) < AXIS_LOCK) return;
      d.axis = Math.abs(mdx) > Math.abs(mdy) ? 'h' : 'v';
    }
    if (d.axis !== 'h') return; // vertical → the page scrolls, untouched
    const now = performance.now();
    if (now - d.lastT >= SAMPLE_MS) {
      d.v = (e.clientX - d.last) / (now - d.lastT);
      d.last = e.clientX;
      d.lastT = now;
    }
    // How far the finger has travelled lives on the gesture itself, not in
    // state: pointermove is a continuous event, so React is free to defer the
    // re-render, and the decision below would be reading a stale offset.
    d.dx = mdx;
    swiped.current = true;
    // No day that way? The card still moves, against resistance, so the first
    // and last days of the plan are felt rather than silently ignored.
    setDx(keyFor(dirOf(mdx)) ? mdx : mdx * RUBBER_BAND);
  };

  const endDrag = () => {
    const d = drag.current;
    drag.current = null;
    setDragging(false);
    if (!d || d.axis !== 'h') { setDx(0); return; }
    const width = viewportRef.current?.offsetWidth || 1;
    const dir = dirOf(d.dx);
    const flicked = Math.abs(d.dx) > FLICK_MIN && Math.abs(d.v) > COMMIT_VELOCITY;
    if ((Math.abs(d.dx) > width * COMMIT_FRACTION || flicked) && keyFor(dir)) go(dir); else setDx(0);
  };

  // A swipe that started on a verse pill or a disclosure must not also open it.
  const onClickCapture = (e) => {
    if (!swiped.current) return;
    swiped.current = false;
    e.preventDefault();
    e.stopPropagation();
  };

  const onKeyDown = (e) => {
    if (e.key !== 'ArrowLeft' && e.key !== 'ArrowRight') return;
    // Leave the arrows to anything that reads them itself.
    const tag = e.target.tagName;
    if (tag === 'INPUT' || tag === 'TEXTAREA' || tag === 'SELECT' || e.target.isContentEditable) return;
    const dir = (e.key === 'ArrowRight') === rtl ? 'prev' : 'next';
    if (!keyFor(dir)) return;
    e.preventDefault();
    go(dir);
  };

  const dayLabel = t(lang, 'planDayOf', { n: dayNo, total: total || '' });
  const dateLabel = parseKey(dayKey).toLocaleDateString(lang, { weekday: 'long', day: 'numeric', month: 'long' });

  const arrow = (dir) => {
    const target = keyFor(dir);
    const label = t(lang, dir === 'next' ? 'planNextDay' : 'planPrevDay');
    // "Back" and "forward" are the reading direction, not the screen's left.
    const Icon = (dir === 'next') !== rtl ? ChevronRight : ChevronLeft;
    return (
      <button
        type="button"
        onClick={() => go(dir)}
        disabled={!target}
        aria-label={target ? `${label} · ${parseKey(target).toLocaleDateString(lang, { day: 'numeric', month: 'long' })}` : label}
        title={label}
        className="pressable flex h-11 w-11 items-center justify-center rounded-full disabled:opacity-35"
        style={{ background: 'var(--input-bg)', border: '0.5px solid var(--input-border)', color: target ? 'var(--accent)' : 'var(--text-3)' }}
      >
        <Icon size={18} aria-hidden="true" />
      </button>
    );
  };

  return (
    // The arrows are the controls; this handler only adds the arrow keys for
    // whoever already has focus inside the card, and swallows nothing else.
    <section
      className="rounded-2xl p-4 space-y-3"
      style={{ background: 'var(--surface)', border: '0.5px solid var(--border)' }}
      onKeyDown={onKeyDown}
    >
      <div className="flex items-center justify-between gap-2">
        {/* The visible label is also the announcement, so a screen reader hears
            which day it landed on instead of only the content changing
            underneath it. The date rides along for listeners alone: on screen it
            belongs with the "not today" note below, next to the way back. */}
        <p role="status" aria-live="polite" className="text-xs font-semibold uppercase tracking-widest" style={{ color: 'var(--accent)' }}>
          {dayLabel}
          <span className="sr-only">{` · ${dateLabel}`}</span>
        </p>
        <div className="flex shrink-0 items-center gap-1.5">
          {arrow('prev')}
          {arrow('next')}
        </div>
      </div>

      {/* Paging moves the DAY, never the page: marking prayed, notes and the
          follow-up all stay about today, so a day that is not today says so and
          offers the way back. */}
      {!isToday && (
        <div className="flex flex-wrap items-center justify-between gap-x-3">
          <p className="text-[11px] first-letter:uppercase" style={{ color: 'var(--text-3)' }}>
            {t(lang, upcoming ? 'planDayUpcoming' : 'planViewingOtherDay')} · {dateLabel}
          </p>
          {onShowToday && (
            <button
              type="button"
              onClick={onShowToday}
              className="pressable flex min-h-11 items-center text-[11px] font-medium"
              style={{ color: 'var(--accent)' }}
            >
              {t(lang, 'planBackToToday')}
            </button>
          )}
        </div>
      )}

      <div
        ref={viewportRef}
        className="plan-deck__viewport"
        onPointerDown={onPointerDown}
        onPointerMove={onPointerMove}
        onPointerUp={endDrag}
        onPointerCancel={endDrag}
        onClickCapture={onClickCapture}
      >
        <div
          key={dayKey}
          className={enterFrom ? `plan-deck__panel plan-deck__panel--from-${enterFrom}` : 'plan-deck__panel'}
          // A day's content can raise a full-screen overlay of its own (the
          // deliverance guide's step-by-step prayer). An element being
          // transformed is the containing block for anything `fixed` inside it,
          // so the entrance is cleared the moment it is over and the panel goes
          // back to being a plain block.
          onAnimationEnd={(e) => { if (e.target === e.currentTarget) setEnterFrom(null); }}
          style={{
            transform: dx ? `translateX(${dx}px)` : undefined,
            transition: dragging ? 'none' : 'transform 0.2s ease',
          }}
        >
          {children}
        </div>
      </div>
    </section>
  );
}
