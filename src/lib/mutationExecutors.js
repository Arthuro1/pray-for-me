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

// Edit a prayer's fields and (optionally) its category links. Content no longer
// fans out to community copies — those are independent snapshots encrypted under
// the group key (see communityStore / setPrayerShares), so a plaintext push here
// would leak content and be unreadable under the wrong key.
registerMutation('updatePrayer', async ({ id, payload, categoryIds }) => {
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
});

// Mark a prayer answered: set its status + mirror onto any shared community
// copies. Testimonies are their own rows now (see addTestimonyRow), so the
// answer_prayer RPC append hack is gone — this is plain idempotent updates,
// exactly like markActive below.
registerMutation('markAnswered', async ({ id, answered_at }) => {
  const r = await supabase.from('prayers').update({ status: 'answered', answered_at }).eq('id', id);
  throwIf(r.error, r.status);
  const c = await supabase.from('community_prayers').update({ is_answered: true }).eq('source_prayer_id', id);
  throwIf(c.error, c.status);
});

// Append a personal testimony as its own row (Phase 3c). Conflict-free by
// construction — a plain INSERT can't lose a concurrent sibling the way a
// jsonb[] rewrite can. Idempotent via the client-supplied row id. The row is
// already ciphertext for private prayers (redacted plaintext columns) or
// plaintext for shared ones; this executor forwards it either way.
registerMutation('addTestimonyRow', async ({ row }) => {
  const r = await supabase.from('prayer_testimonies').upsert(row, { onConflict: 'id' });
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

// Log "prayed this prayer on this local day" (idempotent via the unique
// (prayer_id, day) constraint) and refresh the denormalised last_prayed_at.
registerMutation('logCompletion', async ({ row, last_prayed_at }) => {
  const r = await supabase.from('prayer_completions').upsert(row, { onConflict: 'prayer_id,day' });
  throwIf(r.error, r.status);
  const u = await supabase.from('prayers').update({ last_prayed_at }).eq('id', row.prayer_id);
  throwIf(u.error, u.status);
});

registerMutation('removeCompletion', async ({ prayerId, day }) => {
  const r = await supabase.from('prayer_completions').delete().eq('prayer_id', prayerId).eq('day', day);
  throwIf(r.error, r.status);
});

// Updates / points / verses route through the sync_* RPCs (which also fan out
// to shared community copies). They take a client-supplied id so the optimistic
// local row matches the server row, and are idempotent on replay.
registerMutation('addUpdate', async ({ id, prayerId, text, authorName, attachments }) => {
  const params = { p_id: id, p_source: prayerId, p_text: text, p_author: authorName || '', p_anon: false };
  // p_attachments only when there are any: it has a DEFAULT server-side, so the
  // bare call still resolves — and keeps resolving against a prod that hasn't
  // run rich_media_updates.sql yet (media itself needs that migration anyway).
  if (attachments?.length) params.p_attachments = attachments;
  const r = await supabase.rpc('sync_add_update', params);
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

// Shrink a PLAINTEXT personal update's attachments after the author deletes
// one. The RPC also cleans the update's fanned-out community mirrors (see
// supabase/attachment_management.sql). Against a prod that hasn't run that
// migration yet the RPC doesn't exist (PGRST202) — fall back to a direct
// table update so the personal row is still fixed; only the mirror cleanup
// waits for the migration.
registerMutation('removeUpdateAttachment', async ({ updateId, attId, attachments }) => {
  const r = await supabase.rpc('sync_remove_update_attachment', { p_update_id: updateId, p_att_id: attId });
  if (r.error?.code === 'PGRST202') {
    const u = await supabase.from('prayer_updates').update({ attachments }).eq('id', updateId);
    throwIf(u.error, u.status);
    return;
  }
  throwIf(r.error, r.status);
});

// Blank a PLAINTEXT personal update's text. Mirror-aware RPC with the same
// pre-migration fallback as removeUpdateAttachment above.
registerMutation('removeUpdateText', async ({ updateId }) => {
  const r = await supabase.rpc('sync_remove_update_text', { p_update_id: updateId });
  if (r.error?.code === 'PGRST202') {
    const u = await supabase.from('prayer_updates').update({ text: '' }).eq('id', updateId);
    throwIf(u.error, u.status);
    return;
  }
  throwIf(r.error, r.status);
});

// Set the text of a PLAINTEXT personal update (author edit). Mirror-aware RPC
// (sync_set_update_text, supabase/update_text_edit.sql) with the same
// pre-migration fallback as removeUpdateText: against a prod without the RPC the
// personal row is still corrected, only the mirror cleanup waits for it.
registerMutation('setUpdateText', async ({ updateId, text }) => {
  const r = await supabase.rpc('sync_set_update_text', { p_update_id: updateId, p_text: text });
  if (r.error?.code === 'PGRST202') {
    const u = await supabase.from('prayer_updates').update({ text }).eq('id', updateId);
    throwIf(u.error, u.status);
    return;
  }
  throwIf(r.error, r.status);
});

// Delete a whole personal update. The RPC also drops its fanned-out community
// mirrors; pre-migration, at least the personal row goes.
registerMutation('deleteUpdate', async ({ updateId }) => {
  const r = await supabase.rpc('sync_delete_update', { p_update_id: updateId });
  if (r.error?.code === 'PGRST202') {
    const u = await supabase.from('prayer_updates').delete().eq('id', updateId);
    throwIf(u.error, u.status);
    return;
  }
  throwIf(r.error, r.status);
});

// Plaintext personal testimony rows never fan out — a direct update suffices.
registerMutation('setTestimonyAttachments', async ({ testimonyId, attachments }) => {
  const r = await supabase.from('prayer_testimonies').update({ attachments }).eq('id', testimonyId);
  throwIf(r.error, r.status);
});

registerMutation('setTestimonyContent', async ({ testimonyId, content }) => {
  const r = await supabase.from('prayer_testimonies').update({ content }).eq('id', testimonyId);
  throwIf(r.error, r.status);
});

registerMutation('deleteTestimony', async ({ testimonyId }) => {
  const r = await supabase.from('prayer_testimonies').delete().eq('id', testimonyId);
  throwIf(r.error, r.status);
});

// Re-encrypt a private update/testimony in place after an attachment delete:
// the attachment metadata lives inside encrypted_payload, so we overwrite the
// blob and keep the plaintext columns redacted (mirrors updatePointEncrypted).
registerMutation('updateUpdateEncrypted', async ({ updateId, row }) => {
  const r = await supabase.from('prayer_updates').update(row).eq('id', updateId);
  throwIf(r.error, r.status);
});

registerMutation('updateTestimonyEncrypted', async ({ testimonyId, row }) => {
  const r = await supabase.from('prayer_testimonies').update(row).eq('id', testimonyId);
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
