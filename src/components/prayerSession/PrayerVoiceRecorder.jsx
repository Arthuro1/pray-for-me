// The voice half of a prayer note. Deliberately ONE thing at a time: an idle
// "Voice note" action, a focused recording state, then a player with Record
// again / Delete — never all three at once around the writing field.
//
// It reuses the app's existing recording stack (recorderMime's per-browser
// MediaRecorder format, the same MAX limits as any attachment) rather than
// introducing a second voice-note system. The microphone is requested ONLY when
// the user taps Voice note — never on entering the session or opening the
// composer — and a denied permission leaves the written note fully usable.
import { forwardRef, useEffect, useImperativeHandle, useRef, useState } from 'react';
import { Mic, Play, RotateCcw, Square, Trash2 } from 'lucide-react';
import { t } from '../../i18n';
import { recorderMime } from '../rich/recorderMime';
import { MAX_VOICE_SECONDS } from '../../lib/prayerNoteDrafts';
import { fmtDuration } from './duration';

// Exposes `finalize()` so the session's Next can stop an in-flight recording and
// wait for it to be safely captured before it advances — the recording is never
// silently discarded.
const PrayerVoiceRecorder = forwardRef(function PrayerVoiceRecorder(
  { lang, voice, onCaptured, onDelete, readOnly = false },
  ref,
) {
  const [recording, setRecording] = useState(false);
  const [seconds, setSeconds] = useState(0);
  const [error, setError] = useState(null); // i18n key
  const [url, setUrl] = useState(null);
  const recorderRef = useRef(null);
  const timerRef = useRef(null);
  const secondsRef = useRef(0);
  const discardRef = useRef(false);
  const settleRef = useRef(null); // resolves once onstop has finished capturing

  // Play back what was recorded before moving on. One object URL per blob,
  // revoked as soon as it is replaced or the composer goes away.
  useEffect(() => {
    const blob = voice?.blob;
    if (!blob || typeof URL?.createObjectURL !== 'function') { setUrl(null); return undefined; }
    const next = URL.createObjectURL(blob);
    setUrl(next);
    return () => URL.revokeObjectURL(next);
  }, [voice?.blob]);

  // Never leave the mic open if the session closes mid-recording.
  useEffect(() => () => {
    try { recorderRef.current?.stream?.getTracks?.().forEach((track) => track.stop()); } catch { /* already gone */ }
    clearInterval(timerRef.current);
  }, []);

  const stopTimer = () => { clearInterval(timerRef.current); timerRef.current = null; };

  const start = async () => {
    setError(null);
    const mime = recorderMime();
    if (!mime || !navigator.mediaDevices?.getUserMedia) { setError('micUnavailable'); return; }
    let stream;
    try {
      stream = await navigator.mediaDevices.getUserMedia({ audio: true });
    } catch (err) {
      // A refusal is a choice, not a fault: say what to do and keep writing available.
      setError(err?.name === 'NotAllowedError' || err?.name === 'SecurityError' ? 'micPermission' : 'micUnavailable');
      return;
    }
    try {
      const recorder = new MediaRecorder(stream, { mimeType: mime });
      const chunks = [];
      const type = mime.split(';')[0];
      discardRef.current = false;
      recorder.ondataavailable = (e) => { if (e.data?.size > 0) chunks.push(e.data); };
      recorder.onstop = async () => {
        stream.getTracks().forEach((track) => track.stop());
        stopTimer();
        const captured = secondsRef.current;
        secondsRef.current = 0;
        setRecording(false);
        setSeconds(0);
        try {
          const blob = new Blob(chunks, { type });
          if (!discardRef.current && blob.size > 0) {
            await onCaptured({ blob, mime: type, seconds: captured });
          }
        } catch {
          setError('noteSaveFailedShort');
        } finally {
          settleRef.current?.();
          settleRef.current = null;
        }
      };
      recorderRef.current = recorder;
      recorder.start();
      secondsRef.current = 0;
      setSeconds(0);
      setRecording(true);
      timerRef.current = setInterval(() => {
        secondsRef.current += 1;
        setSeconds(secondsRef.current);
        if (secondsRef.current >= MAX_VOICE_SECONDS) stop();
      }, 1000);
    } catch {
      stream.getTracks().forEach((track) => track.stop());
      setError('micUnavailable');
    }
  };

  // Returns a promise that settles once the recording has been handed to
  // `onCaptured` (which persists it) — not merely once the recorder stopped.
  const stop = () => {
    const recorder = recorderRef.current;
    if (!recorder || recorder.state === 'inactive') return Promise.resolve();
    return new Promise((resolve) => {
      settleRef.current = resolve;
      try { recorder.stop(); } catch { resolve(); }
    });
  };

  useImperativeHandle(ref, () => ({
    isRecording: () => recording,
    finalize: () => stop(),
  }));

  if (readOnly) {
    return voice ? (
      <div className="mt-3 flex w-full items-center gap-2">
        <Play size={13} aria-hidden="true" style={{ color: 'var(--accent)' }} />
        <audio controls src={url || undefined} preload="metadata" aria-label={t(lang, 'noteVoicePlayback')} className="max-w-full flex-1" />
      </div>
    ) : null;
  }

  if (recording) {
    return (
      <div className="mt-3 w-full rounded-xl px-3 py-3" style={{ background: 'var(--input-bg)', border: '0.5px solid var(--input-border)' }}>
        <div className="flex items-center gap-2.5">
          {/* Never colour alone: the pulsing dot is paired with the word "Recording". */}
          <span className="h-2.5 w-2.5 shrink-0 animate-pulse rounded-full" style={{ background: '#e53e3e' }} aria-hidden="true" />
          <span className="text-sm font-medium" style={{ color: 'var(--text-1)' }}>{t(lang, 'noteRecording')}</span>
          {/* The ticking count is decorative — announcing it every second would
              bury everything else in a screen reader. */}
          <span className="flex-1 text-end text-sm tabular-nums" style={{ color: 'var(--text-2)' }} aria-hidden="true">
            {fmtDuration(seconds)}
          </span>
        </div>
        <p role="status" className="sr-only">{t(lang, 'noteRecording')}</p>
        <button
          type="button"
          onClick={() => stop()}
          aria-label={t(lang, 'noteStopRecording')}
          className="pressable mt-3 flex min-h-11 w-full items-center justify-center gap-2 rounded-xl text-sm font-medium text-white"
          style={{ background: 'var(--accent)' }}
        >
          <Square size={14} aria-hidden="true" /> {t(lang, 'noteStopRecording')}
        </button>
      </div>
    );
  }

  if (voice) {
    return (
      <div className="mt-3 w-full">
        <audio controls src={url || undefined} preload="metadata" aria-label={t(lang, 'noteVoicePlayback')} className="w-full" />
        <div className="mt-2 flex items-center gap-2">
          <button
            type="button"
            onClick={start}
            className="pressable flex min-h-11 items-center gap-1.5 rounded-xl px-3 text-xs font-medium"
            style={{ background: 'var(--input-bg)', color: 'var(--text-2)', border: '0.5px solid var(--input-border)' }}
          >
            <RotateCcw size={13} aria-hidden="true" /> {t(lang, 'noteRecordAgain')}
          </button>
          <button
            type="button"
            onClick={onDelete}
            className="pressable flex min-h-11 items-center gap-1.5 rounded-xl px-3 text-xs font-medium"
            style={{ color: 'var(--text-3)' }}
          >
            <Trash2 size={13} aria-hidden="true" /> {t(lang, 'noteDeleteRecording')}
          </button>
        </div>
        {error && <p className="mt-2 text-xs" style={{ color: 'var(--text-3)' }}>{t(lang, error)}</p>}
      </div>
    );
  }

  // Idle: a compact action that sits beside the formatting control. The
  // microphone is requested here and nowhere else.
  return (
    <div className="ms-auto flex flex-col items-end">
      <button
        type="button"
        onClick={start}
        className="pressable flex min-h-11 items-center gap-1.5 rounded-xl px-3 text-xs font-medium"
        style={{ color: 'var(--text-2)' }}
      >
        <Mic size={14} aria-hidden="true" /> {t(lang, 'noteVoice')}
      </button>
      {error && <p role="status" className="mt-1 text-xs text-end" style={{ color: 'var(--text-3)' }}>{t(lang, error)}</p>}
    </div>
  );
});

export default PrayerVoiceRecorder;
