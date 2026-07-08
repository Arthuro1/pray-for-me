// Spoken prayer guide for Hands-free Prayer Mode, using the browser's on-device
// Web Speech API (speechSynthesis).
//
// PRIVACY — this is the whole reason the guide is "prompts only": this module is
// ONLY ever handed generic movement prompts and Scripture references (e.g.
// "Begin by adoring God…", "Psalm 103:1-2"). It is never given a prayer title,
// description, person name, or any user content, so nothing about the user's
// prayers can reach a browser's (sometimes cloud-backed) voice engine.
//
// It degrades quietly: where speech is unsupported, speak() resolves immediately
// so the hands-free session simply guides the user in silence instead.
import { devWarn } from '../logger';

// App language → a BCP-47 tag we ask the voice engine for.
const BCP47 = {
  fr: 'fr-FR', en: 'en-US', de: 'de-DE', pt: 'pt-BR', es: 'es-ES', zh: 'zh-CN',
  hi: 'hi-IN', ja: 'ja-JP', sw: 'sw-KE', am: 'am-ET', id: 'id-ID', tl: 'fil-PH',
  ko: 'ko-KR', ru: 'ru-RU', ar: 'ar-SA', fa: 'fa-IR',
};

export function voiceLang(lang) {
  return BCP47[lang] || 'en-US';
}

export function isSpeechSupported() {
  return typeof window !== 'undefined'
    && 'speechSynthesis' in window
    && typeof window.SpeechSynthesisUtterance === 'function';
}

function getVoices() {
  try { return window.speechSynthesis.getVoices() || []; } catch { return []; }
}

// Voices populate asynchronously in some browsers; wait briefly (once) for them.
function ensureVoices() {
  return new Promise((resolve) => {
    const have = getVoices();
    if (have.length) { resolve(have); return; }
    let done = false;
    const finish = () => { if (!done) { done = true; resolve(getVoices()); } };
    try { window.speechSynthesis.addEventListener('voiceschanged', finish, { once: true }); } catch { /* ignore */ }
    setTimeout(finish, 1000);
  });
}

export function pickVoice(voices, bcp47) {
  const lc = bcp47.toLowerCase();
  const short = lc.slice(0, 2);
  return voices.find((v) => v.lang && v.lang.toLowerCase() === lc)
    || voices.find((v) => v.lang && v.lang.toLowerCase().startsWith(short))
    || null;
}

// Speak one short generic prompt. Resolves when speech ends (or is cancelled, or
// on any error) so callers can await it before opening a silent prayer window.
export async function speak(text, { lang = 'en', rate = 0.92, pitch = 1 } = {}) {
  if (!isSpeechSupported() || !text) return;
  const bcp47 = voiceLang(lang);
  const voices = await ensureVoices();
  await new Promise((resolve) => {
    let settled = false;
    const finish = () => { if (!settled) { settled = true; resolve(); } };
    try {
      const u = new window.SpeechSynthesisUtterance(text);
      u.lang = bcp47;
      u.rate = rate;
      u.pitch = pitch;
      const v = pickVoice(voices, bcp47);
      if (v) u.voice = v;
      u.onend = finish;
      u.onerror = finish;
      window.speechSynthesis.cancel(); // clear anything queued before we speak
      window.speechSynthesis.speak(u);
      // Safety net: some mobile engines never fire onend. Resolve on a length
      // estimate so the session can never stall waiting for the voice.
      const estMs = Math.min(20000, 1500 + text.length * 75);
      setTimeout(finish, estMs);
    } catch {
      devWarn('prayerGuideAudio: speak failed');
      finish();
    }
  });
}

export function cancelSpeech() {
  if (!isSpeechSupported()) return;
  try { window.speechSynthesis.cancel(); } catch { /* ignore */ }
}

// Best-effort pause/resume of an in-flight utterance (used by the Pause control).
export function pauseSpeech() {
  if (!isSpeechSupported()) return;
  try { window.speechSynthesis.pause(); } catch { /* ignore */ }
}

export function resumeSpeech() {
  if (!isSpeechSupported()) return;
  try { window.speechSynthesis.resume(); } catch { /* ignore */ }
}
