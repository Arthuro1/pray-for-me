// AI consent helpers. Consent is a settings-store field (aiConsentPrayer /
// aiConsentHome), so it is account-level: persisted locally with the other
// settings and synced through user_settings to every browser the user signs into.
//
// Kept out of AiConsentModal.jsx so that file only exports a component (keeps Fast
// Refresh working) and so non-UI callers can read/grant consent without importing
// the modal.
import usePrayerStore from '../store/prayerStore';
import { track, EVENTS } from './analytics';

export function hasAiConsent(context = 'prayer') {
  const { aiConsentPrayer, aiConsentHome, aiPrayerContentEnabled } = usePrayerStore.getState().settings;
  // Master switch: "Disable AI for prayer content" turns every prayer-content AI
  // feature off regardless of prior consent. Defaults on when unset.
  if (aiPrayerContentEnabled === false) return false;
  return context === 'home' ? !!aiConsentHome : !!aiConsentPrayer;
}

export function grantAiConsent(context = 'prayer') {
  usePrayerStore.getState().updateSettings(
    context === 'home' ? { aiConsentHome: true } : { aiConsentPrayer: true }
  );
  track(EVENTS.AI_CONSENT_ENABLED, { source: context });
}

// True if the user has opted into AI for at least one context.
export function hasAnyAiConsent() {
  const { aiConsentPrayer, aiConsentHome } = usePrayerStore.getState().settings;
  return !!(aiConsentPrayer || aiConsentHome);
}

// Withdraw consent everywhere — the next AI use will ask again.
export function revokeAiConsent() {
  usePrayerStore.getState().updateSettings({ aiConsentPrayer: false, aiConsentHome: false });
  track(EVENTS.AI_CONSENT_REVOKED);
}
