import { describe, it, expect } from 'vitest';
import { flattenStrings, localizedEntries } from './entries';
import { loadCatalogue } from './catalogue';
import { auditEntries, validateMetadata } from '../../scripts/content-quality/checks.mjs';
import { fingerprints } from '../../scripts/content-quality/runtime.mjs';
import rules from './content-rules.json';
import de from './glossary/de.json';

const entry = { id: 'landing:beginLabel', surface: 'landing', locale: 'de', key: 'beginLabel', source: 'Begin with a prayer', text: 'Mit einem Gebet beginnen', sensitivity: 'marketing' };
describe('content-quality protections', () => {
  it('extracts displayed text without structural icons or Scripture references', () => {
    expect(flattenStrings({ icon: 'Book', color: '#fff', title: 'Read', scriptureReferences: ['John 1:1'], steps: [{ text: 'Pray' }] })).toEqual({ title: 'Read', 'steps[0].text': 'Pray' });
  });
  it('aligns plan overlays including biblical story and nested arrays', () => {
    const entries = localizedEntries('plans/test', 'de', { id: 'test', biblical: { ref: 'John 1:1', text: { en: 'Story', fr: 'Récit' } }, days: [{ prompts: [{ en: 'Pray', fr: 'Prie' }] }] }, { biblical: 'Geschichte', days: [{ prompts: ['Bete'] }] });
    expect(entries.map((e) => [e.key, e.text])).toEqual([['biblical.text', 'Geschichte'], ['days[0].prompts[0]', 'Bete']]);
  });
  it('reports missing authored content instead of silently labelling English as German', () => {
    expect(localizedEntries('plans/test', 'de', { intro: { en: 'English source' } })[0].text).toBeNull();
  });
  it('only flags avoid terms at word boundaries and supports contextual alternatives', () => {
    expect(auditEntries([{ ...entry, text: 'Eine Gebetsanfrage' }], rules, { de })[0].rule).toContain('prayerRequest');
    expect(auditEntries([{ ...entry, text: 'Gebetsanfragenliste' }], rules, { de })).toEqual([]);
  });
  it('flags Traditional characters in the Simplified Chinese locale', () => {
    const zh = { ...entry, locale: 'zh', text: '在基督裡的自由' };
    expect(auditEntries([zh], rules, {})[0]).toMatchObject({ rule: 'script' });
    expect(auditEntries([{ ...zh, text: '在基督里的自由' }], rules, {})).toEqual([]);
  });
  it('changed source or target cannot inherit a baseline exemption', () => {
    const bad = { ...entry, text: 'x'.repeat(100) };
    const original = auditEntries([bad], rules, { de })[0].fingerprint;
    expect(auditEntries([{ ...bad, source: 'Different source' }], rules, { de })[0].fingerprint).not.toBe(original);
    expect(auditEntries([{ ...bad, text: 'y'.repeat(100) }], rules, { de })[0].fingerprint).not.toBe(original);
  });
  it('distinguishes legitimate repeated prose from different source meanings', () => {
    const first = { ...entry, sensitivity: 'sensitive', surface: 'plans/test', text: 'A'.repeat(150) };
    const second = { ...first, key: 'days[1].reflection', id: 'plans/test:days[1].reflection' };
    expect(auditEntries([first, second], { ...rules, shortKeys: [] }, { de })).toEqual([]);
    expect(auditEntries([first, { ...second, source: 'Different reflection' }], { ...rules, shortKeys: [] }, { de })[0].rule).toBe('repeated-prose');
  });
  it('requires named human evidence and invalidates stale reviews', () => {
    const record = { status: 'human-approved', ...fingerprints([entry]), reviewer: 'Native editor', reviewedAt: '2026-09-22', nativeLanguageReview: true };
    const metadata = { version: 1, semanticSource: 'en', bundles: { 'de/landing': record } };
    expect(validateMetadata([entry], metadata, {}, [])).toEqual([]);
    expect(validateMetadata([{ ...entry, source: 'Changed' }], metadata, {}, [])).toContain('Stale review: de/landing; reset to needs-review.');
    expect(validateMetadata([entry], { ...metadata, bundles: { 'de/landing': { ...record, reviewer: '' } } }, {}, [])).toContain('Human approval lacks required evidence: de/landing');
  });
  it('requires Christian native review for sensitive approval, but permits pending legacy content', () => {
    const sensitive = { ...entry, sensitivity: 'sensitive' };
    const record = { status: 'human-approved', ...fingerprints([sensitive]), reviewer: 'Editor', reviewedAt: '2026-02-30', nativeLanguageReview: true };
    expect(validateMetadata([sensitive], { version: 1, semanticSource: 'en', bundles: { 'de/landing': record } }, {}, [])).toHaveLength(1);
    expect(validateMetadata([sensitive], { version: 1, semanticSource: 'en', bundles: { 'de/landing': { ...record, status: 'needs-review' } } }, {}, [])).toEqual([]);
  });
  it('catalogues all main surfaces with stable, unique ids and real German text', async () => {
    const entries = await loadCatalogue('de');
    expect(new Set(entries.map((e) => e.id)).size).toBe(entries.length);
    expect(entries.find((e) => e.id === 'landing:content.features[3].desc').text).toContain('erhörten Gebete');
    expect(entries.some((e) => e.surface.startsWith('gospel/') && e.text)).toBe(true);
    expect(entries.find((e) => e.id === 'plans/preparing21:days[0].reflection').text).toContain('Asaf');
  });
  it('leaves hidden overlay stubs out, as readers never see them', async () => {
    const entries = await loadCatalogue('de');
    // marriage30 declares no ready overlays; its de.json is a repeated template.
    const reflections = entries.filter((e) => e.surface === 'plans/marriage30' && /^days\[\d+\]\.reflection$/.test(e.key));
    expect(reflections.length).toBeGreaterThan(0);
    expect(reflections.every((e) => !e.text?.startsWith('Heute lenkt die Schrift'))).toBe(true);
    expect(entries.find((e) => e.id === 'plans/covenant21:days[0].reflection').text).toBeTruthy();
  });
});
