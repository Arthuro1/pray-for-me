import { useEffect, useRef, useState } from 'react';
import { t } from '../i18n';
import { useEscapeKey } from '../hooks/useEscapeKey';
import { useFocusTrap } from '../hooks/useFocusTrap';
import { PrimaryButton, QuietButton, SecondaryButton, SectionLabel } from './shared/Primitives';
import RiseMark from './shared/RiseMark';

const DURATIONS = [
  { seconds: 30, labelKey: 'remain30s' },
  { seconds: 60, labelKey: 'remain1m' },
];

// "Remain with God" (LISTEN): an optional, quiet ending to prayer. It is meant
// to resist product noise, so the still screen carries no generated text, no
// counter, no recommendations and no statistics — one line, the rise mark, and
// a way out. Nothing about it is recorded.
//
// `embedded` renders inside an existing overlay (the prayer session); otherwise
// it is its own full-screen dialog.
export default function RemainWithGod({ lang, onFinish, embedded = false }) {
  const [phase, setPhase] = useState('choose');
  const [seconds, setSeconds] = useState(0);
  const trapRef = useFocusTrap(!embedded);
  const bodyRef = useRef(null);
  // Inside the session the host overlay already closes on Escape.
  useEscapeKey(embedded ? undefined : onFinish);

  // Each phase replaces the button that was just pressed, so hand focus to the
  // new screen's first control instead of letting it fall to the page.
  useEffect(() => {
    bodyRef.current?.querySelector('button')?.focus({ preventScroll: true });
  }, [phase]);

  useEffect(() => {
    if (phase !== 'still') return undefined;
    const timer = setTimeout(() => setPhase('ended'), seconds * 1000);
    return () => clearTimeout(timer);
  }, [phase, seconds]);

  const begin = (duration) => {
    setSeconds(duration);
    setPhase('still');
  };

  const body = (
    <div ref={bodyRef} className="prayer-session__done" data-remain-phase={phase}>
      {phase === 'choose' && (
        <>
          <RiseMark motion="still" size={40} className="mb-6" />
          <h2 className="prayer-session__done-title">{t(lang, 'remainWithGod')}</h2>
          <p className="prayer-session__prompt mx-auto mt-4 max-w-sm">{t(lang, 'remainSub')}</p>
          <div className="prayer-session__done-actions">
            {DURATIONS.map(({ seconds: s, labelKey }) => (
              <SecondaryButton key={s} onClick={() => begin(s)}>
                {t(lang, labelKey)}
              </SecondaryButton>
            ))}
            <QuietButton onClick={onFinish}>{t(lang, 'remainFinish')}</QuietButton>
          </div>
        </>
      )}

      {phase === 'still' && (
        <>
          <RiseMark motion="breathe" size={56} className="mb-8" />
          <p className="prayer-session__done-title">{t(lang, 'remainStill')}</p>
          <QuietButton onClick={onFinish} className="mt-16">{t(lang, 'remainFinish')}</QuietButton>
        </>
      )}

      {phase === 'ended' && (
        <>
          <SectionLabel sacred className="mb-3">{t(lang, 'amenBtn')}</SectionLabel>
          <p role="status" className="prayer-session__done-title">{t(lang, 'remainEnded')}</p>
          <div className="prayer-session__done-actions">
            <PrimaryButton onClick={onFinish}>{t(lang, 'remainFinish')}</PrimaryButton>
          </div>
        </>
      )}
    </div>
  );

  if (embedded) return body;

  return (
    <div className="prayer-session q-immersive">
      <div ref={trapRef} role="dialog" aria-modal="true" aria-label={t(lang, 'remainWithGod')} tabIndex={-1} className="flex h-full flex-col focus:outline-none">
        {body}
      </div>
    </div>
  );
}
