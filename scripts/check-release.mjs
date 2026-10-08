/** Local consistency gate; --live also checks the website actually served to Android/Play. */
import assert from 'node:assert/strict';
import { readFile, access, readdir } from 'node:fs/promises';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import sharp from 'sharp';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const read = (path) => readFile(join(root, path), 'utf8');
const json = async (path) => JSON.parse(await read(path));
const origin = 'https://qetoret.com';
const packageId = 'space.praystead.twa';
let failures = 0;
async function check(label, fn) {
  try { await fn(); console.log(`PASS ${label}`); }
  catch (error) { failures += 1; console.error(`FAIL ${label}: ${error.message}`); }
}

await check('Android launch origin, identity and version', async () => {
  const twa = await json('android-twa/twa-manifest.json');
  const gradle = await read('android-twa/app/build.gradle');
  assert.equal(twa.packageId, packageId);
  assert.equal(twa.host, 'qetoret.com');
  assert.equal(twa.name, 'Qetoret');
  assert.equal(twa.webManifestUrl, `${origin}/manifest.json`);
  assert.equal(twa.fullScopeUrl, `${origin}/`);
  assert(gradle.includes("hostName: 'qetoret.com'"));
  assert.match(gradle, /targetSdkVersion\s+36\b/);
  assert.match(gradle, new RegExp(`versionCode\\s+${twa.appVersionCode}\\b`));
  assert(gradle.includes(`versionName "${twa.appVersionName}"`));
});
await check('PWA brand, icons and screenshot references', async () => {
  const manifest = await json('public/manifest.json');
  assert.equal(manifest.name, 'Qetoret');
  assert.equal(manifest.short_name, 'Qetoret');
  assert.equal(manifest.id, '/');
  assert.equal(manifest.start_url, '/');
  assert(manifest.icons.some((icon) => icon.purpose === 'maskable'));
  for (const item of [...manifest.icons, ...(manifest.screenshots || [])]) {
    assert(item.src.startsWith('/') && !item.src.includes('..'));
    const metadata = await sharp(join(root, 'public', item.src.slice(1))).metadata();
    assert.equal(`${metadata.width}x${metadata.height}`, item.sizes);
  }
});
function validateLinks(links) {
  assert(Array.isArray(links));
  const entry = links.find((link) => link.target?.package_name === packageId && link.relation?.includes('delegate_permission/common.handle_all_urls'));
  assert(entry, 'Missing Android URL delegation');
  assert.equal(entry.target.namespace, 'android_app');
  assert(entry.target.sha256_cert_fingerprints.length > 0);
  for (const fingerprint of entry.target.sha256_cert_fingerprints) assert.match(fingerprint, /^(?:[A-F0-9]{2}:){31}[A-F0-9]{2}$/);
}
await check('Matching Digital Asset Links files', async () => {
  const direct = await json('public/assetlinks.json');
  validateLinks(direct);
  assert.deepEqual(await json('public/.well-known/assetlinks.json'), direct);
});
await check('Qetoret canonical metadata and public legal resources', async () => {
  const html = await read('index.html');
  assert(html.includes(`rel="canonical" href="${origin}"`));
  assert(!html.includes('praystead.com'));
  for (const path of ['privacy.html', 'terms.html', 'delete-account.html', 'robots.txt', 'sitemap.xml']) await access(join(root, 'public', path));
});
await check('Play graphics and screenshots', async () => {
  for (const [name, width, height] of [['icon-512.png', 512, 512], ['feature-graphic-1024x500.png', 1024, 500]]) {
    const image = await sharp(join(root, 'docs/play-store/assets', name)).metadata();
    assert.equal(image.width, width); assert.equal(image.height, height); assert.equal(image.hasAlpha, false);
  }
  const files = (await readdir(join(root, 'docs/play-store/assets/screenshots/en-US'))).filter((file) => file.endsWith('.png'));
  assert(files.length >= 2, 'At least two phone screenshots required');
  for (const file of files) {
    const image = await sharp(join(root, 'docs/play-store/assets/screenshots/en-US', file)).metadata();
    assert.equal(image.width, 1080); assert.equal(image.height, 1920);
  }
});
await check('Store listing character limits', async () => {
  for (const locale of ['en-US', 'fr-FR']) {
    for (const [name, max] of [['title.txt', 30], ['short-description.txt', 80], ['full-description.txt', 4000], ['release-notes.txt', 500]]) {
      const value = (await read(`docs/play-store/listings/${locale}/${name}`)).trim();
      assert(value.length > 0 && value.length <= max, `${locale}/${name}: ${value.length} characters, max ${max}`);
    }
  }
});
if (process.argv.includes('--live')) {
  for (const path of ['/', '/manifest.json', '/.well-known/assetlinks.json', '/privacy.html', '/terms.html', '/delete-account.html']) {
    await check(`Live ${origin}${path}`, async () => {
      const response = await fetch(`${origin}${path}`, { redirect: 'manual', signal: AbortSignal.timeout(15000) });
      assert.equal(response.status, 200, `HTTP ${response.status}; redirect or unavailable`);
      if (path.endsWith('.json')) {
        assert.match(response.headers.get('content-type') || '', /application\/json/);
        const payload = await response.json();
        if (path.includes('assetlinks')) {
          validateLinks(payload);
          const expected = await json('public/assetlinks.json');
          for (const local of expected) {
            const remote = payload.find((item) => item.target?.package_name === local.target?.package_name);
            for (const fingerprint of local.target.sha256_cert_fingerprints) assert(remote?.target?.sha256_cert_fingerprints?.includes(fingerprint), 'Live site missing a configured signing certificate');
          }
        } else assert.equal(payload.name, 'Qetoret');
      } else {
        const html = await response.text();
        assert(html.includes('Qetoret'), 'Qetoret content missing');
        if (path !== '/') assert(!html.includes('<div id="root"></div>'), 'Legal URL returned SPA fallback');
      }
    });
  }
}
console.log(`\n${failures ? `${failures} release check(s) failed.` : 'Local release consistency checks passed.'}`);
console.log('Play signing certificate, Console declarations, moderation operations, recovery migration and on-device tests remain manual release gates.');
process.exitCode = failures ? 1 : 0;
