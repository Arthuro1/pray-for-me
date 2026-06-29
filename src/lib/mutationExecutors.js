import { supabase } from './supabase';
import { registerMutation } from './mutationQueue';

// Server-side executors for queued mutations. These hold ONLY the Supabase
// calls (no local state) and must be idempotent, since a mutation may be
// replayed if its previous attempt succeeded but the ack was lost. Errors are
// thrown enriched with the HTTP `status` so the queue can classify them.
function throwIf(error, status) {
  if (error) throw Object.assign(new Error(error.message || 'request failed'), { status, code: error.code });
}

// Create a personal prayer (idempotent via client-supplied id + upsert).
registerMutation('createPrayer', async ({ row, categoryIds = [] }) => {
  const res = await supabase.from('prayers').upsert(row, { onConflict: 'id' });
  throwIf(res.error, res.status);
  // Reset category links then re-insert — idempotent without needing a unique
  // constraint, and correct on replay.
  const del = await supabase.from('prayer_categories').delete().eq('prayer_id', row.id);
  throwIf(del.error, del.status);
  if (categoryIds.length) {
    const ins = await supabase
      .from('prayer_categories')
      .insert(categoryIds.map((category_id) => ({ prayer_id: row.id, category_id })));
    throwIf(ins.error, ins.status);
  }
});

// Edit a prayer's fields and (optionally) its category links + shared copies.
registerMutation('updatePrayer', async ({ id, payload, categoryIds, community }) => {
  const upd = await supabase.from('prayers').update(payload).eq('id', id);
  throwIf(upd.error, upd.status);
  if (categoryIds !== undefined) {
    const del = await supabase.from('prayer_categories').delete().eq('prayer_id', id);
    throwIf(del.error, del.status);
    if (categoryIds.length) {
      const ins = await supabase
        .from('prayer_categories')
        .insert(categoryIds.map((category_id) => ({ prayer_id: id, category_id })));
      throwIf(ins.error, ins.status);
    }
  }
  if (community && Object.keys(community).length) {
    const c = await supabase.from('community_prayers').update(community).eq('source_prayer_id', id);
    throwIf(c.error, c.status);
  }
});

registerMutation('markAnswered', async ({ id, answered_at, testimony }) => {
  // Appends the testimony server-side (idempotent) rather than overwriting the
  // array, so a concurrent testimony from another device isn't lost.
  const r = await supabase.rpc('answer_prayer', {
    p_prayer: id,
    p_status: 'answered',
    p_answered_at: answered_at,
    p_testimony_id: testimony?.id ?? null,
    p_content: testimony?.content ?? null,
    p_created_at: testimony?.created_at ?? null,
  });
  throwIf(r.error, r.status);
});

registerMutation('markActive', async ({ id }) => {
  const r = await supabase.from('prayers').update({ status: 'active', answered_at: null }).eq('id', id);
  throwIf(r.error, r.status);
  const c = await supabase.from('community_prayers').update({ is_answered: false }).eq('source_prayer_id', id);
  throwIf(c.error, c.status);
});

registerMutation('deletePrayer', async ({ id }) => {
  const r = await supabase.from('prayers').delete().eq('id', id);
  throwIf(r.error, r.status);
});

// Updates / points / verses route through the sync_* RPCs (which also fan out
// to shared community copies). They take a client-supplied id so the optimistic
// local row matches the server row, and are idempotent on replay.
registerMutation('addUpdate', async ({ id, prayerId, text, authorName }) => {
  const r = await supabase.rpc('sync_add_update', { p_id: id, p_source: prayerId, p_text: text, p_author: authorName || '', p_anon: false });
  throwIf(r.error, r.status);
});

registerMutation('addPrayerPoint', async ({ id, prayerId, title, verses }) => {
  const r = await supabase.rpc('sync_add_point', { p_id: id, p_source: prayerId, p_title: title, p_verses: verses || [] });
  throwIf(r.error, r.status);
});

// Encrypted (PRIVATE-prayer) variants. These bypass the sync_* fan-out RPCs —
// a private prayer has no community copies to fan out to — and write the already
// -encrypted child row straight to its table. RLS lets the owner manage child
// rows of their own prayers (supabase/rls_audit.sql). Idempotent via the
// client-supplied row id. The store only enqueues these when the prayer is
// private (canEncryptNested), so the redacted plaintext columns never leak.
registerMutation('addUpdateEncrypted', async ({ row }) => {
  const r = await supabase.from('prayer_updates').upsert(row, { onConflict: 'id' });
  throwIf(r.error, r.status);
});

registerMutation('addPointEncrypted', async ({ row }) => {
  const r = await supabase.from('prayer_points').upsert(row, { onConflict: 'id' });
  throwIf(r.error, r.status);
});

// Re-encrypt a private prayer point in place after a verse add/remove: the
// verses live inside encrypted_payload, so we overwrite the blob and keep the
// plaintext columns redacted.
registerMutation('updatePointEncrypted', async ({ pointId, row }) => {
  const r = await supabase.from('prayer_points').update(row).eq('id', pointId);
  throwIf(r.error, r.status);
});

registerMutation('addVerse', async ({ prayerId, pointId, verse }) => {
  const r = await supabase.rpc('sync_add_verse', { p_source: prayerId, p_point_id: pointId, p_verse: verse });
  throwIf(r.error, r.status);
});

registerMutation('removeVerse', async ({ prayerId, pointId, verseRef }) => {
  const r = await supabase.rpc('sync_remove_verse', { p_source: prayerId, p_point_id: pointId, p_verse_ref: verseRef });
  throwIf(r.error, r.status);
});

registerMutation('removePoint', async ({ prayerId, pointId }) => {
  const r = await supabase.rpc('sync_remove_point', { p_source: prayerId, p_point_id: pointId });
  throwIf(r.error, r.status);
});
