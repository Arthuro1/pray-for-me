import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import {
  PLANS,
  FEATURES,
  FREE_FEATURES,
  SUPPORTER_FEATURES,
  BILLING_ENABLED,
  getFeatureTier,
  isSupporterFeature,
  isFeatureAvailable,
  isSupporter,
  getUserPlan,
} from './plan';

describe('feature tiering', () => {
  it('tiers every declared feature as free or supporter with no overlap', () => {
    const free = new Set(FREE_FEATURES);
    const supporter = new Set(SUPPORTER_FEATURES);
    for (const key of FREE_FEATURES) expect(supporter.has(key)).toBe(false);
    for (const key of SUPPORTER_FEATURES) expect(free.has(key)).toBe(false);
  });

  it('keeps the dignity guarantees free (privacy, export, deletion, private prayers)', () => {
    const mustBeFree = [
      FEATURES.PRIVATE_PRAYERS,
      FEATURES.VAULT_BASIC,
      FEATURES.DATA_EXPORT,
      FEATURES.ACCOUNT_DELETION,
      FEATURES.PRIVACY_CENTER,
      FEATURES.SIMPLE_REMINDERS,
      FEATURES.PRAYER_JOURNAL,
    ];
    for (const key of mustBeFree) {
      expect(getFeatureTier(key)).toBe('free');
      expect(isFeatureAvailable(key, PLANS.FREE)).toBe(true);
    }
  });

  it('tiers advanced tools as supporter', () => {
    expect(getFeatureTier(FEATURES.ADVANCED_SCHEDULING)).toBe('supporter');
    expect(getFeatureTier(FEATURES.AI_ASSISTANCE)).toBe('supporter');
    expect(isSupporterFeature(FEATURES.PRAYER_CHAINS)).toBe(true);
    expect(isSupporterFeature(FEATURES.PRAYER_JOURNAL)).toBe(false);
  });

  it('defaults unknown feature keys to free / open (never accidentally gated)', () => {
    expect(getFeatureTier('nonexistentFeature')).toBe('free');
    expect(isFeatureAvailable('nonexistentFeature', PLANS.FREE)).toBe(true);
  });
});

describe('isFeatureAvailable soft gate', () => {
  it('while billing is disabled, supporter features are still available to free users', () => {
    // Documents current shipping behaviour: the app is never crippled.
    if (!BILLING_ENABLED) {
      expect(isFeatureAvailable(FEATURES.AI_ASSISTANCE, PLANS.FREE)).toBe(true);
      expect(isFeatureAvailable(FEATURES.ADVANCED_SCHEDULING, PLANS.FREE)).toBe(true);
    } else {
      expect(isFeatureAvailable(FEATURES.AI_ASSISTANCE, PLANS.FREE)).toBe(false);
    }
  });

  it('recognizes supporter and sponsor as paid tiers', () => {
    expect(isSupporter(PLANS.FREE)).toBe(false);
    expect(isSupporter(PLANS.SUPPORTER)).toBe(true);
    expect(isSupporter(PLANS.SPONSOR)).toBe(true);
  });
});

describe('getUserPlan', () => {
  const hadStorage = typeof globalThis.localStorage !== 'undefined';
  const store = {};
  beforeEach(() => {
    if (!hadStorage) {
      globalThis.localStorage = {
        getItem: (k) => (k in store ? store[k] : null),
        setItem: (k, v) => { store[k] = String(v); },
        removeItem: (k) => { delete store[k]; },
      };
    }
  });
  afterEach(() => {
    if (!hadStorage) delete globalThis.localStorage;
    else localStorage.removeItem('pfm_plan');
    for (const k of Object.keys(store)) delete store[k];
  });

  it('defaults to free with no stored plan', () => {
    expect(getUserPlan()).toBe(PLANS.FREE);
  });

  it('reads a valid stored plan and ignores an invalid one', () => {
    localStorage.setItem('pfm_plan', PLANS.SUPPORTER);
    expect(getUserPlan()).toBe(PLANS.SUPPORTER);
    localStorage.setItem('pfm_plan', 'bogus');
    expect(getUserPlan()).toBe(PLANS.FREE);
  });
});
