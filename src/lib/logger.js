// Dev-only logging. In production these are no-ops, so prayer content, AI
// prompts, or error bodies that may echo user input never reach the browser
// console (or any log sink / extension that scrapes it). Always log status
// codes and short tags here — never raw user content or full error objects.
const isDev = (() => {
  try {
    return !!import.meta.env?.DEV;
  } catch {
    return false;
  }
})();

export function devError(...args) {
  if (isDev) console.error(...args);
}

export function devWarn(...args) {
  if (isDev) console.warn(...args);
}
