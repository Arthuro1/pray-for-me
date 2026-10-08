import { describe, expect, it } from 'vitest';
import { preparePrayerAiInput, selectPrayerAiInput } from './aiPrayerInput';
import { validateTaskRequest } from '../../server/aiTasks';

describe('reviewed prayer AI input', () => {
  it('defaults to title only and snapshots opted-in, trimmed fields', () => {
    const source = { title: '  Hope  ', description: '  Background  ', update: '  Today  ' };
    expect(selectPrayerAiInput(source)).toEqual({ title: 'Hope', description: '', update: '' });
    expect(selectPrayerAiInput(source, { aiSendUpdate: true })).toEqual({ title: 'Hope', description: '', update: 'Today' });
    expect(preparePrayerAiInput({ title: undefined, description: null, update: 5 })).toMatchObject({ title: '', description: '', update: '', context: '', shortened: false });
  });

  it('uses consistent redaction placeholders across the labelled fields and joined context', () => {
    const outgoing = preparePrayerAiInput({ title: 'mom@example.com', description: 'Contact mom@example.com', update: 'Call +1 415 555 2671' });
    expect(outgoing).toMatchObject({
      title: '[EMAIL_1]',
      description: 'Contact [EMAIL_1]',
      update: 'Call [PHONE_1]',
      context: 'Contact [EMAIL_1]\n\nCall [PHONE_1]',
      shortened: false,
    });
  });

  it.each([
    ['d'.repeat(7000), 'u'.repeat(7000)],
    ['d'.repeat(7000), 'A short update'],
    ['Short background', 'u'.repeat(7000)],
    ['d'.repeat(7000), ''],
    ['', 'u'.repeat(7000)],
  ])('bounds long selected fields to the server contract without losing a selected update', (description, update) => {
    const outgoing = preparePrayerAiInput({ title: 't'.repeat(500), description, update });
    expect(outgoing.title.length).toBeLessThanOrEqual(300);
    expect(outgoing.context.length).toBeLessThanOrEqual(4000);
    expect(outgoing.shortened).toBe(true);
    if (update) expect(outgoing.update.length).toBeGreaterThan(0);
    expect(outgoing.context).toBe([outgoing.description, outgoing.update].filter(Boolean).join('\n\n'));
    expect(validateTaskRequest({ task: 'prayer_recommendations', input: { title: outgoing.title, description: outgoing.context, kind: 'new', lang: 'en' } })).not.toBeNull();
  });

  it('redacts before bounding text and never cuts a placeholder or a Unicode character', () => {
    const outgoing = preparePrayerAiInput({ title: `${'a'.repeat(294)} test@example.com`, description: `${'a'.repeat(3999)}😀`, update: '' });
    expect(outgoing.title).toBe('a'.repeat(294));
    expect(outgoing.description).toBe('a'.repeat(3999));
    expect(outgoing.title).not.toContain('test@');
  });
});
