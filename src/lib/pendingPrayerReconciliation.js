// Queued ciphertext is newer local work, including terminal failures retained
// for repair. Apply its FIFO intent to fetched rows before decrypting, so a
// later full-bundle edit cannot replace a pending title/verse with stale data.
const encrypted = (row) => row?.encrypted_payload != null || row?.encryption_version != null;
const children = {
  addUpdateEncrypted: ['prayer_updates', 'add'],
  addPointEncrypted: ['prayer_points', 'add'],
  addTestimonyRow: ['prayer_testimonies', 'add'],
  updateUpdateEncrypted: ['prayer_updates', 'updateId'],
  updatePointEncrypted: ['prayer_points', 'pointId'],
  updateTestimonyEncrypted: ['prayer_testimonies', 'testimonyId'],
  deleteUpdate: ['prayer_updates', 'updateId', true],
  removePoint: ['prayer_points', 'pointId', true],
  deleteTestimony: ['prayer_testimonies', 'testimonyId', true],
};

// loadSnapshot has already authenticated these parent payloads. Cache payloads
// also contain nested rows: decrypting an old parent envelope again AFTER a
// child overlay would restore its older children over that pending edit.
// Keep locked ciphertext untouched; only an authenticated plaintext snapshot
// may discard its redundant envelope before newer queued ciphertext is merged.
export function snapshotRowsForPendingOverlay(rows) {
  return (rows || []).map((row) => {
    if (row._locked !== false || !row.encrypted_payload) return row;
    const plain = { ...row };
    delete plain.encrypted_payload;
    return { ...plain, _encrypted: true };
  });
}

export function mergePendingMutationSnapshots(earlier, latest) {
  const seen = new Set(earlier.map((entry) => entry.id));
  return [...earlier, ...latest.filter((entry) => !seen.has(entry.id))];
}

export function applyPendingPrayerMutations(rows, mutations, userId) {
  const prayers = new Map((rows || []).filter((row) => row.user_id === userId)
    .map((row) => [row.id, { ...row }]));
  for (const item of mutations || []) {
    const args = item.args || {};
    const owner = item.accountId || args.accountId || args.row?.user_id;
    if (owner !== userId) continue;
    if (item.kind === 'createPrayer' && encrypted(args.row) && args.row.user_id === userId) {
      const old = prayers.get(args.row.id);
      prayers.set(args.row.id, { ...old, ...args.row,
        prayer_categories: (args.categoryIds || []).map((category_id) => ({ category_id })),
        prayer_updates: old?.prayer_updates || [], prayer_points: old?.prayer_points || [],
        prayer_testimonies: old?.prayer_testimonies || [] });
    } else if (item.kind === 'updatePrayer' && encrypted(args.payload) && prayers.has(args.id)) {
      prayers.set(args.id, { ...prayers.get(args.id), ...args.payload, id: args.id, user_id: userId });
    } else if (item.kind === 'deletePrayer') {
      prayers.delete(args.id);
    } else if (children[item.kind]) {
      const [collection, idField, remove] = children[item.kind];
      const childId = idField === 'add' ? args.row?.id : args[idField];
      if (!childId || (!remove && !encrypted(args.row))) continue;
      const parent = idField === 'add' ? prayers.get(args.row?.prayer_id)
        : [...prayers.values()].find((prayer) => (prayer[collection] || []).some((row) => row.id === childId));
      if (!parent) continue;
      const old = (parent[collection] || []).find((row) => row.id === childId);
      const next = remove ? null : { ...old, ...args.row, id: childId, prayer_id: parent.id };
      prayers.set(parent.id, { ...parent, [collection]: [
        ...(parent[collection] || []).filter((row) => row.id !== childId), ...(next ? [next] : []),
      ] });
    }
  }
  return [...prayers.values()];
}
