// AI consent helpers. Consent is a settings-store field (aiConsentPrayer /
// aiConsentHome), so it is account-level: persisted locally with the other
// settings and synced through user_settings to every browser the user signs into.
//
// Kept out of AiConsentModal.jsx so that file only exports a component (keeps Fast
// Refresh working) and so non-UI callers can read/grant consent without importing
// the modal.
import usePrayerStore from '../store/prayerStore';
import { track, EVENTS } from './analytics';
import { clearAllAiResultCaches } from './aiResultCache';
import { resetAiRequestState } from './aiCore';
import { clearTranslationCache } from '../store/translationStore';
import { acknowledgeAiProvider, clearAiProviderAcknowledgement, hasAiProviderAcknowledgement } from './aiProvider';

export function hasAiConsent(context = 'prayer') {
  const { settings: { aiConsentPrayer, aiConsentHome }, userId } = usePrayerStore.getState();
  const consent = context === 'home' ? !!aiConsentHome : !!aiConsentPrayer;
  return consent && hasAiProviderAcknowledgement(userId, context);
}

export function grantAiConsent(context = 'prayer') {
  acknowledgeAiProvider(usePrayerStore.getState().userId, context);
  usePrayerStore.getState().updateSettings(
    context === 'home' ? { aiConsentHome: true } : { aiConsentPrayer: true }
  );
  track(EVENTS.AI_CONSENT_ENABLED, { source: context });
}

// Withdraw consent everywhere — the next AI use will ask again. Withdrawal also
// clears AI result caches and in-memory AI request state, but never deletes
// prayer content (that stays in the user's encrypted store).
export function revokeAiConsent() {
  clearAiProviderAcknowledgement(usePrayerStore.getState().userId);
  usePrayerStore.getState().updateSettings({ aiConsentPrayer: false, aiConsentHome: false });
  clearAllAiResultCaches();
  clearTranslationCache();
  resetAiRequestState();
  track(EVENTS.AI_CONSENT_REVOKED);
}
