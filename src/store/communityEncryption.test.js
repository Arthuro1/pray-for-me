// End-to-end proof that COMMUNITY content (prayers / updates / testimonies) is
// encrypted under the per-group key before it reaches Supabase, and round-trips
// back to plaintext on read. Drives the real communityStore actions against a
// stateful in-memory Supabase (crypto key tables + membership + content tables),
// with the full crypto stack (account key → RSA identity key → group key) live.
import { describe, it, expect, beforeEach, vi } from 'vitest';

// ── Stateful in-memory Supabase ───────────────────────────────────────────────
const db = {
  user_crypto_keys: new Map(),
  group_key_versions: [],
  group_member_keys: new Map(),
  group_members: [],
  community_prayers: [],
  community_updates: [],
  testimonies: [],
};
let currentUser = null;
const CONTENT_TABLES = ['community_prayers', 'community_updates', 'testimonies'];

function resetDb() {
  db.user_crypto_keys.clear();
  db.group_key_versions = [];
  db.group_member_keys.clear();
  db.group_members = [];
  db.community_prayers = [];
  db.community_updates = [];
  db.testimonies = [];
  currentUser = null;
}

function rowMatches(row, filters) {
  return filters.every(([c, v]) => (c === '__in__' ? v[1].includes(row[v[0]]) : row[c] === v));
}

function selectRows(table, filters, order, limit) {
  let rows;
  if (table === 'public_keys') rows = [...db.user_crypto_keys.values()].map((r) => ({ user_id: r.user_id, public_key_jwk: r.public_key_jwk }));
  else if (table === 'user_crypto_keys') rows = [...db.user_crypto_keys.values()];
  else if (table === 'group_member_keys') rows = [...db.group_member_keys.values()];
  else rows = db[table] || [];
  rows = rows.filter((r) => rowMatches(r, filters));
  if (order) rows = [...rows].sort((a, b) => (order.ascending ? a[order.col] - b[order.col] : b[order.col] - a[order.col]));
  if (limit != null) rows = rows.slice(0, limit);
  return rows;
}

function insert(table, rowOrRows) {
  const rows = (Array.isArray(rowOrRows) ? rowOrRows : [rowOrRows]).map((r) => ({
    id: r.id || crypto.randomUUID(),
    ...(CONTENT_TABLES.includes(table) ? { created_at: r.created_at || new Date().toISOString() } : {}),
    ...r,
  }));
  if (table === 'group_key_versions') db.group_key_versions.push(...rows);
  else if (CONTENT_TABLES.includes(table)) db[table].push(...rows);
  const holder = {
    select: () => holder,
    single: () => Promise.resolve({ data: rows[0] || null, error: null }),
    maybeSingle: () => Promise.resolve({ data: rows[0] || null, error: null }),
    then: (res) => res({ data: rows, error: null }),
  };
  return holder;
}

function upsert(table, rowOrRows, opts) {
  const rows = Array.isArray(rowOrRows) ? rowOrRows : [rowOrRows];
  for (const r of rows) {
    if (table === 'user_crypto_keys') db.user_crypto_keys.set(r.user_id, { ...r });
    else if (table === 'group_member_keys') {
      const k = `${r.group_id}:${r.key_version}:${r.user_id}`;
      if (opts?.ignoreDuplicates && db.group_member_keys.has(k)) continue;
      db.group_member_keys.set(k, { ...r });
    }
  }
  return Promise.resolve({ data: null, error: null });
}

function applyUpdate(table, filters, patch) {
  for (const r of db[table] || []) if (rowMatches(r, filters)) Object.assign(r, patch);
  return { data: null, error: null };
}

function makeQuery(table) {
  const q = { _f: [], _order: null, _limit: null, _op: 'select', _patch: null };
  const rows = () => selectRows(table, q._f, q._order, q._limit);
  q.select = () => q;
  q.eq = (c, v) => { q._f.push([c, v]); return q; };
  q.in = (c, vals) => { q._f.push(['__in__', [c, vals]]); return q; };
  q.order = (c, o) => { q._order = { col: c, ascending: o?.ascending !== false }; return q; };
  q.limit = (n) => { q._limit = n; return q; };
  q.update = (patch) => { q._op = 'update'; q._patch = patch; return q; };
  q.insert = (r) => insert(table, r);
  q.upsert = (r, o) => upsert(table, r, o);
  q.single = () => Promise.resolve({ data: rows()[0] || null, error: null });
  q.maybeSingle = () => Promise.resolve({ data: rows()[0] || null, error: null });
  q.then = (res) => res(q._op === 'update' ? applyUpdate(table, q._f, q._patch) : { data: rows(), error: null });
  return q;
}

vi.mock('../lib/supabase', () => ({
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

import useCommunityStore from './communityStore';
import { getGroupKey, clearGroupKeyCache } from '../lib/crypto/groupKeys';
import { ensureUserPublicKey, clearUserKeyCache } from '../lib/crypto/userKeys';
import { decryptCommunityRow } from '../lib/crypto/communityCrypto';
import { autoInitAccountKey, destroyVault } from '../lib/crypto/keyManager';

// The acting user, a member of group g1, with account key + identity key ready.
async function setup() {
  resetDb();
  installStorage();
  clearGroupKeyCache();
  clearUserKeyCache();
  await destroyVault();
  db.group_members.push({ group_id: 'g1', user_id: 'me' });
  currentUser = 'me';
  await autoInitAccountKey();
  await ensureUserPublicKey('me');
  useCommunityStore.setState({ prayers: [], testimonies: [], activeGroupId: 'g1' });
}

async function decryptStored(row) {
  const gk = await getGroupKey('g1', row.key_version || 1);
  return decryptCommunityRow(async () => gk, row);
}

beforeEach(() => { installStorage(); });

describe('community content is encrypted under the group key', () => {
  it('addPrayer stores ciphertext (no plaintext title/description) and keeps plaintext in memory', async () => {
    await setup();
    const res = await useCommunityStore.getState().addPrayer({
      groupId: 'g1', userId: 'me', authorName: 'Me',
      title: 'SECRET_community_title', description: 'SECRET_community_desc', isAnonymous: false, categoryIds: [],
    });
    expect(res.prayer).toBeTruthy();

    const stored = db.community_prayers[0];
    const json = JSON.stringify(stored);
    expect(json).not.toContain('SECRET_community_title');
    expect(json).not.toContain('SECRET_community_desc');
    expect(stored.title).toBe('');
    expect(stored.encrypted_payload).toBeTruthy();
    expect(stored.key_version).toBe(1);

    // In-memory state stays plaintext for the UI.
    expect(useCommunityStore.getState().prayers[0].title).toBe('SECRET_community_title');

    // Round-trips under the group key.
    const dec = await decryptStored(stored);
    expect(dec.title).toBe('SECRET_community_title');
    expect(dec.description).toBe('SECRET_community_desc');
  });

  it('addUpdate stores the update text as ciphertext', async () => {
    await setup();
    await useCommunityStore.getState().addPrayer({ groupId: 'g1', userId: 'me', authorName: 'Me', title: 't', description: '', isAnonymous: false, categoryIds: [] });
    const prayerId = useCommunityStore.getState().prayers[0].id;

    await useCommunityStore.getState().addUpdate({ prayerId, userId: 'me', authorName: 'Me', text: 'SECRET_update_body', isAnonymous: false });

    const upd = db.community_updates[0];
    expect(JSON.stringify(upd)).not.toContain('SECRET_update_body');
    expect(upd.text).toBe('');
    expect(upd.encrypted_payload).toBeTruthy();
    expect((await decryptStored(upd)).text).toBe('SECRET_update_body');
  });

  it('addTestimony stores the content as ciphertext', async () => {
    await setup();
    await useCommunityStore.getState().addTestimony({ groupId: 'g1', userId: 'me', authorName: 'Me', content: 'SECRET_answered_prayer', isAnonymous: false });

    const t = db.testimonies[0];
    expect(JSON.stringify(t)).not.toContain('SECRET_answered_prayer');
    expect(t.content).toBe('');
    expect(t.encrypted_payload).toBeTruthy();
    expect((await decryptStored(t)).content).toBe('SECRET_answered_prayer');
  });

  it('updatePrayer re-encrypts the edited title without leaking plaintext', async () => {
    await setup();
    await useCommunityStore.getState().addPrayer({ groupId: 'g1', userId: 'me', authorName: 'Me', title: 'old', description: 'old', isAnonymous: false, categoryIds: [] });
    const prayerId = useCommunityStore.getState().prayers[0].id;

    await useCommunityStore.getState().updatePrayer({ prayerId, title: 'SECRET_edited', description: 'SECRET_edited_desc', isAnonymous: false, categoryIds: [] });

    const stored = db.community_prayers[0];
    expect(JSON.stringify(stored)).not.toContain('SECRET_edited');
    expect(stored.title).toBe('');
    expect((await decryptStored(stored)).title).toBe('SECRET_edited');
  });

  it('fetchPrayers decrypts the wall back to plaintext in memory', async () => {
    await setup();
    await useCommunityStore.getState().addPrayer({ groupId: 'g1', userId: 'me', authorName: 'Me', title: 'SECRET_on_the_wall', description: '', isAnonymous: false, categoryIds: [] });
    useCommunityStore.setState({ prayers: [] }); // drop in-memory plaintext

    await useCommunityStore.getState().fetchPrayers('g1');

    const shown = useCommunityStore.getState().prayers;
    expect(shown.length).toBe(1);
    expect(shown[0].title).toBe('SECRET_on_the_wall');
    expect(shown[0]._locked).toBe(false);
  });
});
