import { redactMany } from './aiRedaction';

// Match the finite prayer-task limits in server/aiTasks.js. The review and
// request share this preparation, including redaction and length limits.
export const AI_PRAYER_TITLE_LIMIT = 300;
export const AI_PRAYER_CONTEXT_LIMIT = 4000;

export function selectPrayerAiInput({ title, description = '', update = '' }, settings = {}) {
  return {
    title: typeof title === 'string' ? title.trim() : '',
    description: settings.aiSendDescription && typeof description === 'string' ? description.trim() : '',
    update: settings.aiSendUpdate && typeof update === 'string' ? update.trim() : '',
  };
}

function fit(text, limit) {
  if (text.length <= limit) return text;
  let end = limit;
  const opening = text.lastIndexOf('[', end - 1);
  const placeholder = opening >= 0 && text.slice(opening).match(/^\[(?:EMAIL|PHONE|URL|SECRET|ADDRESS)_\d+\]/);
  if (placeholder && opening + placeholder[0].length > end) end = opening;
  // Avoid leaving half of a UTF-16 character at the boundary.
  if (end && /[\uD800-\uDBFF]/.test(text[end - 1])) end -= 1;
  return text.slice(0, end).trimEnd();
}

export function preparePrayerAiInput(input = {}) {
  const { texts } = redactMany([input?.title, input?.description, input?.update].map((value) => typeof value === 'string' ? value : ''));
  const [title, description, update] = texts;
  // Reserve room for both included fields. A shorter field gives its unused
  // space to the other, so the latest update never silently disappears.
  const available = AI_PRAYER_CONTEXT_LIMIT - (description && update ? 2 : 0);
  const descriptionLimit = update && description
    ? Math.max(Math.ceil(available / 2), available - update.length)
    : available;
  const outDescription = fit(description, descriptionLimit);
  const outUpdate = fit(update, available - outDescription.length);
  return {
    title: fit(title, AI_PRAYER_TITLE_LIMIT),
    description: outDescription,
    update: outUpdate,
    context: [outDescription, outUpdate].filter(Boolean).join('\n\n'),
    shortened: title.length > AI_PRAYER_TITLE_LIMIT || description.length > outDescription.length || update.length > outUpdate.length,
  };
}
