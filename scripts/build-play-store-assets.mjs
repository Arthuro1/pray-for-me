/** Rebuild official-brand store graphics and real component screenshots using synthetic data. */
/* global localStorage, document */
import { mkdir, readFile, writeFile, copyFile } from 'node:fs/promises';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import sharp from 'sharp';
import { chromium } from 'playwright';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const output = join(root, 'docs/play-store/assets');
await mkdir(output, { recursive: true });
const logo = await readFile(join(root, 'public/logo.svg'));
const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="1024" height="500" viewBox="0 0 1024 500">
  <rect width="1024" height="500" fill="#29213F"/>
  <circle cx="1000" cy="-120" r="430" fill="none" stroke="#C6A15C" stroke-opacity=".16"/>
  <circle cx="1000" cy="-120" r="400" fill="none" stroke="#C6A15C" stroke-opacity=".09"/>
  <image href="data:image/svg+xml;base64,${logo.toString('base64')}" x="65" y="125" width="250" height="250"/>
  <text x="370" y="224" font-family="Georgia, serif" font-size="88" fill="#F7F5EF">Qetoret</text>
  <path d="M374 255h70" stroke="#C6A15C" stroke-width="2"/>
  <text x="374" y="305" font-family="Arial, sans-serif" font-size="28" fill="#E9E4EF">Let your prayers rise.</text>
  <text x="374" y="348" font-family="Arial, sans-serif" font-size="21" fill="#C6A15C">Build a life of prayer before God.</text>
</svg>`;
await sharp(Buffer.from(svg)).flatten({ background: '#29213F' }).removeAlpha().png().toFile(join(output, 'feature-graphic-1024x500.png'));
await sharp(join(root, 'android-twa/store_icon.png')).flatten({ background: '#3A2D5C' }).ensureAlpha().png().toFile(join(output, 'icon-512.png'));
await copyFile(join(output, 'feature-graphic-1024x500.png'), join(root, 'android-twa/store_feature_graphic.png'));
console.log('Store icon (512×512) and feature graphic (1024×500) generated.');
if (process.argv.includes('--graphics-only')) process.exit(0);

const baseArg = process.argv.indexOf('--base-url');
const base = new URL(baseArg >= 0 ? process.argv[baseArg + 1] : 'http://127.0.0.1:5180');
if (!['127.0.0.1', 'localhost', '[::1]'].includes(base.hostname)) throw new Error('Screenshots must use a local dev preview with synthetic data.');
const channelArg = process.argv.indexOf('--channel');
const channel = channelArg >= 0 ? process.argv[channelArg + 1] : 'msedge';
const browser = await chromium.launch({ channel, headless: true });
const screens = [
  ['01-today', 'today', 'Come before God with today’s prayers'],
  ['02-journal', 'journal', 'Keep your prayer journal'],
  ['03-circles', 'circles', 'Carry people and nations in prayer'],
  ['04-plans', 'plans', 'Build a faithful rhythm with prayer plans'],
  ['05-together', 'together', 'Pray together in private groups'],
  ['06-prayer', 'first-prayer', 'Bring what is on your heart'],
];
try {
  const context = await browser.newContext({ viewport: { width: 432, height: 768 }, deviceScaleFactor: 2.5, locale: 'en-US', timezoneId: 'Europe/Berlin', colorScheme: 'light' });
  // Never let a capture contact real account, AI, analytics, or Scripture services.
  await context.route('**/*', (route) => {
    const url = new URL(route.request().url());
    return url.origin === base.origin || ['data:', 'blob:'].includes(url.protocol) ? route.continue() : route.abort();
  });
  await context.addInitScript(() => {
    localStorage.setItem('pfm_language', 'en');
    localStorage.setItem('pfm_theme', 'light');
    localStorage.setItem('pfm_settings', JSON.stringify({ language: 'en', theme: 'light', animations: false }));
  });
  const page = await context.newPage();
  page.setDefaultTimeout(90000);
  page.setDefaultNavigationTimeout(90000);
  const errors = [];
  page.on('pageerror', (error) => errors.push(error.message));
  await mkdir(join(output, 'screenshots/en-US'), { recursive: true });
  for (const [name, screen] of screens) {
    await page.goto(new URL(`/__design/${screen}`, base).href, { waitUntil: 'domcontentloaded' });
    await page.waitForFunction(() => document.body.innerText.trim().length > 80);
    if (screen === 'first-prayer') await page.getByRole('textbox').first().waitFor({ state: 'visible' });
    else await page.locator('header').first().waitFor({ state: 'visible' });
    await page.evaluate(() => document.fonts.ready);
    await page.addStyleTag({ content: '[data-design-nav] { display: none !important; } *, *::before, *::after { animation: none !important; transition: none !important; }' });
    if (errors.length) throw new Error(`Capture encountered page errors: ${[...new Set(errors)].join('; ')}`);
    await page.screenshot({ path: join(output, `screenshots/en-US/${name}.png`), fullPage: false });
    console.log(`Captured ${name}: 1080×1920`);
  }
  await mkdir(join(root, 'public/store/screenshots'), { recursive: true });
  await copyFile(join(output, 'screenshots/en-US/01-today.png'), join(root, 'public/store/screenshots/today.png'));
  await copyFile(join(output, 'screenshots/en-US/04-plans.png'), join(root, 'public/store/screenshots/plans.png'));
  if (errors.length) throw new Error(`Capture encountered page errors: ${[...new Set(errors)].join('; ')}`);
  const provenance = {
    generatedAt: new Date().toISOString(), source: 'Local /__design routes rendering actual app components with synthetic fixtures; no real account or remote services',
    viewport: { width: 432, height: 768, deviceScaleFactor: 2.5 },
    screenshots: screens.map(([name, route, label]) => ({ file: `screenshots/en-US/${name}.png`, route: `/__design/${route}`, label })),
    graphics: 'Composed from existing Qetoret vector brand; no AI-generated images',
    review: 'Confirm each screenshot still represents the submitted production app; on-device Play-signed smoke testing is separate.',
  };
  await writeFile(join(output, 'provenance.json'), `${JSON.stringify(provenance, null, 2)}\n`);
} finally { await browser.close(); }
