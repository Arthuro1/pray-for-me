// @vitest-environment jsdom
import { beforeEach, describe, expect, it, vi } from 'vitest';

const state = vi.hoisted(() => ({
  count: 0, notes: [], forms: [], guest: false, keys: [], queue: [], record: 'local-wrapper',
  key: {}, unlocked: true, verify: vi.fn(), read: vi.fn(), getUser: vi.fn(),
}));
vi.mock('idb-keyval', () => ({ keys: vi.fn(async () => state.keys), get: vi.fn(async (key) => key === 'pfm_mutation_queue' ? state.queue : {}) }));
vi.mock('./supabase', () => ({ supabase: {
  auth: { getUser: state.getUser },
  from: vi.fn(() => ({ select: vi.fn(() => ({ eq: vi.fn(() => ({ maybeSingle: state.read })) })) })),
} }));
vi.mock('./crypto/keyManager', () => ({
  exportVaultRecord: () => state.record, getMasterKey: () => state.key,
  inspectVaultRecord: (record) => record?.valid ? { json: 'server-wrapper' } : null,
  isUnlocked: () => state.unlocked, verifyRecoveryPassphrase: state.verify,
}));
vi.mock('./mutationQueue', () => ({ pendingCount: () => state.count }));
vi.mock('./prayerNoteDrafts', () => ({ listNoteDraftIds: vi.fn(async () => state.notes), loadNoteDraft: vi.fn(async () => ({ text: 'unsaved note' })) }));
vi.mock('./prayerFormDrafts', () => ({ listFormDraftSlots: vi.fn(async () => state.forms), loadFormDraft: vi.fn(async () => ({ title: 'unsaved prayer' })) }));
vi.mock('./guestPrayerDraft', () => ({ loadGuestDraft: vi.fn(async () => state.guest ? { title: 'guest prayer' } : null) }));

import {
  checkOriginMigrationReady, isMigrationVerificationCurrent, isOriginalAppOrigin,
  isNewAppOrigin, migrationPromptSnoozed, snoozeMigrationPrompt, recheckOriginMigrationReady,
} from './originMigration';

beforeEach(() => {
  vi.clearAllMocks();
  localStorage.clear();
  Object.assign(state, { count: 0, notes: [], forms: [], guest: false, keys: [], queue: [], record: 'local-wrapper', key: {}, unlocked: true });
  Object.defineProperty(navigator, 'onLine', { value: true, configurable: true });
  vi.stubGlobal('indexedDB', {});
  state.verify.mockResolvedValue(true);
  state.getUser.mockResolvedValue({ data: { user: { id: 'user-1' } }, error: null });
  state.read.mockResolvedValue({ data: { record: { valid: true } }, error: null });
});

describe('origin migration prompt', () => {
  it('accepts only exact trusted production origins', () => {
    for (const origin of ['https://praystead.com', 'https://www.praystead.com']) expect(isOriginalAppOrigin(origin)).toBe(true);
    for (const origin of ['http://praystead.com', 'https://praystead.com:444', 'https://praystead.com.evil.test', 'https://qetoret.com']) expect(isOriginalAppOrigin(origin)).toBe(false);
    expect(isNewAppOrigin('https://qetoret.com')).toBe(true);
    expect(isNewAppOrigin('https://qetoret.com.evil.test')).toBe(false);
  });

  it('snoozes only the current account for seven days', () => {
    snoozeMigrationPrompt('user-1', 1000);
    expect(migrationPromptSnoozed('user-1', 1001)).toBe(true);
    expect(migrationPromptSnoozed('user-2', 1001)).toBe(false);
    expect(migrationPromptSnoozed('user-1', 1000 + 7 * 86400000)).toBe(false);
    expect(localStorage.getItem('pfm_origin_migration_snooze:user-1')).toBe(String(1000 + 7 * 86400000));
  });
});

describe('migration readiness', () => {
  it('verifies the server wrapper against the running key without writing recovery or sending a passphrase', async () => {
    const result = await checkOriginMigrationReady('user-1', 'private recovery passphrase');
    expect(result.status).toBe('ready');
    expect(state.verify).toHaveBeenCalledWith('private recovery passphrase', { valid: true });
    expect(state.getUser).toHaveBeenCalledWith();
    expect(state.read).toHaveBeenCalledWith();
    expect(isMigrationVerificationCurrent(result, 'user-1')).toBe(true);
    expect(isMigrationVerificationCurrent(result, 'another-user')).toBe(false);
    expect(isMigrationVerificationCurrent(result, 'user-1', result.checkedAt + 60000)).toBe(false);
  });

  it.each(['notes', 'forms', 'guest'])('keeps local %s drafts on the original origin', async (kind) => {
    state[kind] = kind === 'guest' ? true : ['unfinished'];
    expect(await checkOriginMigrationReady('user-1', 'pass')).toEqual({ status: 'drafts' });
    expect(state.read).not.toHaveBeenCalled();
  });

  it('does not strand users on expired or corrupt drafts that the existing readers reject', async () => {
    state.keys = ['pfm_guest_draft', 'pfm_note_draft:expired', 'pfm_form_draft:expired'];
    state.notes = ['expired'];
    state.forms = ['expired'];
    const { loadNoteDraft } = await import('./prayerNoteDrafts');
    const { loadFormDraft } = await import('./prayerFormDrafts');
    loadNoteDraft.mockResolvedValue(null);
    loadFormDraft.mockResolvedValue(null);
    expect((await checkOriginMigrationReady('user-1', 'pass')).status).toBe('ready');
    loadNoteDraft.mockResolvedValue({ text: 'valid note' });
    loadFormDraft.mockResolvedValue({ title: 'valid prayer' });
  });

  it('blocks queued changes and offline checks', async () => {
    state.count = 1;
    expect(await checkOriginMigrationReady('user-1', 'pass')).toEqual({ status: 'pending' });
    state.count = 0;
    Object.defineProperty(navigator, 'onLine', { value: false, configurable: true });
    expect(await checkOriginMigrationReady('user-1', 'pass')).toEqual({ status: 'offline' });
    expect(state.read).not.toHaveBeenCalled();
  });

  it('rechecks IndexedDB drafts and other-tab queued writes at the final click', async () => {
    const result = await checkOriginMigrationReady('user-1', 'pass');
    state.notes = ['written-after-verification'];
    expect(await recheckOriginMigrationReady(result, 'user-1')).toEqual({ status: 'drafts' });
    state.notes = [];
    state.queue = [{ id: 'other-tab-write' }];
    expect(await recheckOriginMigrationReady(result, 'user-1')).toEqual({ status: 'pending' });
    state.queue = [];
    state.record = 'changed-wrapper';
    expect(await recheckOriginMigrationReady(result, 'user-1')).toEqual({ status: 'changed' });
  });

  it('fails closed when storage inventory cannot be read', async () => {
    const { keys } = await import('idb-keyval');
    keys.mockRejectedValueOnce(new Error('storage blocked'));
    expect(await checkOriginMigrationReady('user-1', 'pass')).toEqual({ status: 'failed' });
  });

  it('requires a valid online recovery record and a matching current account', async () => {
    state.read.mockResolvedValueOnce({ data: null, error: null });
    expect(await checkOriginMigrationReady('user-1', 'pass')).toEqual({ status: 'failed' });
    state.getUser.mockResolvedValueOnce({ data: { user: { id: 'another-user' } } });
    expect(await checkOriginMigrationReady('user-1', 'pass')).toEqual({ status: 'failed' });
    state.read.mockResolvedValueOnce({ data: { record: { valid: true } }, error: { code: 'denied' } });
    expect(await checkOriginMigrationReady('user-1', 'pass')).toEqual({ status: 'failed' });
  });

  it('rejects wrong passphrases or unrelated keys and changes while checking', async () => {
    state.verify.mockResolvedValueOnce(false);
    expect(await checkOriginMigrationReady('user-1', 'pass')).toEqual({ status: 'wrongPassphrase' });
    state.verify.mockImplementationOnce(async () => { state.key = {}; return true; });
    expect(await checkOriginMigrationReady('user-1', 'pass')).toEqual({ status: 'changed' });
    state.verify.mockImplementationOnce(async () => { state.count = 1; return true; });
    expect(await checkOriginMigrationReady('user-1', 'pass')).toEqual({ status: 'pending' });
  });
});
