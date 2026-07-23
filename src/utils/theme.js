export function normalizeTheme(value) {
  return value === 'dark' || value === 'night' ? 'dark' : 'light';
}
