import { beforeEach, describe, expect, it, vi } from 'vitest';
import { createRecoveryService } from './recoveryService.js';
import { handleRecoveryRequest } from '../api/recovery.js';

const userId = '11111111-1111-4111-8111-111111111111';
const methodId = '22222222-2222-4222-8222-222222222222';
const challengeId = '33333333-3333-4333-8333-333333333333';
const b64 = size => Buffer.alloc(size, 17).toString('base64url');
const credentialId = b64(16);
const wrapper = { version: 1, kind: 'passkey-prf', accountId: userId, methodId, credentialId,
  rpId: 'qetoret.com', prfSalt: b64(32), hkdfSalt: b64(32), iv: b64(12), ciphertext: b64(48) };
const method = { id: methodId, user_id: userId, method_type: 'passkey', credential_id: credentialId,
  status: 'active', revision: 2, wrapper, created_at: '2026-10-09', verified_at: '2026-10-09' };
const credential = { id: credentialId, user_id: userId, method_id: methodId, rp_id: 'qetoret.com',
  public_key: b64(32), counter: 0, revision: 0, device_type: 'singleDevice', backed_up: false, transports: ['internal'] };
const assertion = { id: credentialId, rawId: credentialId, type: 'public-key', response: {
  clientDataJSON: b64(100), authenticatorData: b64(37), signature: b64(64), userHandle: Buffer.from(userId).toString('base64url'),
}, clientExtensionResults: { prf: { results: { first: 'SECRET_PRF' } } } };

function fixtures(enrollment = false) {
  const savedMethod = { ...method };
  const savedCredential = { ...credential };
  const rpc = vi.fn(async (name, values) => {
    if (name === 'check_recovery_rate_limit') return { data: true };
    if (name === 'consume_recovery_challenge') return { data: { id: challengeId, challenge: b64(32), origin: 'https://qetoret.com', rp_id: 'qetoret.com',
      operation: 'recover', credential_id: credentialId, expected_revision: 2 } };
    if (name === 'complete_recovery_assertion') {
      savedCredential.counter = values.p_new_counter;
      savedCredential.revision += 1;
      return { data: null };
    }
    return { data: { ...savedMethod } };
  });
  const queries = [];
  const db = { rpc, from(table) {
    const chain = { table, filters: [] };
    for (const key of ['select', 'eq', 'is', 'neq', 'order']) chain[key] = (...args) => { chain.filters.push([key, ...args]); return chain; };
    chain.update = (values) => { chain.patch = values; return chain; };
    chain.maybeSingle = async () => {
      if (table !== 'account_recovery_credentials') return { data: { ...savedMethod } };
      const matched = chain.filters.every(([kind, key, value]) => kind !== 'eq' && kind !== 'is'
        || (kind === 'is' && value === null ? savedCredential[key] == null : savedCredential[key] === value));
      if (!matched) return { data: null };
      if (chain.patch) Object.assign(savedCredential, chain.patch);
      return { data: { ...savedCredential } };
    };
    chain.then = (resolve, reject) => Promise.resolve({ data: [table === 'account_recovery_credentials' ? savedCredential : savedMethod] }).then(resolve, reject);
    queries.push(chain);
    return chain;
  } };
  const webauthn = {
    generateAuthenticationOptions: vi.fn(async () => ({ challenge: b64(32), userVerification: 'required' })),
    verifyAuthenticationResponse: vi.fn(async () => ({ verified: true, authenticationInfo: { newCounter: 0, userVerified: true, credentialDeviceType: 'singleDevice', credentialBackedUp: false } })),
  };
  const execute = createRecoveryService({ db, user: { id: userId }, config: { enrollment, rpID: 'qetoret.com', origin: 'https://qetoret.com' }, webauthn });
  return { execute, db, rpc, queries, webauthn, savedMethod, savedCredential };
}

describe('server recovery trust boundary', () => {
  it('keeps existing recovery assertions and reads working with enrollment disabled', async () => {
    const { execute, webauthn } = fixtures();
    expect((await execute({ action: 'read', methodId })).method.wrapper).toEqual(wrapper);
    const options = await execute({ action: 'assert-options', methodId, purpose: 'recover' });
    expect(options.method.status).toBe('active');
    expect(webauthn.generateAuthenticationOptions).toHaveBeenCalledWith(expect.objectContaining({ rpID: 'qetoret.com', userVerification: 'required' }));
  });
  it('returns pending revision-zero metadata so cancelled enrollment can be revoked', async () => {
    const { execute, rpc } = fixtures();
    const original = rpc.getMockImplementation();
    rpc.mockImplementation((name, args) => name === 'read_recovery_method'
      ? { data: { ...method, status: 'pending', revision: 0, credential_id: null, wrapper: null, verified_at: null } } : original(name, args));
    const result = await execute({ action: 'read', methodId });
    expect(result.method).toMatchObject({ id: methodId, status: 'pending', revision: 0, wrapper: null });
    await execute({ action: 'revoke', methodId, expectedRevision: result.method.revision });
    expect(rpc).toHaveBeenCalledWith('revoke_recovery_method', { p_user_id: userId, p_method_id: methodId, p_revision: 0 });
  });
  it('normalizes PostgREST singleton composite RPC arrays for reads and assertions', async () => {
    const { execute, rpc } = fixtures();
    const original = rpc.getMockImplementation();
    rpc.mockImplementation(async (name, args) => {
      const result = await original(name, args);
      return name === 'check_recovery_rate_limit' || name === 'complete_recovery_assertion' ? result : { data: [result.data] };
    });
    expect((await execute({ action: 'read', methodId })).method.id).toBe(methodId);
    expect((await execute({ action: 'assert-verify', methodId, challengeId, response: assertion })).proofId).toBe(challengeId);
  });
  it('fails closed on ambiguous multiple-row RPC results and empty challenge arrays', async () => {
    const { execute, rpc } = fixtures();
    rpc.mockImplementation(async name => ({ data: name === 'check_recovery_rate_limit' ? true : [method, method] }));
    await expect(execute({ action: 'read', methodId })).rejects.toMatchObject({ code: 'recovery_unavailable', status: 503 });
    rpc.mockImplementation(async name => ({ data: name === 'check_recovery_rate_limit' ? true : [] }));
    await expect(execute({ action: 'assert-verify', methodId, challengeId, response: assertion })).rejects.toMatchObject({ code: 'invalid_challenge', status: 409 });
  });
  it.each(['register-options', 'register-verify', 'commit', 'emergency-create'])('blocks new %s behind the disabled flag', async action => {
    await expect(fixtures().execute({ action, methodId })).rejects.toMatchObject({ code: 'enrollment_disabled', status: 403 });
  });
  it('binds every database lookup/RPC to Auth-derived ownership', async () => {
    const { execute, queries, rpc } = fixtures();
    await execute({ action: 'assert-options', methodId, purpose: 'recover', userId: 'attacker' });
    for (const query of queries) expect(query.filters).toContainEqual(['eq', 'user_id', userId]);
    for (const [, input] of rpc.mock.calls) expect(input.p_user_id).toBe(userId);
  });
  it('verifies signatures with exact origin, RP, challenge and UV and strips PRF output', async () => {
    const { execute, webauthn, rpc } = fixtures();
    expect((await execute({ action: 'assert-verify', methodId, challengeId, response: assertion })).proofId).toBe(challengeId);
    const [input] = webauthn.verifyAuthenticationResponse.mock.calls[0];
    expect(input).toMatchObject({ expectedOrigin: 'https://qetoret.com', expectedRPID: 'qetoret.com', expectedChallenge: b64(32), requireUserVerification: true });
    expect(JSON.stringify(input)).not.toContain('SECRET_PRF');
    expect(rpc).toHaveBeenCalledWith('complete_recovery_assertion', expect.objectContaining({ p_credential_revision: 0, p_old_counter: 0, p_new_counter: 0 }));
  });
  it('exposes only stored verified backup flags in method metadata', async () => {
    const { execute, savedCredential } = fixtures();
    savedCredential.device_type = 'multiDevice';
    const result = await execute({ action: 'list', backupState: { eligible: true, backedUp: true } });
    expect(result.methods[0].backupState).toEqual({ eligible: true, backedUp: false });
    expect((await execute({ action: 'read', methodId })).method.backupState).toEqual({ eligible: true, backedUp: false });
    expect(result.methods[0]).not.toHaveProperty('public_key');
    expect(result.methods[0]).not.toHaveProperty('counter');
    savedCredential.backed_up = true;
    expect((await execute({ action: 'assert-options', methodId, purpose: 'recover' })).method.backupState)
      .toEqual({ eligible: true, backedUp: true });
  });
  it('does not infer backup eligibility for an absent or foreign-RP credential', async () => {
    const { execute, savedCredential } = fixtures();
    savedCredential.device_type = 'multiDevice';
    savedCredential.backed_up = true;
    savedCredential.rp_id = 'localhost';
    expect((await execute({ action: 'read', methodId })).method).not.toHaveProperty('backupState');
    savedCredential.rp_id = 'qetoret.com';
    savedCredential.revoked_at = '2026-10-10';
    expect((await execute({ action: 'list' })).methods[0]).not.toHaveProperty('backupState');
  });
  it.each([true, false])('refreshes signed backup status %s with an owner and revision guarded update', async backedUp => {
    const { execute, savedCredential, webauthn, queries, rpc } = fixtures();
    savedCredential.device_type = 'multiDevice';
    savedCredential.backed_up = !backedUp;
    webauthn.verifyAuthenticationResponse.mockResolvedValue({ verified: true, authenticationInfo: {
      newCounter: 0, userVerified: true, credentialDeviceType: 'multiDevice', credentialBackedUp: backedUp,
    } });
    const result = await execute({ action: 'assert-verify', methodId, challengeId, response: assertion,
      backupState: { eligible: false, backedUp: !backedUp } });
    expect(result.method.backupState).toEqual({ eligible: true, backedUp });
    expect(savedCredential.backed_up).toBe(backedUp);
    const update = queries.find(query => query.patch);
    expect(update.patch).toEqual({ backed_up: backedUp });
    expect(update.filters).toEqual(expect.arrayContaining([
      ['eq', 'id', credentialId], ['eq', 'user_id', userId], ['eq', 'method_id', methodId],
      ['eq', 'revision', 1], ['eq', 'counter', 0], ['is', 'revoked_at', null],
    ]));
    expect(rpc).toHaveBeenCalledWith('complete_recovery_assertion', expect.objectContaining({ p_credential_revision: 0 }));
    expect(result.method.wrapper).toEqual(wrapper);
    expect(JSON.stringify(result)).not.toContain('SECRET_PRF');
  });
  it.each([
    { credentialDeviceType: 'multiDevice', credentialBackedUp: true },
    { credentialDeviceType: 'singleDevice', credentialBackedUp: true },
    { credentialDeviceType: 'singleDevice' },
  ])('rejects inconsistent or missing signed backup metadata before persisting %j', async metadata => {
    const { execute, webauthn, rpc, queries } = fixtures();
    webauthn.verifyAuthenticationResponse.mockResolvedValue({ verified: true, authenticationInfo: {
      newCounter: 0, userVerified: true, ...metadata,
    } });
    await expect(execute({ action: 'assert-verify', methodId, challengeId, response: assertion }))
      .rejects.toMatchObject({ code: 'verification_failed' });
    expect(rpc.mock.calls.some(([name]) => name === 'complete_recovery_assertion')).toBe(false);
    expect(queries.some(query => query.patch)).toBe(false);
  });
  it('fails closed if a newer credential revision wins the backup-state update', async () => {
    const { execute, rpc, savedCredential } = fixtures();
    const original = rpc.getMockImplementation();
    rpc.mockImplementation(async (name, args) => {
      const result = await original(name, args);
      if (name === 'complete_recovery_assertion') savedCredential.revision += 1;
      return result;
    });
    await expect(execute({ action: 'assert-verify', methodId, challengeId, response: assertion }))
      .rejects.toMatchObject({ code: 'recovery_conflict', status: 409 });
  });
  it('fails closed if the method changes after completing the signed assertion', async () => {
    const { execute, rpc, savedMethod } = fixtures();
    const original = rpc.getMockImplementation();
    rpc.mockImplementation(async (name, args) => {
      const result = await original(name, args);
      if (name === 'complete_recovery_assertion') savedMethod.revision += 1;
      return result;
    });
    await expect(execute({ action: 'assert-verify', methodId, challengeId, response: assertion }))
      .rejects.toMatchObject({ code: 'recovery_conflict', status: 409 });
  });
  it('consumes challenges before verification and rejects replay', async () => {
    const { execute, rpc, webauthn } = fixtures();
    rpc.mockImplementation(async name => ({ data: name === 'check_recovery_rate_limit' ? true : null }));
    await expect(execute({ action: 'assert-verify', methodId, challengeId, response: assertion })).rejects.toMatchObject({ code: 'invalid_challenge' });
    expect(webauthn.verifyAuthenticationResponse).not.toHaveBeenCalled();
  });
  it('fails closed on concurrent credential counter revision conflicts', async () => {
    const { execute, rpc } = fixtures();
    const original = rpc.getMockImplementation();
    rpc.mockImplementation((name, args) => name === 'complete_recovery_assertion'
      ? { error: { code: '40001', message: 'SECRET_DATABASE_DETAIL' } } : original(name, args));
    await expect(execute({ action: 'assert-verify', methodId, challengeId, response: assertion })).rejects.toMatchObject({ code: 'recovery_conflict', status: 409 });
  });
  it('does not accept a successful authenticator result without user verification', async () => {
    const { execute, webauthn } = fixtures();
    webauthn.verifyAuthenticationResponse.mockResolvedValue({ verified: true, authenticationInfo: { newCounter: 0, userVerified: false } });
    await expect(execute({ action: 'assert-verify', methodId, challengeId, response: assertion })).rejects.toMatchObject({ code: 'verification_failed' });
  });
  it('never trusts a foreign userHandle', async () => {
    const { execute, webauthn } = fixtures();
    await expect(execute({ action: 'assert-verify', methodId, challengeId, response: { ...assertion,
      response: { ...assertion.response, userHandle: b64(36) } } })).rejects.toMatchObject({ code: 'verification_failed' });
    expect(webauthn.verifyAuthenticationResponse).not.toHaveBeenCalled();
  });
  it('requires client verification in addition to server assertion proof', async () => {
    await expect(fixtures().execute({ action: 'verify', methodId, expectedRevision: 2, proofId: challengeId })).rejects.toMatchObject({ code: 'client_verification_required' });
  });
  it('uses durable limits and fails closed if quota service is unavailable', async () => {
    const { execute, rpc } = fixtures();
    rpc.mockResolvedValue({ data: false });
    await expect(execute({ action: 'list' })).rejects.toMatchObject({ status: 429 });
    rpc.mockResolvedValue({ error: { message: 'internal' } });
    await expect(execute({ action: 'list' })).rejects.toMatchObject({ status: 503 });
    rpc.mockResolvedValue({ data: { allowed: true } });
    await expect(execute({ action: 'list' })).rejects.toMatchObject({ status: 503 });
  });
});

describe('recovery HTTP handler', () => {
  let res;
  const env = { SUPABASE_URL: 'https://supabase.invalid', SUPABASE_ANON_KEY: 'public', SUPABASE_SECRET_KEY: 'server-secret' };
  const request = () => ({ method: 'POST', headers: { origin: 'https://qetoret.com', authorization: 'Bearer token' }, body: { action: 'list' } });
  beforeEach(() => { res = { status: vi.fn().mockReturnThis(), json: vi.fn(), setHeader: vi.fn() }; });
  it('disables response caching even for rejected requests', async () => {
    await handleRecoveryRequest({ ...request(), method: 'GET' }, res, { env });
    expect(res.status).toHaveBeenCalledWith(405);
    expect(res.setHeader).toHaveBeenCalledWith('Cache-Control', 'no-store');
    expect(res.setHeader).toHaveBeenCalledWith('Pragma', 'no-cache');
    expect(res.setHeader).toHaveBeenCalledWith('Vary', 'Origin');
  });
  it.each([undefined, '', 'Basic token', 'Bearer ', 'Bearer one two'])('rejects malformed bearer auth %s before creating any client', async authorization => {
    const client = vi.fn();
    await handleRecoveryRequest({ ...request(), headers: { ...request().headers, authorization } }, res, { env, createClientImpl: client });
    expect(res.status).toHaveBeenCalledWith(401);
    expect(client).not.toHaveBeenCalled();
  });
  it.each([null, [], 'plaintext secret'])('rejects invalid request shape before auth', async body => {
    const client = vi.fn();
    await handleRecoveryRequest({ ...request(), body }, res, { env, createClientImpl: client });
    expect(res.status).toHaveBeenCalledWith(400);
    expect(client).not.toHaveBeenCalled();
  });
  it.each(['https://www.qetoret.com', 'https://evil.test', undefined])('rejects unapproved Origin %s before authentication', async origin => {
    const client = vi.fn();
    await handleRecoveryRequest({ ...request(), headers: { ...request().headers, origin, host: 'qetoret.com' } }, res, { env, createClientImpl: client });
    expect(res.status).toHaveBeenCalledWith(403);
    expect(client).not.toHaveBeenCalled();
  });
  it('requires fresh getUser bearer verification before service-role access', async () => {
    const getUser = vi.fn(async () => ({ data: { user: null }, error: new Error('expired') }));
    const client = vi.fn(() => ({ auth: { getUser } }));
    await handleRecoveryRequest(request(), res, { env, createClientImpl: client });
    expect(getUser).toHaveBeenCalledWith('token');
    expect(client).toHaveBeenCalledTimes(1);
    expect(res.status).toHaveBeenCalledWith(401);
  });
  it('uses the fresh Auth user for privileged database calls and never persists a session', async () => {
    const { db, rpc } = fixtures();
    const getUser = vi.fn(async () => ({ data: { user: { id: userId } }, error: null }));
    const client = vi.fn((url, key) => key === env.SUPABASE_ANON_KEY ? { auth: { getUser } } : db);
    await handleRecoveryRequest({ ...request(), body: { action: 'list', userId: 'spoofed-owner' } }, res, { env, createClientImpl: client });
    expect(res.status).toHaveBeenCalledWith(200);
    expect(client).toHaveBeenNthCalledWith(1, env.SUPABASE_URL, env.SUPABASE_ANON_KEY, { auth: {
      persistSession: false, autoRefreshToken: false, detectSessionInUrl: false,
    } });
    expect(client).toHaveBeenNthCalledWith(2, env.SUPABASE_URL, env.SUPABASE_SECRET_KEY, expect.any(Object));
    expect(rpc).toHaveBeenCalledWith('check_recovery_rate_limit', { p_user_id: userId });
    expect(res.setHeader).toHaveBeenCalledWith('Cache-Control', 'no-store');
  });
  it('redacts database errors and service-role key from HTTP errors', async () => {
    const { db, rpc } = fixtures();
    rpc.mockResolvedValue({ error: { message: `ciphertext and ${env.SUPABASE_SECRET_KEY}`, details: 'private' } });
    const client = vi.fn((url, key) => key === env.SUPABASE_ANON_KEY ? { auth: { getUser: async () => ({ data: { user: { id: userId } } }) } } : db);
    await handleRecoveryRequest(request(), res, { env, createClientImpl: client });
    expect(res.status).toHaveBeenCalledWith(503);
    expect(res.json).toHaveBeenCalledWith({ error: 'recovery_unavailable' });
  });
  it('returns only constant safe errors from unexpected internals', async () => {
    await handleRecoveryRequest(request(), res, { env, createClientImpl: () => { throw new Error('SECRET_TOKEN_AND_WRAPPER'); } });
    expect(res.status).toHaveBeenCalledWith(503);
    expect(res.json).toHaveBeenCalledWith({ error: 'recovery_unavailable' });
  });
  it('rejects oversized request bodies before auth', async () => {
    const client = vi.fn();
    await handleRecoveryRequest({ ...request(), body: { action: 'list', padding: 'x'.repeat(49152) } }, res, { env, createClientImpl: client });
    expect(res.status).toHaveBeenCalledWith(413);
    expect(client).not.toHaveBeenCalled();
  });
  it('measures request bounds in UTF-8 bytes rather than characters', async () => {
    const client = vi.fn();
    await handleRecoveryRequest({ ...request(), body: { action: 'list', padding: '祈'.repeat(17000) } }, res, { env, createClientImpl: client });
    expect(res.status).toHaveBeenCalledWith(413);
    expect(client).not.toHaveBeenCalled();
  });
});
