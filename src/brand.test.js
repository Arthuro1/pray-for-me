// Guard, not a unit test: the public brand is Qetoret everywhere a person can
// read it, while internal identifiers keep their historical names on purpose
// (docs/QETORET_MIGRATION.md). If this fails, fix the copy, not the test.
import { describe, expect, it } from 'vitest';
import { readFileSync, readdirSync, statSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const read = (path) => readFileSync(join(root, path), 'utf8');

function filesUnder(dir, test) {
  return readdirSync(join(root, dir)).flatMap((name) => {
    const rel = `${dir}/${name}`;
    if (statSync(join(root, rel)).isDirectory()) return filesUnder(rel, test);
    return test(rel) ? [rel] : [];
  });
}

// Comments may still mention the old name in historical notes; visible text may not.
const withoutComments = (source) => source
  .replace(/\{\/\*[\s\S]*?\*\/\}/g, '')
  .replace(/\/\*[\s\S]*?\*\//g, '')
  .replace(/(^|[^:])\/\/.*$/gm, '$1');

describe('the public brand is Qetoret', () => {
  it('names Qetoret in the page head, the PWA manifest and the notification fallback', () => {
    for (const path of ['index.html', 'public/manifest.json', 'public/push-sw.js', 'public/privacy.html', 'public/terms.html']) {
      const text = read(path);
      expect(text, path).toContain('Qetoret');
      expect(text, path).not.toMatch(/Praystead/);
    }
  });

  it('never shows the old name in any locale, app or landing', () => {
    const locales = [
      ...filesUnder('src/i18n/locales', (p) => p.endsWith('.js')),
      ...filesUnder('src/pages/landing/locales', (p) => p.endsWith('.js')),
    ];
    expect(locales.length).toBe(32);
    for (const path of locales) expect(read(path), path).not.toMatch(/Praystead/);
  });

  it('never renders the old name from a component', () => {
    const components = filesUnder('src', (p) => p.endsWith('.jsx') && !p.includes('.test.') && !p.includes('.spec.'));
    for (const path of components) expect(withoutComments(read(path)), path).not.toMatch(/Praystead/);
  });

  it('keeps the identifiers that existing installations depend on', () => {
    // The Android application id must not change, or Play would treat Qetoret
    // as a new app and existing installs would never update.
    expect(read('android-twa/app/build.gradle')).toContain("applicationId \"space.praystead.twa\"");
    // Device-local state keeps its pfm_ keys, so nobody is treated as new.
    expect(read('src/pages/LandingPage.jsx')).toContain("'pfm_language'");
  });
});

describe('the rise motion respects reduced motion', () => {
  it('turns the rise animations off when the reader prefers reduced motion', () => {
    const css = read('src/styles/components.css');
    expect(css).toMatch(/@media \(prefers-reduced-motion: reduce\)\s*\{\s*\.rise-in,\s*\.rise-mark--rise path,\s*\.rise-mark--breathe path\s*\{\s*animation: none;\s*opacity: 1;/);
    // The motion tokens themselves collapse to zero as well.
    expect(read('src/styles/tokens.css')).toMatch(/prefers-reduced-motion: reduce[\s\S]*--q-rise: 0px;/);
  });
});
