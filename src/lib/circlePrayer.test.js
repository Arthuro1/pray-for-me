import { describe, expect, it } from 'vitest';
import { circlePrayerPrefill } from './circlePrayer';

const LABELS = { lang: 'fr', pointsLabel: 'Points de prière', scriptureLabel: 'Dans l’Écriture' };

describe('a circle theme, ready to pray', () => {
  it('titles the prayer with the theme and lists the chosen prayer first', () => {
    const guide = {
      title: 'Le fruit de l’Esprit',
      body: 'Le caractère de Christ qui grandit dans une vie.',
      prompts: ['Rends-moi patient.', 'Forme en moi le caractère de Jésus.'],
      refs: ['Galatians 5:22-25', 'Galatians 5:22-25'],
      points: [{ title: 'La bonté', prompt: 'Mets ta bonté dans mes paroles.', ref: 'Ephesians 4:32' }],
    };
    expect(circlePrayerPrefill(guide, 'Forme en moi le caractère de Jésus.', LABELS)).toEqual({
      title: 'Le fruit de l’Esprit',
      description: [
        'Le caractère de Christ qui grandit dans une vie.',
        '',
        '**Points de prière**',
        '- Forme en moi le caractère de Jésus.',
        '- Rends-moi patient.',
        '- **La bonté** — Mets ta bonté dans mes paroles. (Éphésiens 4:32)',
        '',
        '**Dans l’Écriture**',
        '- Galates 5:22-25',
      ].join('\n'),
    });
  });

  it('leaves out a section with nothing in it', () => {
    const guide = { title: 'Unité', body: 'Priez pour l’unité.', prompts: [], refs: [], points: [] };
    expect(circlePrayerPrefill(guide, undefined, LABELS).description).toBe('Priez pour l’unité.');
  });
});
