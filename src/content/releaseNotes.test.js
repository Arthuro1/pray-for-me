import { describe, it, expect } from 'vitest';
import fr from '../i18n/locales/fr.js';
import { RELEASES, LATEST_RELEASE, releaseFor, unreadAppNews } from './releaseNotes';
import { APP_NEWS_BODY, APP_NEWS_TITLE } from '../../supabase/functions/_shared/appNews.ts';
import { EVENT_MSG } from '../../supabase/functions/_shared/eventNotify.ts';

const LANGS = Object.keys(EVENT_MSG);

describe('release notes', () => {
  it('lists releases newest first, each once', () => {
    const versions = RELEASES.map((r) => r.version);
    expect(new Set(versions).size).toBe(versions.length);
    const sorted = [...versions].sort((a, b) => b.localeCompare(a, undefined, { numeric: true }));
    expect(versions).toEqual(sorted);
    expect(LATEST_RELEASE).toBe(RELEASES[0]);
  });

  it('every line on the page is a key in the canonical locale', () => {
    for (const release of RELEASES) {
      expect(release.version).toMatch(/^\d+\.\d+\.\d+$/);
      const keys = [release.summaryKey, ...release.items.flatMap((i) => [i.titleKey, i.bodyKey])];
      for (const key of keys) expect(fr[key], key).toBeTruthy();
    }
  });

  it('every release has its push line in every language, and the push names no unknown release', () => {
    for (const release of RELEASES) {
      for (const lang of LANGS) {
        expect(APP_NEWS_BODY[release.version]?.[lang], `${release.version} ${lang}`).toBeTruthy();
        expect(APP_NEWS_TITLE[lang], lang).toBeTruthy();
      }
    }
    for (const version of Object.keys(APP_NEWS_BODY)) expect(releaseFor(version), version).not.toBeNull();
  });
});

describe('unreadAppNews', () => {
  const news = (extra = {}) => ({ id: 'n1', type: 'app_news', metadata: { version: '1.0.6' }, read_at: null, ...extra });

  it('finds the unread announcement of a known release', () => {
    expect(unreadAppNews([{ id: 'x', type: 'friend_request', metadata: {} }, news()])?.id).toBe('n1');
  });

  it('ignores read announcements, unknown releases and other types', () => {
    expect(unreadAppNews([news({ read_at: '2026-10-17T10:00:00Z' })])).toBeNull();
    expect(unreadAppNews([news({ metadata: { version: '9.9.9' } })])).toBeNull();
    expect(unreadAppNews([news({ metadata: {} })])).toBeNull();
    expect(unreadAppNews([])).toBeNull();
  });
});
