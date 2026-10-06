import { useEffect, useRef, useState } from 'react';
import { t } from '../i18n';
import { useEscapeKey } from '../hooks/useEscapeKey';
import { useFocusTrap } from '../hooks/useFocusTrap';
import { PrimaryButton, QuietButton, SectionLabel } from './shared/Primitives';
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
    <div ref={bodyRef} className="constellation-session__done flex flex-1 flex-col items-center justify-center px-8 text-center" data-remain-phase={phase}>
      {phase === 'choose' && (
        <>
          <RiseMark animate={false} size={40} className="mb-6" />
          <h2 className="editorial-heading max-w-lg text-3xl leading-tight sm:text-4xl" style={{ color: 'var(--text-1)' }}>
            {t(lang, 'remainWithGod')}
          </h2>
          <p className="mt-4 max-w-sm text-sm leading-relaxed" style={{ color: 'var(--text-2)' }}>{t(lang, 'remainSub')}</p>
          <div className="mt-9 flex w-full max-w-xs flex-col gap-3">
            {DURATIONS.map(({ seconds: s, labelKey }) => (
              <PrimaryButton key={s} onClick={() => begin(s)} className="min-h-[52px] w-full">
                {t(lang, labelKey)}
              </PrimaryButton>
            ))}
            <QuietButton onClick={onFinish} className="w-full">{t(lang, 'remainFinish')}</QuietButton>
          </div>
        </>
      )}

      {phase === 'still' && (
        <>
          <RiseMark size={56} className="rise-wisp--breathe mb-8" />
          <p className="editorial text-3xl" style={{ color: 'var(--text-1)' }}>{t(lang, 'remainStill')}</p>
          <QuietButton onClick={onFinish} className="mt-16">{t(lang, 'remainFinish')}</QuietButton>
        </>
      )}

      {phase === 'ended' && (
        <>
          <SectionLabel className="mb-3">{t(lang, 'amenBtn')}</SectionLabel>
          <p role="status" className="editorial max-w-sm text-2xl leading-snug" style={{ color: 'var(--text-1)' }}>{t(lang, 'remainEnded')}</p>
          <PrimaryButton onClick={onFinish} className="mt-9 min-w-36">{t(lang, 'remainFinish')}</PrimaryButton>
        </>
      )}
    </div>
  );

  if (embedded) return body;

  return (
    <div className="prayer-session constellation-session fixed inset-0 z-[70] flex flex-col" style={{ background: 'var(--background)' }}>
      <div ref={trapRef} role="dialog" aria-modal="true" aria-label={t(lang, 'remainWithGod')} tabIndex={-1} className="flex h-full flex-col focus:outline-none">
        {body}
      </div>
    </div>
  );
}
