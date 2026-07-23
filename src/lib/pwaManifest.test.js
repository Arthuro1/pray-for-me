import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';

const manifest = JSON.parse(readFileSync(new URL('../../public/manifest.json', import.meta.url), 'utf8'));

describe('PWA manifest retention surfaces', () => {
  it('provides install screenshots and the two useful shortcuts', () => {
    expect(manifest.screenshots).toEqual(expect.arrayContaining([
      expect.objectContaining({ form_factor: 'narrow', type: 'image/jpeg' }),
    ]));
    expect(manifest.shortcuts.map((shortcut) => shortcut.name)).toEqual([
      'Pray today',
      'Add prayer',
    ]);
    expect(manifest.shortcuts[1].url).toBe('/?action=add-prayer');
  });

  it('supports desktop layouts rather than forcing portrait orientation', () => {
    expect(manifest.display).toBe('standalone');
    expect(manifest.orientation).toBeUndefined();
  });
});
