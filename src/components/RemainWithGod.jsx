import { useEffect, useRef, useState } from 'react';
import { t } from '../i18n';
import { useEscapeKey } from '../hooks/useEscapeKey';
import { useFocusTrap } from '../hooks/useFocusTrap';
import { PrimaryButton, QuietButton, SecondaryButton, SectionLabel, Textarea } from './shared/Primitives';
import RiseMark from './shared/RiseMark';
import ScriptureRefButton from './circles/ScriptureRefButton';

// The quiet spaces of prayer (LISTEN), one screen in three forms:
//
//   remain   "Remain with God": be still before Him and let the Spirit lead.
//   spirit   "Pray in the Spirit": a longer space to pray freely, with no
//            written words — for those who have the gift, praying in tongues.
//   noWords  "When words fail": come before God with nothing to bring but
//            yourself; the Spirit intercedes (Romans 8:26).
//
// They resist product noise: the still screen carries no generated text, no
// counter, no recommendations and no statistics — one line, the rise mark and
// a way out. The stillness itself is never recorded. Only afterwards, and only
// when a session prayer is there to hold it (`noteTarget`), may the person keep
// a few words of what stayed with them, saved through `onSaveNote` as a note on
// that prayer. The app never says what God said; the person writes, it keeps.
//
// `embedded` renders inside an existing overlay (the prayer session); otherwise
// it is its own full-screen dialog.
const VARIANTS = {
  remain: {
    titleKey: 'remainWithGod',
    subKey: 'remainSub',
    stillKey: 'remainStill',
    durations: [{ seconds: 30, labelKey: 'remain30s' }, { seconds: 60, labelKey: 'remain1m' }],
    refs: [],
  },
  spirit: {
    titleKey: 'spiritPrayTitle',
    subKey: 'spiritPraySub',
    stillKey: 'spiritPrayStill',
    durations: [{ seconds: 180, labelKey: 'remain3m' }, { seconds: 300, labelKey: 'remain5m' }, { seconds: 600, labelKey: 'remain10m' }],
    refs: ['Ephesians 6:18', '1 Corinthians 14:15'],
  },
  noWords: {
    titleKey: 'noWordsTitle',
    subKey: 'noWordsSub',
    stillKey: 'noWordsStill',
    durations: [{ seconds: 60, labelKey: 'remain1m' }, { seconds: 180, labelKey: 'remain3m' }],
    refs: ['Romans 8:26-27'],
  },
};

export default function RemainWithGod({ lang, onFinish, embedded = false, variant = 'remain', noteTarget = null, onSaveNote }) {
  const config = VARIANTS[variant] || VARIANTS.remain;
  const [phase, setPhase] = useState('choose');
  const [seconds, setSeconds] = useState(0);
  const [note, setNote] = useState('');
  const [noteState, setNoteState] = useState('idle'); // idle | saving | saved | failed
  const trapRef = useFocusTrap(!embedded);
  const bodyRef = useRef(null);
  // Inside the session the host overlay already closes on Escape.
  useEscapeKey(embedded ? undefined : onFinish);

  // Each phase replaces the button that was just pressed, so hand focus to the
  // new screen's first control instead of letting it fall to the page.
  useEffect(() => {
    bodyRef.current?.querySelector('button, textarea')?.focus({ preventScroll: true });
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

  const canKeepNote = !!noteTarget && typeof onSaveNote === 'function';

  const keepNote = async () => {
    const text = note.trim();
    if (!text || noteState === 'saving') return;
    setNoteState('saving');
    try {
      await onSaveNote(text);
      setNoteState('saved');
    } catch {
      setNoteState('failed');
    }
  };

  const body = (
    <div ref={bodyRef} className="prayer-session__done" data-remain-phase={phase} data-remain-variant={variant}>
      {phase === 'choose' && (
        <>
          <RiseMark motion="still" size={40} className="mb-6" />
          <h2 className="prayer-session__done-title">{t(lang, config.titleKey)}</h2>
          <p className="prayer-session__prompt mx-auto mt-4 max-w-sm">{t(lang, config.subKey)}</p>
          {config.refs.length > 0 && (
            <div className="mt-3 flex flex-wrap justify-center gap-x-4">
              {config.refs.map((ref) => <ScriptureRefButton key={ref} reference={ref} lang={lang} />)}
            </div>
          )}
          <div className="prayer-session__done-actions">
            {config.durations.map(({ seconds: s, labelKey }) => (
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
          <p className="prayer-session__done-title">{t(lang, config.stillKey)}</p>
          <QuietButton onClick={canKeepNote ? () => setPhase('ended') : onFinish} className="mt-16">{t(lang, 'remainFinish')}</QuietButton>
        </>
      )}

      {phase === 'ended' && (
        <>
          <SectionLabel sacred className="mb-3">{t(lang, 'amenBtn')}</SectionLabel>
          <p role="status" className="prayer-session__done-title">{t(lang, 'remainEnded')}</p>
          {canKeepNote && (
            <div className="mx-auto mt-6 w-full max-w-sm text-start">
              <label htmlFor="remain-note" className="q-meta mb-1.5 block">{t(lang, 'remainNoteLabel')}</label>
              <Textarea
                id="remain-note"
                value={note}
                onChange={(e) => { setNote(e.target.value); if (noteState !== 'saving') setNoteState('idle'); }}
                placeholder={t(lang, 'remainNotePlaceholder')}
                rows={3}
                disabled={noteState === 'saved'}
                className="w-full"
              />
              <p className="q-meta mt-1.5" role={noteState === 'idle' ? undefined : 'status'}>
                {t(lang, noteState === 'saved' ? 'remainNoteSaved' : noteState === 'failed' ? 'noteSaveFailed' : 'remainNoteHint')}
              </p>
            </div>
          )}
          <div className="prayer-session__done-actions">
            {canKeepNote && noteState !== 'saved' && (
              <SecondaryButton onClick={keepNote} disabled={!note.trim() || noteState === 'saving'}>
                {t(lang, 'remainNoteSave')}
              </SecondaryButton>
            )}
            <PrimaryButton onClick={onFinish}>{t(lang, 'remainFinish')}</PrimaryButton>
          </div>
        </>
      )}
    </div>
  );

  if (embedded) return body;

  return (
    <div className="prayer-session q-immersive">
      <div ref={trapRef} role="dialog" aria-modal="true" aria-label={t(lang, config.titleKey)} tabIndex={-1} className="flex h-full flex-col focus:outline-none">
        {body}
      </div>
    </div>
  );
}
