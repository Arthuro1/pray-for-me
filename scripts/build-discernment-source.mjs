// Rebuild the French curriculum from the reviewed manuscript structure.
// Scripture text is never copied: references are shared identifiers below.
import { readFileSync, writeFileSync, mkdirSync } from 'node:fs';

const output = 'src/content/plans/discernment';
mkdirSync(output, { recursive: true });
const manuscript = readFileSync('docs/DISCERNMENT_28_DAYS_FR.md', 'utf8').replace(/\r\n/g, '\n');
const plain = (text) => text
  .replace(/\[([^\]]+)\]\[[^\]]+\]/g, '$1')
  .replace(/\[([^\]]+)\]\([^)]+\)/g, '$1')
  .replace(/\*\*/g, '')
  .replace(/([^\n])\n(?=[^\n])/g, '$1 ')
  .trim();
const headings = [...manuscript.matchAll(/^### Jour (\d+) — (.+)$/gm)];
if (headings.length !== 28) throw new Error('Expected 28 manuscript days');
const days = headings.map((match, i) => {
  const end = headings[i + 1]?.index ?? manuscript.indexOf('\n## Mon bilan');
  const body = manuscript.slice(match.index + match[0].length, end).split('\n## Semaine')[0];
  const section = (label, next) => {
    const start = body.indexOf(`**${label}`);
    const contentStart = body.indexOf('**', start + 2) + 2;
    const contentEnd = next ? body.indexOf(`**${next}`, contentStart) : body.length;
    if (start < 0 || contentEnd < 0) throw new Error(`Missing ${label}, day ${i + 1}`);
    return body.slice(contentStart, contentEnd).trim();
  };
  const journal = section('Écrire dans mon carnet.', 'Un pas concret.');
  const questions = [...journal.matchAll(/^\d\. (.+)$/gm)].map((q) => plain(q[1]));
  if (questions.length !== 3) throw new Error(`Expected three questions, day ${i + 1}`);
  return {
    theme: match[2],
    reflection: plain(section('Comprendre et méditer.', 'Prier.')),
    practice: plain(section('Un pas concret.', 'Pour approfondir.')),
    discernment: {
      reading: plain(section('Lire la Parole', 'Comprendre et méditer.')),
      prayer: plain(section('Prier.', 'Écouter.')),
      listening: plain(section('Écouter.', 'Écrire dans mon carnet.')),
      questions,
      ...(journal.startsWith('1.') ? {} : { journalNote: plain(journal.split('\n1.')[0]) }),
      deeper: plain(section('Pour approfondir.')),
    },
  };
});

// External recommendations are resolved by the approved resource catalogue,
// not copied from the manuscript's review-pending research appendix.
days[0].discernment.deeper = 'Reprends le passage sur la sagesse proposé en lecture complémentaire.';
days[1].discernment.deeper = 'Poursuis la lecture biblique complémentaire et réfléchis à sa mise en pratique.';
days[2].discernment.deeper = 'Relis le chapitre entier pour garder le contexte. La lecture complémentaire relie la marche par l’Esprit à la conduite quotidienne.';
days[4].discernment.deeper = 'Relis le chapitre entier, en gardant ensemble les enseignements sur le célibat et le mariage.';
days[12].discernment.deeper = 'La lecture complémentaire invite à réfléchir à la manière dont nos paroles apaisent ou blessent.';
days[24].discernment.deeper = 'Cherche un service spécialisé adapté à ton pays et à ta situation. Cette lecture pratique peut attendre si une aide immédiate est nécessaire.';
days[24].reflection = days[24].reflection.replace(/Les repères officiels français décrivent\s+ces violences et les possibilités d’aide en France\./, '');

const reviewSection = manuscript.split('## Mon bilan et ma prochaine démarche')[1].split('## Ressources pour prolonger')[0];
const reviewRows = reviewSection.split('\n').filter((line) => line.startsWith('| ') && !line.startsWith('| Ce que je rassemble') && !line.startsWith('| Étape'));
days[27].discernment.review = reviewRows.map((row) => {
  const cells = row.split('|').slice(1, -1).map((cell) => plain(cell));
  return cells.filter(Boolean).join(' : ');
}).join('\n\n');

const content = {
  title: 'Célibataires : discerner avant de s’engager',
  subtitle: '28 jours de prière à la lumière de la Bible et sous la conduite du Saint-Esprit',
  movements: ['Présenter mon cœur à Dieu', 'Connaître l’autre avec vérité', 'Examiner une vie commune', 'Éprouver et choisir'],
  intro: plain(manuscript.split('## Entrer dans le parcours')[1].split('## Sommaire')[0]
    .replace(/^### (.+)$/gm, '$1').replace(/^\|.*$/gm, '').replace(/Garde un carnet personnel en distinguant :/, 'Dans ton carnet personnel, distingue les faits observés, les ressentis, les interprétations ou impressions à éprouver, et les questions encore ouvertes.')),
  biblical: 'La Bible est notre autorité. Nous recherchons la conduite du Saint-Esprit dans la prière et l’obéissance, en éprouvant nos impressions et notre compréhension. Jacques invite des croyants traversant des épreuves à demander la sagesse de Dieu. Ce parcours applique cette invitation au discernement d’une relation, sans transformer ce passage en méthode pour obtenir le nom d’un conjoint. Les méditations expliquent le contexte des textes et distinguent leur sens de leur application à une relation amoureuse.',
  completion: 'Tu as consacré 28 journées à la Parole, à la prière et à une connaissance plus vraie de toi-même et de tes relations. Remercie Dieu pour ce que tu as appris. Tu peux poursuivre une connaissance réciproque, envisager ensemble une préparation au mariage, attendre ou faire une pause pour clarifier, ou renoncer à une relation. Toute étape commune demande un consentement libre et réciproque. La fin du parcours ne fixe aucune date limite pour choisir un conjoint. Si aucune relation n’est en vue, poursuis ta vie avec Dieu, tes amitiés et tes responsabilités. Ton célibat ne diminue ni ta valeur ni ta place dans l’Église.',
  labels: {
    planDiscernmentReading: 'Lire dans le contexte',
    planDiscernmentReflection: 'Comprendre et méditer',
    planDiscernmentPrayer: 'Prier',
    planDiscernmentListening: 'Écouter',
    planDiscernmentJournal: 'Écrire dans mon carnet',
    planDiscernmentDeeper: 'Pour approfondir',
    planDiscernmentReview: 'Mon bilan et ma prochaine démarche',
  },
  days,
};
writeFileSync(`${output}/fr.json`, `${JSON.stringify(content, null, 2)}\n`);
console.log(`French manuscript imported: ${days.length} complete days`);
