// Background worship instrumental for Hands-free Prayer Mode.
//
// A tiny singleton engine that plays ONE low-volume instrumental underneath the
// spoken prayer guide. It is deliberately calm: gentle fade-in, ducking under
// speech, a soft rise during silence, and a gentle fade-out — never a sudden
// jump (which matters for driving safety and for keeping the room quiet).
//
// PRIVACY: this module talks to no network and no third party. Nothing about the
// user's prayers ever reaches it — it only knows a track id and a volume.
//
// AUDIO SOURCES:
//   • file      — a bundled/app-hosted instrumental (see public/audio/README.md).
//                 If a file is missing or fails to load, we fall back to the
//                 track's generated pad rather than failing the session.
//   • generated — a soft ambient pad synthesised on-device with the Web Audio
//                 API. Needs no asset files, so it is always available and is
//                 100% original / royalty-free.
//   • silence   — a first-class option: the engine simply does nothing.
import { devWarn } from '../logger';

const DUCK_FACTOR = 0.35; // speech ducks the music to ~35% of its base level
const FADE_IN_MS = 2500;
const FADE_OUT_MS = 2500;
const DUCK_MS = 600;
const RESTORE_MS = 1400; // slower rise back to base — gentle, not startling

// The atmospheres offered before a session. Silence is first and is the default.
// File tracks name a generated pad as their fallback so a missing/undeliverable
// asset still yields a peaceful (never silent-by-accident) background.
export const AUDIO_TRACKS = Object.freeze([
  { id: 'silence', kind: 'silence', labelKey: 'audioSilence' },
  { id: 'soft-piano', kind: 'file', src: '/audio/soft-piano.mp3', labelKey: 'audioSoftPiano', fallback: 'soft-pad' },
  { id: 'ambient-pad', kind: 'file', src: '/audio/ambient-pad.mp3', labelKey: 'audioAmbientPad', fallback: 'soft-pad' },
  { id: 'nature', kind: 'file', src: '/audio/nature.mp3', labelKey: 'audioNature', fallback: 'soft-pad' },
  { id: 'soft-pad', kind: 'file', src: '/audio/soft-pad.mp3', labelKey: 'audioSoftPad' },
]);

export function resolveTrack(id) {
  return AUDIO_TRACKS.find((t) => t.id === id) || null;
}

export function clamp01(v) {
  if (!Number.isFinite(v)) return 0;
  return Math.min(1, Math.max(0, v));
}

// The ducked (speech-time) level for a given base volume.
export function duckedLevel(base) {
  return clamp01(base * DUCK_FACTOR);
}

// ─── Source implementations ──────────────────────────────────────────────────
// Each source exposes the same shape: applyLevel(level, ms), pause, resume, stop.

// A bundled instrumental file. Fades are done by stepping .volume on a short
// interval so we don't need to route the element through an AudioContext.
function makeFileSource(el) {
  let ramp = null;
  const clearRamp = () => { if (ramp) { clearInterval(ramp); ramp = null; } };
  return {
    kind: 'file',
    applyLevel(level, durationMs = 0) {
      clearRamp();
      const target = clamp01(level);
      if (durationMs <= 0) { el.volume = target; return; }
      const start = el.volume;
      const steps = Math.max(1, Math.round(durationMs / 50));
      let i = 0;
      ramp = setInterval(() => {
        i += 1;
        el.volume = clamp01(start + (target - start) * (i / steps));
        if (i >= steps) clearRamp();
      }, 50);
    },
    pause() { clearRamp(); try { el.pause(); } catch { /* ignore */ } },
    resume() { try { return el.play?.()?.catch?.(() => {}); } catch { return undefined; } },
    stop() {
      clearRamp();
      try { el.pause(); el.removeAttribute('src'); el.load?.(); } catch { /* ignore */ }
    },
  };
}

// Try to start a file track. Resolves a source once it is actually playing, or
// null if the asset is missing / undeliverable (so the caller can fall back).
function tryPlayFile(track, loop) {
  return new Promise((resolve) => {
    let el;
    try { el = new Audio(track.src); } catch { resolve(null); return; }
    el.loop = loop;
    el.preload = 'auto';
    el.volume = 0; // start silent; the engine fades in
    let settled = false;
    const finish = (source) => {
      if (settled) return;
      settled = true;
      if (!source) { try { el.pause(); el.removeAttribute('src'); } catch { /* ignore */ } }
      resolve(source);
    };
    el.addEventListener('playing', () => finish(makeFileSource(el)), { once: true });
    el.addEventListener('canplaythrough', () => finish(makeFileSource(el)), { once: true });
    el.addEventListener('error', () => finish(null), { once: true });
    try { el.play()?.catch?.(() => finish(null)); } catch { finish(null); }
    // Safety net: if the element never reports playing OR erroring, give up so a
    // stalled load can't hang the session's opening.
    setTimeout(() => finish(null), 4000);
  });
}

// A gentle synthesised pad: a soft, low, slightly-detuned drone through a
// lowpass filter. Calm and continuous by nature, so it loops for free.
function makePadSource() {
  const Ctx = typeof window !== 'undefined' && (window.AudioContext || window.webkitAudioContext);
  if (!Ctx) return null;
  let ctx; let master; let oscs;
  try {
    ctx = new Ctx();
    master = ctx.createGain();
    master.gain.value = 0;
    const filter = ctx.createBiquadFilter();
    filter.type = 'lowpass';
    filter.frequency.value = 650; // roll off the top so it stays soft, never bright
    filter.connect(master);
    master.connect(ctx.destination);
    const freqs = [110, 164.81, 220]; // A2 · E3 · A3 — a calm open fifth + octave
    oscs = freqs.map((f, i) => {
      const o = ctx.createOscillator();
      o.type = i === 0 ? 'sine' : 'triangle';
      o.frequency.value = f;
      o.detune.value = (i - 1) * 5; // slight detune for warmth
      const g = ctx.createGain();
      g.gain.value = 0.5 / freqs.length;
      o.connect(g);
      g.connect(filter);
      o.start();
      return o;
    });
  } catch { return null; }
  return {
    kind: 'generated',
    applyLevel(level, durationMs = 0) {
      const target = clamp01(level);
      try {
        const now = ctx.currentTime;
        master.gain.cancelScheduledValues(now);
        master.gain.setValueAtTime(master.gain.value, now);
        if (durationMs <= 0) master.gain.setValueAtTime(target, now);
        else master.gain.linearRampToValueAtTime(target, now + durationMs / 1000);
      } catch { /* ignore */ }
    },
    pause() { try { ctx.suspend?.(); } catch { /* ignore */ } },
    resume() { try { ctx.resume?.(); } catch { /* ignore */ } },
    stop() {
      try { oscs.forEach((o) => { try { o.stop(); } catch { /* ignore */ } }); } catch { /* ignore */ }
      try { ctx.close?.(); } catch { /* ignore */ }
    },
  };
}

// ─── Public engine ───────────────────────────────────────────────────────────
let current = null; // { source, baseVolume, ducked }

const delay = (ms) => new Promise((r) => setTimeout(r, ms));

// Start the chosen instrumental. Call this ONLY after a user gesture (the Start
// button) — both because prayer atmosphere must never begin on its own and
// because browser autoplay policy requires it. Returns the id of the track that
// actually plays (which may be a fallback), or 'silence' when nothing plays.
export async function startBackgroundInstrumental({ trackId, volume = 0.18, loop = true } = {}) {
  await stopBackgroundAudio();
  const track = resolveTrack(trackId);
  if (!track || track.kind === 'silence') return { started: false, trackId: 'silence' };

  const base = clamp01(volume);
  let source = null;
  let effectiveId = track.id;

  if (track.kind === 'file') {
    source = await tryPlayFile(track, loop);
    // Missing / undeliverable asset → try the track's declared fallback file…
    if (!source && track.fallback) {
      const fb = resolveTrack(track.fallback);
      if (fb && fb.kind === 'file' && fb.id !== track.id) {
        devWarn('backgroundAudio: file track unavailable, trying fallback', track.id);
        source = await tryPlayFile(fb, loop);
        if (source) effectiveId = fb.id;
      }
    }
    // …and if that is unavailable too, cover it with the on-device generated pad
    // so the prayer atmosphere is never silent by accident.
    if (!source) {
      devWarn('backgroundAudio: falling back to generated pad', track.id);
      source = makePadSource();
    }
  } else if (track.kind === 'generated') {
    source = makePadSource();
  }

  if (!source) {
    devWarn('backgroundAudio: no audio source available', trackId);
    return { started: false, trackId: 'silence' };
  }

  current = { source, baseVolume: base, ducked: false };
  source.applyLevel(0, 0);
  source.applyLevel(base, FADE_IN_MS); // gentle fade in
  return { started: true, trackId: effectiveId };
}

// Lower the music while the guide is speaking, so the voice stays clearly heard.
export function duckBackgroundAudio() {
  if (!current) return;
  current.ducked = true;
  current.source.applyLevel(duckedLevel(current.baseVolume), DUCK_MS);
}

// Gently raise the music back during silent prayer.
export function restoreBackgroundAudio() {
  if (!current) return;
  current.ducked = false;
  current.source.applyLevel(current.baseVolume, RESTORE_MS);
}

export function setBackgroundVolume(v) {
  const base = clamp01(v);
  if (!current) return;
  current.baseVolume = base;
  current.source.applyLevel(current.ducked ? duckedLevel(base) : base, 250);
}

export function pauseBackgroundAudio() { current?.source.pause(); }
export function resumeBackgroundAudio() { current?.source.resume(); }

// Fade the music out gently, then tear it down. Awaitable so callers can end the
// session cleanly after the sound has faded.
export async function fadeOutBackgroundAudio() {
  if (!current) return;
  const { source } = current;
  source.applyLevel(0, FADE_OUT_MS);
  await delay(FADE_OUT_MS);
  source.stop();
  if (current && current.source === source) current = null;
}

// Stop immediately (used on unmount / turning music off). Never throws.
export async function stopBackgroundAudio() {
  if (!current) return;
  const { source } = current;
  current = null;
  source.stop();
}

export function isBackgroundPlaying() { return !!current; }
