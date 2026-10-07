import { createPortal } from 'react-dom';
import { t } from '../../i18n';
import CirclePicker from '../CirclePicker';
import { Modal } from '../shared/Primitives';

// Placing a saved prayer on the altar, or moving it: the full circle picker in
// a dialog. Choosing the current circle again takes the prayer back out — a
// circle is never required. For a carried group request the question is the
// carrier's own and says so: the circle lives on their encrypted copy, and the
// group and the person who asked never see it.
//
// Rendered into <body>: it may open from a row on a group wall, and a fixed
// overlay must never be caught inside an animated list.
export default function PlaceCircleModal({ value, onPlace, onClose, lang, carried = false, idPrefix = 'place-circle' }) {
  const question = carried ? t(lang, 'carryCircleQuestion') : null;
  return createPortal(
    <Modal label={question || t(lang, value ? 'changeCircle' : 'placeInCircle')} onClose={onClose}>
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
    </Modal>,
    document.body,
  );
}
