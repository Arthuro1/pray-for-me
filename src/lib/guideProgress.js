// Grow-path progress: which prayer guides were started / completed on this
// device, so Grow can open with ONE recommended next step instead of an
// equal-weight catalogue. Deliberately local (localStorage) and content-free —
// it records ids and timestamps only, never what was prayed.
const KEY = 'pfm_guide_progress';

export function getGuideProgress() {
  try {
    const parsed = JSON.parse(localStorage.getItem(KEY) || '{}');
    return parsed && typeof parsed === 'object' ? parsed : {};
  } catch {
    return {};
  }
}

function save(progress) {
  try { localStorage.setItem(KEY, JSON.stringify(progress)); } catch { /* storage unavailable */ }
}

export function markGuideStarted(id) {
  if (!id) return;
  const progress = getGuideProgress();
  if (progress[id]?.startedAt) return; // first start wins — keeps "continue" honest
  progress[id] = { ...(progress[id] || {}), startedAt: new Date().toISOString() };
  save(progress);
}

export function markGuideCompleted(id) {
  if (!id) return;
  const progress = getGuideProgress();
  progress[id] = { ...(progress[id] || {}), completedAt: new Date().toISOString() };
  save(progress);
}

// The single recommended next step, from existing progress only (no
// questionnaire): a guide already begun wins over anything new; otherwise the
// first guide not yet completed; when everything is done, invite praying a
// favourite again. Returns { type: 'continue' | 'new' | 'again', guide } or
// null when there are no guides at all.
export function recommendNext(guides, progress = getGuideProgress()) {
  const list = guides || [];
  if (list.length === 0) return null;
  const inProgress = list.find((g) => progress[g.id]?.startedAt && !progress[g.id]?.completedAt);
  if (inProgress) return { type: 'continue', guide: inProgress };
  const fresh = list.find((g) => !progress[g.id]?.completedAt);
  if (fresh) return { type: 'new', guide: fresh };
  return { type: 'again', guide: list[0] };
}

// Completed guides move into a collapsed History section.
export function completedGuides(guides, progress = getGuideProgress()) {
  return (guides || []).filter((g) => progress[g.id]?.completedAt);
}
