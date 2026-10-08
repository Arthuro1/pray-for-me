import { beforeEach, describe, expect, it, vi } from 'vitest';

const mocks = vi.hoisted(() => ({
  aiFetch: vi.fn(),
  from: vi.fn(),
  upsert: vi.fn(),
  deriveAccountHmacKey: vi.fn(),
  computeSourceHmac: vi.fn(),
  encryptAccountTranslation: vi.fn(),
  decryptAccountTranslation: vi.fn(),
  ensureGroupKey: vi.fn(),
  deriveGroupHmacKey: vi.fn(),
  encryptGroupTranslation: vi.fn(),
  decryptGroupTranslation: vi.fn(),
  redactMany: vi.fn(),
  restore: vi.fn(),
}));

vi.mock('../lib/aiClient', () => ({ aiEnabled: true, aiFetch: mocks.aiFetch }));
vi.mock('../lib/aiRedaction', () => ({ redactMany: mocks.redactMany, restore: mocks.restore }));
vi.mock('../lib/supabase', () => ({ supabase: { from: mocks.from } }));
vi.mock('../lib/crypto/groupKeys', () => ({ ensureGroupKey: mocks.ensureGroupKey }));
vi.mock('../lib/crypto/translationCrypto', () => ({
  deriveAccountHmacKey: mocks.deriveAccountHmacKey,
  computeSourceHmac: mocks.computeSourceHmac,
  encryptAccountTranslation: mocks.encryptAccountTranslation,
  decryptAccountTranslation: mocks.decryptAccountTranslation,
  deriveGroupHmacKey: mocks.deriveGroupHmacKey,
  encryptGroupTranslation: mocks.encryptGroupTranslation,
  decryptGroupTranslation: mocks.decryptGroupTranslation,
}));

import useTranslationStore, { clearTranslationCache } from './translationStore';
import { validateTaskRequest } from '../../server/aiTasks';

function deferred() {
  let resolve;
  const promise = new Promise((done) => { resolve = done; });
  return { promise, resolve };
}

function success(input) {
  const translations = Object.fromEntries(input.texts.map((text, index) => [index, `translated: ${text}`]));
  return { ok: true, status: 200, json: async () => ({ data: { translations } }) };
}

function tableQuery(table, data = []) {
  const chain = {
    select: () => chain,
    eq: () => chain,
    in: () => chain,
    then: (resolve, reject) => Promise.resolve({ data, error: null }).then(resolve, reject),
    upsert: (rows, options) => mocks.upsert(table, rows, options),
  };
  return chain;
}

async function flushMicrotasks() {
  for (let index = 0; index < 20; index += 1) await Promise.resolve();
}

const translate = (...args) => useTranslationStore.getState().translateTexts(...args);
const tr = (...args) => useTranslationStore.getState().tr(...args);

beforeEach(() => {
  clearTranslationCache();
  Object.values(mocks).forEach((mock) => mock.mockReset());
  mocks.aiFetch.mockImplementation(async (_, input) => success(input));
  mocks.from.mockImplementation((table) => tableQuery(table));
  mocks.upsert.mockResolvedValue({ data: null, error: null });
  mocks.redactMany.mockImplementation((texts) => ({ texts, map: {} }));
  mocks.restore.mockImplementation((text) => text);
  mocks.deriveAccountHmacKey.mockResolvedValue('account-hmac-key');
  mocks.computeSourceHmac.mockImplementation(async (_, text) => `hmac:${text}`);
  mocks.encryptAccountTranslation.mockImplementation(async ({ sourceHmac }) => ({
    source_hmac: sourceHmac, encrypted_translation: 'encrypted-account', nonce: 'account-nonce', encryption_version: 2,
  }));
  mocks.decryptAccountTranslation.mockResolvedValue('account cache translation');
  mocks.ensureGroupKey.mockResolvedValue({ key: 'group-key', version: 3 });
  mocks.deriveGroupHmacKey.mockResolvedValue('group-hmac-key');
  mocks.encryptGroupTranslation.mockImplementation(async ({ sourceHmac }) => ({
    source_hmac: sourceHmac, encrypted_translation: 'encrypted-group', nonce: 'group-nonce', encryption_version: 2, key_version: 3,
  }));
  mocks.decryptGroupTranslation.mockResolvedValue('group cache translation');
});

describe('translation request deduplication', () => {
  it('coalesces overlapping automatic and detail requests in the same turn', async () => {
    const automatic = useTranslationStore.getState().translateContent([
      { user_id: 'user-1', title: 'Prayer title', description: 'Prayer details' },
    ], [], 'de', 'user-1');
    const detail = translate(['Prayer title', 'Prayer details', 'Prayer update'], 'de', 'user-1');
    await Promise.all([automatic, detail]);

    expect(mocks.aiFetch).toHaveBeenCalledTimes(1);
    expect(mocks.aiFetch).toHaveBeenCalledWith('translate_texts', {
      lang: 'de', texts: ['Prayer title', 'Prayer details', 'Prayer update'],
    }, { signal: expect.any(AbortSignal) });
    expect(useTranslationStore.getState().translating).toBe(false);
  });

  it('translates only records owned by the current account during an account switch', async () => {
    await useTranslationStore.getState().translateContent([
      {
        user_id: 'old-user', title: 'Old private prayer', description: 'Old private details',
        testimony: 'Old private testimony', prayer_updates: [{ text: 'Old private update' }],
        prayer_points: [{ title: 'Old private prayer point' }],
      },
      { title: 'Prayer without an owner', description: 'Unowned private details' },
      {
        user_id: 'current-user', title: 'Current prayer', description: 'Current details',
        prayer_updates: [{ text: 'Current update' }], prayer_points: [{ title: 'Current prayer point' }],
      },
    ], [
      { user_id: 'old-user', name: 'Old private category' },
      { name: 'Category without an owner' },
      { user_id: 'current-user', name: 'Current category' },
    ], 'de', 'current-user');

    expect(mocks.aiFetch).toHaveBeenCalledTimes(1);
    expect(mocks.aiFetch.mock.calls[0][1].texts).toEqual([
      'Current category', 'Current prayer', 'Current details', 'Current update', 'Current prayer point',
    ]);
    expect(mocks.redactMany.mock.calls.flatMap(([texts]) => texts).join(' ')).not.toMatch(/Old|Unowned|without an owner/);
  });

  it('rechecks cache misses when overlapping work arrives during inference', async () => {
    const firstResponse = deferred();
    mocks.aiFetch.mockImplementationOnce(() => firstResponse.promise);
    const first = translate(['First prayer'], 'de', 'user-1');
    await vi.waitFor(() => expect(mocks.aiFetch).toHaveBeenCalledTimes(1));
    const second = translate(['First prayer', 'New update'], 'de', 'user-1');
    const third = translate(['New update'], 'de', 'user-1');
    expect(mocks.aiFetch).toHaveBeenCalledTimes(1);

    firstResponse.resolve(success({ texts: ['First prayer'] }));
    await Promise.all([first, second, third]);
    expect(mocks.aiFetch).toHaveBeenCalledTimes(2);
    expect(mocks.aiFetch.mock.calls[1][1].texts).toEqual(['New update']);
  });

  it('serializes distinct scopes and languages rather than starting a request burst', async () => {
    const firstResponse = deferred();
    mocks.aiFetch.mockImplementationOnce(() => firstResponse.promise);
    const first = translate(['Personal prayer'], 'de', 'user-1');
    await vi.waitFor(() => expect(mocks.aiFetch).toHaveBeenCalledTimes(1));
    const second = translate(['Community prayer'], 'fr', 'user-1', 'group-1');
    await flushMicrotasks();
    expect(mocks.ensureGroupKey).not.toHaveBeenCalled();
    expect(mocks.aiFetch).toHaveBeenCalledTimes(1);

    firstResponse.resolve(success({ texts: ['Personal prayer'] }));
    await Promise.all([first, second]);
    expect(mocks.aiFetch).toHaveBeenCalledTimes(2);
    expect(mocks.aiFetch.mock.calls[1][1].lang).toBe('fr');
  });

  it('caches each successful chunk while a later chunk is still pending', async () => {
    const laterResponse = deferred();
    mocks.aiFetch.mockImplementationOnce(async (_, input) => success(input))
      .mockImplementationOnce(() => laterResponse.promise);
    const texts = Array.from({ length: 21 }, (_, index) => `Prayer ${index}`);
    const work = translate(texts, 'de', 'user-1');
    await vi.waitFor(() => expect(mocks.aiFetch).toHaveBeenCalledTimes(2));

    expect(tr(texts[0], 'de')).toBe(`translated: ${texts[0]}`);
    expect(tr(texts[20], 'de')).toBe(texts[20]);
    expect(useTranslationStore.getState().translating).toBe(true);
    await translate([texts[0]], 'de', 'user-1');
    expect(mocks.aiFetch).toHaveBeenCalledTimes(2);
    laterResponse.resolve(success({ texts: [texts[20]] }));
    await work;
  });
});

describe('translation request bounds and failures', () => {
  it.each([429, 401, 503])('stops all later chunks after HTTP %i', async (status) => {
    mocks.aiFetch.mockResolvedValueOnce({ ok: false, status });
    const texts = Array.from({ length: 45 }, (_, index) => `Prayer ${index}`);
    await translate(texts, 'de', 'user-1');
    expect(mocks.aiFetch).toHaveBeenCalledTimes(1);
    expect(mocks.upsert).not.toHaveBeenCalled();
    expect(tr(texts[0], 'de')).toBe(texts[0]);
  });

  it('stops later chunks after a network failure', async () => {
    mocks.aiFetch.mockRejectedValueOnce(new Error('Network unavailable'));
    await translate(Array.from({ length: 30 }, (_, index) => `Prayer ${index}`), 'de', 'user-1');
    expect(mocks.aiFetch).toHaveBeenCalledTimes(1);
  });

  it.each([
    ['item count', Array.from({ length: 50 }, (_, index) => `Prayer ${index}`), 3],
    ['character count', Array.from({ length: 7 }, (_, index) => `${'x'.repeat(3990)}${index}`), 2],
    ['UTF-8 byte count', Array.from({ length: 7 }, (_, index) => `${'界'.repeat(3990)}${index}`), 4],
  ])('keeps every %s batch inside the server input contract', async (_, texts, expectedCalls) => {
    await translate(texts, 'de', 'user-1');
    expect(mocks.aiFetch).toHaveBeenCalledTimes(expectedCalls);
    const sent = [];
    for (const [task, input] of mocks.aiFetch.mock.calls) {
      expect(validateTaskRequest({ task, input })).not.toBeNull();
      expect(new TextEncoder().encode(JSON.stringify({ task, input })).byteLength).toBeLessThanOrEqual(32768);
      sent.push(...input.texts);
    }
    expect(sent).toEqual(texts);
  });

  it('skips unsupported individual inputs without rejecting other translations', async () => {
    await translate([null, 12, '', '   ', 'x'.repeat(4001), 'Supported prayer'], 'de', 'user-1');
    expect(mocks.aiFetch).toHaveBeenCalledTimes(1);
    expect(mocks.aiFetch.mock.calls[0][1].texts).toEqual(['Supported prayer']);
  });

  it('validates actual strings after redaction changes their lengths', async () => {
    mocks.redactMany.mockImplementation((texts) => ({
      texts: texts.map((text) => text === 'Expanded placeholder' ? 'x'.repeat(4001) : text), map: {},
    }));
    await translate(['Supported prayer', 'Expanded placeholder', 'Other prayer'], 'de', 'user-1');
    expect(mocks.aiFetch).toHaveBeenCalledTimes(1);
    expect(mocks.aiFetch.mock.calls[0][1].texts).toEqual(['Supported prayer', 'Other prayer']);
    expect(tr('Expanded placeholder', 'de')).toBe('Expanded placeholder');
  });

  it('restores sensitive placeholders using only the values sent in that batch', async () => {
    mocks.redactMany.mockImplementation((texts) => ({
      texts: texts.map((_, index) => `[EMAIL_${index + 1}]`),
      map: Object.fromEntries(texts.map((text, index) => [`[EMAIL_${index + 1}]`, text])),
    }));
    mocks.restore.mockImplementation((text, map) => Object.entries(map)
      .reduce((out, [placeholder, original]) => out.split(placeholder).join(original), text));
    const texts = Array.from({ length: 21 }, (_, index) => `private-${index}@example.test`);
    await translate(texts, 'de', 'user-1');
    expect(mocks.aiFetch).toHaveBeenCalledTimes(2);
    expect(Object.values(mocks.restore.mock.calls.at(-1)[1])).toEqual([texts[20]]);
    expect(tr(texts[20], 'de')).toBe(`translated: ${texts[20]}`);
  });
});

describe('translation cancellation on cache reset', () => {
  it('cancels queued work before it dispatches', async () => {
    const first = translate(['First prayer'], 'de', 'user-1');
    const second = translate(['Second prayer'], 'fr', 'user-1', 'group-1');
    clearTranslationCache();
    await Promise.all([first, second]);
    await flushMicrotasks();
    expect(mocks.aiFetch).not.toHaveBeenCalled();
    expect(mocks.deriveAccountHmacKey).not.toHaveBeenCalled();
    expect(mocks.ensureGroupKey).not.toHaveBeenCalled();
    expect(useTranslationStore.getState().translating).toBe(false);
  });

  it('discards an in-flight response and all queued work after sign-out or consent withdrawal', async () => {
    const response = deferred();
    mocks.aiFetch.mockImplementationOnce(() => response.promise);
    const texts = Array.from({ length: 21 }, (_, index) => `Prayer ${index}`);
    const first = translate(texts, 'de', 'user-1');
    await vi.waitFor(() => expect(mocks.aiFetch).toHaveBeenCalledTimes(1));
    const signal = mocks.aiFetch.mock.calls[0][2].signal;
    expect(signal.aborted).toBe(false);
    const queued = translate(['Queued private prayer'], 'fr', 'user-1');
    clearTranslationCache();
    expect(signal.aborted).toBe(true);
    await Promise.all([first, queued]);
    response.resolve(success({ texts: texts.slice(0, 20) }));
    await flushMicrotasks();

    expect(mocks.aiFetch).toHaveBeenCalledTimes(1);
    expect(mocks.upsert).not.toHaveBeenCalled();
    expect(tr(texts[0], 'de')).toBe(texts[0]);
    expect(useTranslationStore.getState().translating).toBe(false);
  });

  it('cancels cache lookup before dispatch if the vault locks during key derivation', async () => {
    const key = deferred();
    mocks.deriveAccountHmacKey.mockImplementationOnce(() => key.promise);
    const work = translate(['Private prayer'], 'de', 'user-1');
    await vi.waitFor(() => expect(mocks.deriveAccountHmacKey).toHaveBeenCalledTimes(1));
    clearTranslationCache();
    key.resolve('old-account-key');
    await work;
    await flushMicrotasks();
    expect(mocks.from).not.toHaveBeenCalled();
    expect(mocks.aiFetch).not.toHaveBeenCalled();
  });

  it('cancels community cache lookup after a group key finishes loading late', async () => {
    const key = deferred();
    mocks.ensureGroupKey.mockImplementationOnce(() => key.promise);
    const work = translate(['Community prayer'], 'de', 'user-1', 'group-1');
    await vi.waitFor(() => expect(mocks.ensureGroupKey).toHaveBeenCalledTimes(1));
    clearTranslationCache();
    key.resolve({ key: 'old-group-key', version: 3 });
    await work;
    await flushMicrotasks();
    expect(mocks.deriveGroupHmacKey).not.toHaveBeenCalled();
    expect(mocks.aiFetch).not.toHaveBeenCalled();
  });

  it('discards a response body that finishes parsing after reset', async () => {
    const body = deferred();
    const json = vi.fn(() => body.promise);
    mocks.aiFetch.mockResolvedValueOnce({ ok: true, status: 200, json });
    const work = translate(['Private prayer'], 'de', 'user-1');
    await vi.waitFor(() => expect(json).toHaveBeenCalledTimes(1));
    clearTranslationCache();
    body.resolve({ data: { translations: { 0: 'Old translated prayer' } } });
    await work;
    await flushMicrotasks();
    expect(tr('Private prayer', 'de')).toBe('Private prayer');
    expect(mocks.upsert).not.toHaveBeenCalled();
  });

  it('does not restore plaintext after an encrypted cache decryption finishes late', async () => {
    const decryption = deferred();
    mocks.from.mockImplementation((table) => tableQuery(table, [{ source_hmac: 'hmac:Private prayer' }]));
    mocks.decryptAccountTranslation.mockImplementationOnce(() => decryption.promise);
    const work = translate(['Private prayer'], 'de', 'user-1');
    await vi.waitFor(() => expect(mocks.decryptAccountTranslation).toHaveBeenCalledTimes(1));
    clearTranslationCache();
    decryption.resolve('Old account translation');
    await work;
    await flushMicrotasks();
    expect(tr('Private prayer', 'de')).toBe('Private prayer');
    expect(mocks.aiFetch).not.toHaveBeenCalled();
  });

  it('does not write stale encrypted cache rows after a reset during encryption', async () => {
    const encryption = deferred();
    mocks.encryptAccountTranslation.mockImplementationOnce(() => encryption.promise);
    const work = translate(['Private prayer'], 'de', 'user-1');
    await vi.waitFor(() => expect(mocks.encryptAccountTranslation).toHaveBeenCalledTimes(1));
    clearTranslationCache();
    encryption.resolve({ encrypted_translation: 'stale-ciphertext' });
    await work;
    await flushMicrotasks();
    expect(mocks.upsert).not.toHaveBeenCalled();
    expect(tr('Private prayer', 'de')).toBe('Private prayer');
  });

  it('lets a new account proceed while an old response is unresolved without mixing cache or busy state', async () => {
    const oldResponse = deferred();
    const newResponse = deferred();
    mocks.aiFetch.mockImplementationOnce(() => oldResponse.promise)
      .mockImplementationOnce(() => newResponse.promise);
    const oldWork = translate(['Old private prayer'], 'de', 'user-1');
    await vi.waitFor(() => expect(mocks.aiFetch).toHaveBeenCalledTimes(1));
    clearTranslationCache();
    const newWork = translate(['New private prayer'], 'de', 'user-2');
    await vi.waitFor(() => expect(mocks.aiFetch).toHaveBeenCalledTimes(2));
    oldResponse.resolve(success({ texts: ['Old private prayer'] }));
    await oldWork;
    await flushMicrotasks();
    expect(useTranslationStore.getState().translating).toBe(true);
    expect(tr('Old private prayer', 'de')).toBe('Old private prayer');

    newResponse.resolve(success({ texts: ['New private prayer'] }));
    await newWork;
    expect(tr('New private prayer', 'de')).toBe('translated: New private prayer');
    expect(useTranslationStore.getState().translating).toBe(false);
    expect(mocks.upsert.mock.calls.every(([, rows]) => rows.every((row) => row.user_id === 'user-2'))).toBe(true);
  });
});

describe('encrypted translation cache compatibility', () => {
  it('uses an account cache hit without spending another AI request', async () => {
    mocks.from.mockImplementation((table) => tableQuery(table, [{ source_hmac: 'hmac:Private prayer' }]));
    await translate(['Private prayer'], 'de', 'user-1');
    expect(tr('Private prayer', 'de')).toBe('account cache translation');
    expect(mocks.aiFetch).not.toHaveBeenCalled();
  });

  it('uses group cache hits and preserves encrypted account/group writes for fresh community text', async () => {
    mocks.from.mockImplementation((table) => tableQuery(table, table === 'community_translations'
      ? [{ source_hmac: 'hmac:Cached community prayer' }] : []));
    await translate(['Cached community prayer', 'New community prayer'], 'de', 'user-1', 'group-1');
    expect(tr('Cached community prayer', 'de')).toBe('group cache translation');
    expect(mocks.aiFetch.mock.calls[0][1].texts).toEqual(['New community prayer']);
    expect(mocks.upsert.mock.calls.map(([table]) => table)).toEqual(['translations', 'community_translations']);
    expect(mocks.upsert.mock.calls[0][1][0]).toMatchObject({
      user_id: 'user-1', encrypted_translation: 'encrypted-account', target_language: 'de',
    });
    expect(mocks.upsert.mock.calls[1][1][0]).toMatchObject({
      group_id: 'group-1', encrypted_translation: 'encrypted-group', target_language: 'de', key_version: 3,
    });
    for (const [, rows] of mocks.upsert.mock.calls) {
      expect(rows[0]).not.toHaveProperty('original_text');
      expect(rows[0]).not.toHaveProperty('translated_text');
    }
  });
});
