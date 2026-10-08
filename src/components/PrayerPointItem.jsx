import { useState } from 'react';
import { BookOpen, BookX, MoreHorizontal, Plus, Trash2 } from 'lucide-react';
import { t } from '../i18n';
import { localizeRef } from '../content/teaching';
import { useLocalizedVerse } from '../hooks/useLocalizedVerse';
import OverflowMenu from './shared/OverflowMenu';
import VerseAccordion from './VerseAccordion';

// One way to pray, as one compact entry: its words, its passages as small gold
// chips that open in place, and — for whoever may change it — a "+" chip to add
// a passage and a ⋯ menu that holds the removals. The number comes from the
// list itself (a CSS counter on the <ol>), so nothing here repeats it.

// Points carry either the `verses` array or the older single verse fields.
function pointVerses(point) {
  if (point.verses?.length) return point.verses;
  return point.verse ? [{ ref: point.verse, text: point.verse_text || '' }] : [];
}

// Verses are stored in the prayer's creation language; useLocalizedVerse swaps
// in authoritative text + a localized reference for the reader's language when
// one exists (offline bundle / YouVersion, never AI-translated). Otherwise the
// STORED reference and wording stay together as one consistent pair.
function PointVerse({ verse, lang }) {
  const resolved = useLocalizedVerse(verse.ref, lang);
  const ref = resolved?.ref ?? verse.ref;
  return (
    <VerseAccordion reference={ref} lang={lang} initialText={resolved?.text ?? verse.text} className="prayer-point__verse">
      {({ toggle, expanded }) => (
        <button type="button" onClick={toggle} aria-expanded={expanded} title={t(lang, 'tipVerseToggle')} className="scripture-chip">
          <BookOpen size={12} aria-hidden="true" /> {ref}
        </button>
      )}
    </VerseAccordion>
  );
}

function AddVerseForm({ lang, onSave, onCancel }) {
  const [ref, setRef] = useState('');
  const [text, setText] = useState('');
  const save = () => {
    if (!ref.trim()) return;
    onSave({ ref: ref.trim(), text: text.trim() });
  };
  return (
    <div className="prayer-point__form">
      <input
        type="text"
        value={ref}
        onChange={(e) => setRef(e.target.value)}
        onKeyDown={(e) => { if (e.key === 'Enter') save(); }}
        placeholder={t(lang, 'verseRefPlaceholder')}
        aria-label={t(lang, 'verseRefPlaceholder')}
        className="q-input q-input--compact"
        autoFocus
      />
      <input
        type="text"
        value={text}
        onChange={(e) => setText(e.target.value)}
        placeholder={t(lang, 'verseTextPlaceholder')}
        aria-label={t(lang, 'verseTextPlaceholder')}
        className="q-input q-input--compact"
      />
      <div className="prayer-point__form-actions">
        <button type="button" onClick={onCancel} className="quiet-button pressable" style={{ color: 'var(--q-text-tertiary)' }}>{t(lang, 'cancel')}</button>
        <button type="button" onClick={save} title={t(lang, 'tipSaveVerse')} className="quiet-button pressable">
          {t(lang, 'addVerse')}
        </button>
      </div>
    </div>
  );
}

export default function PrayerPointItem({ point, title, lang, canAdd, canRemove, onAddVerse, onRemoveVerse, onRemove }) {
  const [adding, setAdding] = useState(false);
  const verses = pointVerses(point);
  // A locked or fallback point can be read, never changed.
  const readOnly = !!(point._locked || point._communityFallback);
  const mayAdd = canAdd && !readOnly;
  const mayRemove = canRemove && !readOnly;

  return (
    <li className="prayer-point">
      <div className="min-w-0">
        <p className={`prayer-point__text ${point._locked ? 'prayer-point__text--locked' : ''}`}>{title}</p>
        {(verses.length > 0 || (mayAdd && !adding)) && (
          <div className="prayer-point__verses">
            {verses.map((v, i) => <PointVerse key={`${v.ref}-${i}`} verse={v} lang={lang} />)}
            {mayAdd && !adding && (
              <button
                type="button"
                onClick={() => setAdding(true)}
                aria-label={t(lang, 'tipAddVerse')}
                title={t(lang, 'tipAddVerse')}
                className="scripture-chip scripture-chip--add"
              >
                <Plus size={12} aria-hidden="true" />
                {verses.length === 0 && <span>{t(lang, 'addVerse')}</span>}
              </button>
            )}
          </div>
        )}
        {adding && (
          <AddVerseForm
            lang={lang}
            onCancel={() => setAdding(false)}
            onSave={(verse) => { onAddVerse(verse); setAdding(false); }}
          />
        )}
      </div>
      {mayRemove && (
        <OverflowMenu
          lang={lang}
          triggerIcon={MoreHorizontal}
          triggerClassName="icon-button pressable prayer-point__menu"
          iconColor="var(--q-text-tertiary)"
          items={[
            ...verses.map((v) => ({
              key: `verse-${v.ref}`,
              icon: BookX,
              label: `${t(lang, 'tipRemoveVerse')} · ${localizeRef(v.ref, lang)}`,
              onClick: () => onRemoveVerse(v.ref),
            })),
            { key: 'remove', icon: Trash2, label: t(lang, 'tipRemovePoint'), danger: true, onClick: onRemove },
          ]}
        />
      )}
    </li>
  );
}
