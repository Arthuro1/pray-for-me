import { useState, useEffect, useRef, useCallback } from 'react';
import { useShallow } from 'zustand/react/shallow';
import {
  X, Play, Pause, RotateCcw, SkipBack, SkipForward, Car, Loader2, Eye, EyeOff, Check,
} from 'lucide-react';
import { t } from '../i18n';
import usePrayerStore from '../store/prayerStore';
import { useEscapeKey } from '../hooks/useEscapeKey';
import { useFocusTrap } from '../hooks/useFocusTrap';
import { requestSpokenGuide, fetchGuideAudio, defaultPrivacyMode } from '../lib/spokenGuide';
import { speak, cancelSpeech, pauseSpeech, resumeSpeech } from '../lib/audio/prayerGuideAudio';
import { track as trackEvent, EVENTS } from '../lib/analytics';
import Encouragement from './Encouragement';

// Spoken Prayer Guide — a driving-safe, server-generated spoken prayer session.
//
// Unlike Hands-free Mode (on-device voice that NEVER speaks prayer content), this
// sends privacy-reduced prayer content to Pray4Me's PRIVATE AI + voice backend so
// it can be read aloud. The user previews and confirms the privacy mode first.
//
// Playback prefers the backend audio (fetched through the app's own authenticated
// proxy, so the browser never calls the backend directly). If no audio is
// available (e.g. dev), it falls back to speaking the returned script on-device.
const MODE_META = [
  { id: 'names_only', titleKey: 'sgModeNamesOnly', descKey: 'sgModeNamesOnlyDesc' },
  { id: 'summary', titleKey: 'sgModeSummary', descKey: 'sgModeSummaryDesc' },
  { id: 'full', titleKey: 'sgModeFull', descKey: 'sgModeFullDesc' },
];

function fmt(sec) {
  if (!Number.isFinite(sec) || sec < 0) return '0:00';
  const m = Math.floor(sec / 60);
  const s = Math.floor(sec % 60);
  return `${m}:${String(s).padStart(2, '0')}`;
}

export default function SpokenGuideMode({ prayers, categories, lang, tr, onClose, onComplete }) {
  const { settings } = usePrayerStore(useShallow((s) => ({ settings: s.settings })));
  const trapRef = useFocusTrap(true);

  const [phase, setPhase] = useState('setup'); // setup | loading | playing | error | done
  const [privacyMode, setPrivacyMode] = useState(() => defaultPrivacyMode(settings));
  const [length, setLength] = useState('short');
  const [includeScripture, setIncludeScripture] = useState(false);
  const [readFullDetails, setReadFullDetails] = useState(false);

  const [script, setScript] = useState('');
  const [audioSrc, setAudioSrc] = useState(null); // object URL, or null (speech fallback)
  const [showWords, setShowWords] = useState(false);
  const [markPrayed, setMarkPrayed] = useState(true);

  // Playback state.
  const audioRef = useRef(null);
  const [playing, setPlaying] = useState(false);
  const [progress, setProgress] = useState({ current: 0, duration: 0 });
  const objectUrlRef = useRef(null);
  const speechModeRef = useRef(false);

  // ── Cleanup: never let audio/speech or a blob URL outlive the overlay ──
  const cleanup = useCallback(() => {
    cancelSpeech();
    if (audioRef.current) { try { audioRef.current.pause(); } catch { /* ignore */ } }
    if (objectUrlRef.current) { URL.revokeObjectURL(objectUrlRef.current); objectUrlRef.current = null; }
  }, []);
  useEffect(() => cleanup, [cleanup]);

  const handleClose = useCallback(() => { cleanup(); onClose?.(); }, [cleanup, onClose]);
  useEscapeKey(handleClose);

  const finish = useCallback(() => {
    cleanup();
    setPlaying(false);
    setPhase('done');
    trackEvent(EVENTS.SESSION_COMPLETED);
  }, [cleanup]);

  // ── Start: request the guide, then play audio (or speak the script) ──
  const start = useCallback(async () => {
    setPhase('loading');
    trackEvent(EVENTS.HANDS_FREE_SESSION_STARTED, { mode: 'spoken_guide' });
    const { ok, data } = await requestSpokenGuide({
      prayers, tr, lang, categories, privacyMode, length, includeScripture, readFullDetails,
    });
    if (!ok || !data || !data.script) { setPhase('error'); return; }

    setScript(data.script);
    // Prefer server audio through the in-app proxy; fall back to on-device speech.
    const url = await fetchGuideAudio(data.audioUrl);
    if (url) {
      objectUrlRef.current = url;
      speechModeRef.current = false;
      setAudioSrc(url);
    } else {
      speechModeRef.current = true;
      setAudioSrc(null);
    }
    setPhase('playing');
  }, [prayers, tr, lang, categories, privacyMode, length, includeScripture, readFullDetails]);

  // ── Audio-element playback wiring ──
  useEffect(() => {
    if (phase !== 'playing' || !audioSrc) return undefined;
    const el = audioRef.current;
    if (!el) return undefined;
    const onTime = () => setProgress({ current: el.currentTime, duration: el.duration || 0 });
    const onPlay = () => setPlaying(true);
    const onPause = () => setPlaying(false);
    const onEnded = () => finish();
    el.addEventListener('timeupdate', onTime);
    el.addEventListener('play', onPlay);
    el.addEventListener('pause', onPause);
    el.addEventListener('ended', onEnded);
    el.play().catch(() => { /* autoplay may be blocked; user taps Play */ });
    return () => {
      el.removeEventListener('timeupdate', onTime);
      el.removeEventListener('play', onPlay);
      el.removeEventListener('pause', onPause);
      el.removeEventListener('ended', onEnded);
    };
  }, [phase, audioSrc, finish]);

  // ── On-device speech fallback (no server audio) ──
  useEffect(() => {
    if (phase !== 'playing' || audioSrc || !speechModeRef.current || !script) return undefined;
    let cancelled = false;
    setPlaying(true);
    speak(script, { lang }).then(() => { if (!cancelled) finish(); });
    return () => { cancelled = true; cancelSpeech(); };
  }, [phase, audioSrc, script, lang, finish]);

  // ── Controls ──
  const togglePlay = useCallback(() => {
    if (audioSrc && audioRef.current) {
      if (audioRef.current.paused) audioRef.current.play().catch(() => {});
      else audioRef.current.pause();
    } else {
      // Speech mode: best-effort pause/resume.
      if (playing) { pauseSpeech(); setPlaying(false); } else { resumeSpeech(); setPlaying(true); }
    }
  }, [audioSrc, playing]);

  const skip = useCallback((delta) => {
    const el = audioRef.current;
    if (!el || !audioSrc) return;
    el.currentTime = Math.max(0, Math.min((el.duration || 0), el.currentTime + delta));
  }, [audioSrc]);

  const restart = useCallback(() => {
    if (audioSrc && audioRef.current) {
      audioRef.current.currentTime = 0;
      audioRef.current.play().catch(() => {});
    } else {
      cancelSpeech();
      setPlaying(true);
      speak(script, { lang }).then(() => finish());
    }
  }, [audioSrc, script, lang, finish]);

  const handleDone = useCallback(() => {
    if (markPrayed) onComplete?.();
    handleClose();
  }, [markPrayed, onComplete, handleClose]);

  // ── Media Session (lock-screen / headset controls) for driving ──
  useEffect(() => {
    if (phase !== 'playing' || typeof navigator === 'undefined' || !('mediaSession' in navigator)) return undefined;
    const ms = navigator.mediaSession;
    const handlers = [['play', togglePlay], ['pause', togglePlay], ['seekbackward', () => skip(-15)], ['seekforward', () => skip(15)]];
    handlers.forEach(([a, cb]) => { try { ms.setActionHandler(a, cb); } catch { /* unsupported */ } });
    return () => handlers.forEach(([a]) => { try { ms.setActionHandler(a, null); } catch { /* ignore */ } });
  }, [phase, togglePlay, skip]);

  // ── Rendering ──
  const overlay = (children) => (
    <div className="fixed inset-0 z-[70] flex flex-col" style={{ background: 'var(--bg)' }}>
      <div ref={trapRef} role="dialog" aria-modal="true" aria-label={t(lang, 'sgTitle')} tabIndex={-1} className="flex flex-col h-full focus:outline-none">
        {children}
      </div>
    </div>
  );

  const closeBtn = (onClick, label) => (
    <button onClick={onClick} aria-label={label} className="w-9 h-9 flex items-center justify-center rounded-full shrink-0" style={{ background: 'var(--surface)', border: '0.5px solid var(--border)', color: 'var(--text-2)' }}>
      <X size={18} />
    </button>
  );

  // ── Setup: privacy preview + options ──
  if (phase === 'setup') {
    return overlay(
      <>
        <div className="shrink-0 px-5 pt-4 flex items-center justify-between">
          <span className="text-sm font-semibold flex items-center gap-2" style={{ color: 'var(--text-1)' }}>
            <Car size={16} style={{ color: 'var(--accent)' }} /> {t(lang, 'sgTitle')}
          </span>
          {closeBtn(handleClose, t(lang, 'close'))}
        </div>
        <div className="flex-1 overflow-y-auto px-6 py-6 max-w-xl mx-auto w-full">
          <p className="text-sm leading-relaxed mb-5" style={{ color: 'var(--text-2)' }}>{t(lang, 'sgIntro')}</p>

          {/* Driving safety — shown before anything can start. */}
          <div className="rounded-2xl px-4 py-3 mb-5 flex items-start gap-2.5" style={{ background: 'var(--accent-soft)', border: '0.5px solid var(--accent-border)' }}>
            <span className="text-base leading-none mt-0.5" aria-hidden="true">🚗</span>
            <p className="text-xs leading-relaxed" style={{ color: 'var(--text-2)' }}>{t(lang, 'sgSafety')}</p>
          </div>

          {/* Privacy mode preview */}
          <p className="text-xs font-semibold uppercase tracking-widest mb-2" style={{ color: 'var(--text-3)' }}>{t(lang, 'sgPrivacyLabel')}</p>
          <div className="flex flex-col gap-2 mb-4">
            {MODE_META.map((m) => {
              const active = privacyMode === m.id;
              return (
                <button
                  key={m.id}
                  onClick={() => { setPrivacyMode(m.id); if (m.id !== 'full') setReadFullDetails(false); if (m.id === 'full') setReadFullDetails(true); }}
                  className="text-left rounded-2xl px-4 py-3 transition-all"
                  style={{ background: active ? 'var(--accent-soft)' : 'var(--surface)', border: `0.5px solid ${active ? 'var(--accent-border)' : 'var(--border)'}` }}
                >
                  <span className="text-sm font-semibold flex items-center gap-2" style={{ color: active ? 'var(--accent)' : 'var(--text-1)' }}>
                    {active && <Check size={14} />} {t(lang, m.titleKey)}
                  </span>
                  <span className="text-xs block mt-0.5" style={{ color: 'var(--text-3)' }}>{t(lang, m.descKey)}</span>
                </button>
              );
            })}
          </div>

          {/* Options */}
          <div className="flex flex-col gap-2 mb-4">
            {privacyMode === 'full' && (
              <ToggleRow label={t(lang, 'sgReadFullDetails')} checked={readFullDetails} onChange={setReadFullDetails} />
            )}
            <ToggleRow label={t(lang, 'sgIncludeScripture')} checked={includeScripture} onChange={setIncludeScripture} />
          </div>

          {/* Length */}
          <p className="text-xs font-semibold uppercase tracking-widest mb-2" style={{ color: 'var(--text-3)' }}>{t(lang, 'sgLength')}</p>
          <div className="grid grid-cols-2 gap-2 mb-5">
            {[['short', 'sgLengthShort'], ['medium', 'sgLengthMedium']].map(([id, key]) => (
              <button
                key={id}
                onClick={() => setLength(id)}
                className="py-2.5 rounded-2xl text-sm font-medium transition-all"
                style={{ background: length === id ? 'var(--accent)' : 'var(--surface)', color: length === id ? '#fff' : 'var(--text-2)', border: '0.5px solid var(--border)' }}
              >
                {t(lang, key)}
              </button>
            ))}
          </div>

          {/* Privacy note */}
          <p className="text-xs leading-relaxed" style={{ color: 'var(--text-3)' }}>{t(lang, 'sgPrivacyNote')}</p>
        </div>
        <div className="shrink-0 px-6 py-4 max-w-xl mx-auto w-full" style={{ borderTop: '0.5px solid var(--border)' }}>
          <button
            onClick={start}
            disabled={!prayers || prayers.length === 0}
            className="w-full flex items-center justify-center gap-2 py-4 rounded-2xl text-base font-semibold text-white disabled:opacity-50"
            style={{ background: 'var(--accent)' }}
          >
            <Play size={18} /> {t(lang, 'sgStartShort')}
          </button>
        </div>
      </>
    );
  }

  if (phase === 'loading') {
    return overlay(
      <div className="flex-1 flex flex-col items-center justify-center text-center px-8 gap-4">
        <Loader2 size={36} className="animate-spin" style={{ color: 'var(--accent)' }} />
        <p className="text-sm" style={{ color: 'var(--text-2)' }}>{t(lang, 'sgGenerating')}</p>
      </div>
    );
  }

  if (phase === 'error') {
    return overlay(
      <div className="flex-1 flex flex-col items-center justify-center text-center px-8 gap-4">
        <div className="text-5xl">🙏</div>
        <p className="text-sm leading-relaxed max-w-xs" style={{ color: 'var(--text-2)' }}>{t(lang, 'sgError')}</p>
        <div className="flex gap-3 mt-2">
          <button onClick={() => setPhase('setup')} className="px-5 py-3 rounded-xl text-sm font-medium text-white" style={{ background: 'var(--accent)' }}>{t(lang, 'sgErrorRetry')}</button>
          <button onClick={handleClose} className="px-5 py-3 rounded-xl text-sm font-medium" style={{ background: 'var(--surface)', border: '0.5px solid var(--border)', color: 'var(--text-2)' }}>{t(lang, 'close')}</button>
        </div>
      </div>
    );
  }

  if (phase === 'done') {
    return overlay(
      <div className="flex-1 flex flex-col items-center justify-center text-center px-8 gap-3">
        <div className="text-6xl mb-1">🙏</div>
        <h2 className="text-xl font-semibold" style={{ color: 'var(--text-1)' }}>{t(lang, 'sgDoneTitle')}</h2>
        <p className="text-sm" style={{ color: 'var(--text-3)' }}>{t(lang, 'sgDoneSub')}</p>
        <Encouragement lang={lang} className="max-w-xs" />
        <label className="flex items-center gap-2 mt-3 text-sm cursor-pointer" style={{ color: 'var(--text-2)' }}>
          <input type="checkbox" checked={markPrayed} onChange={(e) => setMarkPrayed(e.target.checked)} />
          {t(lang, 'sgMarkPrayed')}
        </label>
        <button onClick={handleDone} className="mt-3 px-6 py-3 rounded-xl text-sm font-medium text-white" style={{ background: 'var(--accent)' }}>{t(lang, 'close')}</button>
      </div>
    );
  }

  // ── Playing ──
  const pct = progress.duration ? Math.min(100, (progress.current / progress.duration) * 100) : 0;
  return overlay(
    <>
      {audioSrc && <audio ref={audioRef} src={audioSrc} preload="auto" />}
      <div className="shrink-0 px-5 pt-4 pb-3 flex items-center justify-between">
        <span className="text-xs font-semibold uppercase tracking-widest flex items-center gap-1.5" style={{ color: 'var(--text-3)' }}>
          <Car size={12} /> {t(lang, `sgMode${privacyMode === 'names_only' ? 'NamesOnly' : privacyMode === 'summary' ? 'Summary' : 'Full'}`)}
        </span>
        {closeBtn(finish, t(lang, 'sgFinish'))}
      </div>

      <div className="flex-1 overflow-y-auto px-6 py-4 max-w-xl mx-auto w-full flex flex-col items-center justify-center text-center">
        <div className="text-6xl mb-5" aria-hidden="true">🙏</div>
        <p className="text-lg font-semibold mb-1" style={{ color: 'var(--text-1)' }}>{t(lang, 'sgNowPlaying')}</p>
        {!audioSrc && <p className="text-xs mb-3" style={{ color: 'var(--text-3)' }}>{t(lang, 'sgOnDeviceVoice')}</p>}

        {audioSrc && (
          <div className="w-full max-w-sm mt-4">
            <div className="h-1.5 rounded-full overflow-hidden" style={{ background: 'var(--border)' }}>
              <div className="h-full rounded-full" style={{ width: `${pct}%`, background: 'var(--accent)' }} />
            </div>
            <div className="flex justify-between text-xs mt-1.5" style={{ color: 'var(--text-3)' }}>
              <span>{fmt(progress.current)}</span>
              <span>{fmt(progress.duration)}</span>
            </div>
          </div>
        )}

        {/* Optional words — hidden by default so the driver isn't asked to read. */}
        <button onClick={() => setShowWords((v) => !v)} className="mt-5 text-xs flex items-center gap-1.5" style={{ color: 'var(--text-3)' }}>
          {showWords ? <EyeOff size={13} /> : <Eye size={13} />} {t(lang, showWords ? 'sgHideWords' : 'sgShowWords')}
        </button>
        {showWords && (
          <p className="text-sm leading-relaxed whitespace-pre-line mt-3 text-left max-w-sm" style={{ color: 'var(--text-2)' }}>{script}</p>
        )}
      </div>

      {/* Large, driving-safe controls */}
      <div className="shrink-0 px-6 py-4 max-w-xl mx-auto w-full space-y-3" style={{ borderTop: '0.5px solid var(--border)' }}>
        <button onClick={togglePlay} className="w-full flex items-center justify-center gap-2 py-4 rounded-2xl text-base font-semibold text-white" style={{ background: 'var(--accent)' }}>
          {playing ? <><Pause size={18} /> {t(lang, 'sgPause')}</> : <><Play size={18} /> {t(lang, 'sgPlay')}</>}
        </button>
        <div className={`grid ${audioSrc ? 'grid-cols-3' : 'grid-cols-1'} gap-2.5`}>
          {audioSrc && <CtrlButton icon={SkipBack} label={t(lang, 'sgBack15')} onClick={() => skip(-15)} />}
          <CtrlButton icon={RotateCcw} label={t(lang, 'sgRestart')} onClick={restart} />
          {audioSrc && <CtrlButton icon={SkipForward} label={t(lang, 'sgForward15')} onClick={() => skip(15)} />}
        </div>
        <CtrlButton icon={Check} label={t(lang, 'sgFinish')} onClick={finish} full />
      </div>
    </>
  );
}

function ToggleRow({ label, checked, onChange }) {
  return (
    <label className="flex items-center justify-between gap-3 rounded-2xl px-4 py-3 cursor-pointer" style={{ background: 'var(--surface)', border: '0.5px solid var(--border)' }}>
      <span className="text-sm" style={{ color: 'var(--text-2)' }}>{label}</span>
      <input type="checkbox" checked={checked} onChange={(e) => onChange(e.target.checked)} />
    </label>
  );
}

function CtrlButton({ icon: Icon, label, onClick, full }) {
  return (
    <button
      onClick={onClick}
      className={`flex ${full ? 'flex-row w-full' : 'flex-col'} items-center justify-center gap-1.5 py-3 rounded-2xl text-xs font-medium`}
      style={{ background: 'var(--surface)', border: '0.5px solid var(--border)', color: 'var(--text-2)' }}
    >
      <Icon size={18} />
      {label}
    </button>
  );
}
