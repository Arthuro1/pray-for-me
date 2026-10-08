import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';

const manifest = JSON.parse(readFileSync(new URL('../../public/manifest.json', import.meta.url), 'utf8'));

describe('PWA manifest retention surfaces', () => {
  it('carries the Qetoret name, not the old brand', () => {
    expect(manifest.name).toBe('Qetoret');
    expect(manifest.short_name).toBe('Qetoret');
    expect(JSON.stringify(manifest)).not.toMatch(/Praystead/i);
  });

  it('provides install screenshots and the two useful shortcuts', () => {
    expect(manifest.screenshots).toEqual(expect.arrayContaining([
      expect.objectContaining({ src: '/store/screenshots/today.png', sizes: '1080x1920', form_factor: 'narrow', type: 'image/png' }),
      expect.objectContaining({ src: '/store/screenshots/plans.png', sizes: '1080x1920', form_factor: 'narrow', type: 'image/png' }),
    ]));
    expect(manifest.shortcuts.map((shortcut) => shortcut.name)).toEqual([
      'Pray today',
      'Bring a prayer',
    ]);
    // Routing is unchanged by the rename: App.jsx still reads these URLs.
    expect(manifest.shortcuts[0].url).toBe('/?source=pwa-shortcut');
    expect(manifest.shortcuts[1].url).toBe('/?action=add-prayer');
  });

  it('supports desktop layouts rather than forcing portrait orientation', () => {
    expect(manifest.display).toBe('standalone');
    expect(manifest.orientation).toBeUndefined();
  });
});
