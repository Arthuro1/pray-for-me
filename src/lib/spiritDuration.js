// How long a time of praying in the Spirit lasts: one of a few presets, the
// person's own number of minutes, or no timer at all. The last choice is
// remembered on this device only — a preference, never a record of prayer.

export const PRESET_MINUTES = Object.freeze([5, 10, 15, 30]);
export const CUSTOM = 'custom';
export const OPEN_ENDED = 'open';
export const CUSTOM_MIN = 1;
export const CUSTOM_MAX = 60;

const STORAGE_KEY = 'pfm_spirit_duration';
const DEFAULT_CHOICE = Object.freeze({ choice: 10, custom: '20' });

// The custom field's minutes, or null while it holds anything but a whole
// number in range.
export function customMinutes(text) {
  if (!/^\d+$/.test(String(text).trim())) return null;
  const minutes = Number(text);
  return minutes >= CUSTOM_MIN && minutes <= CUSTOM_MAX ? minutes : null;
}

// Seconds to stay, `null` for no timer, or `undefined` when the custom field
// cannot start a time of prayer yet.
export function durationSeconds({ choice, custom }) {
  if (choice === OPEN_ENDED) return null;
  if (choice === CUSTOM) {
    const minutes = customMinutes(custom);
    return minutes === null ? undefined : minutes * 60;
  }
  return PRESET_MINUTES.includes(choice) ? choice * 60 : undefined;
}

function isChoice(value) {
  return value === OPEN_ENDED || value === CUSTOM || PRESET_MINUTES.includes(value);
}

export function readDurationChoice() {
  try {
    const saved = JSON.parse(localStorage.getItem(STORAGE_KEY) || 'null');
    if (!saved || !isChoice(saved.choice)) return { ...DEFAULT_CHOICE };
    return { choice: saved.choice, custom: customMinutes(saved.custom) ? String(saved.custom) : DEFAULT_CHOICE.custom };
  } catch {
    return { ...DEFAULT_CHOICE };
  }
}

export function rememberDurationChoice({ choice, custom }) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify({ choice, custom }));
  } catch {
    // Storage blocked (private mode): the next time simply starts from the default.
  }
}
