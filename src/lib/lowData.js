// Low data mode: a device-local setting for believers on expensive or fragile
// connections. When on, NONESSENTIAL remote fetches are deferred — verse text
// that isn't already bundled or cached stays a reference with a link — while
// everything core (prayer capture, Today, sessions, offline writes and their
// sync) keeps working exactly as before. Deliberately NOT account-synced:
// bandwidth is a property of the device/network, not of the account.
const SETTINGS_KEY = 'pfm_settings';

export function isLowDataMode() {
  try {
    return !!JSON.parse(localStorage.getItem(SETTINGS_KEY) || '{}').lowDataMode;
  } catch {
    return false;
  }
}
