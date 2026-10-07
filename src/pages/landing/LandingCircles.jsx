import { useEffect, useRef, useState } from 'react';
import { CIRCLES, circlesWithin } from '../../lib/circles';
import { circleReach } from '../../components/shared/circleGeometry';
import CircleGlyph from '../../components/shared/CircleGlyph';
import CircleTeaching from '../../components/circles/CircleTeaching';
import { useCircleTeaching } from '../../hooks/useCircleTeaching';
import { EVENTS, track } from '../../lib/analytics';
import LandingScriptureRef from './LandingScriptureRef';

// The seven Intercession Circles on the public page: the ring model and the
// list are ONE control. Hovering or focusing a circle previews its reach on the
// rings; choosing one opens its teaching beneath, without leaving the page. The
// ordered list is the accessible control; the rings are a drawing of the same
// state, so a screen reader hears each circle once.
//
// Breadth, never rank: choosing "Nations" lights the circles it reaches across
// (My heart … Nations). Nothing is counted, completed or compared.

const PANEL_ID = 'landing-circle-panel';
const SWAP_MS = 140; // fade the old circle's words out before the new ones rise in
const LAST = CIRCLES[CIRCLES.length - 1];
const SCALE = 140 / circleReach(LAST);
const STEP = (circleReach(CIRCLES[1]) - circleReach(CIRCLES[0])) * SCALE;

const reducedMotion = () => typeof window !== 'undefined'
  && !!window.matchMedia?.('(prefers-reduced-motion: reduce)').matches;

// Draw the rings outward once, the first time the section is seen. Without
// IntersectionObserver, or with reduced motion, they are simply there.
function useRingReveal(ref) {
  const [stage, setStage] = useState(() => (
    typeof window !== 'undefined' && 'IntersectionObserver' in window && !reducedMotion() ? 'armed' : 'static'
  ));
  useEffect(() => {
    if (stage !== 'armed' || !ref.current) return undefined;
    const observer = new IntersectionObserver((entries) => {
      if (!entries.some((entry) => entry.isIntersecting)) return;
      setStage('revealed');
      observer.disconnect();
    }, { threshold: 0.35 });
    observer.observe(ref.current);
    return () => observer.disconnect();
  }, [stage, ref]);
  return stage;
}

function ringState(circle, active, within) {
  if (!active) return 'rest';
  if (circle === active) return 'selected';
  return within.has(circle) ? 'within' : 'outside';
}

// The ring drawing. Each ring has a generous invisible hit band (one ring step
// wide) so nobody has to hit a hairline; the innermost is a disc.
function Rings({ active, stage, onPreview, onSelect }) {
  const within = new Set(circlesWithin(active));
  const outerFirst = [...CIRCLES].reverse();
  const hit = (circle) => ({
    onPointerEnter: () => onPreview(circle),
    onPointerLeave: () => onPreview(null),
    onClick: () => onSelect(circle),
  });
  return (
    <svg
      viewBox="0 0 320 320"
      className={`landing__rings-art landing__rings-art--${stage}`}
      aria-hidden="true"
      focusable="false"
    >
      {outerFirst.map((circle) => {
        const index = CIRCLES.indexOf(circle);
        return (
          <circle
            key={circle}
            cx="160"
            cy="160"
            r={circleReach(circle) * SCALE}
            pathLength="1"
            style={{ '--ring-index': index }}
            className={`landing__ring landing__ring--${ringState(circle, active, within)}${index === 0 ? ' landing__ring--heart' : ''}`}
          />
        );
      })}
      <circle cx="160" cy="160" r="5" className="landing__ring-point" />
      <path d="M157 150C163 145 164 139 160 133C157 128 157 123 161 118" className="landing__ring-rise" />
      {outerFirst.slice(0, -1).map((circle) => (
        <circle key={circle} cx="160" cy="160" r={circleReach(circle) * SCALE} strokeWidth={STEP} className="landing__ring-hit" {...hit(circle)} />
      ))}
      <circle cx="160" cy="160" r={circleReach(CIRCLES[0]) * SCALE + STEP / 2} className="landing__ring-hit landing__ring-hit--heart" {...hit(CIRCLES[0])} />
    </svg>
  );
}

export default function LandingCircles({ lang, copy, onBeginPrayer }) {
  const teaching = useCircleTeaching(lang);
  const sectionRef = useRef(null);
  const panelRef = useRef(null);
  const swapTimer = useRef(null);
  const stage = useRingReveal(sectionRef);
  const [selected, setSelected] = useState(null);
  const [preview, setPreview] = useState(null);
  // The circle whose words are on screen, and whether they are fading out to
  // make way for the next one.
  const [shown, setShown] = useState(null);
  const [leaving, setLeaving] = useState(false);
  const active = preview ?? selected;

  useEffect(() => () => clearTimeout(swapTimer.current), []);

  // On a narrow screen the panel opens below the list; bring its first lines
  // into view rather than leave a tap without visible effect.
  const revealPanel = () => requestAnimationFrame(() => {
    const panel = panelRef.current;
    if (!panel || panel.getBoundingClientRect().top < window.innerHeight - 96) return;
    panel.scrollIntoView({ behavior: reducedMotion() ? 'auto' : 'smooth', block: 'start' });
  });

  const select = (circle) => {
    if (circle === selected) return;
    setSelected(circle);
    track(EVENTS.CIRCLE_TEACHING_OPENED, { source: 'landing' });
    clearTimeout(swapTimer.current);
    if (!shown || reducedMotion()) {
      setShown(circle);
      setLeaving(false);
      revealPanel();
      return;
    }
    setLeaving(true);
    swapTimer.current = setTimeout(() => {
      setShown(circle);
      setLeaving(false);
      revealPanel();
    }, SWAP_MS);
  };

  const pray = (circle) => ({ prompt } = {}) => {
    track(EVENTS.CIRCLE_PRAYER_STARTED, { source: 'landing' });
    onBeginPrayer({ circle, prompt });
  };

  const shownIndex = CIRCLES.indexOf(shown);

  return (
    <section ref={sectionRef} className="landing__band landing__circles" aria-labelledby="landing-circles-title">
      <div className="landing__rings">
        <Rings active={active} stage={stage} onPreview={setPreview} onSelect={select} />
      </div>
      <div>
        <h2 id="landing-circles-title" className="landing__heading">{copy.title}</h2>
        <p className="landing__text">{copy.subtitle}</p>
        {teaching && <p className="landing__circles-hint">{teaching.ui.choose}</p>}
        <ol className="landing__circle-list">
          {CIRCLES.map((circle, i) => {
            const item = copy.items[i];
            const isSelected = selected === circle;
            return (
              <li key={circle}>
                <button
                  type="button"
                  aria-expanded={isSelected}
                  aria-controls={shown ? PANEL_ID : undefined}
                  onClick={() => select(circle)}
                  onPointerEnter={() => setPreview(circle)}
                  onPointerLeave={() => setPreview(null)}
                  onFocus={() => setPreview(circle)}
                  onBlur={() => setPreview(null)}
                  className={`landing__circle-option pressable${active === circle ? ' is-active' : ''}`}
                >
                  <CircleGlyph circle={circle} size={24} selected={isSelected} />
                  <span className="min-w-0">
                    <span className="landing__circle-name">{item.name}</span>
                    <span className="landing__circle-desc">{item.desc}</span>
                  </span>
                </button>
              </li>
            );
          })}
        </ol>
        <p className="landing__start">{copy.start}</p>
      </div>

      {shown && teaching && (
        <div ref={panelRef} className={`landing__circle-panel${leaving ? ' is-leaving' : ''}`}>
          <CircleTeaching
            key={shown}
            id={PANEL_ID}
            teaching={teaching.circle(shown)}
            ui={teaching.ui}
            lang={teaching.lang}
            name={copy.items[shownIndex]?.name}
            ScriptureRef={LandingScriptureRef}
            onPray={pray(shown)}
            className="landing__circle-teaching"
          />
        </div>
      )}
    </section>
  );
}
