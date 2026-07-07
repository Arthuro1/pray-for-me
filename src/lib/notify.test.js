import { describe, it, expect } from 'vitest';
// Imports the edge functions' pure notification-copy module directly (no npm:
// specifiers there, so Vitest can transpile it). This is the exact builder the
// send-*-reminder functions use, so the guarantees asserted here hold in prod.
import {
  dailyPayload,
  followUpPayload,
  normalizeDetail,
  DAILY_MSG,
  FOLLOWUP_MSG,
} from '../../supabase/functions/_shared/notify.ts';

// A representative piece of sensitive prayer content. It is never passed to the
// builders — the whole point is that the payload has no channel for it — so if
// it ever appeared, something upstream would be leaking.
const SECRET_TITLE = 'Healing for Mom after her diagnosis';
const SECRET_NAME = 'Aunt Miriam';

const LANGS = Object.keys(DAILY_MSG);

describe('notification payloads carry no prayer content by default', () => {
  it('daily default (generic) has no count and no content, in every language', () => {
    for (const lang of LANGS) {
      const p = JSON.parse(dailyPayload(lang)); // detail defaults to 'generic'
      expect(p.body).toBe(DAILY_MSG[lang].generic);
      expect(p.body).not.toMatch(/\d/); // generic copy never carries a count
      expect(p.tag).toBe('daily-reminder');
      expect(p.url).toBe('/');
    }
  });

  it('follow-up is always generic and names no one, in every language', () => {
    for (const lang of LANGS) {
      const p = JSON.parse(followUpPayload(lang));
      expect(p.body).toBe(FOLLOWUP_MSG[lang].generic);
      expect(p.tag).toBe('follow-up');
      expect(JSON.stringify(p)).not.toContain(SECRET_NAME);
    }
  });

  it('never surfaces a prayer title, even at the highest detail level', () => {
    // 'titles' is intentionally treated like 'count' — the builder has no title
    // input at all, so a title cannot leak through this path.
    const generic = JSON.parse(dailyPayload('en', 'generic', 3));
    const count = JSON.parse(dailyPayload('en', 'count', 3));
    const titles = JSON.parse(dailyPayload('en', 'titles', 3));
    for (const p of [generic, count, titles]) {
      expect(JSON.stringify(p)).not.toContain(SECRET_TITLE);
    }
  });

  it("'count' opt-in surfaces only a number, never text content", () => {
    const p = JSON.parse(dailyPayload('en', 'count', 5));
    expect(p.body).toContain('5');
    expect(p.body).not.toContain(SECRET_TITLE);
  });

  it('generic default ignores the count even when one is provided', () => {
    const p = JSON.parse(dailyPayload('en', 'generic', 5));
    expect(p.body).toBe(DAILY_MSG.en.generic);
    expect(p.body).not.toContain('5');
  });

  it('normalizeDetail defaults unknown/empty values to the safe generic level', () => {
    expect(normalizeDetail(undefined)).toBe('generic');
    expect(normalizeDetail(null)).toBe('generic');
    expect(normalizeDetail('anything')).toBe('generic');
    expect(normalizeDetail('count')).toBe('count');
    expect(normalizeDetail('titles')).toBe('titles');
  });

  it('falls back to English for an unknown language without leaking', () => {
    const p = JSON.parse(dailyPayload('xx'));
    expect(p.body).toBe(DAILY_MSG.en.generic);
  });
});
