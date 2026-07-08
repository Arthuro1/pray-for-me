import { useState, useEffect, useRef, useMemo, useCallback } from 'react';
import { useShallow } from 'zustand/react/shallow';
import { X, Play, Pause, SkipForward, RotateCcw, Hand, Music, VolumeX, Headphones } from 'lucide-react';
import { t } from '../i18n';
import usePrayerStore from '../store/prayerStore';
import { useEscapeKey } from '../hooks/useEscapeKey';
import { useFocusTrap } from '../hooks/useFocusTrap';
import { MOVEMENT_META, buildSteps, pauseSeconds } from '../lib/prayerFlow';
import { movementPassage } from '../lib/prayerMovements';
import {
  startBackgroundInstrumental,
  stopBackgroundAudio,
  fadeOutBackgroundAudio,
  duckBackgroundAudio,
  restoreBackgroundAudio,
  pauseBackgroundAudio,
  resumeBackgroundAudio,
} from '../lib/audio/backgroundAudio';
import {
  speak,
  cancelSpeech,
  isSpeechSupported,
  pauseSpeech,
  resumeSpeech,
} from '../lib/audio/prayerGuideAudio';
import { track as trackEvent, EVENTS } from '../lib/analytics';
import PrayerAudioSettings from './PrayerAudioSettings';
import Encouragement from './Encouragement';

// Hands-free Prayer Mode: a calm, voice-guided session for communion with God —
// eyes closed, or hands on the wheel. A gentle instrumental (optional, and off
// by default) sits low underneath; the guide speaks only generic prompts and
// Scripture, ducking the music while it speaks and letting it rise again during
// silent prayer. Nothing plays until the user taps Start.
//
// The flow is the "guided" movement (adoration → the day's prayers → thanks-
// giving) so there is Scripture to open and close in, with the user's own
// prayers at the heart. Prayer titles are shown on screen but never spoken.
const HANDS_FREE_MODE = 'guided';

export default function HandsFreePrayerMode({ prayers, categories, lang, tr, onClose, onComplete }) {
  const { settings, updateSettings } = usePrayerStore(
    useShallow((s) => ({ settings: s.settings, updateSettings: s.updateSettings }))
  );
  const trapRef = useFocusTrap(true);

  const trackId = settings.audioTrackId ?? 'silence';
  const volume = settings.audioVolume ?? 0.18;
  const voiceEnabled = settings.audioVoiceEnabled ?? true;
  const pauseLength = settings.audioPauseLength ?? 'medium';
  const secs = pauseSeconds(pauseLength);
  const speechSupported = isSpeechSupported();

  const steps = useMemo(() => buildSteps(HANDS_FREE_MODE, prayers), [prayers]);
  const total = steps.length;

  const [phase, setPhase] = useState('setup'); // 'setup' | 'running' | 'done'
  const [stepIndex, setStepIndex] = useState(0);
  const [subPhase, setSubPhase] = useState('speaking'); // 'speaking' | 'silence'
  const [paused, setPaused] = useState(false);
  const [secondsLeft, setSecondsLeft] = useState(secs);
  const [speakToken, setSpeakToken] = useState(0);
  const [musicMuted, setMusicMuted] = useState(false);

  // Latest-value refs so async work / effects don't restart on unrelated renders.
  const voiceRef = useRef(voiceEnabled);
  voiceRef.current = voiceEnabled;
  const musicPlayingRef = useRef(false); // whether the engine currently holds audio
  const completedRef = useRef(false);

  // ── Cleanup: never let audio or speech outlive the overlay ──
  useEffect(() => () => { cancelSpeech(); stopBackgroundAudio(); }, []);

  const handleClose = useCallback(() => {
    cancelSpeech();
    stopBackgroundAudio();
    onClose?.();
  }, [onClose]);

  useEscapeKey(handleClose);

  // ── Spoken prompt for a step (generic prompts + Scripture only) ──
  const spokenPromptFor = useCallback((index) => {
    const step = steps[index];
    if (!step) return '';
    const parts = [];
    if (index === 0) parts.push(t(lang, 'hfOpening'));
    if (step.type === 'movement') {
      parts.push(t(lang, MOVEMENT_META[step.stage].promptKey));
      const ref = movementPassage(step.stage, lang);
      if (ref) parts.push(ref);
    } else {
      parts.push(t(lang, 'hfRequestPrompt'));
    }
    return parts.join(' ');
  }, [steps, lang]);

  const finishSession = useCallback(() => {
    if (completedRef.current) return;
    completedRef.current = true;
    cancelSpeech();
    setPhase('done');
    // Speak the closing blessing (if voice on), then fade the music out under it.
    if (voiceRef.current) {
      speak(t(lang, 'hfClosing'), { lang }).finally(() => { fadeOutBackgroundAudio(); });
    } else {
      fadeOutBackgroundAudio();
    }
    trackEvent(EVENTS.SESSION_COMPLETED);
    onComplete?.();
  }, [lang, onComplete]);

  const goNext = useCallback(() => {
    cancelSpeech();
    if (stepIndex + 1 >= total) { finishSession(); return; }
    setStepIndex(stepIndex + 1);
    setSubPhase('speaking');
  }, [stepIndex, total, finishSession]);

  // ── Speaking: duck the music, speak the prompt, restore, open the silence ──
  useEffect(() => {
    if (phase !== 'running' || subPhase !== 'speaking') return undefined;
    let cancelled = false;
    duckBackgroundAudio();
    (async () => {
      const text = spokenPromptFor(stepIndex);
      if (voiceRef.current && text) await speak(text, { lang });
      else await new Promise((r) => setTimeout(r, 400)); // a small beat, even in silence
      if (cancelled) return;
      restoreBackgroundAudio();
      setSecondsLeft(secs);
      setSubPhase('silence');
    })();
    return () => { cancelled = true; cancelSpeech(); };
  }, [phase, subPhase, stepIndex, speakToken, spokenPromptFor, lang, secs]);

  // ── Silence: count down gently, then continue on to the next step ──
  useEffect(() => {
    if (phase !== 'running' || subPhase !== 'silence' || paused) return undefined;
    if (secondsLeft <= 0) { goNext(); return undefined; }
    const id = setTimeout(() => setSecondsLeft((s) => s - 1), 1000);
    return () => clearTimeout(id);
  }, [phase, subPhase, paused, secondsLeft, goNext]);

  // ── Controls ──
  const handleStart = useCallback(async () => {
    trackEvent(EVENTS.HANDS_FREE_SESSION_STARTED);
    // Start the instrumental first (post-gesture) so the opening prompt already
    // has something to duck under; silence just skips this.
    if (trackId !== 'silence' && !musicMuted) {
      const res = await startBackgroundInstrumental({ trackId, volume, loop: true });
      musicPlayingRef.current = !!res.started;
      if (res.started) trackEvent(EVENTS.BACKGROUND_AUDIO_ENABLED, { method: res.trackId });
    }
    setStepIndex(0);
    setSubPhase('speaking');
    setPaused(false);
    setPhase('running');
  }, [trackId, volume, musicMuted]);

  const handlePause = useCallback(() => {
    setPaused(true);
    pauseSpeech();
    pauseBackgroundAudio();
  }, []);

  const handleResume = useCallback(() => {
    setPaused(false);
    resumeSpeech();
    if (musicPlayingRef.current) resumeBackgroundAudio();
  }, []);

  const handleRepeat = useCallback(() => {
    setPaused(false);
    setSubPhase('speaking');
    setSpeakToken((x) => x + 1);
  }, []);

  const handleStay = useCallback(() => {
    setPaused(false);
    setSubPhase('silence');
    setSecondsLeft(secs);
  }, [secs]);

  const handleNext = useCallback(() => { setPaused(false); goNext(); }, [goNext]);

  const toggleMusic = useCallback(async () => {
    if (musicPlayingRef.current) {
      await stopBackgroundAudio();
      musicPlayingRef.current = false;
      setMusicMuted(true);
    } else if (trackId !== 'silence') {
      const res = await startBackgroundInstrumental({ trackId, volume, loop: true });
      musicPlayingRef.current = !!res.started;
      setMusicMuted(false);
      if (res.started && subPhase === 'speaking') duckBackgroundAudio();
    }
  }, [trackId, volume, subPhase]);

  // ── Media Session (lock-screen / headset controls) where supported ──
  useEffect(() => {
    if (phase !== 'running' || typeof navigator === 'undefined' || !('mediaSession' in navigator)) return undefined;
    const ms = navigator.mediaSession;
    try {
      if (typeof window.MediaMetadata === 'function') {
        ms.metadata = new window.MediaMetadata({ title: t(lang, 'handsFreePrayer'), artist: 'Pray4Me' });
      }
    } catch { /* ignore */ }
    const handlers = [
      ['play', handleResume],
      ['pause', handlePause],
      ['nexttrack', handleNext],
      ['previoustrack', handleRepeat],
    ];
    handlers.forEach(([action, cb]) => { try { ms.setActionHandler(action, cb); } catch { /* unsupported */ } });
    return () => { handlers.forEach(([action]) => { try { ms.setActionHandler(action, null); } catch { /* ignore */ } }); };
  }, [phase, lang, handleResume, handlePause, handleNext, handleRepeat]);

  // ── Rendering ──
  const overlay = (children) => (
    <div className="fixed inset-0 z-[70] flex flex-col" style={{ background: 'var(--bg)' }}>
      <div ref={trapRef} role="dialog" aria-modal="true" aria-label={t(lang, 'handsFreePrayer')} tabIndex={-1} className="flex flex-col h-full focus:outline-none">
        {children}
      </div>
    </div>
  );

  const closeButton = (onClick, label) => (
    <button onClick={onClick} aria-label={label} className="w-9 h-9 flex items-center justify-center rounded-full shrink-0" style={{ background: 'var(--surface)', border: '0.5px solid var(--border)', color: 'var(--text-2)' }}>
      <X size={18} />
    </button>
  );

  // Setup — choose the atmosphere, read the safety note, then Start.
  if (phase === 'setup') {
    return overlay(
      <>
        <div className="shrink-0 px-5 pt-4 flex items-center justify-between">
          <span className="text-sm font-semibold flex items-center gap-2" style={{ color: 'var(--text-1)' }}>
            <Headphones size={16} style={{ color: 'var(--accent)' }} /> {t(lang, 'handsFreePrayer')}
          </span>
          {closeButton(handleClose, t(lang, 'close'))}
        </div>
        <div className="flex-1 overflow-y-auto px-6 py-6 max-w-xl mx-auto w-full">
          <p className="text-sm leading-relaxed mb-5" style={{ color: 'var(--text-2)' }}>{t(lang, 'handsFreeIntro')}</p>

          {/* Driving safety — shown every time, before anything can start. */}
          <div className="rounded-2xl px-4 py-3 mb-6 flex items-start gap-2.5" style={{ background: 'var(--accent-soft)', border: '0.5px solid var(--accent-border)' }}>
            <span className="text-base leading-none mt-0.5" aria-hidden="true">🚗</span>
            <p className="text-xs leading-relaxed" style={{ color: 'var(--text-2)' }}>{t(lang, 'handsFreeSafety')}</p>
          </div>

          <PrayerAudioSettings
            lang={lang}
            trackId={trackId}
            volume={volume}
            voiceEnabled={voiceEnabled}
            pauseLength={pauseLength}
            speechSupported={speechSupported}
            onChangeTrack={(id) => updateSettings({ audioTrackId: id })}
            onChangeVolume={(v) => updateSettings({ audioVolume: v })}
            onToggleVoice={(on) => updateSettings({ audioVoiceEnabled: on })}
            onChangePause={(k) => updateSettings({ audioPauseLength: k })}
          />
        </div>
        <div className="shrink-0 px-6 py-4 max-w-xl mx-auto w-full" style={{ borderTop: '0.5px solid var(--border)' }}>
          <button
            onClick={handleStart}
            className="w-full flex items-center justify-center gap-2 py-4 rounded-2xl text-base font-semibold text-white"
            style={{ background: 'var(--accent)' }}
          >
            <Play size={18} /> {t(lang, 'handsFreeStart')}
          </button>
        </div>
      </>
    );
  }

  if (phase === 'done') {
    return overlay(
      <div className="flex-1 flex flex-col items-center justify-center text-center px-8 gap-3">
        <div className="text-6xl mb-1">🙏</div>
        <h2 className="text-xl font-semibold" style={{ color: 'var(--text-1)' }}>{t(lang, 'sessionDoneTitle')}</h2>
        <p className="text-sm" style={{ color: 'var(--text-3)' }}>{t(lang, 'sessionDoneSub', { n: prayers.length })}</p>
        <Encouragement lang={lang} className="max-w-xs" />
        <button
          onClick={handleClose}
          className="mt-4 px-6 py-3 rounded-xl text-sm font-medium text-white"
          style={{ background: 'var(--accent)' }}
        >
          {t(lang, 'close')}
        </button>
      </div>
    );
  }

  // Running — the guided session.
  const step = steps[stepIndex];
  const speaking = subPhase === 'speaking';

  return overlay(
    <>
      <div className="shrink-0 px-5 pt-4 pb-3 flex items-center justify-between">
        <span className="text-xs font-semibold uppercase tracking-widest" style={{ color: 'var(--text-3)' }}>
          {stepIndex + 1} / {total}
        </span>
        {closeButton(finishSession, t(lang, 'hfEnd'))}
      </div>

      <div className="flex-1 overflow-y-auto px-6 py-4 max-w-xl mx-auto w-full">
        <StepContent step={step} lang={lang} tr={tr} categories={categories} />
      </div>

      {/* Gentle status: guiding while speaking, or a soft prayer countdown. */}
      <div className="shrink-0 text-center px-6 pb-2">
        {speaking ? (
          <p className="text-xs font-medium" style={{ color: 'var(--text-3)' }}>{t(lang, 'hfGuiding')}</p>
        ) : (
          <div>
            <p className="text-sm font-medium mb-0.5" style={{ color: 'var(--accent)' }}>
              {paused ? t(lang, 'hfPaused') : `${t(lang, 'hfPraying')} · ${secondsLeft}s`}
            </p>
            <p className="text-xs" style={{ color: 'var(--text-3)' }}>{t(lang, 'hfStayHint')}</p>
          </div>
        )}
      </div>

      {/* Large, driving-safe controls */}
      <div className="shrink-0 px-6 py-4 max-w-xl mx-auto w-full space-y-3" style={{ borderTop: '0.5px solid var(--border)' }}>
        <button
          onClick={paused ? handleResume : handlePause}
          className="w-full flex items-center justify-center gap-2 py-4 rounded-2xl text-base font-semibold text-white"
          style={{ background: 'var(--accent)' }}
        >
          {paused ? <><Play size={18} /> {t(lang, 'hfResume')}</> : <><Pause size={18} /> {t(lang, 'hfPause')}</>}
        </button>

        <div className="grid grid-cols-3 gap-2.5">
          <CtrlButton icon={RotateCcw} label={t(lang, 'hfRepeat')} onClick={handleRepeat} />
          <CtrlButton icon={Hand} label={t(lang, 'hfStayHere')} onClick={handleStay} />
          <CtrlButton icon={SkipForward} label={t(lang, 'hfNext')} onClick={handleNext} />
        </div>

        <div className={`grid ${trackId !== 'silence' ? 'grid-cols-2' : 'grid-cols-1'} gap-2.5`}>
          {trackId !== 'silence' && (
            <CtrlButton
              icon={musicMuted ? VolumeX : Music}
              label={musicMuted ? t(lang, 'hfMusicOn') : t(lang, 'hfMusicOff')}
              onClick={toggleMusic}
            />
          )}
          <CtrlButton icon={X} label={t(lang, 'hfEnd')} onClick={finishSession} danger />
        </div>
      </div>
    </>
  );
}

// A large secondary control button.
function CtrlButton({ icon: Icon, label, onClick, danger }) {
  return (
    <button
      onClick={onClick}
      className="flex flex-col items-center justify-center gap-1 py-3 rounded-2xl text-xs font-medium"
      style={{ background: 'var(--surface)', border: '0.5px solid var(--border)', color: danger ? 'var(--danger, #c0392b)' : 'var(--text-2)' }}
    >
      <Icon size={18} />
      {label}
    </button>
  );
}

// The on-screen content for the current step. Prayer text is shown here but is
// never spoken aloud — the voice guide stays on generic prompts + Scripture.
function StepContent({ step, lang, tr, categories }) {
  if (!step) return null;

  if (step.type === 'movement') {
    const meta = MOVEMENT_META[step.stage];
    const ref = movementPassage(step.stage, lang);
    return (
      <div className="text-center pt-4">
        <div className="text-5xl mb-4">{meta.emoji}</div>
        <h2 className="text-2xl font-semibold leading-snug mb-3" style={{ color: 'var(--text-1)' }}>{t(lang, meta.titleKey)}</h2>
        <p className="text-base leading-relaxed mb-5" style={{ color: 'var(--text-2)' }}>{t(lang, meta.promptKey)}</p>
        {ref && (
          <p className="text-sm font-medium inline-block px-4 py-2 rounded-full" style={{ background: 'var(--accent-soft)', color: 'var(--accent)', border: '0.5px solid var(--accent-border)' }}>
            📖 {ref}
          </p>
        )}
      </div>
    );
  }

  // Request (supplication) — the user's own prayer, shown large and calm.
  const { prayer } = step;
  const ids = (prayer.prayer_categories || []).map((pc) => pc.category_id);
  const cats = categories.filter((c) => ids.includes(c.id));
  const points = prayer.prayer_points || [];
  return (
    <div className="pt-2">
      <p className="text-xs font-semibold uppercase tracking-widest mb-3 text-center" style={{ color: 'var(--accent)' }}>
        🤲 {t(lang, 'stageSupplication')}
      </p>
      {(cats.length > 0 || (prayer.for_other && prayer.person_name)) && (
        <div className="flex flex-wrap gap-1.5 mb-4 justify-center">
          {cats.map((c) => (
            <span key={c.id} className="text-xs px-3 py-1 rounded-full font-medium text-white" style={{ backgroundColor: c.color }}>
              {c.emoji} {tr(c.name, lang)}
            </span>
          ))}
          {prayer.for_other && prayer.person_name && (
            <span className="text-xs px-3 py-1 rounded-full font-medium" style={{ background: 'var(--accent-soft)', color: 'var(--accent)', border: '0.5px solid var(--accent-border)' }}>
              👤 {prayer.person_name}
            </span>
          )}
        </div>
      )}
      <h2 className="text-2xl font-semibold leading-snug mb-3 text-center" style={{ color: 'var(--text-1)' }}>{tr(prayer.title, lang)}</h2>
      {prayer.description && (
        <p className="text-base leading-relaxed mb-5 text-center" style={{ color: 'var(--text-2)' }}>{tr(prayer.description, lang)}</p>
      )}
      {points.length > 0 && (
        <div className="space-y-3">
          {points.map((pp, i) => (
            <div key={pp.id || i} className="rounded-2xl p-4" style={{ background: 'var(--surface)', border: '0.5px solid var(--border)' }}>
              <p className="text-sm font-medium" style={{ color: 'var(--text-1)' }}>{tr(pp.title, lang)}</p>
              {(pp.verses || []).map((v, vi) => (
                <div key={vi} className="mt-2 pl-3" style={{ borderLeft: '2px solid var(--accent-border)' }}>
                  {v.text && <p className="text-sm italic leading-relaxed" style={{ color: 'var(--text-2)' }}>&quot;{v.text}&quot;</p>}
                  {v.ref && <p className="text-xs mt-1" style={{ color: 'var(--accent)' }}>📖 {v.ref}</p>}
                </div>
              ))}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
