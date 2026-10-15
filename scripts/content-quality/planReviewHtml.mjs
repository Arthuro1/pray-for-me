// Renders one language's review packet (src/content-quality/planReviewPacket.js)
// as a single self-contained HTML file: no external requests, so a reviewer can
// open it from an email attachment, offline.
import { readFileSync } from 'node:fs';

const CLIENT = readFileSync(new URL('./planReviewClient.js', import.meta.url), 'utf8');

const escapeHtml = (text) => String(text).replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[c]);
// JSON inside <script> must never contain "</script" or "<!--".
const scriptJson = (value) => JSON.stringify(value).replace(/</g, '\\u003c');

const CSS = `
:root { --bg:#faf8f4; --card:#ffffff; --tint:#f5f0fa; --text:#1f1b16; --muted:#6b6259; --line:#e4ded4; --accent:#6b3fa0; --accent-text:#ffffff;
  --mark:#ffe08a; --crit:#b42318; --err:#b54708; --warn:#8a6d00; --ok:#1a7f37; --served:#1a7f37; --hidden:#6b6259; }
@media (prefers-color-scheme: dark) { :root { --bg:#16131a; --card:#1f1b24; --tint:#272130; --text:#ece6f2; --muted:#a79fb2; --line:#352f3d;
  --accent:#b993e6; --accent-text:#16131a; --mark:#6b5a12; --crit:#ff8a7a; --err:#ffb36b; --warn:#e6c84f; --ok:#6fd88b; --served:#6fd88b; --hidden:#a79fb2; } }
* { box-sizing: border-box; }
body { margin:0; background:var(--bg); color:var(--text); font:16px/1.6 system-ui, -apple-system, "Segoe UI", sans-serif; }
#app { max-width: 1100px; margin: 0 auto; padding: 24px 16px 140px; }
h1 { font-size: 1.8rem; line-height: 1.2; margin: .2em 0 .4em; } h2 { font-size: 1.2rem; margin: 0 0 .6em; }
h3 { font-size: 1.05rem; margin: 1.6em 0 .2em; } h4 { margin: 0 0 .5em; }
.eyebrow { color: var(--accent); font-weight: 600; letter-spacing: .02em; margin: 0; }
.muted { color: var(--muted); } .steps li { margin: .3em 0; }
.card { background: var(--card); border: 1px solid var(--line); border-radius: 12px; padding: 16px 18px; margin: 16px 0; }
details.card > summary { cursor: pointer; font-weight: 600; }
.grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(220px, 1fr)); gap: 12px; margin-bottom: 8px; }
label { display: block; } label > input[type=text], label > input[type=date], label > select, textarea { display: block; width: 100%; margin-top: 4px;
  padding: 8px 10px; border: 1px solid var(--line); border-radius: 8px; background: var(--bg); color: var(--text); font: inherit; }
.check { display: flex; gap: 8px; align-items: flex-start; margin: 6px 0; } .check input { margin-top: 5px; }
.scale { list-style: none; padding: 0; } .scale strong { display: inline-block; width: 1.4em; }
.dimensions dt { font-weight: 600; margin-top: .6em; } .dimensions dd { margin: 0; color: var(--muted); }
.table-wrap { overflow-x: auto; margin: 8px 0; } table { border-collapse: collapse; width: 100%; font-size: .92rem; }
th, td { text-align: start; border-bottom: 1px solid var(--line); padding: 6px 8px; vertical-align: top; }
.plan > summary { display: flex; flex-wrap: wrap; gap: 6px 10px; align-items: center; font-weight: 400; }
.plan-title { font-weight: 700; font-size: 1.1rem; } .meta { display: flex; flex-wrap: wrap; gap: 6px; }
.badge { display: inline-block; font-size: .78rem; font-weight: 600; padding: 2px 8px; border-radius: 999px; border: 1px solid var(--line); color: var(--muted); }
.badge.served { color: var(--served); border-color: var(--served); } .badge.done { color: var(--ok); border-color: var(--ok); }
.badge.critical, .finding.critical .badge { color: var(--crit); border-color: var(--crit); }
.badge.error, .finding.error .badge { color: var(--err); border-color: var(--err); }
.badge.warning, .finding.warning .badge { color: var(--warn); border-color: var(--warn); }
.badge.critical-dim { margin-inline-start: 8px; }
.findings ul { list-style: none; padding: 0; margin: 0; } .finding { border-top: 1px solid var(--line); padding: 10px 0; }
.finding p { margin: .2em 0; } .finding input[type=text] { width: 100%; padding: 6px 8px; border: 1px solid var(--line); border-radius: 8px; background: var(--bg); color: var(--text); font: inherit; }
.row { display: grid; grid-template-columns: 1fr 1fr; gap: 16px; border-top: 1px solid var(--line); padding: 12px 0; }
.label { display: block; font-size: .8rem; font-weight: 600; color: var(--muted); text-transform: uppercase; letter-spacing: .03em; }
.source p, .translation p { margin: .3em 0; white-space: pre-line; }
.source-fr { display: none; color: var(--muted); font-style: italic; } body.show-fr .source-fr { display: block; }
.translation { font-size: 1.05rem; background: var(--tint); border-radius: 10px; padding: 8px 12px; }
.translation.flagged { border-inline-start: 4px solid var(--warn); }
mark { background: var(--mark); color: inherit; border-radius: 3px; padding: 0 2px; }
.flags { display: flex; flex-wrap: wrap; gap: 6px; }
.suggest summary { cursor: pointer; color: var(--accent); font-size: .9rem; } .suggest textarea { margin-top: 6px; }
.scores { border-top: 2px solid var(--line); margin-top: 20px; padding-top: 12px; }
fieldset { border: 1px solid var(--line); border-radius: 10px; margin: 10px 0; padding: 8px 12px; } legend { font-weight: 600; padding: 0 4px; }
fieldset p { margin: 0 0 6px; font-size: .9rem; } .choices { display: flex; flex-wrap: wrap; gap: 6px; }
.choices label { display: flex; align-items: center; gap: 4px; border: 1px solid var(--line); border-radius: 8px; padding: 6px 12px; cursor: pointer; min-height: 40px; }
.choices label:has(input:checked) { border-color: var(--accent); outline: 2px solid var(--accent); }
.toolbar { display: flex; justify-content: flex-end; }
.bar { position: fixed; inset: auto 0 0 0; background: var(--card); border-top: 1px solid var(--line); padding: 10px 16px;
  display: flex; flex-wrap: wrap; gap: 10px; align-items: center; justify-content: flex-end; }
.status { margin: 0 auto 0 0; font-weight: 600; }
button { font: inherit; font-weight: 600; border-radius: 10px; padding: 10px 16px; border: 1px solid var(--accent); background: var(--accent); color: var(--accent-text); cursor: pointer; min-height: 44px; }
button.secondary { background: transparent; color: var(--accent); }
.message { flex-basis: 100%; } .message:empty { display: none; } .message.error { color: var(--crit); } .message.ok { color: var(--ok); }
.message ul { margin: 0; padding-inline-start: 1.2em; }
:focus-visible { outline: 3px solid var(--accent); outline-offset: 2px; }
@media (max-width: 720px) { .row { grid-template-columns: 1fr; gap: 6px; } h1 { font-size: 1.5rem; } }
`;

export function renderReviewPage(packet) {
  return `<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>Plan review · ${escapeHtml(packet.languageName)}</title>
<style>${CSS}</style>
</head>
<body>
<main id="app"><noscript>This review page needs JavaScript. It runs only in your browser and sends nothing anywhere.</noscript></main>
<script type="application/json" id="review-data">${scriptJson(packet)}</script>
<script>${CLIENT}</script>
</body>
</html>
`;
}
