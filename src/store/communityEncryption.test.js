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
let failGroupKeyOperations = false;
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
  failGroupKeyOperations = false;
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
    rpc: async (name, args) => {
      if (failGroupKeyOperations) return { data: null, error: { message: 'group key unavailable' } };
      if (name === 'create_group_key_version') {
        const existing = db.group_key_versions.find((row) => (
          row.group_id === args.p_group_id && row.version === args.p_requested_version
        ));
        if (!existing) db.group_key_versions.push({ group_id: args.p_group_id, version: args.p_requested_version });
        db.group_member_keys.set(
          `${args.p_group_id}:${args.p_requested_version}:${currentUser}`,
          {
            group_id: args.p_group_id,
            key_version: args.p_requested_version,
            user_id: currentUser,
            encrypted_group_key: args.p_encrypted_creator_key,
          },
        );
        return { data: args.p_requested_version, error: null };
      }
      if (name === 'distribute_group_key') {
        const key = `${args.p_group_id}:${args.p_key_version}:${args.p_target_user_id}`;
        if (!db.group_member_keys.has(key)) {
          db.group_member_keys.set(key, {
            group_id: args.p_group_id,
            key_version: args.p_key_version,
            user_id: args.p_target_user_id,
            encrypted_group_key: args.p_encrypted_group_key,
          });
        }
        return { data: null, error: null };
      }
      return { data: null, error: null };
    },
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
import { encryptJsonLegacy } from '../lib/crypto/e2ee';
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
  useCommunityStore.setState({
    prayers: [], testimonies: [], activeGroupId: 'g1',
    communityEncryptionMigration: { groupId: null, status: 'idle', total: 0, completed: 0, failed: 0 },
  });
}

async function decryptStored(row) {
  const gk = await getGroupKey('g1', row.key_version || 1);
  const resolver = async () => gk;
  resolver.groupId = 'g1';
  return decryptCommunityRow(resolver, row);
}

beforeEach(() => { installStorage(); });

describe('community content is encrypted under the group key', () => {
  it('fails closed without writing plaintext when the group key is unavailable', async () => {
    await setup();
    failGroupKeyOperations = true;

    const result = await useCommunityStore.getState().addPrayer({
      groupId: 'g1', userId: 'me', authorName: 'Me',
      title: 'MUST_NOT_LEAK', description: 'MUST_NOT_LEAK_EITHER', isAnonymous: false, categoryIds: [],
    });

    expect(result).toEqual({ error: 'groupEncryptionUnavailable' });
    expect(db.community_prayers).toHaveLength(0);
    expect(JSON.stringify(db)).not.toContain('MUST_NOT_LEAK');
  });

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

  it('migrates owned v1 community ciphertext to record-bound v2 and is idempotent', async () => {
    await setup();
    await useCommunityStore.getState().addPrayer({
      groupId: 'g1', userId: 'me', authorName: 'Me', title: 'legacy title', description: 'legacy body', isAnonymous: false, categoryIds: [],
    });
    const stored = db.community_prayers[0];
    const gk = await getGroupKey('g1', stored.key_version);
    stored.encrypted_payload = await encryptJsonLegacy(gk.key, {
      title: 'legacy title', description: 'legacy body', prayer_points: [],
    });
    stored.encryption_version = 1;

    const first = await useCommunityStore.getState().migrateLegacyCommunityContent('g1');

    expect(first).toMatchObject({ status: 'complete', total: 1, completed: 1, failed: 0 });
    expect(stored.encrypted_payload.v).toBe(2);
    expect(stored.title).toBe('');
    expect((await decryptStored(stored)).title).toBe('legacy title');

    const second = await useCommunityStore.getState().migrateLegacyCommunityContent('g1');
    expect(second).toMatchObject({ status: 'complete', total: 0, completed: 0, failed: 0 });
  });

  // Anonymity must hold at rest, not just in the UI: an anonymous community row
  // must never carry the author's real display name in its plaintext author_name
  // column (the Network response / table editor would de-anonymize it).
  it('addPrayer blanks the stored author_name when anonymous', async () => {
    await setup();
    await useCommunityStore.getState().addPrayer({
      groupId: 'g1', userId: 'me', authorName: 'Ruth Adeyemi',
      title: 't', description: '', isAnonymous: true, categoryIds: [],
    });
    const stored = db.community_prayers[0];
    expect(stored.is_anonymous).toBe(true);
    expect(stored.author_name).toBe('');
    expect(JSON.stringify(stored)).not.toContain('Ruth Adeyemi');
  });

  it('addPrayer keeps the stored author_name when NOT anonymous', async () => {
    await setup();
    await useCommunityStore.getState().addPrayer({
      groupId: 'g1', userId: 'me', authorName: 'Ruth Adeyemi',
      title: 't', description: '', isAnonymous: false, categoryIds: [],
    });
    expect(db.community_prayers[0].author_name).toBe('Ruth Adeyemi');
  });

  it('addUpdate and addTestimony blank the stored author_name when anonymous', async () => {
    await setup();
    await useCommunityStore.getState().addPrayer({ groupId: 'g1', userId: 'me', authorName: 'Me', title: 't', description: '', isAnonymous: false, categoryIds: [] });
    const prayerId = useCommunityStore.getState().prayers[0].id;

    await useCommunityStore.getState().addUpdate({ prayerId, userId: 'me', authorName: 'David Osei', text: 'x', isAnonymous: true });
    expect(db.community_updates[0].author_name).toBe('');
    expect(JSON.stringify(db.community_updates[0])).not.toContain('David Osei');

    await useCommunityStore.getState().addTestimony({ groupId: 'g1', userId: 'me', authorName: 'Naomi Carter', content: 'y', isAnonymous: true });
    expect(db.testimonies[0].author_name).toBe('');
    expect(JSON.stringify(db.testimonies[0])).not.toContain('Naomi Carter');
  });

  it('updatePrayer blanks the stored name when a prayer is made anonymous, and restores it on un-anonymize', async () => {
    await setup();
    await useCommunityStore.getState().addPrayer({ groupId: 'g1', userId: 'me', authorName: 'Grace Bennett', title: 't', description: '', isAnonymous: false, categoryIds: [] });
    const prayerId = useCommunityStore.getState().prayers[0].id;
    expect(db.community_prayers[0].author_name).toBe('Grace Bennett');

    await useCommunityStore.getState().updatePrayer({ prayerId, title: 't', description: '', isAnonymous: true, categoryIds: [], authorName: 'Grace Bennett' });
    expect(db.community_prayers[0].author_name).toBe('');
    expect(JSON.stringify(db.community_prayers[0])).not.toContain('Grace Bennett');
    expect(useCommunityStore.getState().prayers[0].author_name).toBe('');

    await useCommunityStore.getState().updatePrayer({ prayerId, title: 't', description: '', isAnonymous: false, categoryIds: [], authorName: 'Grace Bennett' });
    expect(db.community_prayers[0].author_name).toBe('Grace Bennett');
  });

  it('never overwrites a malformed non-null ciphertext envelope as plaintext', async () => {
    await setup();
    const malformed = {
      id: 'broken', group_id: 'g1', user_id: 'me', title: '', description: '', prayer_points: [],
      encrypted_payload: { v: 99, ciphertext: 'unknown-format' }, encryption_version: 99, key_version: 1,
    };
    db.community_prayers.push(malformed);

    const result = await useCommunityStore.getState().migrateLegacyCommunityContent('g1');

    expect(result).toMatchObject({ status: 'partial', total: 1, completed: 0, failed: 1 });
    expect(malformed.encrypted_payload).toEqual({ v: 99, ciphertext: 'unknown-format' });
  });
});
