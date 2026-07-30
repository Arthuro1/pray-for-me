import { devWarn } from '../logger';

const FADE_IN_MS = 1400;
const FADE_OUT_MS = 900;

// First-party, instrumental-only prayer atmospheres. They are served from the
// app's own origin, so changing music never shares prayer data with a third
// party. Silence remains a full session choice.
export const AUDIO_TRACKS = Object.freeze([
  { id: 'soft-piano', src: '/audio/piano-and-rain.mp3', labelKey: 'audioSoftPiano' },
  { id: 'ambient-pad', src: '/audio/ambient-pad.mp3', labelKey: 'audioAmbientPad' },
  { id: 'nature', src: '/audio/nature.mp3', labelKey: 'audioNature' },
  { id: 'soft-pad', src: '/audio/soft-pad.mp3', labelKey: 'audioSoftPad' },
  { id: 'silence', src: null, labelKey: 'audioSilence' },
]);

// Prayer sessions begin quietly. A visitor can opt into music, and that choice
// is remembered for later sessions, but we never start audio before consent.
export const DEFAULT_AUDIO_TRACK_ID = 'silence';

export function resolveTrack(id) {
  return AUDIO_TRACKS.find((track) => track.id === id) || null;
}

export function clamp01(value) {
  if (!Number.isFinite(value)) return 0;
  return Math.min(1, Math.max(0, value));
}

let current = null;
let operationId = 0;

function makeSource(element) {
  let rampTimer = null;

  const clearRamp = () => {
    if (rampTimer) {
      clearInterval(rampTimer);
      rampTimer = null;
    }
  };

  return {
    element,
    setLevel(level, durationMs = 0) {
      clearRamp();
      const target = clamp01(level);
      if (durationMs <= 0) {
        element.volume = target;
        return;
      }

      const start = element.volume;
      const steps = Math.max(1, Math.round(durationMs / 50));
      let step = 0;
      rampTimer = setInterval(() => {
        step += 1;
        element.volume = clamp01(start + (target - start) * (step / steps));
        if (step >= steps) clearRamp();
      }, 50);
    },
    pause() {
      clearRamp();
      try { element.pause(); } catch { /* best effort */ }
    },
    resume() {
      try {
        const result = element.play?.();
        result?.catch?.(() => {});
      } catch { /* best effort */ }
    },
    stop() {
      clearRamp();
      try {
        element.pause();
        element.removeAttribute('src');
        element.load?.();
      } catch { /* best effort */ }
    },
  };
}

function beginFilePlayback(track) {
  return new Promise((resolve) => {
    // jsdom deliberately leaves HTMLMediaElement.play() unimplemented. Treat it
    // like any other audio-less environment so component tests stay quiet while
    // the engine's browser behavior is covered by the interactive verification.
    const isJsdom = typeof navigator !== 'undefined' && /jsdom/i.test(navigator.userAgent || '');
    if (typeof Audio !== 'function' || isJsdom) {
      resolve(null);
      return;
    }

    let element;
    try {
      element = new Audio(track.src);
    } catch {
      resolve(null);
      return;
    }

    element.loop = true;
    element.preload = 'auto';
    element.volume = 0;

    let settled = false;
    let timeoutId;
    const finish = (source) => {
      if (settled) return;
      settled = true;
      clearTimeout(timeoutId);
      if (!source) {
        try {
          element.pause();
          element.removeAttribute('src');
        } catch { /* best effort */ }
      }
      resolve(source);
    };

    element.addEventListener('playing', () => finish(makeSource(element)), { once: true });
    element.addEventListener('error', () => finish(null), { once: true });

    try {
      const playResult = element.play?.();
      // A fulfilled play() promise means the browser accepted playback even when
      // its "playing" event is delayed. A rejection is usually autoplay policy.
      playResult?.then?.(
        () => finish(makeSource(element)),
        () => finish(null),
      );
    } catch {
      finish(null);
      return;
    }

    timeoutId = setTimeout(() => finish(null), 3500);
  });
}

async function stopCurrent({ fade = false } = {}) {
  if (!current) return;
  const active = current;
  current = null;

  if (fade) {
    active.source.setLevel(0, FADE_OUT_MS);
    await new Promise((resolve) => setTimeout(resolve, FADE_OUT_MS));
  }
  active.source.stop();
}

export async function stopBackgroundAudio({ fade = false } = {}) {
  operationId += 1;
  await stopCurrent({ fade });
}

// Starts or changes the session atmosphere. This is intentionally failure-soft:
// a missing asset or a browser autoplay block yields Silence and leaves prayer
// itself fully usable.
export async function startBackgroundInstrumental({
  trackId = DEFAULT_AUDIO_TRACK_ID,
  volume = 0.16,
} = {}) {
  const thisOperation = ++operationId;
  await stopCurrent();

  const track = resolveTrack(trackId);
  if (!track || !track.src) {
    return { started: false, trackId: 'silence' };
  }

  const source = await beginFilePlayback(track);
  // A second selection or session close won while this file was loading.
  if (thisOperation !== operationId) {
    source?.stop();
    return { started: false, trackId: track.id };
  }
  if (!source) {
    devWarn('backgroundAudio: playback unavailable', track.id);
    return { started: false, trackId: track.id };
  }

  const baseVolume = clamp01(volume);
  current = { source, trackId: track.id, baseVolume };
  source.setLevel(0);
  source.setLevel(baseVolume, FADE_IN_MS);
  return { started: true, trackId: track.id };
}

export function setBackgroundVolume(value) {
  if (!current) return;
  current.baseVolume = clamp01(value);
  current.source.setLevel(current.baseVolume, 250);
}

export function pauseBackgroundAudio() {
  current?.source.pause();
}

export function resumeBackgroundAudio() {
  current?.source.resume();
}

export function isBackgroundPlaying() {
  return !!current;
}

export function currentBackgroundTrack() {
  return current?.trackId || 'silence';
}
