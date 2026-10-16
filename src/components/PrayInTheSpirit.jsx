import { useEffect, useId, useRef, useState } from 'react';
import { X } from 'lucide-react';
import { t } from '../i18n';
import { useEscapeKey } from '../hooks/useEscapeKey';
import { useFocusTrap } from '../hooks/useFocusTrap';
import { useScreenWakeLock } from '../hooks/useScreenWakeLock';
import {
  CUSTOM, CUSTOM_MAX, CUSTOM_MIN, OPEN_ENDED, PRESET_MINUTES,
  durationSeconds, readDurationChoice, rememberDurationChoice,
} from '../lib/spiritDuration';
import { Input, PrimaryButton, QuietButton, SecondaryButton, SectionLabel, Textarea } from './shared/Primitives';
import RiseMark from './shared/RiseMark';
import ScriptureRefButton from './circles/ScriptureRefButton';
import PrayerMusicControl from './PrayerMusicControl';
import SpiritGuide from './SpiritGuide';

// The quiet space of prayer (LISTEN): "Pray in the Spirit". One place to stay
// before God — in silence, in one's own words, or, for those who have the
// gift, in tongues — led by the Holy Spirit (Ephesians 6:18; Romans 8:26).
//
// It resists product noise: the still screen carries no generated text, no
// counter and no statistics — one line, the rise mark and a way out. The
// person chooses how long (a preset, their own minutes, or no timer) and may
// play the same first-party music as a time of prayer. A short guide answers
// what praying in the Spirit means. The stillness itself is never recorded.
// Only afterwards, and only when a session prayer is there to hold it
// (`noteTarget`), may the person keep a few words of what stayed with them,
// saved through `onSaveNote` as a note on that prayer. The app never says what
// God said; the person writes, it keeps.
//
// `embedded` renders inside an existing overlay (the prayer session); otherwise
// it is its own full-screen dialog.
const REFS = ['Ephesians 6:18', 'Romans 8:26-27'];

function DurationPicker({ lang, value, onChange }) {
  const labelId = useId();
  const customId = useId();
  const choose = (choice) => onChange({ ...value, choice });
  const chip = (choice, label) => (
    <button
      key={choice}
      type="button"
      aria-pressed={value.choice === choice}
      onClick={() => choose(choice)}
      className="q-chip pressable"
    >
      {label}
    </button>
  );
  return (
    <div className="quiet-space__duration">
      <p id={labelId} className="q-meta">{t(lang, 'spiritDurationLabel')}</p>
      <div className="q-chips quiet-space__chips" role="group" aria-labelledby={labelId}>
        {PRESET_MINUTES.map((minutes) => chip(minutes, t(lang, 'minutesShort', { n: minutes })))}
        {chip(CUSTOM, t(lang, 'spiritDurationOther'))}
        {chip(OPEN_ENDED, t(lang, 'spiritDurationOpen'))}
      </div>
      {value.choice === CUSTOM && (
        <div className="quiet-space__custom">
          <label htmlFor={customId} className="q-meta">{t(lang, 'spiritCustomLabel')}</label>
          <Input
            id={customId}
            type="number"
            inputMode="numeric"
            min={CUSTOM_MIN}
            max={CUSTOM_MAX}
            step={1}
            value={value.custom}
            onChange={(event) => onChange({ ...value, custom: event.target.value })}
            className="quiet-space__minutes"
          />
        </div>
      )}
    </div>
  );
}

export default function PrayInTheSpirit({ lang, onFinish, embedded = false, noteTarget = null, onSaveNote }) {
  const [phase, setPhase] = useState('choose'); // choose | guide | still | ended
  const [duration, setDuration] = useState(readDurationChoice);
  const [note, setNote] = useState('');
  const [noteState, setNoteState] = useState('idle'); // idle | saving | saved | failed
  const trapRef = useFocusTrap(!embedded);
  const bodyRef = useRef(null);
  const seconds = durationSeconds(duration);
  // Inside the session the host overlay already closes on Escape.
  useEscapeKey(embedded ? undefined : onFinish);
  useScreenWakeLock(phase === 'still');

  // Each phase replaces the screen that was just used, so hand focus to the
  // new screen's first control and bring its top into view.
  useEffect(() => {
    bodyRef.current?.scrollTo?.({ top: 0 });
    bodyRef.current?.querySelector('button, textarea')?.focus({ preventScroll: true });
  }, [phase]);

  useEffect(() => {
    if (phase !== 'still' || typeof seconds !== 'number') return undefined;
    const timer = setTimeout(() => setPhase('ended'), seconds * 1000);
    return () => clearTimeout(timer);
  }, [phase, seconds]);

  const begin = () => {
    if (seconds === undefined) return;
    rememberDurationChoice(duration);
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

  const header = (
    <div className="prayer-session__header">
      <div className="prayer-session__bar">
        <button type="button" onClick={onFinish} aria-label={t(lang, 'close')} className="icon-button pressable">
          <X size={20} aria-hidden="true" />
        </button>
        <div className="prayer-session__tools">
          <PrayerMusicControl lang={lang} active={phase !== 'ended'} />
        </div>
      </div>
    </div>
  );

  const body = (
    <div ref={bodyRef} className="prayer-session__done quiet-space" data-quiet-phase={phase}>
      {phase === 'choose' && (
        <>
          <RiseMark motion="still" size={40} className="mb-6" />
          <h2 className="prayer-session__done-title">{t(lang, 'spiritPrayTitle')}</h2>
          <p className="prayer-session__prompt quiet-space__sub">{t(lang, 'spiritPraySub')}</p>
          <QuietButton onClick={() => setPhase('guide')} className="quiet-space__guide-link">
            {t(lang, 'spiritGuideLink')}
          </QuietButton>
          <div className="quiet-space__refs">
            {REFS.map((ref) => <ScriptureRefButton key={ref} reference={ref} lang={lang} />)}
          </div>
          <DurationPicker lang={lang} value={duration} onChange={setDuration} />
          <div className="prayer-session__done-actions">
            <PrimaryButton onClick={begin} disabled={seconds === undefined}>{t(lang, 'spiritBegin')}</PrimaryButton>
          </div>
        </>
      )}

      {phase === 'guide' && (
        <SpiritGuide lang={lang} onBack={() => setPhase('choose')} onLeave={onFinish} />
      )}

      {phase === 'still' && (
        <>
          <RiseMark motion="breathe" size={56} className="mb-8" />
          <p className="prayer-session__done-title">{t(lang, 'spiritPrayStill')}</p>
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

  if (embedded) return <>{header}{body}</>;

  return (
    <div className="prayer-session q-immersive">
      <div ref={trapRef} role="dialog" aria-modal="true" aria-label={t(lang, 'spiritPrayTitle')} tabIndex={-1} className="flex h-full min-h-0 flex-col focus:outline-none">
        {header}
        {body}
      </div>
    </div>
  );
}
