// Short, Christ-centered encouragements shown at gentle moments (the Pray-now
// "done" screen and empty states). Devotional content, not chrome: authored in
// English and French with English fallback for every other language — kept out
// of the per-locale i18n and the AI translation pipeline (sound encouragement is
// authored, not generated). Mirrors the teaching content layer's pick() pattern.
import { pick } from './teaching/pick';

const ENCOURAGEMENTS = [
  { en: 'God loves you, and He is listening.', fr: 'Dieu vous aime, et il vous écoute.' },
  { en: 'Christ is enough for today.', fr: 'Christ suffit pour aujourd’hui.' },
  { en: 'Growth takes time — be patient with yourself.', fr: 'La croissance prend du temps — soyez patient avec vous-même.' },
  { en: 'His mercies are new every morning.', fr: 'Ses compassions se renouvellent chaque matin.' },
  { en: 'You are held by a faithful God.', fr: 'Vous êtes tenu par un Dieu fidèle.' },
  { en: 'Rest — the outcome belongs to Him.', fr: 'Reposez-vous — le résultat lui appartient.' },
  { en: 'Nothing you bring Him is too small.', fr: 'Rien de ce que vous lui apportez n’est trop petit.' },
  { en: 'He hears you, even when words run out.', fr: 'Il vous entend, même quand les mots manquent.' },
];

// Pick an encouragement for the given language, rotating by day so it stays
// fresh but is stable within a day.
export function dailyEncouragement(lang = 'en', date = new Date()) {
  const dayOfYear = Math.floor((date - new Date(date.getFullYear(), 0, 0)) / 86400000);
  return pick(ENCOURAGEMENTS[dayOfYear % ENCOURAGEMENTS.length], lang);
}
