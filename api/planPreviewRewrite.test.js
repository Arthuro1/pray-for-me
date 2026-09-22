import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';

const config = JSON.parse(readFileSync(new URL('../vercel.json', import.meta.url), 'utf8'));
const previewRules = config.rewrites.filter((rule) => rule.destination.startsWith('/api/plan-preview'));
const crawler = new RegExp(`^${previewRules[0].has[0].value}$`);

// Link-preview fetchers as they identify themselves.
const CRAWLERS = [
  'WhatsApp/2.23.20.0 A',
  'facebookexternalhit/1.1 (+http://www.facebook.com/externalhit_uatext.php)',
  'facebookexternalhit/1.1 Facebot Twitterbot/1.0', // iMessage
  'TelegramBot (like TwitterBot)',
  'Twitterbot/1.0',
  'Slackbot-LinkExpanding 1.0 (+https://api.slack.com/robots)',
  'Mozilla/5.0 (compatible; Discordbot/2.0; +https://discordapp.com)',
  'LinkedInBot/1.0 (compatible; Mozilla/5.0; Apache-HttpClient +http://www.linkedin.com)',
  'Mozilla/5.0 (compatible; Googlebot/2.1; +http://www.google.com/bot.html)',
];

// People, including inside the social apps' own browsers, must always get the app.
const PEOPLE = [
  'Mozilla/5.0 (Linux; Android 14; Pixel 8) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/128.0 Mobile Safari/537.36',
  'Mozilla/5.0 (iPhone; CPU iPhone OS 17_5 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.5 Mobile/15E148 Safari/604.1',
  'Mozilla/5.0 (iPhone; CPU iPhone OS 17_5 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Mobile/15E148 [FBAN/FBIOS;FBAV/470.0]',
  'Mozilla/5.0 (Linux; Android 14) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/128.0 Mobile Safari/537.36 Instagram 340.0',
  'Mozilla/5.0 (Linux; Android 14; wv) AppleWebKit/537.36 (KHTML, like Gecko) Version/4.0 Chrome/128.0 Mobile Safari/537.36 [Pinterest/Android]',
  'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/128.0 Safari/537.36 Edg/128.0',
];

describe('plan link preview rewrite', () => {
  it('covers plan links with and without a sharer token, ahead of the SPA fallback', () => {
    expect(previewRules.map((rule) => rule.source)).toEqual(['/plans/:planId', '/plans/:planId/:token']);
    const fallback = config.rewrites.findIndex((rule) => rule.source === '/(.*)');
    for (const rule of previewRules) expect(config.rewrites.indexOf(rule)).toBeLessThan(fallback);
  });

  it('sends link-preview crawlers to the function', () => {
    for (const ua of CRAWLERS) expect(crawler.test(ua), ua).toBe(true);
  });

  it('never catches a person, even in a social app’s own browser', () => {
    for (const ua of PEOPLE) expect(crawler.test(ua), ua).toBe(false);
  });

  it('lets anyone through with ?app, and applies the same test to both rules', () => {
    for (const rule of previewRules) {
      expect(rule.missing).toEqual([{ type: 'query', key: 'app' }]);
      expect(rule.has).toEqual(previewRules[0].has);
    }
  });
});
