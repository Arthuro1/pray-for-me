import { createPortal } from 'react-dom';
import { t } from '../../i18n';
import { circleLabelKey } from '../../lib/circles';
import CirclePicker from '../CirclePicker';
import { Modal, QuietButton } from '../shared/Primitives';

// Placing a saved prayer on the altar, or moving it: the full circle picker in
// a dialog. Choosing the current circle again takes the prayer back out — a
// circle is never required. For a carried group request the question is the
// carrier's own and says so: the circle lives on their encrypted copy, and the
// group and the person who asked never see it.
//
// `onAbout(circle)`, where the host can show a circle's page, adds one quiet
// way from the chosen circle to its teaching — the prayer's page names the
// circle once, and this is where it leads.
//
// Rendered into <body>: it may open from a toast or a row, and a fixed overlay
// must never be caught inside an animated list.
export default function PlaceCircleModal({ value, onPlace, onClose, onAbout = null, lang, carried = false, idPrefix = 'place-circle' }) {
  const question = carried ? t(lang, 'carryCircleQuestion') : null;
  return createPortal(
    <Modal label={question || t(lang, 'circleFieldLabel')} onClose={onClose}>
      <CirclePicker
        value={value}
        onChange={(circle) => {
          onPlace(circle);
          onClose();
        }}
        lang={lang}
        idPrefix={idPrefix}
        label={question}
        hint={carried ? t(lang, 'carryCircleHint') : null}
      />
      {value && onAbout && (
        <QuietButton onClick={() => { onClose(); onAbout(value); }} className="mt-3 -ms-3">
          {t(lang, 'circleLearnAbout', { circle: t(lang, circleLabelKey(value)) })}
        </QuietButton>
      )}
    </Modal>,
    document.body,
  );
}
