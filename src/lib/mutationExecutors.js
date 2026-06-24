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
