import { writeFileSync } from 'node:fs';
import { DAYS } from '../src/content/plans/biblicalWisdomDays.js';
import { WISDOM_RESOURCES, WISDOM_RESOURCE_DAYS } from '../src/content/resources/wisdomResources.js';
import fr from '../src/i18n/locales/fr.js';

// Render the same curriculum that the application uses, keeping the manuscript
// and daily plan in sync. No Scripture text is generated or copied.
const names = {
  Proverbs: 'Proverbes', Ecclesiastes: 'Ecclésiaste', Job: 'Job', James: 'Jacques',
  Matthew: 'Matthieu', Psalm: 'Psaume', '1 Thessalonians': '1 Thessaloniciens',
  Philippians: 'Philippiens', Hebrews: 'Hébreux', Romans: 'Romains', Luke: 'Luc',
  Colossians: 'Colossiens', Galatians: 'Galates', Mark: 'Marc',
  '1 Timothy': '1 Timothée', Ephesians: 'Éphésiens', '2 Corinthians': '2 Corinthiens',
  John: 'Jean', '1 Corinthians': '1 Corinthiens',
};
function reference(ref) {
  const [, book, passage] = /^(.+?) (\d.*)$/.exec(ref);
  if (!names[book]) throw new Error(`Missing French book name: ${book}`);
  return `${names[book]} ${passage.replace(':', '.')}`;
}
function resourceText(id) {
  const resource = WISDOM_RESOURCES.find((item) => item.id === id);
  const lang = resource.editions.fr ? 'fr' : 'en';
  const edition = resource.editions[lang];
  return `- [${edition.title}](${edition.url}) — ${edition.author}, ${lang === 'fr' ? 'français' : 'anglais'}. ${resource.description.fr}`;
}
const parts = [
  '# Grandir dans la sagesse biblique',
  '**42 jours · 6 semaines · environ 20 à 30 minutes par jour**',
  'Un parcours pour connaître Dieu, suivre Jésus et développer une sagesse qui se voit dans les choix, les paroles, les relations et la manière de traverser l’incertitude. Les 31 chapitres des Proverbes, les 12 de l’Ecclésiaste et les 42 de Job sont lus intégralement, avec des passages complémentaires dans les Psaumes, les Évangiles et les lettres des apôtres.',
  '## Comment suivre le parcours',
  '1. Prie brièvement pour demander la sagesse.\n2. Lis **tous les passages indiqués** dans ta Bible, en tenant compte de leur contexte.\n3. Médite sur les deux questions : observe le texte avant de l’appliquer à ta vie.\n4. Note une réponse concrète et termine par la prière proposée ou tes propres mots.\n5. Chaque septième jour, fais le bilan de ce qui commence à changer. Si une lecture demande davantage de temps, poursuis-la à ton rythme.',
  'Les méditations et les prières ci-dessous sont des textes d’accompagnement originaux, non des citations bibliques. Utilise la traduction de la Bible que tu lis habituellement.',
  '## Repères de lecture',
  'Les Proverbes décrivent la conduite sage et ses fruits habituels : ils ne garantissent pas une vie sans épreuve. L’Ecclésiaste examine les dons et les limites de la vie. Dans Job, distingue les paroles du narrateur, de Job, de ses amis, d’Élihu et de Dieu. Les affirmations des amis ne représentent pas automatiquement la pensée de Dieu : ils sont repris en Job 42.7. La restauration finale de Job ne promet pas une compensation matérielle pour chaque souffrance. Job 28 et les passages sur Christ invitent à chercher une sagesse qui dépasse la maîtrise humaine.',
  '## Ressources chrétiennes complémentaires',
  'Consulte ces ressources **après la lecture biblique**, de manière facultative. Compare chaque interprétation avec le texte et son contexte. Les liens officiels ont été vérifiés le 8 septembre 2026 ; les langues et limites d’accès sont indiquées. Les références à une ressource dans le calendrier sont des suggestions éditoriales pour ce parcours.',
  ...WISDOM_RESOURCES.map((resource) => resourceText(resource.id)),
];
for (const [index, day] of DAYS.entries()) {
  const n = index + 1;
  if (index % 7 === 0) parts.push(`## Semaine ${Math.floor(index / 7) + 1} — ${fr[`planWisdomWeek${Math.floor(index / 7) + 1}`]}`);
  parts.push(`### Jour ${n} — ${day.theme.fr}`,
    `**Lectures :** ${[day.ref, ...day.related].map(reference).join(' ; ')}.`,
    `**Méditation.** ${day.reflection.fr}`,
    day.study.questions.map((q, i) => `${i + 1}. ${q.fr}`).join('\n'),
    `**Mise en pratique.** ${day.study.synthesis.fr}`,
    `**Prière.** ${day.study.prayer.fr}`);
  if (WISDOM_RESOURCE_DAYS[n]) parts.push('**Pour approfondir (facultatif)**\n\n' + WISDOM_RESOURCE_DAYS[n].map(resourceText).join('\n'));
}
parts.push('## Continuer après les 42 jours',
  'Reprends la décision du premier jour. Nomme un changement dans tes paroles, un dans tes relations et un dans ta réponse à l’incertitude. Appuie chacun sur un passage étudié. Choisis trois pratiques à poursuivre pendant un mois et une personne de confiance avec qui faire le point. Continue de demander la sagesse et de mettre les paroles de Jésus en pratique.',
  '## Note pour la préparation dans Praystead',
  'Ce manuscrit accompagne le parcours `wisdom42`, version 1. L’approbation de Paul pour le plan et ses quatre ressources a été confirmée dans la conversation du projet le 8 septembre 2026. Le plan est autorisé hors du mode aperçu et les ressources peuvent être affichées selon les langues choisies par le lecteur. Le contenu quotidien est rédigé en français et en anglais ; les autres langues utilisent actuellement le repli anglais. L’approbation porte sur ces présentations existantes et ne constitue pas une attestation de traductions supplémentaires. La vérification des liens et ses limites restent indiquées dans chaque ressource. Ces changements prendront effet sur le site lors du prochain déploiement.',
);
const path = new URL('../docs/PLAN_SAGESSE_BIBLIQUE_42_JOURS.md', import.meta.url);
writeFileSync(path, `${parts.join('\n\n')}\n`, 'utf8');
console.log(`Created ${path.pathname} (${DAYS.length} days)`);
