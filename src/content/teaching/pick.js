// Helpers for the teaching content layer (prayer guides + theology explanations).
// Content is authored in English and French (the app's primary + default
// languages). Every other supported language falls back to English so the
// teaching is never shown as an empty or machine-mangled string. We deliberately
// keep doctrine out of the AI translation pipeline — sound teaching is authored,
// not generated.

// Resolve a localized field of shape { en, fr } to the active language, falling
// back to English, then to whatever is present. Accepts plain strings too.
export function pick(field, lang) {
  if (field == null) return '';
  if (typeof field === 'string') return field;
  return field[lang] ?? field.en ?? field.fr ?? '';
}

// Bible book names, English → French. Only the languages we author in need a
// mapping; all other languages read the English reference (still a valid link).
const FR_BOOKS = {
  Genesis: 'Genèse', Exodus: 'Exode', Leviticus: 'Lévitique', Numbers: 'Nombres',
  Deuteronomy: 'Deutéronome', Joshua: 'Josué', Judges: 'Juges', Ruth: 'Ruth',
  Samuel: 'Samuel', Kings: 'Rois', Chronicles: 'Chroniques', Ezra: 'Esdras',
  Nehemiah: 'Néhémie', Esther: 'Esther', Job: 'Job', Psalm: 'Psaume',
  Psalms: 'Psaumes', Proverbs: 'Proverbes', Ecclesiastes: 'Ecclésiaste',
  Isaiah: 'Ésaïe', Jeremiah: 'Jérémie', Lamentations: 'Lamentations',
  Ezekiel: 'Ézéchiel', Daniel: 'Daniel', Hosea: 'Osée', Joel: 'Joël',
  Amos: 'Amos', Jonah: 'Jonas', Micah: 'Michée', Habakkuk: 'Habacuc',
  Zechariah: 'Zacharie', Malachi: 'Malachie', Matthew: 'Matthieu', Mark: 'Marc',
  Luke: 'Luc', John: 'Jean', Acts: 'Actes', Romans: 'Romains',
  Corinthians: 'Corinthiens', Galatians: 'Galates', Ephesians: 'Éphésiens',
  Philippians: 'Philippiens', Colossians: 'Colossiens', Thessalonians: 'Thessaloniciens',
  Timothy: 'Timothée', Titus: 'Tite', Philemon: 'Philémon', Hebrews: 'Hébreux',
  James: 'Jacques', Peter: 'Pierre', Jude: 'Jude', Revelation: 'Apocalypse',
};

// Localize a reference's book name, keeping the chapter:verse part intact.
// "1 Corinthians 13:4-7" → "1 Corinthiens 13:4-7" (fr). English/other: unchanged.
export function localizeRef(ref, lang) {
  if (!ref || lang !== 'fr') return ref || '';
  const m = ref.match(/^(\d\s)?([A-Za-z]+(?:\s[A-Za-z]+)*)\s+(\d.*)$/);
  if (!m) return ref;
  const [, prefix = '', book, rest] = m;
  const fr = FR_BOOKS[book];
  return fr ? `${prefix}${fr} ${rest}` : ref;
}
