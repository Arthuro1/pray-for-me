// Link previews for shared plan links (/plans/:planId/:token).
//
// The app is a single-page app, so a crawler that doesn't run JavaScript —
// WhatsApp, Facebook, iMessage, Telegram, X, Slack — only ever reads the static
// index.html and previews every plan as the generic homepage. vercel.json
// rewrites those crawlers, and only those, to this function, which answers with
// the plan's own title, description and picture. People always get the real
// app straight from the static files: nothing here is on their path.
//
// What a preview may say is exactly what the public plan page says: the plan's
// name, subtitle and length, in the sharer's language (?lang=). Never the
// sharer's name — that needs a database lookup a crawler must not trigger —
// and never anything about anyone's prayers. The data is generated from the
// plan catalogue and locale bundles by api/planPreview.test.js.
import PLAN_PREVIEW from './_planPreviewData.js';

const SITE = 'https://praystead.com';
const PLAN_ID = /^[A-Za-z0-9_-]{1,64}$/;
const TOKEN = /^[A-Za-z0-9_-]{16,32}$/;

const GENERIC = {
  title: 'Praystead — Bring what is on your heart',
  description: 'A private prayer journal that brings the right requests back at the right time.',
  image: `${SITE}/og.png`,
};

function escapeHtml(value) {
  return String(value)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

const first = (value) => (Array.isArray(value) ? value[0] : value);

// The page a crawler sees for one plan link. Pure, so it is tested directly.
export function planPreviewPage({ planId, token, lang }) {
  const plan = PLAN_ID.test(planId || '') ? PLAN_PREVIEW.plans[planId] : null;
  const code = PLAN_PREVIEW.langs.includes(lang) ? lang : 'en';
  const path = plan ? `/plans/${planId}${TOKEN.test(token || '') ? `/${token}` : ''}` : '/';
  const url = `${SITE}${path}`;
  const meta = plan
    ? {
      title: `${plan.title[code]} · Praystead`,
      description: `${plan.sub[code]} · ${plan.days[code]}`,
      image: `${SITE}/og/plans/${planId}.png`,
    }
    : GENERIC;

  const tags = [
    ['name', 'description', meta.description],
    ['property', 'og:type', 'website'],
    ['property', 'og:site_name', 'Praystead'],
    ['property', 'og:url', url],
    ['property', 'og:title', meta.title],
    ['property', 'og:description', meta.description],
    ['property', 'og:image', meta.image],
    ['property', 'og:image:width', '1200'],
    ['property', 'og:image:height', '630'],
    ['property', 'og:image:alt', meta.title],
    ['name', 'twitter:card', 'summary_large_image'],
    ['name', 'twitter:title', meta.title],
    ['name', 'twitter:description', meta.description],
    ['name', 'twitter:image', meta.image],
  ].map(([attr, key, value]) => `<meta ${attr}="${key}" content="${escapeHtml(value)}" />`);

  // `?app=1` is the way through for a person whose browser was mistaken for a
  // crawler: vercel.json never rewrites a request that carries it.
  const appUrl = `${path}${path.includes('?') ? '&' : '?'}app=1`;
  return `<!doctype html>
<html lang="${code}">
<head>
<meta charset="utf-8" />
<meta name="viewport" content="width=device-width, initial-scale=1" />
<title>${escapeHtml(meta.title)}</title>
<link rel="canonical" href="${escapeHtml(url)}" />
${tags.join('\n')}
</head>
<body>
<h1>${escapeHtml(meta.title)}</h1>
<p>${escapeHtml(meta.description)}</p>
<p><a href="${escapeHtml(appUrl)}">Praystead</a></p>
</body>
</html>`;
}

export default function handler(req, res) {
  const html = planPreviewPage({
    planId: first(req.query?.planId),
    token: first(req.query?.token),
    lang: first(req.query?.lang),
  });
  res.setHeader('Content-Type', 'text/html; charset=utf-8');
  // Plan content only changes with a deploy, and a deploy gets fresh functions.
  res.setHeader('Cache-Control', 'public, max-age=0, s-maxage=86400, stale-while-revalidate=604800');
  res.status(200).send(html);
}
