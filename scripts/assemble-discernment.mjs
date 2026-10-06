// Assemble cached editorial translations into existing app locale/overlay files.
// Never makes network requests or records an editorial approval.
import { readFileSync, writeFileSync, mkdirSync } from 'node:fs';
import { createHash } from 'node:crypto';
import { join } from 'node:path';
import { tmpdir } from 'node:os';

const source = JSON.parse(readFileSync('src/content/plans/discernment/fr.json', 'utf8'));
const digest = createHash('sha256').update(JSON.stringify(source)).digest('hex').slice(0, 16);
const cache = join(tmpdir(), `praystead-discernment-${digest}`);
const languages = ['fr', 'en', 'de', 'pt', 'zh', 'es', 'hi', 'ja', 'sw', 'am', 'id', 'tl', 'ko', 'ru', 'ar', 'fa'];
const content = { fr: source };
for (const lang of languages.filter((code) => code !== 'fr')) {
  const meta = JSON.parse(readFileSync(join(cache, `${lang}-meta.json`), 'utf8'));
  const days = Array.from({ length: 14 }, (_, i) => JSON.parse(readFileSync(join(cache, `${lang}-days-${i * 2 + 1}.json`), 'utf8'))).flat();
  if (days.length !== 28) throw new Error(`${lang}: expected 28 days`);
  content[lang] = { ...meta, intro: meta.intro.replace(/\n{3,}/g, '\n\n').replace(/ - /g, '\n- '), days };
}

// Validate every batch exists before writing any app file.
writeFileSync('src/content/plans/discernment/en.json', `${JSON.stringify(content.en, null, 2)}\n`);
writeFileSync('src/content/plans/discernment/themes.json', `${JSON.stringify(source.days.map((_, i) => Object.fromEntries(languages.map((lang) => [lang, content[lang].days[i].theme]))), null, 2)}\n`);
mkdirSync('src/content/plans/translations/discernment28', { recursive: true });
for (const lang of languages) {
  const translated = content[lang];
  if (!['en', 'fr'].includes(lang)) {
    const overlay = {
      intro: translated.intro, biblical: translated.biblical, completion: translated.completion,
      days: translated.days.map(({ reflection, practice, discernment }) => ({ reflection, practice, discernment })),
    };
    writeFileSync(`src/content/plans/translations/discernment28/${lang}.json`, `${JSON.stringify({ discernment28: overlay }, null, 2)}\n`);
  }
  const copy = {
    planDiscernmentTitle: translated.title, planDiscernmentSub: translated.subtitle,
    ...Object.fromEntries(translated.movements.map((title, i) => [`planDiscernmentMovement${i + 1}`, title])),
    ...translated.labels,
  };
  const file = `src/i18n/locales/${lang}.js`;
  let locale = readFileSync(file, 'utf8');
  for (const key of Object.keys(copy)) locale = locale.replace(new RegExp(`^  "${key}":.*\\r?\\n`, 'm'), '');
  const additions = Object.entries(copy).map(([key, value]) => `  ${JSON.stringify(key)}: ${JSON.stringify(value)},`).join('\n');
  locale = locale.replace(/};\s*$/, `${additions}\n};\n`);
  writeFileSync(file, locale);
}
console.log('Assembled 28 full days in 16 languages, 14 lazy overlays and all UI labels. Review signatures unchanged.');
