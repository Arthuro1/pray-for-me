import { useEffect, useRef, useState } from 'react';
import { CIRCLES } from '../../lib/circles';
import { CIRCLE_ICONS } from '../../components/shared/circleIcons';
import CircleRings from '../../components/circles/CircleRings';
import { reducedMotion, useRingReveal } from '../../hooks/useRingReveal';
import CircleTeaching from '../../components/circles/CircleTeaching';
import { useCircleTeaching } from '../../hooks/useCircleTeaching';
import { EVENTS, track } from '../../lib/analytics';
import ScriptureRefButton from '../../components/circles/ScriptureRefButton';
import { BeatLabel } from './LandingBeat';

// The seven Intercession Circles on the public page: the ring model and the
// list are ONE control. Hovering or focusing a circle previews its reach on the
// rings; choosing one opens its teaching beneath, without leaving the page. The
// ordered list is the accessible control; the rings (CircleRings) are a drawing
// of the same state, so a screen reader hears each circle once. Each circle
// wears its icon tile in its own tone, as on a prayer's row inside the app.

const PANEL_ID = 'landing-circle-panel';
const SWAP_MS = 140; // fade the old circle's words out before the new ones rise in

export default function LandingCircles({ lang, label, copy, onBeginPrayer }) {
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
    <section ref={sectionRef} id="carry" className="landing__circles" aria-labelledby="landing-circles-title">
      <div className="landing__rings">
        <CircleRings active={active} stage={stage} onPreview={setPreview} onSelect={select} />
      </div>
      <div>
        <BeatLabel>{label}</BeatLabel>
        <h2 id="landing-circles-title" className="landing__heading">{copy.title}</h2>
        <p className="landing__text">{copy.subtitle}</p>
        {teaching && <p className="landing__circles-hint">{teaching.ui.choose}</p>}
        <ol className="landing__circle-list">
          {CIRCLES.map((circle, i) => {
            const item = copy.items[i];
            const isSelected = selected === circle;
            const Icon = CIRCLE_ICONS[circle];
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
                  <span className={`icon-tile tone-${circle}`} aria-hidden="true"><Icon size={18} strokeWidth={1.8} /></span>
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
            ScriptureRef={ScriptureRefButton}
            onPray={pray(shown)}
            className="landing__circle-teaching"
          />
        </div>
      )}
    </section>
  );
}
