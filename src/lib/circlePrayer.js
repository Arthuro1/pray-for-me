// "Pray this" on one of a circle's themes: the prayer form opens already
// holding what helps to pray it — the theme as the title, then, in the note,
// what to pray for, the prayer points (the one chosen first, a facet's passage
// beside it) and the passages behind them. Scripture appears by reference only;
// its words are read in the app's Scripture reader, never written here. It is a
// starting point the person edits freely: nothing is saved until they save.
import { localizeRef } from '../content/teaching/pick';

// guide: { title, body, prompts, refs, points: [{ title, prompt, ref }] }, as a
// theme sheet describes the theme or facet a prompt belongs to
// (components/circles/CircleThemeSheet.jsx). The note is the markdown-lite the
// prayer note is written in (components/rich/markdownHtml.js).
export function circlePrayerPrefill(guide, chosen, { lang, pointsLabel, scriptureLabel }) {
  const prompts = [chosen, ...guide.prompts.filter((prompt) => prompt !== chosen)].filter(Boolean);
  const points = [
    ...prompts.map((prompt) => `- ${prompt}`),
    ...guide.points.filter((point) => point.prompt)
      .map(({ title, prompt, ref }) => `- **${title}** — ${prompt}${ref ? ` (${localizeRef(ref, lang)})` : ''}`),
  ];
  const refs = [...new Set(guide.refs)].map((ref) => `- ${localizeRef(ref, lang)}`);
  const description = [
    guide.body,
    ...(points.length ? ['', `**${pointsLabel}**`, ...points] : []),
    ...(refs.length ? ['', `**${scriptureLabel}**`, ...refs] : []),
  ].join('\n').trim();
  return { title: guide.title, description };
}
