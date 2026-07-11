import { describe, it, expect, beforeEach, vi } from 'vitest';

// ── Stateful in-memory Supabase: crypto key tables + membership ───────────────
// Enough of the query surface for userKeys + groupKeys: chained select/eq/order/
// limit/maybeSingle, insert (pk-conflict aware), upsert (ignoreDuplicates), and a
// filtered delete. `currentUser` stands in for auth.uid(); tests flip it to act
// as different members. The public_keys "view" projects user_crypto_keys down to
// its non-sensitive columns, exactly like the real view.
const db = {
  user_crypto_keys: new Map(),  // user_id -> row
  group_key_versions: [],       // { group_id, version, created_by }
  group_member_keys: new Map(), // `${group_id}:${key_version}:${user_id}` -> row
  group_members: [],            // { group_id, user_id }
};
let currentUser = null;

function resetDb() {
  db.user_crypto_keys.clear();
  db.group_key_versions = [];
  db.group_member_keys.clear();
  db.group_members = [];
  currentUser = null;
}

function tableRows(table) {
  switch (table) {
    case 'user_crypto_keys':
    case 'public_keys': return [...db.user_crypto_keys.values()];
    case 'group_key_versions': return db.group_key_versions;
    case 'group_member_keys': return [...db.group_member_keys.values()];
    case 'group_members': return db.group_members;
    default: return [];
  }
}

function project(table, row) {
  if (!row) return null;
  return table === 'public_keys' ? { user_id: row.user_id, public_key_jwk: row.public_key_jwk } : row;
}

const matches = (row, filters) => filters.every(([col, val]) => row[col] === val);

function resolveSelect(q, single) {
  let rows = tableRows(q._table).filter((r) => matches(r, q._filters));
  if (q._order) rows = [...rows].sort((a, b) => (q._order.ascending ? a[q._order.col] - b[q._order.col] : b[q._order.col] - a[q._order.col]));
  if (q._limit != null) rows = rows.slice(0, q._limit);
  return single
    ? { data: rows[0] ? project(q._table, rows[0]) : null, error: null }
    : { data: rows.map((r) => project(q._table, r)), error: null };
}

function insertRow(table, row) {
  if (table === 'group_key_versions') {
    if (db.group_key_versions.some((r) => r.group_id === row.group_id && r.version === row.version)) {
      return Promise.resolve({ data: null, error: { message: 'duplicate key', code: '23505' } });
    }
    db.group_key_versions.push({ ...row });
  }
  return Promise.resolve({ data: [row], error: null });
}

function upsertRows(table, rowOrRows, opts) {
  const rows = Array.isArray(rowOrRows) ? rowOrRows : [rowOrRows];
  for (const r of rows) {
    if (table === 'user_crypto_keys') { db.user_crypto_keys.set(r.user_id, { ...r }); continue; }
    if (table === 'group_member_keys') {
      const k = `${r.group_id}:${r.key_version}:${r.user_id}`;
      if (opts?.ignoreDuplicates && db.group_member_keys.has(k)) continue;
      db.group_member_keys.set(k, { ...r });
    }
  }
  return Promise.resolve({ data: null, error: null });
}

function doDelete(q) {
  if (q._table === 'group_member_keys') {
    for (const [k, r] of [...db.group_member_keys]) if (matches(r, q._filters)) db.group_member_keys.delete(k);
  }
  return { data: null, error: null };
}

function makeQuery(table) {
  const q = { _table: table, _filters: [], _order: null, _limit: null, _op: 'select' };
  q.select = () => q;
  q.eq = (col, val) => { q._filters.push([col, val]); return q; };
  q.order = (col, opts) => { q._order = { col, ascending: opts?.ascending !== false }; return q; };
  q.limit = (n) => { q._limit = n; return q; };
  q.delete = () => { q._op = 'delete'; return q; };
  q.maybeSingle = () => Promise.resolve(resolveSelect(q, true));
  q.insert = (row) => insertRow(table, row);
  q.upsert = (rows, opts) => upsertRows(table, rows, opts);
  q.then = (resolve) => resolve(q._op === 'delete' ? doDelete(q) : resolveSelect(q, false));
  return q;
}

vi.mock('../supabase', () => ({
  supabase: {
    auth: { getUser: async () => ({ data: { user: currentUser ? { id: currentUser } : null } }) },
    from: (table) => makeQuery(table),
  },
}));

function installStorage() {
  const map = new Map();
  globalThis.localStorage = {
    getItem: (k) => (map.has(k) ? map.get(k) : null),
    setItem: (k, v) => map.set(k, String(v)),
    removeItem: (k) => map.delete(k),
    clear: () => map.clear(),
  };
}

import {
  ensureGroupKey, getGroupKey, rotateGroupKey, revokeMemberAndRotate, clearGroupKeyCache,
} from './groupKeys';
import { ensureUserPublicKey, clearUserKeyCache } from './userKeys';
import { encryptCommunityPrayer, decryptCommunityRow } from './communityCrypto';
import {
  autoInitAccountKey, lock, destroyVault, importRawMasterKey, exportRawMasterKey,
} from './keyManager';

// Give `userId` a fresh account key + published identity keypair; return the raw
// account key so a later becomeUser() can restore this exact identity.
async function provisionUser(userId) {
  lock();
  clearUserKeyCache();
  await autoInitAccountKey();
  currentUser = userId;
  await ensureUserPublicKey(userId);
  return exportRawMasterKey();
}

// Switch the acting user: load their account key, drop cached identity + group
// keys so everything is re-fetched and re-unwrapped as that user would.
async function becomeUser(userId, ackB64) {
  lock();
  clearUserKeyCache();
  clearGroupKeyCache();
  await importRawMasterKey(ackB64);
  currentUser = userId;
  await ensureUserPublicKey(userId);
}

async function setupTwoMemberGroup() {
  resetDb();
  clearGroupKeyCache();
  await destroyVault();
  clearUserKeyCache();
  installStorage();
  db.group_members.push({ group_id: 'g1', user_id: 'alice' }, { group_id: 'g1', user_id: 'bob' });
  const ackAlice = await provisionUser('alice');
  const ackBob = await provisionUser('bob');
  return { ackAlice, ackBob };
}

beforeEach(() => { installStorage(); });

describe('group content key lifecycle', () => {
  it('provisions version 1 on first use and encrypts under it', async () => {
    const { ackAlice } = await setupTwoMemberGroup();
    await becomeUser('alice', ackAlice);

    const gk = await ensureGroupKey('g1');
    expect(gk).toBeTruthy();
    expect(gk.version).toBe(1);
    expect(db.group_key_versions).toEqual([{ group_id: 'g1', version: 1, created_by: 'alice' }]);
    // Alice holds a wrapped copy of her own group key.
    expect(db.group_member_keys.has('g1:1:alice')).toBe(true);
  });

  it('lets another member unwrap the SAME key from their wrapped row (RSA round-trip via server)', async () => {
    const { ackAlice, ackBob } = await setupTwoMemberGroup();

    await becomeUser('alice', ackAlice);
    const gkAlice = await ensureGroupKey('g1'); // creates + distributes to alice AND bob
    expect(db.group_member_keys.has('g1:1:bob')).toBe(true);

    await becomeUser('bob', ackBob);
    const gkBob = await getGroupKey('g1', 1);
    expect(gkBob).toBeTruthy();

    // Same key material: Alice encrypts, Bob decrypts.
    const enc = await encryptCommunityPrayer(gkAlice, { id: 'x', title: 'SECRET_shared_content' });
    const dec = await decryptCommunityRow(async () => gkBob, enc);
    expect(dec.title).toBe('SECRET_shared_content');
  });

  it('returns null for a non-member (no wrapped key exists for them)', async () => {
    const { ackAlice } = await setupTwoMemberGroup();
    await becomeUser('alice', ackAlice);
    await ensureGroupKey('g1');

    const ackCarol = await provisionUser('carol'); // provisioned, but NOT in g1
    await becomeUser('carol', ackCarol);
    expect(await getGroupKey('g1', 1)).toBe(null);
    expect(await ensureGroupKey('g1')).toBe(null); // a member row already exists → can't self-create
  });

  it('is idempotent: repeated ensureGroupKey keeps the same version and key', async () => {
    const { ackAlice } = await setupTwoMemberGroup();
    await becomeUser('alice', ackAlice);
    const a = await ensureGroupKey('g1');
    const b = await ensureGroupKey('g1');
    expect(a.version).toBe(b.version);
    // Still a single version row (no accidental re-provision).
    expect(db.group_key_versions.length).toBe(1);
  });

  it('wraps in a member who publishes their identity key AFTER the first fan-out', async () => {
    resetDb();
    clearGroupKeyCache();
    await destroyVault();
    clearUserKeyCache();
    installStorage();
    // Bob is a member from the start, but has NOT published an identity key when
    // Alice first provisions + distributes the group key.
    db.group_members.push({ group_id: 'g1', user_id: 'alice' }, { group_id: 'g1', user_id: 'bob' });
    const ackAlice = await provisionUser('alice');

    const realNow = Date.now;
    let clock = 1_000_000;
    Date.now = () => clock;
    try {
      await becomeUser('alice', ackAlice);
      await ensureGroupKey('g1'); // creates v1; bob has no public key yet → skipped
      expect(db.group_member_keys.has('g1:1:alice')).toBe(true);
      expect(db.group_member_keys.has('g1:1:bob')).toBe(false);

      // Bob now comes online and publishes his identity key (from his own device).
      const bobKp = await crypto.subtle.generateKey(
        { name: 'RSA-OAEP', modulusLength: 2048, publicExponent: new Uint8Array([1, 0, 1]), hash: 'SHA-256' },
        true, ['encrypt', 'decrypt'],
      );
      const bobPubJwk = await crypto.subtle.exportKey('jwk', bobKp.publicKey);
      db.user_crypto_keys.set('bob', { user_id: 'bob', public_key_jwk: bobPubJwk });

      // Alice touches the group again in the SAME session, past the coalescing
      // window → the still-incomplete fan-out retries and tops bob in. (The old
      // once-per-session guard would have skipped this and left bob unable to read.)
      clock += 10_000;
      await ensureGroupKey('g1');
      expect(db.group_member_keys.has('g1:1:bob')).toBe(true);
    } finally {
      Date.now = realNow;
    }
  });

  it('forward-only rotation mints the next version wrapped to current members only', async () => {
    const { ackAlice } = await setupTwoMemberGroup();
    await becomeUser('alice', ackAlice);
    await ensureGroupKey('g1'); // v1 for alice + bob

    // Remove bob, then revoke + rotate.
    db.group_members = db.group_members.filter((m) => !(m.group_id === 'g1' && m.user_id === 'bob'));
    const rotated = await revokeMemberAndRotate('g1', 'bob');

    expect(rotated.version).toBe(2);
    expect(db.group_member_keys.has('g1:2:alice')).toBe(true); // remaining member gets v2
    expect(db.group_member_keys.has('g1:2:bob')).toBe(false);  // removed member does NOT
    expect(db.group_member_keys.has('g1:1:bob')).toBe(false);  // and their old key is revoked
  });

  it('decrypts old-version content after a rotation using the row key_version', async () => {
    const { ackAlice } = await setupTwoMemberGroup();
    await becomeUser('alice', ackAlice);
    const v1 = await ensureGroupKey('g1');
    const encOld = await encryptCommunityPrayer(v1, { id: 'old', title: 'OLD_secret' });

    const v2 = await rotateGroupKey('g1');
    expect(v2.version).toBe(2);

    // A resolver (as the store builds) still fetches v1 for the old row.
    const resolve = async (version) => getGroupKey('g1', version);
    const dec = await decryptCommunityRow(resolve, encOld);
    expect(dec.title).toBe('OLD_secret');
  });
});
