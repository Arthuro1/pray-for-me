// The stored appearance preference: 'light', 'dark', or 'system' (follow the
// device). A legacy Night value is folded into Dark, anything else into Light.
export function normalizeTheme(value) {
  if (value === 'system') return 'system';
  return value === 'dark' || value === 'night' ? 'dark' : 'light';
}

const darkQuery = () => (typeof window !== 'undefined' && window.matchMedia
  ? window.matchMedia('(prefers-color-scheme: dark)')
  : null);

// The theme actually drawn: a 'system' preference asks the device.
export function resolveTheme(preference) {
  const value = normalizeTheme(preference);
  if (value !== 'system') return value;
  return darkQuery()?.matches ? 'dark' : 'light';
}

let stopFollowingDevice = null;

// Draw a preference on <html data-theme>. 'system' keeps following the device
// as it switches between light and dark, until another preference is applied.
export function applyTheme(preference) {
  stopFollowingDevice?.();
  stopFollowingDevice = null;
  const root = document.documentElement;
  root.setAttribute('data-theme', resolveTheme(preference));
  const query = normalizeTheme(preference) === 'system' ? darkQuery() : null;
  if (!query?.addEventListener) return;
  const follow = () => root.setAttribute('data-theme', query.matches ? 'dark' : 'light');
  query.addEventListener('change', follow);
  stopFollowingDevice = () => query.removeEventListener('change', follow);
}
