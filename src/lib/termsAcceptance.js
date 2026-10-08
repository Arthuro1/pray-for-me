// Acceptance is scoped to the signed-in account, origin and published terms
// version. It records no prayer content and is deliberately separate from auth.
export const TERMS_VERSION = '2026-10-08';

const storageKey = (userId) => `pfm_terms_acceptance:${userId}`;

export function hasAcceptedTerms(userId) {
  if (!userId) return false;
  try {
    const record = JSON.parse(localStorage.getItem(storageKey(userId)) || 'null');
    return record?.version === TERMS_VERSION && typeof record.acceptedAt === 'string';
  } catch {
    return false;
  }
}

export function acceptTerms(userId) {
  if (!userId) return;
  try {
    localStorage.setItem(storageKey(userId), JSON.stringify({
      version: TERMS_VERSION,
      acceptedAt: new Date().toISOString(),
    }));
  } catch {
    // The gate keeps explicit acceptance for this mounted session. Browsers
    // without writable storage must ask again on the next visit, never fail open.
  }
}
