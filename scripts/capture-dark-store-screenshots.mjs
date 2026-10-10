/** Capture the current dark app UI at distinct phone and tablet viewports. */
/* global localStorage, document, window, getComputedStyle */
import { mkdir, readFile, writeFile } from 'node:fs/promises';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { createHash } from 'node:crypto';
import sharp from 'sharp';
import { chromium } from 'playwright';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const output = join(root, 'docs/play-store/assets/screenshots/dark/en-US');
const baseArg = process.argv.indexOf('--base-url');
const base = new URL(baseArg >= 0 ? process.argv[baseArg + 1] : 'http://127.0.0.1:5180');
if (!['127.0.0.1', 'localhost', '[::1]'].includes(base.hostname)) throw new Error('Use a local preview with synthetic data.');
const devices = [
  { id: 'phone', label: 'Phone', viewport: { width: 432, height: 768 }, deviceScaleFactor: 2.5, width: 1080, height: 1920, isMobile: true },
  { id: 'tablet-7-inch', label: '7-inch tablet', viewport: { width: 720, height: 1280 }, deviceScaleFactor: 2, width: 1440, height: 2560, isMobile: true },
  { id: 'tablet-10-inch', label: '10-inch tablet', viewport: { width: 900, height: 1600 }, deviceScaleFactor: 2, width: 1800, height: 3200, isMobile: true },
];
const screens = [
  { name: '01-today', route: 'today', alt: 'Dark Today screen with a prayer for Sarah, daily prayer actions and Scripture.' },
  { name: '02-journal', route: 'journal', alt: 'Dark prayer journal with personal prayer requests, search and filters.' },
  { name: '03-my-house', route: 'circle?c=household', alt: 'My house intercession circle with teaching and household prayer guidance in dark mode.' },
  { name: '04-plans', route: 'plans', alt: 'Guided Christian prayer plans in the dark Qetoret interface.' },
  { name: '05-together', route: 'together', alt: 'Dark Together screen showing prayer groups and people to pray with.' },
  { name: '06-prayer', route: 'first-prayer', alt: 'Dark prayer entry screen inviting the user to bring what is on their heart before God.' },
];
const captureTime = '2026-10-08T08:00:00+02:00';
const browser = await chromium.launch({ channel: 'msedge', headless: true });
const records = [];
try {
  await mkdir(output, { recursive: true });
  for (const device of devices) {
    const dir = join(output, device.id);
    await mkdir(dir, { recursive: true });
    const context = await browser.newContext({
      viewport: device.viewport, deviceScaleFactor: device.deviceScaleFactor,
      isMobile: device.isMobile, hasTouch: true, locale: 'en-US', timezoneId: 'Europe/Berlin',
      colorScheme: 'dark', reducedMotion: 'reduce', serviceWorkers: 'block',
    });
    const blocked = new Set();
    await context.route('**/*', (route) => {
      const url = new URL(route.request().url());
      if (['data:', 'blob:'].includes(url.protocol)) return route.continue();
      if (url.origin === base.origin && !url.pathname.startsWith('/api/')) return route.continue();
      blocked.add(url.origin + url.pathname);
      return route.abort('blockedbyclient');
    });
    await context.addInitScript(() => {
      localStorage.setItem('pfm_language', 'en');
      localStorage.setItem('pfm_theme', 'dark');
      localStorage.setItem('pfm_settings', JSON.stringify({ language: 'en', theme: 'dark', animations: false }));
      const applyDark = () => {
        document.documentElement.setAttribute('data-theme', 'dark');
        document.documentElement.style.colorScheme = 'dark';
      };
      if (document.documentElement) applyDark();
      document.addEventListener('DOMContentLoaded', applyDark, { once: true });
    });
    try {
      for (const screen of screens) {
        const page = await context.newPage();
        page.setDefaultTimeout(60000);
        page.setDefaultNavigationTimeout(60000);
        const errors = [];
        page.on('pageerror', error => errors.push(error.message));
        await page.clock.setFixedTime(new Date(captureTime));
        const url = new URL(`/__design/${screen.route}`, base);
        url.searchParams.set('capture', '1');
        await page.goto(url.href, { waitUntil: 'domcontentloaded' });
        await page.waitForFunction(() => document.body.innerText.trim().length > 100 && document.documentElement.lang === 'en');
        if (screen.route === 'first-prayer') {
          await page.getByRole('textbox').first().fill('Lord, bring peace and strength to my family today. Help us care for one another with patience and love.');
          await page.getByRole('button', { name: 'Pray now', exact: true }).waitFor({ state: 'visible' });
          if (!await page.getByRole('button', { name: 'Pray now', exact: true }).isEnabled()) throw new Error('Sample prayer did not enable the prayer action.');
        } else await page.locator('main').waitFor({ state: 'visible' });
        await page.evaluate(() => document.fonts.ready);
        await page.addStyleTag({ content: '[data-design-nav] { display: none !important; }' });
        await page.evaluate(() => new Promise(resolve => window.requestAnimationFrame(() => window.requestAnimationFrame(resolve))));
        const checks = await page.evaluate(() => ({
          theme: document.documentElement.getAttribute('data-theme'),
          background: getComputedStyle(document.body).backgroundColor,
          documentWidth: document.documentElement.scrollWidth,
          viewportWidth: window.innerWidth,
          activeNav: [...document.querySelectorAll('[aria-current="page"]')].map(el => el.textContent.trim()),
          sidebarVisible: !![...document.querySelectorAll('aside')].find(el => getComputedStyle(el).display !== 'none'),
          text: document.body.innerText,
        }));
        if (checks.theme !== 'dark') throw new Error('Dark theme was not applied: ' + device.id + '/' + screen.name);
        if (checks.documentWidth > device.viewport.width + 1) throw new Error('Horizontal overflow: ' + device.id + '/' + screen.name);
        if (errors.length) throw new Error('Page errors: ' + errors.join('; '));
        const png = await page.screenshot({ fullPage: false, animations: 'disabled', caret: 'hide' });
        const path = join(dir, `${screen.name}.png`);
        await sharp(png).removeAlpha().png().toFile(path);
        const metadata = await sharp(path).metadata();
        if (metadata.width !== device.width || metadata.height !== device.height || metadata.hasAlpha || metadata.channels !== 3) {
          throw new Error('Unexpected image encoding or size: ' + path);
        }
        const bytes = await readFile(path);
        if (bytes.length > 8 * 1024 * 1024) throw new Error('Screenshot exceeds 8 MB: ' + path);
        records.push({
          file: `${device.id}/${screen.name}.png`, device: device.label,
          route: url.pathname + url.search, width: metadata.width, height: metadata.height,
          viewport: device.viewport, deviceScaleFactor: device.deviceScaleFactor,
          format: '24-bit RGB PNG without alpha', bytes: bytes.length,
          sha256: createHash('sha256').update(bytes).digest('hex'), alt: screen.alt,
          checks: { ...checks, text: undefined }, blockedRequests: [...blocked],
        });
        console.log(`Captured ${device.id}/${screen.name}.png ${metadata.width}x${metadata.height}`);
        await page.close();
      }
    } finally { await context.close(); }
  }
  await writeFile(join(output, 'provenance.json'), JSON.stringify({
    generatedAt: new Date().toISOString(), locale: 'en-US', appearance: 'dark',
    captureTime, source: 'Current real app components at local development preview routes with synthetic fixtures and production route context',
    method: 'Each category rendered separately at its stated CSS viewport; no resized phone captures, device frames or marketing overlays',
    orientation: 'portrait', aspectRatio: '9:16',
    note: 'Browser viewport captures for store device categories, not photographs or captures from physical Android devices.',
    screenshots: records,
  }, null, 2) + '\n');
  await writeFile(join(output, 'README.txt'), [
    'Qetoret dark mode Google Play screenshots', '',
    'Language: English United States', 'Six screenshots per device category', '',
    ...devices.map(d => `${d.label}: ${d.id}/  ${d.width} x ${d.height} pixels`), '',
    'All images are portrait 9:16, RGB PNG without alpha, and below 8 MB.',
    'Upload PNG files from each folder to the matching Play Console screenshot category.',
    'Order: Today, Journal, My house, Plans, Together, Prayer entry.',
    'These are separate responsive browser renders of current app components using synthetic account data.',
    'No real account data or remote services were used. They are not physical-device captures.',
    'provenance.json contains capture settings, image hashes and suggested alt text.', '',
  ].join('\n'));
  console.log(`Completed ${records.length} screenshots.`);
} finally { await browser.close(); }
