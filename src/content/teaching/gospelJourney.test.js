// Content-integrity for the gospel journey. This guards the AUTHORED content and
// its translation overlays — not the UI — so it runs in the default node env.
//
// It enforces the invariants the reader and the localization system rely on:
// exactly six sections with unique stable ids, every section anchored in at least
// one Scripture reference in the shared format, related/question article ids that
// resolve to real Learn articles, and translation overlays that translate ONLY
// prose (never the stable ids, refs, or structure).
import { describe, it, expect } from 'vitest';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import gospelJourney from './gospelJourney';
import { getJourney, getArticle } from './index';
import { mergeJourney } from './translations';

const HERE = path.dirname(fileURLToPath(import.meta.url));
const GOSPEL_DIR = path.join(HERE, 'translations', 'gospel');

// Same shape the existing teaching content uses: "Book chap[:verse[-verse]]",
// optionally prefixed with a book number (e.g. "1 Corinthians 15:3-4", "Psalm 13").
const REF_RE = /^([1-3]\s)?[A-Za-z][A-Za-z ]*\s\d+(:\d+(-\d+)?)?$/;

describe('gospel journey — content integrity', () => {
  it('resolves through the teaching content index by its stable id', () => {
    expect(getJourney('hope-behind-prayer')).toBe(gospelJourney);
    expect(getJourney('nope')).toBeNull();
    expect(gospelJourney.type).toBe('gospel-journey');
  });

  it('has exactly six sections with unique stable ids', () => {
    expect(gospelJourney.sections).toHaveLength(6);
    const ids = gospelJourney.sections.map((s) => s.id);
    expect(new Set(ids).size).toBe(6);
    ids.forEach((id) => expect(typeof id).toBe('string'));
  });

  it('gives every section a title, body, and at least one Scripture reference', () => {
    for (const s of gospelJourney.sections) {
      expect(s.heading?.en && s.heading?.fr).toBeTruthy();
      expect(s.body?.en && s.body?.fr).toBeTruthy();
      expect(Array.isArray(s.refs) && s.refs.length >= 1).toBe(true);
    }
  });

  it('uses the same Scripture-reference format as the rest of the teaching content', () => {
    const allRefs = gospelJourney.sections.flatMap((s) => s.refs)
      .concat(gospelJourney.questions.flatMap((q) => q.refs || []));
    for (const ref of allRefs) expect(REF_RE.test(ref), `bad ref: ${ref}`).toBe(true);
  });

  it('provides the required response + starter fields in en and fr', () => {
    for (const key of ['title', 'summary', 'respondHeading', 'respondBody', 'guidedPrayer', 'formulaDisclaimer', 'starterPrompt']) {
      expect(gospelJourney[key]?.en, `${key}.en`).toBeTruthy();
      expect(gospelJourney[key]?.fr, `${key}.fr`).toBeTruthy();
    }
  });

  it('links only to Learn articles that actually exist (related + questions)', () => {
    for (const id of gospelJourney.relatedArticleIds) {
      expect(getArticle(id), `related article ${id} missing`).toBeTruthy();
    }
    for (const q of gospelJourney.questions) {
      if (q.articleId) expect(getArticle(q.articleId), `question article ${q.articleId} missing`).toBeTruthy();
    }
  });

  it('has an overlay for every non-en/fr language, matching the base structure', () => {
    const files = fs.readdirSync(GOSPEL_DIR).filter((f) => f.endsWith('.json'));
    // One overlay per supported language beyond the authored en/fr.
    expect(files.length).toBe(14);
    for (const file of files) {
      const overlay = JSON.parse(fs.readFileSync(path.join(GOSPEL_DIR, file), 'utf8'));
      const tr = overlay['hope-behind-prayer'];
      expect(tr, `${file}: keyed by journey id`).toBeTruthy();
      // Prose only — overlays must NOT carry stable ids, refs, or articleIds.
      expect(tr.sections).toHaveLength(6);
      expect(tr.questions).toHaveLength(6);
      for (const s of tr.sections) {
        expect(s.heading && s.body).toBeTruthy();
        expect(s.id).toBeUndefined();
        expect(s.refs).toBeUndefined();
      }
      for (const q of tr.questions) {
        expect(q.heading).toBeTruthy();
        expect(q.articleId).toBeUndefined();
      }
    }
  });

  it('merging an overlay translates prose but never alters ids, refs, or article links', () => {
    const overlay = JSON.parse(fs.readFileSync(path.join(GOSPEL_DIR, 'es.json'), 'utf8'));
    const merged = mergeJourney(gospelJourney, overlay, 'es');
    // Structure and stable ids are identical to the source.
    expect(merged.sections.map((s) => s.id)).toEqual(gospelJourney.sections.map((s) => s.id));
    expect(merged.sections.map((s) => s.refs)).toEqual(gospelJourney.sections.map((s) => s.refs));
    expect(merged.relatedArticleIds).toEqual(gospelJourney.relatedArticleIds);
    expect(merged.questions.map((q) => q.articleId)).toEqual(gospelJourney.questions.map((q) => q.articleId));
    // Prose is now available in the overlay language.
    expect(merged.sections[0].heading.es).toBeTruthy();
    expect(merged.title.es).toBeTruthy();
    // A missing language falls back safely (no overlay → source object unchanged).
    expect(mergeJourney(gospelJourney, null, 'xx')).toBe(gospelJourney);
  });
});
