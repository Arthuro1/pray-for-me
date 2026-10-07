import { describe, expect, it } from 'vitest';
import {
  CIRCLE_CONTENT,
  CIRCLE_UI,
  circleContent,
  circlesForTheme,
  hasCircleOverlay,
  hasDeepLayer,
  loadCircleDeep,
  loadCircleOverlay,
  SHORT_UI_KEYS,
  withOverlay,
} from '.';
import { CIRCLES } from '../../lib/circles';
import { usfmFromReference } from '../../lib/bibleRef';
import { localizeRef } from '../teaching/pick';
import { LANG_CODES } from '../../i18n';

const AUTHORED = ['en', 'fr'];
const SHORT_FIELDS = ['formation', 'heading', 'summary', 'cta'];

// Loaded up front: describe blocks must be synchronous.
const DEEP = Object.fromEntries(await Promise.all(
  CIRCLES.filter(hasDeepLayer).map(async (circle) => [circle, await loadCircleDeep(circle)]),
));

const filled = (field) => AUTHORED.every((lang) => typeof field?.[lang] === 'string' && field[lang].trim().length > 0);

// Every localized string anywhere in a value, for the Scripture-quotation guard.
function strings(value, out = []) {
  if (typeof value === 'string') out.push(value);
  else if (Array.isArray(value)) value.forEach((item) => strings(item, out));
  else if (value && typeof value === 'object') Object.values(value).forEach((item) => strings(item, out));
  return out;
}

// One chapter per reference, an English book name the app knows, and a passage
// the Scripture pipeline can resolve.
function expectValidRef(ref, where) {
  expect(typeof ref, where).toBe('string');
  expect(usfmFromReference(ref), `${where}: ${ref}`).toBeTruthy();
  expect(localizeRef(ref, 'fr'), `${where}: ${ref} has a French book name`).not.toBe(ref);
}

describe('the circle content contract (short layer)', () => {
  it('has one entry per canonical circle, in canonical order', () => {
    expect(CIRCLE_CONTENT.map((c) => c.id)).toEqual(CIRCLES);
    for (const circle of CIRCLES) expect(circleContent(circle)?.id).toBe(circle);
    expect(circleContent('galaxies')).toBeNull();
  });

  for (const content of CIRCLE_CONTENT) {
    describe(content.id, () => {
      it('has a formation statement, heading, summary and call to pray in English and French', () => {
        for (const field of SHORT_FIELDS) expect(filled(content[field]), field).toBe(true);
      });

      it('names the themes Scripture teaches us to pray for, each once', () => {
        expect(content.themes.length).toBeGreaterThanOrEqual(4);
        const ids = content.themes.map((theme) => theme.id);
        expect(new Set(ids).size).toBe(ids.length);
        for (const theme of content.themes) {
          expect(theme.id).toMatch(/^[a-z][a-z-]*$/);
          expect(filled(theme.title), theme.id).toBe(true);
        }
      });

      it('rests on at least one structurally valid Scripture anchor', () => {
        expect(content.refs.length).toBeGreaterThanOrEqual(1);
        for (const ref of content.refs) expectValidRef(ref, content.id);
        expect(new Set(content.refs).size).toBe(content.refs.length);
      });
    });
  }

  it('words the panel’s own controls in English and French', () => {
    for (const [key, field] of Object.entries(CIRCLE_UI)) expect(filled(field), key).toBe(true);
    for (const key of SHORT_UI_KEYS) expect(CIRCLE_UI[key], key).toBeTruthy();
  });

  it('never writes out Scripture: references only, no quoted passages', () => {
    // A quotation needs quotation marks; the content uses none, so a pasted
    // verse would stand out here before it ever reached a reader.
    for (const text of strings([CIRCLE_CONTENT, CIRCLE_UI])) expect(text).not.toMatch(/["“”«»„]/);
  });
});

// The 14 languages that are not authored in source. The short layer must be
// whole in each: the landing page swaps whole language files and never mixes.
const OVERLAY_LANGS = LANG_CODES.filter((lang) => !AUTHORED.includes(lang));
const OVERLAYS = Object.fromEntries(await Promise.all(OVERLAY_LANGS.map(async (lang) => [lang, await loadCircleOverlay(lang)])));
const text = (value) => typeof value === 'string' && value.trim().length > 0;

describe('the short layer in every language', () => {
  it('covers exactly the 14 languages that are not authored in source', () => {
    expect(OVERLAY_LANGS).toHaveLength(14);
    for (const lang of OVERLAY_LANGS) expect(hasCircleOverlay(lang), lang).toBe(true);
    for (const lang of AUTHORED) expect(hasCircleOverlay(lang), lang).toBe(false);
  });

  for (const lang of OVERLAY_LANGS) {
    it(`is complete in ${lang}`, () => {
      const overlay = OVERLAYS[lang];
      expect(Object.keys(overlay).sort()).toEqual([...CIRCLES, 'ui'].sort());
      for (const content of CIRCLE_CONTENT) {
        const tr = overlay[content.id];
        for (const field of SHORT_FIELDS) expect(text(tr[field]), `${content.id}.${field}`).toBe(true);
        expect(tr.themes, `${content.id}.themes`).toHaveLength(content.themes.length);
        tr.themes.forEach((theme, i) => expect(text(theme.title), `${content.id}.themes[${i}]`).toBe(true));
      }
      for (const key of Object.keys(CIRCLE_UI)) expect(text(overlay.ui[key]), `ui.${key}`).toBe(true);
      for (const value of strings(overlay)) expect(value).not.toMatch(/["“”«»„]/);
    });
  }
});

describe('the deep layer', () => {
  it('exists for My heart first', () => {
    expect(hasDeepLayer('self')).toBe(true);
    expect(hasDeepLayer('toString')).toBe(false);
  });

  for (const circle of CIRCLES.filter(hasDeepLayer)) {
    describe(circle, () => {
      const deep = DEEP[circle];
      const short = circleContent(circle);

      it('follows the short layer’s themes, by id and in order', () => {
        expect(deep.id).toBe(circle);
        expect(deep.themes.map((t) => t.id)).toEqual(short.themes.map((t) => t.id));
      });

      it('explains, teaches to pray and invites reflection in English and French', () => {
        expect(filled(deep.meaning)).toBe(true);
        for (const theme of deep.themes) {
          expect(filled(theme.body), theme.id).toBe(true);
          expect(theme.prompts.length, theme.id).toBeGreaterThanOrEqual(1);
          for (const prompt of theme.prompts) expect(filled(prompt), theme.id).toBe(true);
          expect(theme.refs.length, theme.id).toBeGreaterThanOrEqual(1);
          for (const ref of theme.refs) expectValidRef(ref, `${circle}/${theme.id}`);
          for (const facet of theme.facets || []) {
            expect(filled(facet.title) && filled(facet.body), facet.id).toBe(true);
            expectValidRef(facet.ref, `${circle}/${theme.id}/${facet.id}`);
            for (const prompt of facet.prompts) expect(filled(prompt), facet.id).toBe(true);
          }
        }
        expect(deep.reflection.length).toBeGreaterThanOrEqual(2);
        for (const question of deep.reflection) expect(filled(question)).toBe(true);
      });

      it('never quotes Scripture', () => {
        for (const text of strings(deep)) expect(text).not.toMatch(/["“”«»„]/);
      });
    });
  }

  it('presents the seven foundations as Qetoret’s framework, not a biblical list', async () => {
    const deep = await loadCircleDeep('self');
    expect(deep.themes).toHaveLength(7);
    expect(deep.framework.note.en).toMatch(/Qetoret groups/);
    expect(deep.framework.note.en).toMatch(/not a list Scripture gives/);
    // The fruit is one fruit with nine facets, in the order of the passage.
    const fruit = deep.themes.find((t) => t.id === 'fruit');
    expect(fruit.facets.map((f) => f.id)).toEqual(
      ['love', 'joy', 'peace', 'patience', 'kindness', 'goodness', 'faithfulness', 'gentleness', 'self-control'],
    );
  });

  it('pairs listening for God with testing against Scripture', async () => {
    const deep = await loadCircleDeep('self');
    const discernment = deep.themes.find((t) => t.id === 'discernment');
    expect(discernment.body.en).toMatch(/testing impressions against Scripture/);
    expect(discernment.body.en).toMatch(/Not every thought/);
  });

  it('has no deep layer to load for a circle that has none', async () => {
    expect(await loadCircleDeep('kingdom')).toBeNull();
  });
});

describe('withOverlay', () => {
  const source = {
    id: 'self',
    heading: { en: 'Heading', fr: 'Titre' },
    themes: [{ id: 'a', title: { en: 'A', fr: 'A-fr' } }, { id: 'b', title: { en: 'B', fr: 'B-fr' } }],
    refs: ['Psalm 67'],
  };

  it('adds a language to localized fields, matching arrays by position', () => {
    const merged = withOverlay(source, { heading: 'Überschrift', themes: [{ title: 'A-de' }] }, 'de');
    expect(merged.heading).toEqual({ en: 'Heading', fr: 'Titre', de: 'Überschrift' });
    expect(merged.themes[0].title.de).toBe('A-de');
    expect(merged.themes[1].title).toEqual({ en: 'B', fr: 'B-fr' }); // missing → authored fallback
    expect(merged.themes.map((t) => t.id)).toEqual(['a', 'b']);
    expect(merged.refs).toEqual(['Psalm 67']); // references are never translated
  });

  it('ignores empty values and never mutates the source', () => {
    const before = JSON.stringify(source);
    expect(withOverlay(source, { heading: '  ' }, 'de').heading).toEqual(source.heading);
    expect(withOverlay(source, null, 'de')).toBe(source);
    expect(JSON.stringify(source)).toBe(before);
  });
});

describe('circlesForTheme', () => {
  it('finds the circles an authored theme belongs to, inner to outer', () => {
    expect(circlesForTheme('fruit')).toEqual(['self']);
    expect(circlesForTheme('persecuted')).toEqual(['church', 'nations']);
    expect(circlesForTheme('justice')).toEqual(['authorities', 'nations']);
    expect(circlesForTheme('unknown')).toEqual([]);
    expect(circlesForTheme(undefined)).toEqual([]);
  });
});
