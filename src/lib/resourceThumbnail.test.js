// A cover tile is decoration, so most of what matters here is what must NEVER
// reach an <img src>: a third-party URL that would leak the reader's IP and
// their subject to a publisher or a retailer before they tapped anything.
import { describe, it, expect } from 'vitest';
import { existsSync } from 'node:fs';
import { join } from 'node:path';
import { resolveResourceThumbnail, isBundledThumbnail, thumbnailColor } from './resourceThumbnail.js';
import { CATEGORY_COLORS } from './categoryColor.js';
import { RESOURCE_TYPES } from '../content/resources/topics.js';
import { RESOURCES } from '../content/resources/catalogue.js';

describe('isBundledThumbnail', () => {
  it('accepts a same-origin cover path', () => {
    expect(isBundledThumbnail('/resources/covers/keller-meaning-of-marriage.webp')).toBe(true);
    expect(isBundledThumbnail('/resources/covers/a_b-c.1.jpg')).toBe(true);
  });

  it('refuses anything that would reach a third party', () => {
    expect(isBundledThumbnail('https://images.example.com/cover.jpg')).toBe(false);
    expect(isBundledThumbnail('http://images.example.com/cover.jpg')).toBe(false);
    // Protocol-relative: inherits https and goes straight off-origin.
    expect(isBundledThumbnail('//images.example.com/cover.jpg')).toBe(false);
    expect(isBundledThumbnail('data:image/png;base64,AAAA')).toBe(false);
  });

  it('refuses paths that are not plainly a hosted image', () => {
    expect(isBundledThumbnail('javascript:alert(1)')).toBe(false);
    expect(isBundledThumbnail('/resources/covers/../../secret.jpg')).toBe(false);
    expect(isBundledThumbnail('/resources/covers/cover.svg')).toBe(false); // can carry script
    expect(isBundledThumbnail('/resources/covers/cover')).toBe(false);
    expect(isBundledThumbnail('relative/cover.jpg')).toBe(false);
    expect(isBundledThumbnail(`/${'a'.repeat(600)}.jpg`)).toBe(false);
    expect(isBundledThumbnail(null)).toBe(false);
    expect(isBundledThumbnail(undefined)).toBe(false);
  });
});

describe('thumbnailColor', () => {
  it('is drawn from the theme-safe palette', () => {
    for (const id of ['a', 'keller-meaning-of-marriage', '', 'ጸሎት']) {
      expect(CATEGORY_COLORS).toContain(thumbnailColor(id));
    }
  });

  it('is stable for an id, so a title keeps its cover on every device', () => {
    expect(thumbnailColor('piper-momentary-marriage')).toBe(thumbnailColor('piper-momentary-marriage'));
    expect(thumbnailColor('a')).not.toBe(thumbnailColor('b'));
  });

  // The point of a per-title hue is that a shelf reads as several covers. A raw
  // `hash % 9` put half the catalogue's slugs on one purple; this is the guard.
  it('spreads real catalogue slugs across the palette', () => {
    const ids = RESOURCES.map((r) => r.id);
    const used = new Map();
    for (const id of ids) used.set(thumbnailColor(id), (used.get(thumbnailColor(id)) || 0) + 1);
    expect(used.size).toBeGreaterThanOrEqual(Math.min(5, ids.length));
    expect(Math.max(...used.values())).toBeLessThanOrEqual(Math.ceil(ids.length / 3));
  });
});

describe('resolveResourceThumbnail', () => {
  const resolve = (over = {}) => resolveResourceThumbnail({ id: 'r1', type: 'book', ...over });

  it('always returns a complete tile, so a card never has to handle "no image"', () => {
    const tile = resolve();
    expect(tile.src).toBeNull();
    expect(CATEGORY_COLORS).toContain(tile.color);
    expect(tile.type).toBe('book');
    expect(resolveResourceThumbnail()).toBeTruthy();
  });

  it('uses a curated cover when one is hosted', () => {
    expect(resolve({ thumbnail: '/resources/covers/r1.webp' }).src).toBe('/resources/covers/r1.webp');
  });

  it('drops a cover the reader’s device would have to fetch off-origin', () => {
    expect(resolve({ thumbnail: 'https://images.example.com/r1.jpg' }).src).toBeNull();
  });

  it('skips cover files entirely in low data mode', () => {
    const tile = resolve({ thumbnail: '/resources/covers/r1.webp', lowData: true });
    expect(tile.src).toBeNull();
    expect(tile.color).toBeTruthy();
  });

  it('falls back to a book for an unknown type rather than rendering nothing', () => {
    expect(resolve({ type: 'hologram' }).type).toBe('book');
    expect(resolve({ type: undefined }).type).toBe('book');
  });

  it('draws a spine only for the types that have one', () => {
    expect(resolve({ type: 'book' }).spine).toBe(true);
    expect(resolve({ type: 'study' }).spine).toBe(true);
    expect(resolve({ type: 'podcast' }).spine).toBe(false);
    expect(resolve({ type: 'video' }).spine).toBe(false);
  });

  it('handles every declared resource type', () => {
    for (const type of RESOURCE_TYPES) expect(resolve({ type }).type).toBe(type);
  });
});

// The privacy rule has to hold for the content that actually ships, not just for
// the resolver in the abstract.
describe('the shipped catalogue', () => {
  it('carries no thumbnail that is not hosted by us', () => {
    for (const resource of RESOURCES) {
      for (const ed of Object.values(resource.editions || {})) {
        if (ed.thumbnail) expect(isBundledThumbnail(ed.thumbnail)).toBe(true);
      }
    }
  });

  it('ships every cover file referenced by a live edition', () => {
    for (const resource of RESOURCES) {
      for (const edition of Object.values(resource.editions || {})) {
        if (!edition.thumbnail) continue;
        expect(
          existsSync(join(process.cwd(), 'public', edition.thumbnail.replace(/^\//, ''))),
          `${resource.id} references a missing cover`,
        ).toBe(true);
      }
    }
  });
});
