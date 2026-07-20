import { create } from 'zustand';
import { supabase } from '../lib/supabase';
import { communityToPersonalInsert, sortByOrder } from '../utils/prayer';
import { prayersForDay, sortEntries, catchUpPrayers } from '../lib/planner';
import { addDays } from '../lib/schedule';
import { todayKey } from '../lib/prayedLog';
import { enqueue, pendingPrayerIds } from '../lib/mutationQueue';
import { removeAttachmentFiles } from '../lib/attachments';
import { loadSnapshot, saveSnapshot } from '../lib/dataCache';
import { fetchUserSettings, saveUserSettings, touchesSyncedSettings } from '../lib/settingsSync';
import { track, EVENTS } from '../lib/analytics';
import { ensurePushSubscription } from '../push';
import { isEventPushEnabled } from '../lib/notificationPrefs';
import { resolveLanguage } from '../i18n';
import {
  canEncrypt,
  encryptPrayerForStorage,
  encryptChildForStorage,
  decryptPrayers,
  decryptPrayerFromStorage,
  SENSITIVE_FIELDS,
  SENSITIVE_JSON_FIELDS,
  UPDATE_SENSITIVE_FIELDS,
  POINT_SENSITIVE_FIELDS,
  TESTIMONY_SENSITIVE_FIELDS,
} from '../lib/crypto/prayerCrypto';
import { isUnlocked } from '../lib/crypto/keyManager';
import { groupKeyResolver } from '../lib/crypto/groupKeys';
import { decryptCommunityRow } from '../lib/crypto/communityCrypto';

// Soft-deletes awaiting commit: id -> { prayer snapshot, commit timer }. Module
// level so it survives store re-renders; an "Undo" toast clears the timer.
const pendingDeletes = new Map();
const UNDO_WINDOW_MS = 6000;

// A prayer's NESTED content (updates / points / testimonies) is encrypted at rest
// under the account key exactly when the prayer itself is (canEncrypt). Sharing no
// longer forces the child rows to stay plaintext: a shared prayer's community copy
// is an independent snapshot encrypted under the GROUP key (communityStore), so the
// owner's personal child rows can always stay private under the account key.
function canEncryptNested(prayer) {
  return canEncrypt(prayer);
}

// A fresh plaintext testimony row for the prayer_testimonies child table. The
// in-memory form is always plaintext; _persistTestimony encrypts before it is
// queued/written for private prayers. `content_language` is metadata (outside
// the E2EE payload), stamped from the writer's active language.
function buildTestimonyRow(prayerId, content, created_at, contentLanguage = null, attachments = []) {
  return { id: crypto.randomUUID(), prayer_id: prayerId, content, attachments, author_name: '', created_at, content_language: contentLanguage };
}

// Re-attach any locally-held testimonies a freshly-fetched server prayer doesn't
// yet include — an optimistic row (e.g. one written while marking a prayer
// answered) whose `addTestimonyRow` write is still queued offline or mid-flush.
// Keyed by id and append-only, so a row already persisted server-side is never
// duplicated. Used by loadData so making server data authoritative never blanks
// a just-written testimony from its answered prayer — mirrors the completions
// union in loadData.
function mergePendingTestimonies(serverPrayer, localRows) {
  if (!localRows?.length) return serverPrayer;
  const onServer = new Set((serverPrayer.prayer_testimonies || []).map((tm) => tm.id));
  const pending = localRows.filter((tm) => tm.id && !onServer.has(tm.id));
  if (pending.length === 0) return serverPrayer;
  return { ...serverPrayer, prayer_testimonies: [...(serverPrayer.prayer_testimonies || []), ...pending] };
}

// Re-encrypts the whole SENSITIVE_FIELDS/SENSITIVE_JSON_FIELDS bundle from
// `merged` (the prayer's current in-memory values with any pending edits
// applied) into a single encrypted_payload, redacting every plaintext column
// it covers. Used whenever ANY of those fields change, so the ciphertext
// always carries the full bundle forward instead of dropping fields the
// caller didn't touch (e.g. editing the title must not lose saved Scripture
// guidance, and vice versa). Callers must gate this with canEncrypt(prayer).
async function encryptedSensitiveFields(merged) {
  const sensitive = {
    ...Object.fromEntries(SENSITIVE_FIELDS.map((f) => [f, merged[f] ?? ''])),
    ...Object.fromEntries(SENSITIVE_JSON_FIELDS.map((f) => [f, merged[f] ?? null])),
  };
  const enc = await encryptPrayerForStorage(sensitive);
  return {
    title: '', description: '', person_name: '', phone: '', scripture_guidance: null,
    encrypted_payload: enc.encrypted_payload,
    encryption_version: enc.encryption_version,
  };
}

// ─── Vault migration (encrypt legacy rows at rest) ───────────────────
// The vault only encrypts what a user writes AFTER turning it on; prayers
// created before it existed (or while it was locked) stay plaintext on the
// server. These helpers find those PRIVATE rows and re-store them as ciphertext
// so "Prayer Vault" protects a user's whole private history, not just new writes.
// Shared and saved-from-community prayers are deliberately skipped — group
// members must read the former, and the latter mirrors public community content.
const MIGRATABLE_COLLECTIONS = ['prayer_updates', 'prayer_points', 'prayer_testimonies'];

// A row is encrypted at rest once it carries an encryption_version (written
// alongside every encrypted_payload). Legacy plaintext rows leave it null.
const isRowEncrypted = (row) => row?.encryption_version != null;

// True when a PRIVATE prayer still has anything stored in plaintext — its own
// row or any nested update / point / testimony.
function prayerNeedsEncryption(p) {
  if (!isRowEncrypted(p)) return true;
  return MIGRATABLE_COLLECTIONS.some((coll) => (p[coll] || []).some((r) => !isRowEncrypted(r)));
}

// Ids of the user's personal prayers shared to at least one group — their
// content is plaintext by design and must stay out of the migration.
async function fetchSharedPrayerIds(userId) {
  const { data } = await supabase
    .from('community_prayers')
    .select('source_prayer_id')
    .eq('user_id', userId)
    .not('source_prayer_id', 'is', null);
  return new Set((data || []).map((r) => r.source_prayer_id));
}

// Owned prayers with only the flags the read-only coverage check needs — no
// plaintext content is pulled just to count what's protected.
async function fetchOwnedEncryptionState(userId) {
  const { data, error } = await supabase
    .from('prayers')
    .select(`id, community_origin_id, encryption_version,
             prayer_updates(id, encryption_version),
             prayer_points(id, encryption_version),
             prayer_testimonies(id, encryption_version)`)
    .eq('user_id', userId);
  if (error) throw error;
  return data || [];
}

// Owned prayers with the plaintext content too, so legacy rows can be re-encrypted.
async function fetchOwnedForMigration(userId) {
  const { data, error } = await supabase
    .from('prayers')
    .select(`id, community_origin_id, encryption_version,
             title, description, person_name, phone, scripture_guidance,
             prayer_updates(id, encryption_version, text),
             prayer_points(id, encryption_version, title, verses),
             prayer_testimonies(id, encryption_version, content)`)
    .eq('user_id', userId);
  if (error) throw error;
  return data || [];
}

// Encrypt any still-plaintext child rows of one collection, in place.
async function encryptChildRows(table, rows, fields) {
  for (const row of rows || []) {
    if (isRowEncrypted(row)) continue;
    const enc = await encryptChildForStorage(row, fields);
    const patch = { encrypted_payload: enc.encrypted_payload, encryption_version: enc.encryption_version };
    for (const f of fields) patch[f] = enc[f]; // redacted plaintext ('' / [])
    const { error } = await supabase.from(table).update(patch).eq('id', row.id);
    if (error) throw error;
  }
}

// Re-store one PRIVATE prayer (and its nested rows) as ciphertext: the parent
// scalars/guidance are bundled into encrypted_payload and their columns redacted,
// then each plaintext child row is encrypted in place. Parts already encrypted
// are left untouched (e.g. a formerly-shared prayer whose parent is encrypted but
// whose child rows were kept plaintext for fan-out).
async function encryptExistingPrayer(p) {
  if (!isRowEncrypted(p)) {
    const patch = await encryptedSensitiveFields(p);
    const { error } = await supabase.from('prayers').update(patch).eq('id', p.id);
    if (error) throw error;
  }
  await encryptChildRows('prayer_updates', p.prayer_updates, UPDATE_SENSITIVE_FIELDS);
  await encryptChildRows('prayer_points', p.prayer_points, POINT_SENSITIVE_FIELDS);
  await encryptChildRows('prayer_testimonies', p.prayer_testimonies, TESTIMONY_SENSITIVE_FIELDS);
}

// Keeps shared community copies in sync when the source personal prayer is
// edited. Only touches fields that were actually changed.
const usePrayerStore = create((set, get) => ({
  prayers: [],
  categories: [],
  // prayerId -> ['YYYY-MM-DD', ...] days the prayer was marked prayed (last ~90
  // days). Plain object so it serialises into the offline snapshot untouched.
  completions: {},
  userId: null,
  settings: (() => {
    const base = {
      dailyReminderEnabled: false,
      dailyReminderTime: '07:00',
      followUpEnabled: false,
      followUpDays: 7,
      followUpTime: '07:00',
      notificationsGranted: false,
      // AI consent used to live in dedicated pfm_ai_consent_* keys; read them
      // here so existing users keep their choice (pfm_settings overrides once
      // any settings change is saved).
      aiConsentPrayer: localStorage.getItem('pfm_ai_consent_prayer') === 'true',
      aiConsentHome: localStorage.getItem('pfm_ai_consent_home') === 'true',
    };
    let saved = {};
    try { saved = JSON.parse(localStorage.getItem('pfm_settings') || '{}'); } catch { /* ignore */ }
    // language + theme keep their own dedicated keys as the source of truth.
    return {
      ...base,
      ...saved,
      language: resolveLanguage(localStorage.getItem('pfm_language'), navigator.language || navigator.userLanguage),
      theme: localStorage.getItem('pfm_theme') || 'light',
    };
  })(),
  loading: true, // starts true so the first paint shows skeletons, not an empty flash

  // ─── Load all data ───────────────────────────────────────────
  loadData: async (userId) => {
    set({ loading: true, userId });

    // Account-level settings (language, reminder prefs) sync in parallel —
    // fire-and-forget so an offline settings fetch never blocks prayers.
    get().syncSettings(userId);

    // 1. Hydrate instantly from the local snapshot (works offline and includes
    //    any prayers created offline that aren't on the server yet).
    const snap = await loadSnapshot(userId);
    if (snap) set({ categories: snap.categories || [], prayers: snap.prayers || [], completions: snap.completions || {}, loading: false });

    // 2. Fetch authoritative data. If the network is unreachable, keep the
    //    hydrated snapshot rather than wiping it.
    let cats;
    try {
      const res = await supabase.from('categories').select('*').eq('user_id', userId).order('created_at');
      if (res.error) throw res.error;
      cats = res.data;
    } catch {
      set({ loading: false });
      return;
    }

    // New accounts start with NO categories: an uncategorized, unscheduled
    // prayer simply shows up daily (see lib/planner.js), so structure is never
    // imposed before there are enough prayers to need it. Users create their
    // own categories when organizing starts to matter to them.

    let serverPrayers;
    try {
      const res = await supabase
        .from('prayers')
        .select(`*, prayer_updates(*), prayer_points(*), prayer_testimonies(*), prayer_categories(category_id)`)
        .eq('user_id', userId)
        .order('created_at', { ascending: false });
      if (res.error) throw res.error;
      serverPrayers = res.data || [];
    } catch {
      // Categories loaded but prayers didn't — keep hydrated prayers.
      const orderedCats = [...(cats || [])].sort((a, b) => (a.sort_order ?? Infinity) - (b.sort_order ?? Infinity));
      set({ categories: orderedCats, loading: false });
      return;
    }

    // 3. Decrypt any encrypted rows (legacy plaintext rows pass through). Then
    //    merge: server is authoritative. Keep a local-only prayer only if its
    //    creation is STILL queued — so a prayer whose create was permanently
    //    dropped (rejected) is reconciled away rather than lingering as a ghost.
    serverPrayers = await decryptPrayers(serverPrayers);
    const serverIds = new Set(serverPrayers.map((p) => p.id));
    const creating = pendingPrayerIds();
    const localPrayers = get().prayers;
    const pendingLocal = localPrayers.filter((p) => !serverIds.has(p.id) && creating.has(p.id));
    // Re-attach optimistic testimonies whose server write is still queued, so a
    // just-written testimony survives this server-authoritative reconcile instead
    // of vanishing from the reopened answered prayer (mirrors the completions
    // union below). The hydrated snapshot carries them across a fresh session.
    const localTestimonies = new Map(localPrayers.map((p) => [p.id, p.prayer_testimonies || []]));
    const reconciled = serverPrayers.map((p) => mergePendingTestimonies(p, localTestimonies.get(p.id)));
    const mergedPrayers = [...pendingLocal, ...reconciled];

    // Recent per-prayer completions (catch-up + rotation fairness). Best-effort:
    // offline keeps the snapshot's copy, and pending queued completions replay.
    let completions = get().completions;
    try {
      const res = await supabase
        .from('prayer_completions')
        .select('prayer_id, day')
        .eq('user_id', userId)
        .gte('day', addDays(todayKey(), -90));
      if (!res.error && res.data) {
        // Union with local state so completions queued offline (not yet
        // flushed) aren't dropped from the UI.
        const merged = {};
        for (const [pid, days] of Object.entries(get().completions)) merged[pid] = new Set(days);
        for (const c of res.data) (merged[c.prayer_id] ||= new Set()).add(c.day);
        completions = Object.fromEntries(Object.entries(merged).map(([pid, days]) => [pid, [...days]]));
      }
    } catch { /* offline — snapshot completions stand */ }

    const ordered = [...(cats || [])].sort((a, b) => (a.sort_order ?? Infinity) - (b.sort_order ?? Infinity));
    set({ categories: ordered, prayers: mergedPrayers, completions, loading: false });
    saveSnapshot(userId, { categories: ordered, prayers: mergedPrayers, completions });
    // Mirror shared content of saved-from-community prayers (fully-shared sync).
    get().refreshSavedCopies();
  },

  // Refetch a single personal prayer from the server and replace it in state.
  // Used to reflect community-side edits (two-way sync) back onto the owner's
  // personal copy in-session. No-op for prayers the user can't read (non-owner).
  refreshPrayer: async (prayerId) => {
    const { data } = await supabase
      .from('prayers')
      .select(`*, prayer_updates(*), prayer_points(*), prayer_testimonies(*), prayer_categories(category_id)`)
      .eq('id', prayerId)
      .maybeSingle();
    if (data) {
      const decrypted = await decryptPrayerFromStorage(data);
      set((state) => ({ prayers: state.prayers.map((p) => (p.id === prayerId ? decrypted : p)) }));
    }
  },

  // Batch version of refreshFromCommunity: mirror the shared content of ALL
  // saved-from-community prayers from their linked community prayers in one query.
  // Run on load so saved copies reflect the current shared content (incl. edits
  // synced from other members), without opening each one.
  refreshSavedCopies: async () => {
    const saved = get().prayers.filter((p) => p.community_origin_id);
    if (saved.length === 0) return;
    const { data } = await supabase
      .from('community_prayers')
      .select('id, group_id, title, description, prayer_points, encrypted_payload, encryption_version, key_version')
      .in('id', saved.map((p) => p.community_origin_id));
    if (!data) return;
    const decrypted = await Promise.all(data.map((c) => decryptCommunityRow(groupKeyResolver(c.group_id), c)));
    const byId = Object.fromEntries(decrypted.map((c) => [c.id, c]));
    set((state) => ({
      prayers: state.prayers.map((p) => {
        const c = p.community_origin_id && byId[p.community_origin_id];
        if (!c) return p;
        return {
          ...p,
          title: c.title ?? p.title,
          description: c.description ?? p.description,
          prayer_points: (c.prayer_points || []).map((pp) => ({ id: pp.id, title: pp.title, verses: pp.verses || [] })),
        };
      }),
    }));
  },

  // Fetch testimonies + member updates posted on the community copies of a
  // personal prayer (whether it's the shared source or a saved copy), so they
  // can be shown read-only in the personal prayer detail.
  fetchSharedActivity: async (prayer) => {
    // The community copies whose activity we display, each with its group so the
    // rows can be decrypted under the right group key.
    const col = prayer.community_origin_id ? 'id' : 'source_prayer_id';
    const val = prayer.community_origin_id || prayer.id;
    const { data: copies } = await supabase.from('community_prayers').select('id, group_id').eq(col, val);
    if (!copies || copies.length === 0) return { testimonies: [], updates: [] };
    const ids = copies.map((c) => c.id);
    const groupByCp = Object.fromEntries(copies.map((c) => [c.id, c.group_id]));
    const [tRes, uRes] = await Promise.all([
      supabase.from('testimonies').select('*').in('community_prayer_id', ids).order('created_at'),
      supabase.from('community_updates').select('*').in('community_prayer_id', ids).order('created_at', { ascending: true }),
    ]);
    const testimonies = await Promise.all((tRes.data || []).map((t) => decryptCommunityRow(groupKeyResolver(t.group_id), t)));
    const updates = await Promise.all((uRes.data || []).map((u) => decryptCommunityRow(groupKeyResolver(groupByCp[u.community_prayer_id]), u)));
    return { testimonies, updates };
  },

  // One-way pull for prayers saved from the community: refresh the saved copy's
  // shared content (title, description, prayer points) from the linked community
  // prayer so the owner sees the author's/group's latest. Personal fields
  // (scheduling, categories, status, testimonies) are left untouched.
  refreshFromCommunity: async (prayerId) => {
    const p = get().prayers.find((x) => x.id === prayerId);
    if (!p?.community_origin_id) return;
    const { data } = await supabase
      .from('community_prayers')
      .select('group_id, title, description, prayer_points, encrypted_payload, encryption_version, key_version')
      .eq('id', p.community_origin_id)
      .maybeSingle();
    if (!data) return; // not a member anymore / not found → keep the snapshot
    const c = await decryptCommunityRow(groupKeyResolver(data.group_id), data);
    const points = (c.prayer_points || []).map((pp) => ({ id: pp.id, title: pp.title, verses: pp.verses || [] }));
    set((state) => ({
      prayers: state.prayers.map((x) =>
        x.id === prayerId
          ? { ...x, title: c.title ?? x.title, description: c.description ?? x.description, prayer_points: points }
          : x
      ),
    }));
  },

  // ─── Vault coverage / migration ──────────────────────────────
  // Read-only: how many of the user's PRIVATE prayers are protected vs. still
  // plaintext at rest. Returns null when the server can't be reached (offline)
  // so the UI can stay silent rather than assert a state it can't verify.
  scanVaultCoverage: async () => {
    const { userId } = get();
    if (!userId) return { total: 0, pending: 0 };
    let rows, sharedIds;
    try {
      [rows, sharedIds] = await Promise.all([fetchOwnedEncryptionState(userId), fetchSharedPrayerIds(userId)]);
    } catch {
      return null;
    }
    let total = 0, pending = 0;
    for (const p of rows) {
      if (p.community_origin_id || sharedIds.has(p.id)) continue; // plaintext by design
      total++;
      if (prayerNeedsEncryption(p)) pending++;
    }
    return { total, pending };
  },

  // Encrypt every still-plaintext PRIVATE prayer at rest. Requires the vault
  // unlocked (needs the master key) and a network connection. In-memory state is
  // left untouched — it already holds the same plaintext; only the server's (and,
  // on the next snapshot save, the local cache's) at-rest form changes.
  migrateToVault: async () => {
    const { userId } = get();
    if (!userId || !isUnlocked()) return { migrated: 0, failed: 0 };
    let rows, sharedIds;
    try {
      [rows, sharedIds] = await Promise.all([fetchOwnedForMigration(userId), fetchSharedPrayerIds(userId)]);
    } catch {
      return { migrated: 0, failed: 0 };
    }
    let migrated = 0, failed = 0;
    for (const p of rows) {
      if (p.community_origin_id || sharedIds.has(p.id) || !prayerNeedsEncryption(p)) continue;
      try { await encryptExistingPrayer(p); migrated++; }
      catch { failed++; }
    }
    return { migrated, failed };
  },

  // ─── Prayers ─────────────────────────────────────────────────
  // Optimistic + offline-capable: the prayer appears immediately and the server
  // write is queued (replayed on reconnect). A client-generated id keeps the
  // local record and the eventual server row in sync.
  addPrayer: async (prayer) => {
    // getSession reads the locally-cached session (no network), so this works offline.
    const { data: { session } } = await supabase.auth.getSession();
    const userId = session?.user?.id;
    if (!userId) return null;

    // Activation signal: was the journal empty before this? (No content is sent —
    // just the fact that a first prayer was created. See lib/analytics.js.)
    const isFirst = get().prayers.length === 0;

    const id = crypto.randomUUID();
    const categoryIds = prayer.categoryIds || [];
    const row = {
      id,
      user_id: userId,
      title: prayer.title,
      description: prayer.description || '',
      for_other: prayer.forOther || false,
      person_name: prayer.personName || '',
      phone: prayer.phone || '',
      status: 'active',
      // Scheduling metadata stays outside the E2EE envelope (timing, not content).
      schedule: prayer.schedule || null,
      // Source language of the content, defaulted from the active interface
      // language — a language code, not content, so it travels beside the
      // envelope and survives the offline queue unchanged.
      content_language: prayer.contentLanguage || get().settings.language || null,
    };

    // Decided ONCE, from this prayer's own encryptability, and recorded on the
    // optimistic copy so the UI states a fact about this row rather than a
    // guess from the vault.
    const willEncrypt = canEncrypt(row);

    const optimistic = {
      ...row,
      created_at: new Date().toISOString(),
      prayer_updates: [],
      prayer_points: [],
      prayer_testimonies: [],
      prayer_categories: categoryIds.map((category_id) => ({ category_id })),
      // Explicit per-prayer encryption metadata for the moment before the
      // server row (which carries encryption_version) is read back. The saved
      // confirmation reads THIS, never the global vault state — a prayer
      // written while the key was unavailable must not claim to be encrypted.
      _encrypted: willEncrypt,
    };
    set((state) => ({ prayers: [optimistic, ...state.prayers] }));
    // In-memory stays plaintext; only the persisted row is encrypted (if the
    // vault is unlocked). New prayers have no community_origin_id → encryptable.
    const persistRow = willEncrypt ? await encryptPrayerForStorage(row) : row;
    enqueue('createPrayer', { row: persistRow, categoryIds });
    if (isFirst) track(EVENTS.FIRST_PRAYER_CREATED);
    return id;
  },

  // Saves a community prayer into the user's personal list as a snapshot copy
  // (title, description, prayer points). Not ongoing-synced; deduped by origin.
  addFromCommunity: async (communityPrayer, groupName = null) => {
    const existing = get().prayers.find((p) => p.community_origin_id === communityPrayer.id);
    if (existing) return { prayer: existing, alreadyAdded: true };

    const { data: { user } } = await supabase.auth.getUser();
    const { data, error } = await supabase
      .from('prayers')
      .insert(communityToPersonalInsert(communityPrayer, groupName, user.id))
      .select(`*, prayer_updates(*), prayer_points(*), prayer_testimonies(*), prayer_categories(category_id)`)
      .single();
    if (error || !data) return { error: error?.message || 'failed' };

    // Copy current prayer points (categories are skipped — they belong to the author).
    const points = (communityPrayer.prayer_points || []).map((pp) => ({
      prayer_id: data.id, title: pp.title, verses: pp.verses || [],
    }));
    if (points.length > 0) {
      const { data: inserted } = await supabase.from('prayer_points').insert(points).select();
      data.prayer_points = inserted || [];
    }

    set((state) => ({ prayers: [data, ...state.prayers] }));
    return { prayer: data };
  },

  // Optimistic + offline-capable. Fields map to snake_case; category links and
  // shared-copy mirroring are handled idempotently by the executor.
  updatePrayer: async (id, updates) => {
    const payload = {};
    if (updates.title !== undefined) payload.title = updates.title;
    if (updates.description !== undefined) payload.description = updates.description;
    if (updates.forOther !== undefined) payload.for_other = updates.forOther;
    if (updates.personName !== undefined) payload.person_name = updates.personName;
    if (updates.phone !== undefined) payload.phone = updates.phone;
    if (updates.weekDays !== undefined) payload.week_days = updates.weekDays;
    if (updates.pinned !== undefined) payload.pinned = updates.pinned;
    if (updates.schedule !== undefined) payload.schedule = updates.schedule; // null clears
    if (updates.scheduleOverrides !== undefined) payload.schedule_overrides = updates.scheduleOverrides;
    // The author's correction of the source language — metadata beside the
    // envelope, so it survives the offline queue exactly like scheduling.
    if (updates.contentLanguage !== undefined) payload.content_language = updates.contentLanguage;
    payload.updated_at = new Date().toISOString();

    const current = get().prayers.find((p) => p.id === id);
    // An edit re-encrypts a previously-plaintext row, so the in-memory copy
    // records that this row is now encrypted instead of waiting for a reload.
    const nowEncrypted = canEncrypt(current);
    set((state) => ({
      prayers: state.prayers.map((p) => {
        if (p.id !== id) return p;
        const prayer_categories = updates.categoryIds !== undefined
          ? updates.categoryIds.map((category_id) => ({ category_id }))
          : p.prayer_categories;
        return { ...p, ...payload, prayer_categories, ...(nowEncrypted ? { _encrypted: true } : {}) };
      }),
    }));

    // Encrypt the persisted payload from the merged plaintext (in-memory) state.
    // The whole sensitive set is re-encrypted (the payload is the full blob) and
    // the plaintext columns are redacted. Editing a personal prayer no longer fans
    // title/description out to its community copies — those are independent
    // snapshots encrypted under the group key, so pushing plaintext here would both
    // leak content and be unreadable under the wrong key.
    let persistPayload = payload;
    if (nowEncrypted) {
      persistPayload = { ...payload, ...(await encryptedSensitiveFields({ ...current, ...payload })) };
    }
    enqueue('updatePrayer', { id, payload: persistPayload, categoryIds: updates.categoryIds });
  },

  // Persist the Scripture-first AI guidance once fetched, so reopening the step
  // later recalls it instead of firing a new AI request. Bundled into the same
  // encrypted_payload as title/description for PRIVATE prayers; stored as plain
  // jsonb otherwise (mirrors updatePrayer's encryption gating).
  setScriptureGuidance: async (prayerId, guidance) => {
    set((state) => ({
      prayers: state.prayers.map((p) => (p.id === prayerId ? { ...p, scripture_guidance: guidance } : p)),
    }));
    const current = get().prayers.find((p) => p.id === prayerId);
    if (!current) return;
    const persistPayload = canEncrypt(current)
      ? await encryptedSensitiveFields(current)
      : { scripture_guidance: guidance };
    enqueue('updatePrayer', { id: prayerId, payload: persistPayload });
  },

  // Reverse direction: when the owner edits categories on a shared community
  // prayer, push them back to the personal source and all its community copies.
  // Owner-only (categories belong to the owner's category set).
  syncCategoriesFromCommunity: async (sourcePrayerId, categoryIds) => {
    const ids = categoryIds || [];
    await supabase.from('prayer_categories').delete().eq('prayer_id', sourcePrayerId);
    if (ids.length > 0) {
      await supabase.from('prayer_categories').insert(ids.map((cid) => ({ prayer_id: sourcePrayerId, category_id: cid })));
    }
    await supabase.from('community_prayers').update({ category_ids: ids }).eq('source_prayer_id', sourcePrayerId);
    set((state) => ({
      prayers: state.prayers.map((p) =>
        p.id === sourcePrayerId ? { ...p, prayer_categories: ids.map((cid) => ({ category_id: cid })) } : p
      ),
    }));
  },

  markAnswered: async (id, testimony, attachments = []) => {
    const answered_at = new Date().toISOString();
    const trimmed = (testimony || '').trim();
    const prayer = get().prayers.find((p) => p.id === id);
    // One new testimony (if any), stored as its own row (Phase 3c) — appended
    // locally and server-side, never overwriting a concurrent sibling.
    const row = trimmed || attachments.length
      ? buildTestimonyRow(id, trimmed, answered_at, get().settings.language || null, attachments)
      : null;
    set((state) => ({
      prayers: state.prayers.map((p) => {
        if (p.id !== id) return p;
        const prayer_testimonies = row ? [...(p.prayer_testimonies || []), row] : (p.prayer_testimonies || []);
        return { ...p, status: 'answered', prayer_testimonies, answered_at };
      }),
    }));
    enqueue('markAnswered', { id, answered_at });
    track(EVENTS.PRAYER_ANSWERED);
    if (row) await get()._persistTestimony(prayer, row);
  },

  // Append a thanksgiving/testimony to an already-answered prayer. It becomes its
  // own row, so the prayer's status and answered_at are untouched — remembrance,
  // not a re-answer.
  addTestimony: async (id, content, attachments = []) => {
    const trimmed = (content || '').trim();
    if (!trimmed && !attachments.length) return;
    const prayer = get().prayers.find((p) => p.id === id);
    const row = buildTestimonyRow(id, trimmed, new Date().toISOString(), get().settings.language || null, attachments);
    set((state) => ({
      prayers: state.prayers.map((p) =>
        p.id === id ? { ...p, prayer_testimonies: [...(p.prayer_testimonies || []), row] } : p
      ),
    }));
    await get()._persistTestimony(prayer, row);
  },

  // Persist a personal testimony as its own row. Encrypt the content for PRIVATE
  // prayers (redacting the plaintext column) and pass shared prayers through in
  // plaintext — mirrors _persistEncryptedPoint. Encrypts BEFORE enqueue so the
  // offline queue never holds the plaintext.
  _persistTestimony: async (prayer, row) => {
    const persistRow = canEncryptNested(prayer)
      ? await encryptChildForStorage(row, TESTIMONY_SENSITIVE_FIELDS)
      : row;
    enqueue('addTestimonyRow', { row: persistRow });
  },

  // Delete one attachment from a posted testimony: optimistic local shrink,
  // best-effort removal of the encrypted blob in storage (the owner authored
  // every personal row, so the storage path is theirs), then persist the
  // shrunk list — re-encrypted in place for private prayers, plain jsonb
  // otherwise. Testimonies never fan out, so no mirror cleanup is needed.
  removeTestimonyAttachment: async (prayerId, testimonyId, attId) => {
    const prayer = get().prayers.find((p) => p.id === prayerId);
    const row = (prayer?.prayer_testimonies || []).find((tm) => tm.id === testimonyId);
    const removed = (row?.attachments || []).find((a) => a.id === attId);
    if (!row || !removed) return;
    // An encrypted row we can't re-encrypt (vault locked) can't persist the
    // shrink — bail before touching local state or the stored blob.
    if (isRowEncrypted(row) && !canEncryptNested(prayer)) return;
    const attachments = row.attachments.filter((a) => a.id !== attId);
    set((state) => ({
      prayers: state.prayers.map((p) =>
        p.id === prayerId
          ? { ...p, prayer_testimonies: p.prayer_testimonies.map((tm) => (tm.id === testimonyId ? { ...tm, attachments } : tm)) }
          : p
      ),
    }));
    removeAttachmentFiles([removed]);
    if (canEncryptNested(prayer)) {
      const enc = await encryptChildForStorage({ ...row, attachments }, TESTIMONY_SENSITIVE_FIELDS);
      const patch = { encrypted_payload: enc.encrypted_payload, encryption_version: enc.encryption_version };
      for (const f of TESTIMONY_SENSITIVE_FIELDS) patch[f] = enc[f];
      enqueue('updateTestimonyEncrypted', { testimonyId, row: patch });
    } else {
      enqueue('setTestimonyAttachments', { testimonyId, attachments });
    }
  },

  markActive: async (id) => {
    set((state) => ({ prayers: state.prayers.map((p) => p.id === id ? { ...p, status: 'active', answered_at: null } : p) }));
    enqueue('markActive', { id });
  },

  // ─── Scheduling ──────────────────────────────────────────────
  // Per-occurrence exception on a scheduled prayer: { skip: true } or
  // { movedTo: 'YYYY-MM-DD' }; null clears the exception. The series itself
  // is untouched — this is the "this day only" edit scope.
  setOccurrenceOverride: (prayerId, dayKey, override) => {
    const p = get().prayers.find((x) => x.id === prayerId);
    if (!p?.schedule) return;
    const overrides = { ...(p.schedule_overrides || {}) };
    if (override) overrides[dayKey] = override;
    else delete overrides[dayKey];
    set((state) => ({
      prayers: state.prayers.map((x) => (x.id === prayerId ? { ...x, schedule_overrides: overrides } : x)),
    }));
    enqueue('updatePrayer', { id: prayerId, payload: { schedule_overrides: overrides, updated_at: new Date().toISOString() } });
  },
  skipOccurrence: (prayerId, dayKey) => get().setOccurrenceOverride(prayerId, dayKey, { skip: true }),
  moveOccurrence: (prayerId, fromKey, toKey) => get().setOccurrenceOverride(prayerId, fromKey, { movedTo: toKey }),

  // "This and future" edit scope: end the series the day before `fromKey`.
  endSeriesBefore: (prayerId, fromKey) => {
    const p = get().prayers.find((x) => x.id === prayerId);
    if (!p?.schedule || p.schedule.type !== 'recurring') return;
    get().updatePrayer(prayerId, { schedule: { ...p.schedule, end: { kind: 'date', date: addDays(fromKey, -1) } } });
  },

  // Mark one prayer prayed on a local day (idempotent; powers catch-up,
  // calendar history and rotation fairness). Optimistic + offline-queued.
  markPrayedOn: (prayerId, dayKey, slot = null) => {
    const { userId, completions } = get();
    if ((completions[prayerId] || []).includes(dayKey)) return;
    const now = new Date().toISOString();
    const row = { id: crypto.randomUUID(), user_id: userId, prayer_id: prayerId, day: dayKey, slot };
    set((state) => ({
      completions: { ...state.completions, [prayerId]: [...(state.completions[prayerId] || []), dayKey] },
      prayers: state.prayers.map((p) => (p.id === prayerId ? { ...p, last_prayed_at: now } : p)),
    }));
    enqueue('logCompletion', { row, last_prayed_at: now });
    track(EVENTS.PRAYER_PRAYED); // deduped above — one event per prayer per day
  },

  unmarkPrayedOn: (prayerId, dayKey) => {
    set((state) => ({
      completions: { ...state.completions, [prayerId]: (state.completions[prayerId] || []).filter((d) => d !== dayKey) },
    }));
    enqueue('removeCompletion', { prayerId, day: dayKey });
  },

  // completions as Map(prayerId -> Set(day)) for the planner helpers.
  completedDaysMap: () => new Map(Object.entries(get().completions).map(([pid, days]) => [pid, new Set(days)])),

  // All planned entries ({ prayer, source, slot }) for a local day, sorted.
  getEntriesForDay: (dayKey) => {
    const { prayers, categories } = get();
    return sortEntries(prayersForDay(prayers, categories, dayKey), categories);
  },

  // ─── Day completion (single source of truth: per-prayer completions) ──
  // What's left to pray on a day: scheduled for it, active, and not yet marked
  // prayed on it. Home's count, list and "Pray now" all derive from this.
  getRemainingPrayersForDay: (dayKey) => {
    const { completions } = get();
    return get()
      .getEntriesForDay(dayKey)
      .map((e) => e.prayer)
      .filter((p) => !(completions[p.id] || []).includes(dayKey));
  },

  // Every prayer marked prayed on the day — regardless of current status or
  // schedule, so a prayer answered mid-session still counts as prayed today.
  getCompletedPrayersForDay: (dayKey) => {
    const { prayers, completions } = get();
    return prayers.filter((p) => (completions[p.id] || []).includes(dayKey));
  },

  // The day is complete when something was prayed and nothing remains. Derived,
  // never stored — adding a new prayer immediately re-opens the day, and there
  // is no separate day-level flag that could disagree with the per-prayer log.
  isDayComplete: (dayKey) =>
    get().getRemainingPrayersForDay(dayKey).length === 0 &&
    get().getCompletedPrayersForDay(dayKey).length > 0,

  // Missed prayers from the last few days (not prayed since, not on today's list).
  getCatchUp: (windowDays = 3) => {
    const { prayers, categories } = get();
    return catchUpPrayers(prayers, categories, get().completedDaysMap(), todayKey(), windowDays);
  },

  // Pin/unpin a prayer so it floats to the top of the lists (personal organisation).
  togglePin: (id) => {
    const p = get().prayers.find((x) => x.id === id);
    if (p) get().updatePrayer(id, { pinned: !p.pinned });
  },

  // Immediate delete (callers warn the user first). Optimistic + offline-queued.
  deletePrayer: async (id) => {
    set((state) => ({ prayers: state.prayers.filter((p) => p.id !== id) }));
    enqueue('deletePrayer', { id });
  },

  // Optimistically hide a prayer and defer the real delete, so an "Undo" toast
  // can cancel it. Used for low-stakes removals (unfollowing a saved copy).
  softDeletePrayer: (id) => {
    const prayer = get().prayers.find((p) => p.id === id);
    if (!prayer) return null;
    set((state) => ({ prayers: state.prayers.filter((p) => p.id !== id) }));
    const timer = setTimeout(() => {
      pendingDeletes.delete(id);
      enqueue('deletePrayer', { id });
    }, UNDO_WINDOW_MS);
    pendingDeletes.set(id, { prayer, timer });
    return prayer;
  },

  // Cancel a pending soft-delete and restore the prayer to the list.
  undoDelete: (id) => {
    const entry = pendingDeletes.get(id);
    if (!entry) return;
    clearTimeout(entry.timer);
    pendingDeletes.delete(id);
    set((state) => (state.prayers.some((p) => p.id === id)
      ? state
      : { prayers: [entry.prayer, ...state.prayers] }));
  },

  // ─── Updates ─────────────────────────────────────────────────
  // Routed through sync_add_update so the update also fans out to any shared
  // community copies. For non-shared prayers it just writes prayer_updates.
  addUpdate: async (prayerId, text, authorName = '', attachments = []) => {
    const id = crypto.randomUUID();
    const row = { id, prayer_id: prayerId, text, attachments, author_name: authorName, is_anonymous: false, created_at: new Date().toISOString(), content_language: get().settings.language || null };
    set((state) => ({
      prayers: state.prayers.map((p) =>
        p.id === prayerId ? { ...p, prayer_updates: [...(p.prayer_updates || []), row] } : p
      ),
    }));
    // Private prayer → store the update as ciphertext directly; shared prayer →
    // route through sync_add_update so it fans out to the community copies.
    const prayer = get().prayers.find((p) => p.id === prayerId);
    if (canEncryptNested(prayer)) {
      const encRow = await encryptChildForStorage(row, UPDATE_SENSITIVE_FIELDS);
      enqueue('addUpdateEncrypted', { row: encRow });
    } else {
      enqueue('addUpdate', { id, prayerId, text, authorName, attachments });
    }
  },

  // Delete one attachment from a posted update — same shape as
  // removeTestimonyAttachment, with one extra wrinkle: a PLAINTEXT update on a
  // shared prayer was fanned out into community_updates mirrors by
  // sync_add_update, so those rows must shrink too (the RPC handles both).
  // E2EE rows never fanned out and carry their metadata inside
  // encrypted_payload, so they are re-encrypted and updated in place; a row
  // that is BOTH still plaintext on the server and encryptable now gets the
  // RPC as well, so any pre-E2EE mirrors don't keep a dead attachment.
  removeUpdateAttachment: async (prayerId, updateId, attId) => {
    const prayer = get().prayers.find((p) => p.id === prayerId);
    const row = (prayer?.prayer_updates || []).find((u) => u.id === updateId);
    const removed = (row?.attachments || []).find((a) => a.id === attId);
    if (!row || !removed) return;
    // An encrypted row we can't re-encrypt (vault locked) can't persist the
    // shrink — bail before touching local state or the stored blob.
    if (isRowEncrypted(row) && !canEncryptNested(prayer)) return;
    const attachments = row.attachments.filter((a) => a.id !== attId);
    set((state) => ({
      prayers: state.prayers.map((p) =>
        p.id === prayerId
          ? { ...p, prayer_updates: p.prayer_updates.map((u) => (u.id === updateId ? { ...u, attachments } : u)) }
          : p
      ),
    }));
    removeAttachmentFiles([removed]);
    if (!isRowEncrypted(row)) {
      enqueue('removeUpdateAttachment', { updateId, attId, attachments });
    }
    if (canEncryptNested(prayer)) {
      const enc = await encryptChildForStorage({ ...row, attachments }, UPDATE_SENSITIVE_FIELDS);
      const patch = { encrypted_payload: enc.encrypted_payload, encryption_version: enc.encryption_version };
      for (const f of UPDATE_SENSITIVE_FIELDS) patch[f] = enc[f];
      enqueue('updateUpdateEncrypted', { updateId, row: patch });
    }
  },

  // ─── Prayer Points ────────────────────────────────────────────
  // Routed through sync_add_point so the point also fans out to any shared
  // community copies. For non-shared prayers it just writes prayer_points.
  addPrayerPoint: async (prayerId, point) => {
    // Build initial verses array from legacy single-verse fields or provided verses
    const initialVerses = point.verses
      ? point.verses
      : point.verse
        ? [{ ref: point.verse, text: point.verseText || '' }]
        : [];

    const id = crypto.randomUUID();
    const row = { id, prayer_id: prayerId, title: point.title, verses: initialVerses };
    set((state) => ({
      prayers: state.prayers.map((p) =>
        p.id === prayerId ? { ...p, prayer_points: [...(p.prayer_points || []), row] } : p
      ),
    }));
    const prayer = get().prayers.find((p) => p.id === prayerId);
    if (canEncryptNested(prayer)) {
      const encRow = await encryptChildForStorage(row, POINT_SENSITIVE_FIELDS);
      enqueue('addPointEncrypted', { row: encRow });
    } else {
      enqueue('addPrayerPoint', { id, prayerId, title: point.title, verses: initialVerses });
    }
  },

  // Verse/point mutations route through the sync_* RPCs so they also propagate
  // to any shared community copies (no-op fan-out when the prayer isn't shared).
  addVerseToPoint: async (prayerId, pointId, verse) => {
    const state = get();
    const prayer = state.prayers.find(p => p.id === prayerId);
    const point = (prayer?.prayer_points || []).find(pp => pp.id === pointId);
    if (!point) return;
    const updated = [...(point.verses || []), verse];
    set((s) => ({
      prayers: s.prayers.map(p =>
        p.id === prayerId
          ? { ...p, prayer_points: p.prayer_points.map(pp => pp.id === pointId ? { ...pp, verses: updated } : pp) }
          : p
      ),
    }));
    if (canEncryptNested(prayer)) {
      await get()._persistEncryptedPoint(pointId, point.title, updated);
    } else {
      enqueue('addVerse', { prayerId, pointId, verse });
    }
  },

  removeVerseFromPoint: async (prayerId, pointId, verseRef) => {
    const state = get();
    const prayer = state.prayers.find(p => p.id === prayerId);
    const point = (prayer?.prayer_points || []).find(pp => pp.id === pointId);
    if (!point) return;
    const updated = (point.verses || []).filter(v => v.ref !== verseRef);
    set((s) => ({
      prayers: s.prayers.map(p =>
        p.id === prayerId
          ? { ...p, prayer_points: p.prayer_points.map(pp => pp.id === pointId ? { ...pp, verses: updated } : pp) }
          : p
      ),
    }));
    if (canEncryptNested(prayer)) {
      await get()._persistEncryptedPoint(pointId, point.title, updated);
    } else {
      enqueue('removeVerse', { prayerId, pointId, verseRef });
    }
  },

  removePrayerPoint: async (prayerId, pointId) => {
    set((state) => ({
      prayers: state.prayers.map((p) =>
        p.id === prayerId
          ? { ...p, prayer_points: (p.prayer_points || []).filter((pp) => pp.id !== pointId) }
          : p
      ),
    }));
    // Deletion exposes no plaintext, so it can use the shared remove RPC for both
    // private and shared prayers (the community fan-out is a no-op when private).
    enqueue('removePoint', { prayerId, pointId });
  },

  // Re-encrypt a PRIVATE prayer point after its verses changed and queue the
  // server update — the verses live inside encrypted_payload, so we overwrite the
  // blob and keep the plaintext columns redacted. Encrypts before enqueue so the
  // offline queue never holds the plaintext.
  _persistEncryptedPoint: async (pointId, title, verses) => {
    const enc = await encryptChildForStorage({ title, verses }, POINT_SENSITIVE_FIELDS);
    enqueue('updatePointEncrypted', {
      pointId,
      row: { encrypted_payload: enc.encrypted_payload, encryption_version: enc.encryption_version, title: '', verses: [] },
    });
  },

  // ─── Categories ───────────────────────────────────────────────
  addCategory: async (category) => {
    const { data: { user } } = await supabase.auth.getUser();
    const { data } = await supabase
      .from('categories')
      .insert({ user_id: user.id, name: category.name, emoji: category.emoji, color: category.color, week_days: category.weekDays || [] })
      .select().single();
    if (data) set((state) => ({ categories: [...state.categories, data] }));
  },

  updateCategory: async (id, updates) => {
    const payload = {};
    if (updates.name !== undefined) payload.name = updates.name;
    if (updates.emoji !== undefined) payload.emoji = updates.emoji;
    if (updates.color !== undefined) payload.color = updates.color;
    if (updates.weekDays !== undefined) payload.week_days = updates.weekDays;
    if (updates.rotation !== undefined) payload.rotation = updates.rotation; // { perDay: n } | null

    const { data } = await supabase.from('categories').update(payload).eq('id', id).select().single();
    if (data) {
      set((state) => ({ categories: state.categories.map((c) => c.id === id ? data : c) }));
    }
  },

  deleteCategory: async (id) => {
    await supabase.from('categories').delete().eq('id', id);
    set((state) => ({ categories: state.categories.filter((c) => c.id !== id) }));
  },

  // ─── Settings ────────────────────────────────────────────────
  // localStorage is the instant local copy; language, theme, AI consent and
  // reminder prefs are also mirrored to the account-level user_settings row so
  // every signed-in browser agrees (notificationsGranted stays device-local —
  // it's a permission fact, not a preference).
  // `sync: false` is used when applying values that just came FROM the server.
  updateSettings: (updates, { sync = true } = {}) => {
    if (updates.language) localStorage.setItem('pfm_language', updates.language);
    if (updates.theme) {
      localStorage.setItem('pfm_theme', updates.theme);
      document.documentElement.setAttribute('data-theme', updates.theme);
    }
    let next;
    set((state) => {
      next = { ...state.settings, ...updates };
      // Persist all prefs (reminder toggle/time, follow-up, etc.) so they survive
      // a refresh — previously only language/theme were saved.
      try { localStorage.setItem('pfm_settings', JSON.stringify(next)); } catch { /* ignore */ }
      return { settings: next };
    });
    const { userId } = get();
    if (sync && userId && touchesSyncedSettings(updates)) {
      saveUserSettings(userId, next).catch(() => { /* offline — next change retries */ });
    }
  },

  // Pull the account's settings so this browser matches the others; a browser
  // signing in before any server row exists seeds it from its local state.
  // Afterwards, re-align this device's push subscription with whatever won, so
  // reminders enabled elsewhere are delivered here too (permission permitting).
  syncSettings: async (userId) => {
    try {
      const server = await fetchUserSettings(userId);
      if (server) {
        if (server.language) {
          server.language = resolveLanguage(server.language, navigator.language || navigator.userLanguage);
        }
        if (server.theme !== 'light' && server.theme !== 'dark') delete server.theme;
        get().updateSettings(server, { sync: false });
      } else {
        await saveUserSettings(userId, get().settings);
      }
      // Also honour the account-level event-push master switch, so turning on
      // "Push notifications" on one device keeps every other permission-granted
      // device subscribed too (not just the reminder toggles).
      let eventPush = false;
      try { eventPush = await isEventPushEnabled(userId); } catch { /* default off */ }
      await ensurePushSubscription(userId, get().settings, eventPush);
    } catch { /* offline — local settings stand */ }
  },

  // ─── Today's prayers ─────────────────────────────────────────
  // Planner-backed: per-prayer schedules (one-time/recurring/slots/rotation)
  // and the legacy weekly category plan, merged and sorted.
  getTodaysPrayers: () => {
    const { prayers, categories } = get();
    return sortEntries(prayersForDay(prayers, categories, todayKey()), categories).map((e) => e.prayer);
  },

  // Persist a new category order (array of ids → sort_order = index).
  reorderCategories: async (orderedIds) => {
    set((state) => ({ categories: sortByOrder(state.categories, orderedIds) }));
    await Promise.all(orderedIds.map((id, i) => supabase.from('categories').update({ sort_order: i }).eq('id', id)));
  },
}));

// Persist prayers + categories locally on change (debounced), so the next load
// can hydrate instantly and offline — including not-yet-synced prayers.
let saveTimer;
usePrayerStore.subscribe((state) => {
  if (!state.userId) return;
  clearTimeout(saveTimer);
  saveTimer = setTimeout(
    () => saveSnapshot(state.userId, { categories: state.categories, prayers: state.prayers, completions: state.completions }),
    400
  );
});

export default usePrayerStore;
